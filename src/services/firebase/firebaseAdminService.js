import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as limitTo,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { normalizeReason, validateAdminReason } from '../../utils/adminValidation';
import {
  ADMIN_EVENT_TYPES,
  OBJECT_REOPEN_TRANSITIONS,
  OBJECT_STATUS,
  OBJECT_STATUS_LABELS,
  REQUEST_STATUS,
  USER_ROLES,
} from '../../utils/constants';
import { normalizeObjectId } from '../../utils/objectId';
import {
  FormValidationError,
  NotAuthenticatedError,
  ObjectNotFoundError,
  ObjectUpdateNotAllowedError,
  PermissionDeniedError,
  RequestNotFoundError,
  RequestStatusChangeError,
  SessionExpiredError,
} from '../serviceErrors';
import { COLLECTIONS, getDb, getFirebaseAuth, pendingClaimId } from './firebaseApp';
import { withServiceErrors } from './firebaseErrors';
import { getUserSummaries } from './firebaseUserService';
import { auditLogFromFirestore, claimFromFirestore, objectFromFirestore } from './mappers';

const HISTORY_TARGET_TYPES = { object: 'objeto', request: 'solicitacao' };
const IN_QUERY_LIMIT = 30;

function assertAdmin(actor) {
  if (!actor) throw new NotAuthenticatedError();
  if (actor.role !== USER_ROLES.admin) {
    throw new PermissionDeniedError('Somente administradores podem realizar esta ação.');
  }

  const authUser = getFirebaseAuth().currentUser;
  if (!authUser) throw new SessionExpiredError();
  if (authUser.uid !== actor.id) throw new PermissionDeniedError('A sessão atual não corresponde ao usuário do painel.');
}

function requireReason(value) {
  const message = validateAdminReason(value);
  if (message) throw new FormValidationError({ reason: message });
  return normalizeReason(value);
}

function cleanDetails(details) {
  return Object.fromEntries(Object.entries(details).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

function objectRef(objectId) {
  return doc(getDb(), COLLECTIONS.objects, normalizeObjectId(objectId));
}

function claimRef(claimId) {
  return doc(getDb(), COLLECTIONS.claims, claimId);
}

function addAuditLog(transaction, { type, targetType, targetId, actor, details = {} }) {
  const ref = doc(collection(getDb(), COLLECTIONS.auditLogs));
  transaction.set(ref, {
    type,
    targetType,
    targetId,
    actorId: actor.id,
    actorRole: actor.role,
    details: cleanDetails(details),
    result: 'sucesso',
    createdAt: serverTimestamp(),
  });
}

async function getObjectOrThrow(transactionOrNull, id) {
  const ref = objectRef(id);
  try {
    const snapshot = transactionOrNull ? await transactionOrNull.get(ref) : await getDoc(ref);
    if (!snapshot.exists()) throw new ObjectNotFoundError(normalizeObjectId(id));
    return { ref, data: snapshot.data(), object: objectFromFirestore(snapshot.id, snapshot.data()) };
  } catch (error) {
    if (error?.code === 'permission-denied') throw new ObjectNotFoundError(normalizeObjectId(id));
    throw error;
  }
}

async function getClaimOrThrow(transactionOrNull, id) {
  const ref = claimRef(id);
  try {
    const snapshot = transactionOrNull ? await transactionOrNull.get(ref) : await getDoc(ref);
    if (!snapshot.exists()) throw new RequestNotFoundError(id);
    return { ref, claim: claimFromFirestore(snapshot.id, snapshot.data()) };
  } catch (error) {
    if (error?.code === 'permission-denied') throw new RequestNotFoundError(id);
    throw error;
  }
}

async function readPendingClaimLock(transaction, claim) {
  const ref = doc(getDb(), COLLECTIONS.pendingClaims, pendingClaimId(claim.objectId, claim.requesterId));
  const snapshot = await transaction.get(ref);
  return snapshot.exists() && snapshot.data().claimId === claim.id ? ref : null;
}

function reviewFields(actor, status) {
  return { status, updatedAt: serverTimestamp(), reviewedBy: actor.id, reviewedAt: serverTimestamp() };
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}

async function fetchAuditLogs({ targetIds, type, limit } = {}) {
  const logs = collection(getDb(), COLLECTIONS.auditLogs);
  let entries = [];

  if (targetIds?.length) {
    const snapshots = await Promise.all(
      chunk([...new Set(targetIds)], IN_QUERY_LIMIT).map((ids) => getDocs(query(logs, where('targetId', 'in', ids))))
    );
    entries = snapshots.flatMap((snapshot) => snapshot.docs);
  } else if (type) {
    entries = (await getDocs(query(logs, where('type', '==', type)))).docs;
  } else {
    const constraints = [orderBy('createdAt', 'desc')];
    if (typeof limit === 'number') constraints.push(limitTo(limit));
    entries = (await getDocs(query(logs, ...constraints))).docs;
  }

  const events = entries
    .map((item) => auditLogFromFirestore(item.id, item.data()))
    .filter((event) => !type || event.type === type)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return typeof limit === 'number' ? events.slice(0, limit) : events;
}

async function fetchAllClaims(constraints = []) {
  const snapshot = await getDocs(query(collection(getDb(), COLLECTIONS.claims), ...constraints));
  return snapshot.docs.map((item) => claimFromFirestore(item.id, item.data()));
}

async function fetchAllObjects() {
  const snapshot = await getDocs(collection(getDb(), COLLECTIONS.objects));
  return snapshot.docs.map((item) => objectFromFirestore(item.id, item.data()));
}

async function countWhere(collectionName, field, value) {
  const base = collection(getDb(), collectionName);
  const snapshot = await getCountFromServer(field ? query(base, where(field, '==', value)) : base);
  return snapshot.data().count;
}

async function withRequesters(claims) {
  const summaries = await getUserSummaries(claims.map((claim) => claim.requesterId));
  return claims.map((claim) => ({ ...claim, requester: summaries[claim.requesterId] ?? null }));
}

function toObjectSummary(object) {
  return object ? { id: object.id, name: object.name, category: object.category, status: object.status } : null;
}

function createFirebaseAdminService() {
  async function getOverview(actor) {
    return withServiceErrors(async () => {
      assertAdmin(actor);

      const [
        totalObjects,
        pendingObjects,
        availableObjects,
        inReturnObjects,
        returnedObjects,
        rejectedObjects,
        pendingRequests,
        approvedRequests,
      ] = await Promise.all([
        countWhere(COLLECTIONS.objects),
        countWhere(COLLECTIONS.objects, 'status', OBJECT_STATUS.pendingApproval),
        countWhere(COLLECTIONS.objects, 'status', OBJECT_STATUS.available),
        countWhere(COLLECTIONS.objects, 'status', OBJECT_STATUS.inReturn),
        countWhere(COLLECTIONS.objects, 'status', OBJECT_STATUS.returned),
        countWhere(COLLECTIONS.objects, 'status', OBJECT_STATUS.rejected),
        countWhere(COLLECTIONS.claims, 'status', REQUEST_STATUS.pending),
        countWhere(COLLECTIONS.claims, 'status', REQUEST_STATUS.approved),
      ]);

      return {
        totalObjects,
        pendingObjects,
        availableObjects,
        inReturnObjects,
        returnedObjects,
        rejectedObjects,
        pendingRequests,
        approvedRequests,
      };
    });
  }

  async function listObjects(actor) {
    return withServiceErrors(async () => {
      assertAdmin(actor);

      const [objects, pendingClaims] = await Promise.all([
        fetchAllObjects(),
        fetchAllClaims([where('status', '==', REQUEST_STATUS.pending)]),
      ]);

      const pendingByObject = pendingClaims.reduce(
        (counts, claim) => ({ ...counts, [claim.objectId]: (counts[claim.objectId] ?? 0) + 1 }),
        {}
      );

      return objects
        .map((object) => ({ ...object, pendingRequestCount: pendingByObject[object.id] ?? 0 }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  }

  async function getObjectDetails(objectId, actor) {
    return withServiceErrors(async () => {
      assertAdmin(actor);

      const { object } = await getObjectOrThrow(null, objectId);
      const claims = (await fetchAllClaims([where('objectId', '==', object.id)])).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );

      return {
        object,
        requests: await withRequesters(claims),
        events: await fetchAuditLogs({ targetIds: [object.id, ...claims.map((claim) => claim.id)] }),
      };
    });
  }

  async function listRequests(actor) {
    return withServiceErrors(async () => {
      assertAdmin(actor);

      const [claims, objects] = await Promise.all([fetchAllClaims(), fetchAllObjects()]);
      const objectsById = new Map(objects.map((object) => [object.id, object]));

      const withObjects = claims
        .map((claim) => ({ ...claim, object: toObjectSummary(objectsById.get(claim.objectId)) }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return withRequesters(withObjects);
    });
  }

  async function getRequestDetails(requestId, actor) {
    return withServiceErrors(async () => {
      assertAdmin(actor);

      const { claim } = await getClaimOrThrow(null, requestId);
      const { object } = await getObjectOrThrow(null, claim.objectId);
      const [withRequester] = await withRequesters([{ ...claim, object: toObjectSummary(object) }]);
      const siblings = (await fetchAllClaims([where('objectId', '==', claim.objectId)])).filter((item) => item.id !== claim.id);

      return {
        request: withRequester,
        object,
        otherPendingCount: siblings.filter((item) => item.status === REQUEST_STATUS.pending).length,
        otherApprovedRequest: siblings.find((item) => item.status === REQUEST_STATUS.approved) ?? null,
        events: await fetchAuditLogs({ targetIds: [claim.id, claim.objectId] }),
      };
    });
  }

  async function listHistory(actor, filters = {}) {
    return withServiceErrors(async () => {
      assertAdmin(actor);
      return fetchAuditLogs(filters);
    });
  }

  async function changeObject(objectId, actor, { allowedFrom, nextStatus, eventType, reason, reopen = false }) {
    return withServiceErrors(async () => {
      assertAdmin(actor);

      return runTransaction(getDb(), async (transaction) => {
        const { ref, object } = await getObjectOrThrow(transaction, objectId);
        const target = reopen ? OBJECT_REOPEN_TRANSITIONS[object.status] : nextStatus;

        if (reopen ? !target : object.status !== allowedFrom) {
          throw new ObjectUpdateNotAllowedError(
            reopen
              ? `Registros com status "${OBJECT_STATUS_LABELS[object.status]}" não podem ser reabertos.`
              : `Esta ação só pode ser aplicada a registros com status "${OBJECT_STATUS_LABELS[allowedFrom]}". Status atual: "${OBJECT_STATUS_LABELS[object.status]}".`
          );
        }

        if (!reopen && object.registeredBy === actor.id) {
          throw new PermissionDeniedError('Não é permitido analisar um objeto registrado por você. Outro administrador precisa fazer a análise.');
        }

        transaction.update(ref, reopen ? { ...reviewFields(actor, target), activeClaimId: null } : reviewFields(actor, target));
        addAuditLog(transaction, {
          type: eventType,
          targetType: HISTORY_TARGET_TYPES.object,
          targetId: object.id,
          actor,
          details: { from: object.status, to: target, reason },
        });

        return { ...object, status: target, reviewedBy: actor.id, updatedAt: new Date().toISOString() };
      });
    });
  }

  function approveObject(objectId, actor) {
    return changeObject(objectId, actor, {
      allowedFrom: OBJECT_STATUS.pendingApproval,
      nextStatus: OBJECT_STATUS.available,
      eventType: ADMIN_EVENT_TYPES.objectApproved,
    });
  }

  async function rejectObject(objectId, actor, reasonInput) {
    const reason = requireReason(reasonInput);
    return changeObject(objectId, actor, {
      allowedFrom: OBJECT_STATUS.pendingApproval,
      nextStatus: OBJECT_STATUS.rejected,
      eventType: ADMIN_EVENT_TYPES.objectRejected,
      reason,
    });
  }

  async function reopenObject(objectId, actor, reasonInput) {
    const reason = requireReason(reasonInput);
    return changeObject(objectId, actor, { eventType: ADMIN_EVENT_TYPES.objectReopened, reason, reopen: true });
  }

  async function approveRequest(requestId, actor) {
    return withServiceErrors(async () => {
      assertAdmin(actor);

      return runTransaction(getDb(), async (transaction) => {
        const { ref, claim } = await getClaimOrThrow(transaction, requestId);
        const { ref: objectDocRef, object } = await getObjectOrThrow(transaction, claim.objectId);
        const lockRef = await readPendingClaimLock(transaction, claim);

        if (claim.requesterId === actor.id) {
          throw new PermissionDeniedError('Não é permitido analisar uma solicitação feita por você.');
        }
        if (claim.status !== REQUEST_STATUS.pending) {
          throw new RequestStatusChangeError('Somente solicitações pendentes podem ser aprovadas.');
        }
        if (object.status !== OBJECT_STATUS.available) {
          throw new RequestStatusChangeError(
            `O objeto está com status "${OBJECT_STATUS_LABELS[object.status]}". Apenas objetos disponíveis podem ter uma solicitação aprovada, o que evita duas devoluções do mesmo objeto.`
          );
        }

        transaction.update(objectDocRef, { status: OBJECT_STATUS.inReturn, updatedAt: serverTimestamp(), activeClaimId: claim.id });
        transaction.update(ref, reviewFields(actor, REQUEST_STATUS.approved));
        if (lockRef) transaction.delete(lockRef);
        addAuditLog(transaction, {
          type: ADMIN_EVENT_TYPES.requestApproved,
          targetType: HISTORY_TARGET_TYPES.request,
          targetId: claim.id,
          actor,
          details: { objectId: object.id, from: claim.status, to: REQUEST_STATUS.approved, objectStatus: OBJECT_STATUS.inReturn },
        });

        return { ...claim, status: REQUEST_STATUS.approved, reviewedBy: actor.id };
      });
    });
  }

  async function rejectRequest(requestId, actor, reasonInput) {
    const reason = requireReason(reasonInput);

    return withServiceErrors(async () => {
      assertAdmin(actor);

      return runTransaction(getDb(), async (transaction) => {
        const { ref, claim } = await getClaimOrThrow(transaction, requestId);
        const { ref: objectDocRef, object } = await getObjectOrThrow(transaction, claim.objectId);
        const lockRef = claim.status === REQUEST_STATUS.pending ? await readPendingClaimLock(transaction, claim) : null;

        if (claim.requesterId === actor.id) {
          throw new PermissionDeniedError('Não é permitido analisar uma solicitação feita por você.');
        }

        if (claim.status === REQUEST_STATUS.pending) {
          transaction.update(ref, reviewFields(actor, REQUEST_STATUS.rejected));
          if (lockRef) transaction.delete(lockRef);
          addAuditLog(transaction, {
            type: ADMIN_EVENT_TYPES.requestRejected,
            targetType: HISTORY_TARGET_TYPES.request,
            targetId: claim.id,
            actor,
            details: { objectId: claim.objectId, from: claim.status, to: REQUEST_STATUS.rejected, reason },
          });
          return { ...claim, status: REQUEST_STATUS.rejected };
        }

        if (claim.status === REQUEST_STATUS.approved) {
          transaction.update(ref, reviewFields(actor, REQUEST_STATUS.rejected));
          if (object.status === OBJECT_STATUS.inReturn) {
            transaction.update(objectDocRef, { status: OBJECT_STATUS.available, updatedAt: serverTimestamp(), activeClaimId: null });
          }
          addAuditLog(transaction, {
            type: ADMIN_EVENT_TYPES.requestApprovalCanceled,
            targetType: HISTORY_TARGET_TYPES.request,
            targetId: claim.id,
            actor,
            details: { objectId: claim.objectId, from: claim.status, to: REQUEST_STATUS.rejected, objectStatus: OBJECT_STATUS.available, reason },
          });
          return { ...claim, status: REQUEST_STATUS.rejected };
        }

        throw new RequestStatusChangeError('Esta solicitação já foi encerrada e não pode ser rejeitada.');
      });
    });
  }

  async function completeRequest(requestId, actor) {
    return withServiceErrors(async () => {
      assertAdmin(actor);

      return runTransaction(getDb(), async (transaction) => {
        const { ref, claim } = await getClaimOrThrow(transaction, requestId);
        const { ref: objectDocRef, object } = await getObjectOrThrow(transaction, claim.objectId);

        if (claim.requesterId === actor.id) {
          throw new PermissionDeniedError('Não é permitido analisar uma solicitação feita por você.');
        }
        if (claim.status !== REQUEST_STATUS.approved) {
          throw new RequestStatusChangeError('Somente solicitações aprovadas podem ter a devolução concluída.');
        }
        if (object.status !== OBJECT_STATUS.inReturn) {
          throw new RequestStatusChangeError('O objeto não está em processo de devolução.');
        }

        transaction.update(objectDocRef, reviewFields(actor, OBJECT_STATUS.returned));
        transaction.update(ref, reviewFields(actor, REQUEST_STATUS.completed));
        addAuditLog(transaction, {
          type: ADMIN_EVENT_TYPES.objectReturned,
          targetType: HISTORY_TARGET_TYPES.object,
          targetId: object.id,
          actor,
          details: { requestId: claim.id, from: object.status, to: OBJECT_STATUS.returned },
        });

        return { ...claim, status: REQUEST_STATUS.completed };
      });
    });
  }

  return {
    getOverview,
    listObjects,
    getObjectDetails,
    listRequests,
    getRequestDetails,
    listHistory,
    approveObject,
    rejectObject,
    reopenObject,
    approveRequest,
    rejectRequest,
    completeRequest,
  };
}

const firebaseAdminService = createFirebaseAdminService();

export default firebaseAdminService;
