import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS, getDb } from './firebaseApp';
import { withServiceErrors } from './firebaseErrors';
import { userProfileToFirestore } from './mappers';

export async function getUserProfile(uid) {
  return withServiceErrors(async () => {
    const snapshot = await getDoc(doc(getDb(), COLLECTIONS.users, uid));
    return snapshot.exists() ? snapshot.data() : null;
  });
}

export async function createUserProfile({ uid, displayName, email, profileType }) {
  return withServiceErrors(async () => {
    await setDoc(
      doc(getDb(), COLLECTIONS.users, uid),
      userProfileToFirestore({ uid, displayName, email, profileType, timestamp: serverTimestamp() })
    );
  });
}

export async function updateOwnProfile(uid, { displayName, profileType }) {
  return withServiceErrors(async () => {
    await updateDoc(doc(getDb(), COLLECTIONS.users, uid), { displayName, profileType });
  });
}

export async function getUserSummaries(userIds = []) {
  return withServiceErrors(async () => {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    const entries = await Promise.all(
      uniqueIds.map(async (uid) => {
        try {
          const snapshot = await getDoc(doc(getDb(), COLLECTIONS.users, uid));
          return [uid, snapshot.exists() ? { id: uid, name: snapshot.data().displayName } : null];
        } catch (error) {
          if (error?.code === 'permission-denied') return [uid, null];
          throw error;
        }
      })
    );
    return Object.fromEntries(entries);
  });
}
