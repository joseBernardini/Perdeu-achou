import { ADMIN_EVENT_TYPES, EVENT_ID_PREFIX } from '../../utils/constants';
import { generatePrefixedId, isValidPrefixedId } from '../../utils/objectId';
import { createLocalStore, resolveBrowserStorage } from './localStore';

export const ADMIN_HISTORY_STORAGE_KEY = 'perdeu-achou:historico-administrativo:v1';

export const HISTORY_TARGET_TYPES = {
  object: 'objeto',
  request: 'solicitacao',
};

function isStoredEvent(event) {
  return (
    event &&
    typeof event === 'object' &&
    isValidPrefixedId(EVENT_ID_PREFIX, event.id) &&
    Object.values(ADMIN_EVENT_TYPES).includes(event.type) &&
    typeof event.actorId === 'string' &&
    typeof event.createdAt === 'string'
  );
}

export function createMockAdminHistoryService({
  storage = resolveBrowserStorage(),
  generateId = () => generatePrefixedId(EVENT_ID_PREFIX),
  now = () => new Date(),
} = {}) {
  const store = createLocalStore({
    storage,
    key: ADMIN_HISTORY_STORAGE_KEY,
    fallback: () => [],
    isValid: Array.isArray,
  });

  function readEvents() {
    return store.read().filter(isStoredEvent);
  }

  function recordEvent({ type, targetType, targetId, actor, details = {} }) {
    const events = readEvents();
    const existingIds = new Set(events.map((event) => event.id));
    let id = generateId();
    while (existingIds.has(id)) id = generateId();

    const event = {
      id,
      type,
      targetType,
      targetId,
      actorId: actor.id,
      actorRole: actor.role,
      details,
      createdAt: now().toISOString(),
    };

    store.write([...events, event]);
    return { ...event };
  }

  function listEvents({ targetIds, type, limit } = {}) {
    const events = readEvents()
      .map((event, order) => ({ event, order }))
      .filter(({ event }) => !type || event.type === type)
      .filter(({ event }) => !targetIds || targetIds.includes(event.targetId))
      .sort((a, b) => b.event.createdAt.localeCompare(a.event.createdAt) || b.order - a.order)
      .map(({ event }) => ({ ...event }));

    return typeof limit === 'number' ? events.slice(0, limit) : events;
  }

  return { recordEvent, listEvents };
}

const mockAdminHistoryService = createMockAdminHistoryService();

export default mockAdminHistoryService;
