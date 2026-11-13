import { normalizeReason, validateAdminReason } from '../../utils/adminValidation';
import {
  ADMIN_EVENT_TYPES,
  OBJECT_REOPEN_TRANSITIONS,
  OBJECT_STATUS,
  OBJECT_STATUS_LABELS,
  REQUEST_STATUS,
  USER_ROLES,
} from '../../utils/constants';
import { SIMULATED_LATENCY_MS, resolveBrowserStorage, wait } from './localStore';
import { createMockAdminHistoryService, HISTORY_TARGET_TYPES } from './mockAdminHistoryService';
import { createMockAuthService } from './mockAuthService';
import { createMockObjectService } from './mockObjectService';
import { createMockRecoveryRequestService } from './mockRecoveryRequestService';
import {
  FormValidationError,
  NotAuthenticatedError,
  ObjectUpdateNotAllowedError,
  PermissionDeniedError,
  RequestStatusChangeError,
} from '../serviceErrors';

function assertAdmin(actor) {
  if (!actor) throw new NotAuthenticatedError();
  if (actor.role !== USER_ROLES.admin) {
    throw new PermissionDeniedError('Somente administradores podem realizar esta ação.');
  }
}

function assertNotRequester(request, actor) {
  if (request.requesterId === actor.id) {
    throw new PermissionDeniedError('Não é permitido analisar uma solicitação feita por você.');
  }
}

function requireReason(value) {
  const message = validateAdminReason(value);
  if (message) throw new FormValidationError({ reason: message });
  return normalizeReason(value);
}

export function createMockAdminService({
  storage = resolveBrowserStorage(),
  delay = SIMULATED_LATENCY_MS,
  objects = createMockObjectService({ storage, delay: 0 }),
  requests = createMockRecoveryRequestService({ storage, objects, delay: 0 }),
  users = createMockAuthService({ storage, delay: 0 }),
  history = createMockAdminHistoryService({ storage }),
} = {}) {
  async function withRequesters(list) {
    const summaries = await users.getUserSummaries(list.map((request) => request.requesterId));
    return list.map((request) => ({ ...request, requester: summaries[request.requesterId] ?? null }));
  }

  async function getOverview(actor) {
    await wait(delay);
    assertAdmin(actor);

    const [objectCounts, requestCounts] = await Promise.all([objects.countObjectsByStatus(), requests.countRequestsByStatus()]);
    const totalObjects = Object.values(objectCounts).reduce((total, value) => total + value, 0);

    return {
      totalObjects,
      pendingObjects: objectCounts[OBJECT_STATUS.pendingApproval],
      availableObjects: objectCounts[OBJECT_STATUS.available],
      inReturnObjects: objectCounts[OBJECT_STATUS.inReturn],
      returnedObjects: objectCounts[OBJECT_STATUS.returned],
      rejectedObjects: objectCounts[OBJECT_STATUS.rejected],
      pendingRequests: requestCounts[REQUEST_STATUS.pending],
      approvedRequests: requestCounts[REQUEST_STATUS.approved],
    };
  }

  async function listObjects(actor) {
    await wait(delay);
    assertAdmin(actor);

    const [allObjects, allRequests] = await Promise.all([objects.listObjects(), requests.listAllRequests()]);
    const pendingByObject = allRequests.reduce((counts, request) => {
      if (request.status !== REQUEST_STATUS.pending) return counts;
      return { ...counts, [request.objectId]: (counts[request.objectId] ?? 0) + 1 };
    }, {});

    return allObjects.map((object) => ({ ...object, pendingRequestCount: pendingByObject[object.id] ?? 0 }));
  }

  async function getObjectDetails(objectId, actor) {
    await wait(delay);
    assertAdmin(actor);

    const object = await objects.getObjectById(objectId);
    const related = (await requests.listAllRequests()).filter((request) => request.objectId === object.id);

    return {
      object,
      requests: await withRequesters(related),
      events: history.listEvents({ targetIds: [object.id, ...related.map((request) => request.id)] }),
    };
  }

  async function listRequests(actor) {
    await wait(delay);
    assertAdmin(actor);

    return withRequesters(await requests.listAllRequests());
  }

  async function getRequestDetails(requestId, actor) {
    await wait(delay);
    assertAdmin(actor);

    const request = await requests.getRequestById(requestId);
    const [withRequester] = await withRequesters([request]);
    const object = await objects.getObjectById(request.objectId);
    const siblings = (await requests.listAllRequests()).filter(
      (item) => item.objectId === request.objectId && item.id !== request.id
    );

    return {
      request: withRequester,
      object,
      otherPendingCount: siblings.filter((item) => item.status === REQUEST_STATUS.pending).length,
      otherApprovedRequest: siblings.find((item) => item.status === REQUEST_STATUS.approved) ?? null,
      events: history.listEvents({ targetIds: [request.id, request.objectId] }),
    };
  }

  async function listHistory(actor, filters = {}) {
    await wait(delay);
    assertAdmin(actor);

    return history.listEvents(filters);
  }

  async function approveObject(objectId, actor) {
    await wait(delay);
    assertAdmin(actor);

    const current = await objects.getObjectById(objectId);
    if (current.status !== OBJECT_STATUS.pendingApproval) {
      throw new ObjectUpdateNotAllowedError('Somente registros pendentes de aprovação podem ser aprovados.');
    }
    if (current.registeredBy === actor.id) {
      throw new PermissionDeniedError('Não é permitido analisar um objeto registrado por você. Outro administrador precisa fazer a análise.');
    }

    const updated = await objects.changeObjectStatus(current.id, OBJECT_STATUS.available);
    history.recordEvent({
      type: ADMIN_EVENT_TYPES.objectApproved,
      targetType: HISTORY_TARGET_TYPES.object,
      targetId: current.id,
      actor,
      details: { from: current.status, to: updated.status },
    });

    return updated;
  }

  async function rejectObject(objectId, actor, reasonInput) {
    await wait(delay);
    assertAdmin(actor);
    const reason = requireReason(reasonInput);

    const current = await objects.getObjectById(objectId);
    if (current.status !== OBJECT_STATUS.pendingApproval) {
      throw new ObjectUpdateNotAllowedError('Somente registros pendentes de aprovação podem ser rejeitados.');
    }
    if (current.registeredBy === actor.id) {
      throw new PermissionDeniedError('Não é permitido analisar um objeto registrado por você. Outro administrador precisa fazer a análise.');
    }

    const updated = await objects.changeObjectStatus(current.id, OBJECT_STATUS.rejected);
    history.recordEvent({
      type: ADMIN_EVENT_TYPES.objectRejected,
      targetType: HISTORY_TARGET_TYPES.object,
      targetId: current.id,
      actor,
      details: { from: current.status, to: updated.status, reason },
    });

    return updated;
  }

  async function reopenObject(objectId, actor, reasonInput) {
    await wait(delay);
    assertAdmin(actor);
    const reason = requireReason(reasonInput);

    const current = await objects.getObjectById(objectId);
    const target = OBJECT_REOPEN_TRANSITIONS[current.status];
    if (!target) {
      throw new ObjectUpdateNotAllowedError(
        `Registros com status "${OBJECT_STATUS_LABELS[current.status]}" não podem ser reabertos.`
      );
    }

    const updated = await objects.changeObjectStatus(current.id, target, { reopen: true });
    history.recordEvent({
      type: ADMIN_EVENT_TYPES.objectReopened,
      targetType: HISTORY_TARGET_TYPES.object,
      targetId: current.id,
      actor,
      details: { from: current.status, to: updated.status, reason },
    });

    return updated;
  }

  async function approveRequest(requestId, actor) {
    await wait(delay);
    assertAdmin(actor);

    const request = await requests.getRequestById(requestId);
    assertNotRequester(request, actor);

    if (request.status !== REQUEST_STATUS.pending) {
      throw new RequestStatusChangeError('Somente solicitações pendentes podem ser aprovadas.');
    }

    const object = await objects.getObjectById(request.objectId);
    if (object.status !== OBJECT_STATUS.available) {
      throw new RequestStatusChangeError(
        `O objeto está com status "${OBJECT_STATUS_LABELS[object.status]}". Apenas objetos disponíveis podem ter uma solicitação aprovada, o que evita duas devoluções do mesmo objeto.`
      );
    }

    await objects.changeObjectStatus(object.id, OBJECT_STATUS.inReturn);

    let updated;
    try {
      updated = await requests.changeRequestStatus(request.id, REQUEST_STATUS.approved, { actor });
    } catch (error) {
      await objects.changeObjectStatus(object.id, OBJECT_STATUS.available);
      throw error;
    }

    history.recordEvent({
      type: ADMIN_EVENT_TYPES.requestApproved,
      targetType: HISTORY_TARGET_TYPES.request,
      targetId: request.id,
      actor,
      details: { objectId: object.id, from: request.status, to: updated.status, objectStatus: OBJECT_STATUS.inReturn },
    });

    return updated;
  }

  async function rejectRequest(requestId, actor, reasonInput) {
    await wait(delay);
    assertAdmin(actor);
    const reason = requireReason(reasonInput);

    const request = await requests.getRequestById(requestId);
    assertNotRequester(request, actor);

    if (request.status === REQUEST_STATUS.pending) {
      const updated = await requests.changeRequestStatus(request.id, REQUEST_STATUS.rejected, { actor });
      history.recordEvent({
        type: ADMIN_EVENT_TYPES.requestRejected,
        targetType: HISTORY_TARGET_TYPES.request,
        targetId: request.id,
        actor,
        details: { objectId: request.objectId, from: request.status, to: updated.status, reason },
      });
      return updated;
    }

    if (request.status === REQUEST_STATUS.approved) {
      const object = await objects.getObjectById(request.objectId);
      const updated = await requests.changeRequestStatus(request.id, REQUEST_STATUS.rejected, { actor });
      if (object.status === OBJECT_STATUS.inReturn) {
        await objects.changeObjectStatus(object.id, OBJECT_STATUS.available);
      }
      history.recordEvent({
        type: ADMIN_EVENT_TYPES.requestApprovalCanceled,
        targetType: HISTORY_TARGET_TYPES.request,
        targetId: request.id,
        actor,
        details: { objectId: request.objectId, from: request.status, to: updated.status, objectStatus: OBJECT_STATUS.available, reason },
      });
      return updated;
    }

    throw new RequestStatusChangeError('Esta solicitação já foi encerrada e não pode ser rejeitada.');
  }

  async function completeRequest(requestId, actor) {
    await wait(delay);
    assertAdmin(actor);

    const request = await requests.getRequestById(requestId);
    assertNotRequester(request, actor);

    if (request.status !== REQUEST_STATUS.approved) {
      throw new RequestStatusChangeError('Somente solicitações aprovadas podem ter a devolução concluída.');
    }

    const object = await objects.getObjectById(request.objectId);
    if (object.status !== OBJECT_STATUS.inReturn) {
      throw new RequestStatusChangeError('O objeto não está em processo de devolução.');
    }

    await objects.changeObjectStatus(object.id, OBJECT_STATUS.returned);
    const updated = await requests.changeRequestStatus(request.id, REQUEST_STATUS.completed, { actor });

    history.recordEvent({
      type: ADMIN_EVENT_TYPES.objectReturned,
      targetType: HISTORY_TARGET_TYPES.object,
      targetId: object.id,
      actor,
      details: { requestId: request.id, from: object.status, to: OBJECT_STATUS.returned },
    });

    return updated;
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

const mockAdminService = createMockAdminService();

export default mockAdminService;
