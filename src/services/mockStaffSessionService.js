import { STAFF_ROLES, USER_ID_PREFIX } from '../utils/constants';
import { generatePrefixedId, isValidPrefixedId } from '../utils/objectId';
import { createLocalStore, resolveBrowserStorage } from './localStore';

export const STAFF_DEMO_SESSION_STORAGE_KEY = 'perdeu-achou:sessao-painel-demonstracao:v1';

export const IS_DEMO_STAFF_SESSION = true;

function isValidSession(session) {
  return (
    session &&
    typeof session === 'object' &&
    isValidPrefixedId(USER_ID_PREFIX, session.actorId) &&
    STAFF_ROLES.includes(session.role)
  );
}

export function createMockStaffSessionService({
  storage = resolveBrowserStorage(),
  generateId = () => generatePrefixedId(USER_ID_PREFIX),
  now = () => new Date(),
} = {}) {
  const store = createLocalStore({
    storage,
    key: STAFF_DEMO_SESSION_STORAGE_KEY,
    fallback: () => null,
    isValid: isValidSession,
  });

  function getSession() {
    const session = store.read();
    return session ? { ...session, actor: { id: session.actorId, role: session.role } } : null;
  }

  function startSession({ role, linkedUser = null }) {
    if (!STAFF_ROLES.includes(role)) {
      throw new Error('Perfil de demonstração inválido.');
    }

    store.write({
      actorId: linkedUser?.id ?? generateId(),
      role,
      displayName: linkedUser?.name ?? 'Equipe de demonstração',
      linkedToAccount: Boolean(linkedUser),
      startedAt: now().toISOString(),
    });

    return getSession();
  }

  function endSession() {
    store.remove();
  }

  return { isDemo: IS_DEMO_STAFF_SESSION, getSession, startSession, endSession };
}

const mockStaffSessionService = createMockStaffSessionService();

export default mockStaffSessionService;
