import {
  createUserWithEmailAndPassword,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { PROFILE_TYPES } from '../../utils/constants';
import {
  normalizeEmail,
  normalizeName,
  validatePasswordResetForm,
  validateProfileForm,
  validateSignInForm,
  validateSignUpForm,
} from '../../utils/authValidation';
import { AccountDisabledError, ConfigurationError, FormValidationError, SessionExpiredError } from '../serviceErrors';
import { getFirebaseAuth } from './firebaseApp';
import { firebaseConfigurationError, isFirebaseConfigured } from './firebaseConfig';
import { toServiceError, withServiceErrors } from './firebaseErrors';
import { toDomainUser } from './mappers';
import { createUserProfile, getUserProfile, getUserSummaries, updateOwnProfile } from './firebaseUserService';

function assertValid(errors) {
  if (Object.keys(errors).length > 0) throw new FormValidationError(errors);
}

function createFirebaseAuthService() {
  const listeners = new Set();
  let currentUser = null;
  let resolved = false;
  let emissionId = 0;
  let unsubscribeFirebase = null;
  let lastError = null;

  function emit(user) {
    currentUser = user;
    resolved = true;
    listeners.forEach((listener) => listener(user));
  }

  async function resolveUser(authUser) {
    const id = ++emissionId;

    if (!authUser) {
      if (id === emissionId) emit(null);
      return null;
    }

    let profile = null;
    try {
      profile = await getUserProfile(authUser.uid);
    } catch (error) {
      lastError = error;
    }

    if (profile && profile.active === false) {
      lastError = new AccountDisabledError();
      await firebaseSignOut(getFirebaseAuth()).catch(() => {});
      if (id === emissionId) emit(null);
      return null;
    }

    const user = toDomainUser(authUser, profile);
    if (id === emissionId) emit(user);
    return user;
  }

  function ensureSubscribed() {
    if (unsubscribeFirebase || !isFirebaseConfigured) return;
    unsubscribeFirebase = onFirebaseAuthStateChanged(
      getFirebaseAuth(),
      (authUser) => {
        resolveUser(authUser);
      },
      (error) => {
        lastError = toServiceError(error);
        emit(null);
      }
    );
  }

  function getCurrentUser() {
    return currentUser;
  }

  function onAuthStateChanged(listener) {
    listeners.add(listener);

    if (!isFirebaseConfigured) {
      listener(null);
    } else {
      ensureSubscribed();
      if (resolved) listener(currentUser);
    }

    return () => listeners.delete(listener);
  }

  function consumeLastError() {
    const error = lastError;
    lastError = null;
    return error;
  }

  function assertConfigured() {
    if (!isFirebaseConfigured) throw new ConfigurationError(firebaseConfigurationError);
  }

  async function signUp(values) {
    assertConfigured();
    assertValid(validateSignUpForm(values));

    const displayName = normalizeName(values.name);
    const email = normalizeEmail(values.email);
    const auth = getFirebaseAuth();

    const credential = await withServiceErrors(() => createUserWithEmailAndPassword(auth, email, values.password));

    await withServiceErrors(() => updateProfile(credential.user, { displayName }));
    await createUserProfile({
      uid: credential.user.uid,
      displayName,
      email: credential.user.email ?? email,
      profileType: values.profileType,
    });

    return resolveUser(credential.user);
  }

  async function signIn(values) {
    assertConfigured();
    assertValid(validateSignInForm(values));

    const auth = getFirebaseAuth();
    const credential = await withServiceErrors(
      () => signInWithEmailAndPassword(auth, normalizeEmail(values.email), values.password),
      { context: 'signIn' }
    );

    let profile = await getUserProfile(credential.user.uid);

    if (!profile) {
      await createUserProfile({
        uid: credential.user.uid,
        displayName: credential.user.displayName || normalizeEmail(values.email),
        email: credential.user.email ?? normalizeEmail(values.email),
        profileType: PROFILE_TYPES.notInformed,
      });
      profile = await getUserProfile(credential.user.uid);
    }

    if (profile?.active === false) {
      await firebaseSignOut(auth).catch(() => {});
      throw new AccountDisabledError();
    }

    return resolveUser(credential.user);
  }

  async function signOut() {
    assertConfigured();
    await withServiceErrors(() => firebaseSignOut(getFirebaseAuth()));
  }

  async function updateUserProfile(values) {
    assertConfigured();
    assertValid(validateProfileForm(values));

    const authUser = getFirebaseAuth().currentUser;
    if (!authUser) throw new SessionExpiredError();

    const displayName = normalizeName(values.name);
    await updateOwnProfile(authUser.uid, { displayName, profileType: values.profileType });
    await withServiceErrors(() => updateProfile(authUser, { displayName }));

    return resolveUser(authUser);
  }

  async function requestPasswordReset(values) {
    assertConfigured();
    assertValid(validatePasswordResetForm(values));

    const email = normalizeEmail(values.email);

    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') throw toServiceError(error);
    }

    return { email };
  }

  return {
    isDemo: false,
    configurationError: isFirebaseConfigured ? null : firebaseConfigurationError,
    getCurrentUser,
    onAuthStateChanged,
    consumeLastError,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    updateProfile: updateUserProfile,
    getUserSummaries,
  };
}

const firebaseAuthService = createFirebaseAuthService();

export default firebaseAuthService;
