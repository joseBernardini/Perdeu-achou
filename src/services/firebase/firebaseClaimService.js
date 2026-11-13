import { collection, doc, getDoc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { OBJECT_STATUS, REQUEST_ID_PREFIX, REQUEST_STATUS } from '../../utils/constants';
import { generatePrefixedId } from '../../utils/objectId';
import { normalizeRecoveryRequestForm, validateRecoveryRequestForm } from '../../utils/recoveryRequestValidation';
import {
  DuplicateRequestError,
  FormValidationError,
  NotAuthenticatedError,
  ObjectNotFoundError,
  ObjectUnavailableError,
} from '../serviceErrors';
import { COLLECTIONS, getDb, getFirebaseAuth, pendingClaimId } from './firebaseApp';
import { withServiceErrors } from './firebaseErrors';
import { fetchObjectById } from './firebaseObjectService';
import { claimFromFirestore, claimToFirestore } from './mappers';

function requireAuthenticatedUser(requesterId) {
  const authUser = getFirebaseAuth().currentUser;
  if (!authUser || (requesterId && requesterId !== authUser.uid)) throw new NotAuthenticatedError();
  return authUser;
}

async function readPendingClaim(objectId, requesterId) {
  const lock = await getDoc(doc(getDb(), COLLECTIONS.pendingClaims, pendingClaimId(objectId, requesterId)));
  if (!lock.exists()) return null;

  const snapshot = await getDoc(doc(getDb(), COLLECTIONS.claims, lock.data().claimId));
  if (!snapshot.exists()) return null;

  const claim = claimFromFirestore(snapshot.id, snapshot.data());
  return claim.status === REQUEST_STATUS.pending ? claim : null;
}

async function summarizeObject(objectId) {
  try {
    const object = await fetchObjectById(objectId);
    return { id: object.id, name: object.name, category: object.category, status: object.status };
  } catch (error) {
    if (error instanceof ObjectNotFoundError) return null;
    throw error;
  }
}

function createFirebaseClaimService() {
  async function findPendingRequest(objectId, requesterId) {
    return withServiceErrors(async () => {
      if (!requesterId || !getFirebaseAuth().currentUser) return null;
      return readPendingClaim(objectId, requesterId);
    });
  }

  async function createRequest(input = {}, { requesterId } = {}) {
    return withServiceErrors(async () => {
      const authUser = requireAuthenticatedUser(requesterId);

      const errors = validateRecoveryRequestForm(input);
      if (Object.keys(errors).length > 0) throw new FormValidationError(errors);

      const object = await fetchObjectById(input.objectId);
      if (object.status !== OBJECT_STATUS.available) throw new ObjectUnavailableError(object.id);

      const existing = await readPendingClaim(object.id, authUser.uid);
      if (existing) throw new DuplicateRequestError(existing);

      const id = generatePrefixedId(REQUEST_ID_PREFIX);
      const values = normalizeRecoveryRequestForm(input);

      const batch = writeBatch(getDb());
      batch.set(
        doc(getDb(), COLLECTIONS.claims, id),
        claimToFirestore(
          { ...values, status: REQUEST_STATUS.pending },
          { objectId: object.id, requesterId: authUser.uid, timestamp: serverTimestamp() }
        )
      );
      batch.set(doc(getDb(), COLLECTIONS.pendingClaims, pendingClaimId(object.id, authUser.uid)), {
        objectId: object.id,
        requesterId: authUser.uid,
        claimId: id,
        createdAt: serverTimestamp(),
      });

      try {
        await batch.commit();
      } catch (error) {
        if (error?.code === 'permission-denied') {
          const duplicate = await readPendingClaim(object.id, authUser.uid);
          if (duplicate) throw new DuplicateRequestError(duplicate);
        }
        throw error;
      }

      const now = new Date().toISOString();
      return {
        id,
        objectId: object.id,
        objectCode: object.id,
        requesterId: authUser.uid,
        ...values,
        status: REQUEST_STATUS.pending,
        createdAt: now,
        updatedAt: now,
        reviewedBy: null,
        reviewedAt: null,
      };
    });
  }

  async function listRequestsByRequester(requesterId) {
    return withServiceErrors(async () => {
      const authUser = requireAuthenticatedUser(requesterId);
      const snapshot = await getDocs(
        query(collection(getDb(), COLLECTIONS.claims), where('requesterId', '==', authUser.uid))
      );

      const claims = snapshot.docs
        .map((item) => claimFromFirestore(item.id, item.data()))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const summaries = new Map(
        await Promise.all(
          [...new Set(claims.map((claim) => claim.objectId))].map(async (objectId) => [objectId, await summarizeObject(objectId)])
        )
      );

      return claims.map((claim) => ({ ...claim, object: summaries.get(claim.objectId) ?? null }));
    });
  }

  return {
    findPendingRequest,
    createRequest,
    listRequestsByRequester,
  };
}

const firebaseClaimService = createFirebaseClaimService();

export default firebaseClaimService;
