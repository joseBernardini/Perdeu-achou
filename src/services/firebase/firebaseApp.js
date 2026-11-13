import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { ConfigurationError } from '../serviceErrors';
import {
  FIREBASE_EMULATOR_HOSTS,
  firebaseConfig,
  firebaseConfigurationError,
  isFirebaseConfigured,
  useFirebaseEmulators,
} from './firebaseConfig';

let authInstance = null;
let firestoreInstance = null;

function getFirebaseApp() {
  if (!isFirebaseConfigured) throw new ConfigurationError(firebaseConfigurationError);
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
    authInstance.languageCode = 'pt-BR';
    if (useFirebaseEmulators) connectAuthEmulator(authInstance, FIREBASE_EMULATOR_HOSTS.auth, { disableWarnings: true });
  }
  return authInstance;
}

export function getDb() {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getFirebaseApp());
    if (useFirebaseEmulators) {
      connectFirestoreEmulator(firestoreInstance, FIREBASE_EMULATOR_HOSTS.firestoreHost, FIREBASE_EMULATOR_HOSTS.firestorePort);
    }
  }
  return firestoreInstance;
}

export const COLLECTIONS = {
  users: 'users',
  objects: 'objects',
  claims: 'claims',
  auditLogs: 'auditLogs',
  pendingClaims: 'pendingClaims',
};

export function pendingClaimId(objectId, requesterId) {
  return `${objectId}_${requesterId}`;
}
