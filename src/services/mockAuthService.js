import { USER_ID_PREFIX, USER_ROLES } from '../utils/constants';
import { normalizeEmail, normalizeName, validatePasswordResetForm, validateSignInForm, validateSignUpForm } from '../utils/authValidation';
import { generatePrefixedId, isValidPrefixedId } from '../utils/objectId';
import { SIMULATED_LATENCY_MS, createLocalStore, resolveBrowserStorage, wait } from './localStore';
import { EmailAlreadyRegisteredError, FormValidationError, InvalidCredentialsError } from './serviceErrors';

export const DEMO_USERS_STORAGE_KEY = 'perdeu-achou:usuarios-demonstracao:v1';
export const DEMO_SESSION_STORAGE_KEY = 'perdeu-achou:sessao-demonstracao:v1';

export const IS_DEMO_AUTH = true;

function isStoredUser(user) {
  return (
    user &&
    typeof user === 'object' &&
    isValidPrefixedId(USER_ID_PREFIX, user.id) &&
    typeof user.email === 'string' &&
    Object.values(USER_ROLES).includes(user.role)
  );
}

function toPublicUser(user) {
  return user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
}

export function createMockAuthService({
  storage = resolveBrowserStorage(),
  delay = SIMULATED_LATENCY_MS,
  generateId = () => generatePrefixedId(USER_ID_PREFIX),
  now = () => new Date(),
} = {}) {
  const usersStore = createLocalStore({
    storage,
    key: DEMO_USERS_STORAGE_KEY,
    fallback: () => [],
    isValid: Array.isArray,
  });
  const sessionStore = createLocalStore({
    storage,
    key: DEMO_SESSION_STORAGE_KEY,
    fallback: () => null,
    isValid: (value) => value && typeof value.userId === 'string',
  });
  const listeners = new Set();

  function readUsers() {
    return usersStore.read().filter(isStoredUser);
  }

  function getCurrentUser() {
    const session = sessionStore.read();
    if (!session) return null;
    return toPublicUser(readUsers().find((user) => user.id === session.userId));
  }

  function notify() {
    const user = getCurrentUser();
    listeners.forEach((listener) => listener(user));
  }

  function onAuthStateChanged(listener) {
    listeners.add(listener);
    listener(getCurrentUser());
    return () => listeners.delete(listener);
  }

  function startSession(userId) {
    sessionStore.write({ userId, startedAt: now().toISOString() });
    notify();
  }

  async function signUp(values) {
    await wait(delay);

    const errors = validateSignUpForm(values);
    if (Object.keys(errors).length > 0) throw new FormValidationError(errors);

    const users = readUsers();
    const email = normalizeEmail(values.email);
    if (users.some((user) => user.email === email)) throw new EmailAlreadyRegisteredError();

    const existingIds = new Set(users.map((user) => user.id));
    let id = generateId();
    while (existingIds.has(id)) id = generateId();

    const user = {
      id,
      name: normalizeName(values.name),
      email,
      role: USER_ROLES.member,
      createdAt: now().toISOString(),
    };

    usersStore.write([...users, user]);
    startSession(user.id);
    return toPublicUser(user);
  }

  async function signIn(values) {
    await wait(delay);

    const errors = validateSignInForm(values);
    if (Object.keys(errors).length > 0) throw new FormValidationError(errors);

    const user = readUsers().find((item) => item.email === normalizeEmail(values.email));
    if (!user) throw new InvalidCredentialsError();

    startSession(user.id);
    return toPublicUser(user);
  }

  async function signOut() {
    await wait(delay);
    sessionStore.remove();
    notify();
  }

  async function requestPasswordReset(values) {
    await wait(delay);

    const errors = validatePasswordResetForm(values);
    if (Object.keys(errors).length > 0) throw new FormValidationError(errors);

    return { email: normalizeEmail(values.email) };
  }

  async function getUserSummaries(userIds = []) {
    await wait(delay);

    const users = readUsers();
    return Object.fromEntries(
      [...new Set(userIds)].map((id) => {
        const user = users.find((item) => item.id === id);
        return [id, user ? { id: user.id, name: user.name } : null];
      })
    );
  }

  return {
    isDemo: IS_DEMO_AUTH,
    getUserSummaries,
    getCurrentUser,
    onAuthStateChanged,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
  };
}

const mockAuthService = createMockAuthService();

export default mockAuthService;
