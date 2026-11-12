import {
  OBJECT_STATUS,
  REQUEST_ID_PREFIX,
  REQUEST_STATUS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TRANSITIONS,
  STAFF_ROLES,
} from '../utils/constants';
import { generatePrefixedId, isValidPrefixedId } from '../utils/objectId';
import { normalizeRecoveryRequestForm, validateRecoveryRequestForm } from '../utils/recoveryRequestValidation';
import { SIMULATED_LATENCY_MS, createLocalStore, resolveBrowserStorage, wait } from './localStore';
import objectService from './objectService';
import {
  DuplicateRequestError,
  FormValidationError,
  NotAuthenticatedError,
  ObjectNotFoundError,
  ObjectUnavailableError,
  PermissionDeniedError,
  RequestNotFoundError,
  RequestStatusChangeError,
} from './serviceErrors';

export const RECOVERY_REQUESTS_STORAGE_KEY = 'perdeu-achou:solicitacoes-recuperacao:v1';

function isStoredRequest(request) {
  return (
    request &&
    typeof request === 'object' &&
    isValidPrefixedId(REQUEST_ID_PREFIX, request.id) &&
    typeof request.objectId === 'string' &&
    typeof request.requesterId === 'string' &&
    Object.values(REQUEST_STATUS).includes(request.status)
  );
}

function clone(request) {
  return { ...request };
}

function toObjectSummary(object) {
  return object ? { id: object.id, name: object.name, category: object.category, status: object.status } : null;
}

export function canTransitionRequestStatus(currentStatus, nextStatus) {
  return (REQUEST_STATUS_TRANSITIONS[currentStatus] ?? []).includes(nextStatus);
}

export function createMockRecoveryRequestService({
  storage = resolveBrowserStorage(),
  objects = objectService,
  delay = SIMULATED_LATENCY_MS,
  generateId = () => generatePrefixedId(REQUEST_ID_PREFIX),
  now = () => new Date(),
} = {}) {
  const store = createLocalStore({
    storage,
    key: RECOVERY_REQUESTS_STORAGE_KEY,
    fallback: () => [],
    isValid: Array.isArray,
  });

  function readRequests() {
    return store.read().filter(isStoredRequest);
  }

  function findPending(requests, objectId, requesterId) {
    return requests.find(
      (request) =>
        request.objectId === objectId && request.requesterId === requesterId && request.status === REQUEST_STATUS.pending
    );
  }

  async function findPendingRequest(objectId, requesterId) {
    await wait(delay);
    if (!requesterId) return null;

    const request = findPending(readRequests(), objectId, requesterId);
    return request ? clone(request) : null;
  }

  async function createRequest(input = {}, { requesterId } = {}) {
    await wait(delay);

    if (!requesterId) throw new NotAuthenticatedError();

    const errors = validateRecoveryRequestForm(input);
    if (Object.keys(errors).length > 0) throw new FormValidationError(errors);

    const object = await objects.getObjectById(input.objectId);
    if (object.status !== OBJECT_STATUS.available) throw new ObjectUnavailableError(object.id);

    const requests = readRequests();
    const existing = findPending(requests, object.id, requesterId);
    if (existing) throw new DuplicateRequestError(clone(existing));

    const existingIds = new Set(requests.map((request) => request.id));
    let id = generateId();
    while (existingIds.has(id)) id = generateId();

    const timestamp = now().toISOString();
    const request = {
      id,
      objectId: object.id,
      requesterId,
      ...normalizeRecoveryRequestForm(input),
      status: REQUEST_STATUS.pending,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.write([...requests, request]);
    return clone(request);
  }

  async function attachObjectSummaries(requests) {
    const summaries = await Promise.all(
      [...new Set(requests.map((request) => request.objectId))].map(async (objectId) => {
        try {
          return [objectId, toObjectSummary(await objects.getObjectById(objectId))];
        } catch (error) {
          if (error instanceof ObjectNotFoundError) return [objectId, null];
          throw error;
        }
      })
    );
    const byId = new Map(summaries);

    return requests.map((request) => ({ ...clone(request), object: byId.get(request.objectId) ?? null }));
  }

  async function listRequestsByRequester(requesterId) {
    await wait(delay);

    if (!requesterId) throw new NotAuthenticatedError();

    const requests = readRequests()
      .filter((request) => request.requesterId === requesterId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return attachObjectSummaries(requests);
  }

  async function changeRequestStatus(requestId, nextStatus, { actor } = {}) {
    await wait(delay);

    if (!actor) throw new NotAuthenticatedError();
    if (!STAFF_ROLES.includes(actor.role)) {
      throw new PermissionDeniedError('Somente funcionários responsáveis podem alterar o status das solicitações.');
    }

    const requests = readRequests();
    const index = requests.findIndex((request) => request.id === requestId);
    if (index === -1) throw new RequestNotFoundError(requestId);

    const current = requests[index];

    if (current.requesterId === actor.id) {
      throw new PermissionDeniedError('Não é permitido analisar a própria solicitação.');
    }

    if (!canTransitionRequestStatus(current.status, nextStatus)) {
      throw new RequestStatusChangeError(
        `Não é possível alterar a solicitação de "${REQUEST_STATUS_LABELS[current.status]}" para "${
          REQUEST_STATUS_LABELS[nextStatus] ?? nextStatus
        }".`
      );
    }

    const updated = { ...current, status: nextStatus, updatedAt: now().toISOString() };
    const nextRequests = [...requests];
    nextRequests[index] = updated;
    store.write(nextRequests);

    return clone(updated);
  }

  async function listAllRequests({ status } = {}) {
    await wait(delay);

    const requests = readRequests()
      .filter((request) => !status || request.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return attachObjectSummaries(requests);
  }

  async function getRequestById(requestId) {
    await wait(delay);

    const request = readRequests().find((item) => item.id === requestId);
    if (!request) throw new RequestNotFoundError(requestId);

    const [withObject] = await attachObjectSummaries([request]);
    return withObject;
  }

  async function countRequestsByStatus() {
    await wait(delay);

    return readRequests().reduce(
      (counts, request) => ({ ...counts, [request.status]: counts[request.status] + 1 }),
      Object.fromEntries(Object.values(REQUEST_STATUS).map((status) => [status, 0]))
    );
  }

  return {
    createRequest,
    listAllRequests,
    getRequestById,
    countRequestsByStatus,
    findPendingRequest,
    listRequestsByRequester,
    changeRequestStatus,
  };
}

const mockRecoveryRequestService = createMockRecoveryRequestService();

export default mockRecoveryRequestService;
