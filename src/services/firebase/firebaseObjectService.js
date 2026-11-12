import { collection, doc, getCountFromServer, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { OBJECT_STATUS } from '../../utils/constants';
import { generateObjectId, normalizeObjectId } from '../../utils/objectId';
import { normalizeObjectForm, validateObjectForm } from '../../utils/objectValidation';
import { NotAuthenticatedError, ObjectNotFoundError, ObjectValidationError } from '../serviceErrors';
import { COLLECTIONS, getDb, getFirebaseAuth } from './firebaseApp';
import { withServiceErrors } from './firebaseErrors';
import { objectFromFirestore, objectToFirestore } from './mappers';

function sortByCreatedAtDesc(items) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function fetchObjectById(id) {
  const normalizedId = normalizeObjectId(id);
  if (!normalizedId) throw new ObjectNotFoundError(normalizedId);

  try {
    const snapshot = await getDoc(doc(getDb(), COLLECTIONS.objects, normalizedId));
    if (!snapshot.exists()) throw new ObjectNotFoundError(normalizedId);
    return objectFromFirestore(snapshot.id, snapshot.data());
  } catch (error) {
    if (error?.code === 'permission-denied') throw new ObjectNotFoundError(normalizedId);
    throw error;
  }
}

function createFirebaseObjectService() {
  async function createObject(input) {
    return withServiceErrors(async () => {
      const authUser = getFirebaseAuth().currentUser;
      if (!authUser) throw new NotAuthenticatedError();

      const errors = validateObjectForm(input);
      if (Object.keys(errors).length > 0) throw new ObjectValidationError(errors);

      const values = normalizeObjectForm(input);
      const code = generateObjectId();

      await setDoc(
        doc(getDb(), COLLECTIONS.objects, code),
        objectToFirestore(values, {
          code,
          createdBy: authUser.uid,
          status: OBJECT_STATUS.pendingApproval,
          timestamp: serverTimestamp(),
        })
      );

      const now = new Date().toISOString();
      return {
        id: code,
        ...values,
        status: OBJECT_STATUS.pendingApproval,
        registeredBy: authUser.uid,
        createdAt: now,
        updatedAt: now,
        reviewedBy: null,
        reviewedAt: null,
      };
    });
  }

  async function listObjects({ status = OBJECT_STATUS.available } = {}) {
    return withServiceErrors(async () => {
      const snapshot = await getDocs(query(collection(getDb(), COLLECTIONS.objects), where('status', '==', status)));
      return sortByCreatedAtDesc(snapshot.docs.map((item) => objectFromFirestore(item.id, item.data())));
    });
  }

  async function getObjectById(id) {
    return withServiceErrors(() => fetchObjectById(id));
  }

  async function countObjectsByStatus() {
    return withServiceErrors(async () => {
      const snapshot = await getCountFromServer(
        query(collection(getDb(), COLLECTIONS.objects), where('status', '==', OBJECT_STATUS.inReturn))
      );
      return { [OBJECT_STATUS.inReturn]: snapshot.data().count };
    });
  }

  return {
    createObject,
    listObjects,
    getObjectById,
    countObjectsByStatus,
  };
}

const firebaseObjectService = createFirebaseObjectService();

export default firebaseObjectService;
