import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { ConfigurationError } from '../serviceErrors';
import { firebaseConfig, firebaseConfigurationError, isFirebaseConfigured } from './firebaseConfig';

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
  }
  return authInstance;
}

export function getDb() {
  if (!firestoreInstance) firestoreInstance = getFirestore(getFirebaseApp());
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
