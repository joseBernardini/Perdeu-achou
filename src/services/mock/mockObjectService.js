import mockObjects from './mockObjects';
import { OBJECT_REOPEN_TRANSITIONS, OBJECT_STATUS, OBJECT_STATUS_LABELS, OBJECT_STATUS_TRANSITIONS } from '../../utils/constants';
import { generateObjectId, isValidObjectId, normalizeObjectId } from '../../utils/objectId';
import { normalizeObjectForm, validateObjectForm, OBJECT_FORM_FIELDS } from '../../utils/objectValidation';
import {
  ObjectNotFoundError,
  ObjectStorageError,
  ObjectUpdateNotAllowedError,
  ObjectValidationError,
} from '../serviceErrors';
import { SIMULATED_LATENCY_MS } from './localStore';

export const OBJECTS_STORAGE_KEY = 'perdeu-achou:objetos-registrados:v1';
export const SEED_STATUS_STORAGE_KEY = 'perdeu-achou:status-objetos-demonstracao:v1';

const MAX_ID_ATTEMPTS = 10;

function resolveBrowserStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function clone(record) {
  return { ...record };
}

function wait(ms) {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

export function canTransitionStatus(currentStatus, nextStatus) {
  return (OBJECT_STATUS_TRANSITIONS[currentStatus] ?? []).includes(nextStatus);
}

function isStoredRecord(record) {
  return (
    record &&
    typeof record === 'object' &&
    isValidObjectId(record.id) &&
    Object.values(OBJECT_STATUS).includes(record.status)
  );
}

export function createMockObjectService({
  storage = resolveBrowserStorage(),
  seed = mockObjects,
  delay = SIMULATED_LATENCY_MS,
  generateId = generateObjectId,
  now = () => new Date(),
} = {}) {
  const seedRecords = seed.map(clone);
  const seedIds = new Set(seedRecords.map((record) => record.id));

  function readUserRecords() {
    if (!storage) return [];

    try {
      const raw = storage.getItem(OBJECTS_STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isStoredRecord) : [];
    } catch {
      return [];
    }
  }

  function writeUserRecords(records) {
    if (!storage) {
      throw new ObjectStorageError('O armazenamento local do navegador não está disponível.');
    }

    try {
      storage.setItem(OBJECTS_STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      throw new ObjectStorageError('Não foi possível salvar o registro no armazenamento local do navegador.', error);
    }
  }

  function readSeedStatusChanges() {
    if (!storage) return {};

    try {
      const parsed = JSON.parse(storage.getItem(SEED_STATUS_STORAGE_KEY) ?? '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

      return Object.fromEntries(
        Object.entries(parsed).filter(
          ([id, change]) =>
            seedIds.has(id) && change && Object.values(OBJECT_STATUS).includes(change.status) && typeof change.updatedAt === 'string'
        )
      );
    } catch {
      return {};
    }
  }

  function writeSeedStatusChange(id, change) {
    if (!storage) {
      throw new ObjectStorageError('O armazenamento local do navegador não está disponível.');
    }

    try {
      storage.setItem(SEED_STATUS_STORAGE_KEY, JSON.stringify({ ...readSeedStatusChanges(), [id]: change }));
    } catch (error) {
      throw new ObjectStorageError('Não foi possível salvar a alteração no armazenamento local do navegador.', error);
    }
  }

  function getSeedRecords() {
    const changes = readSeedStatusChanges();
    return seedRecords.map((record) => (changes[record.id] ? { ...record, ...changes[record.id] } : record));
  }

  function getAllRecords() {
    return [...getSeedRecords(), ...readUserRecords()];
  }

  function createUniqueId(existingIds) {
    for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt += 1) {
      const id = generateId();
      if (isValidObjectId(id) && !existingIds.has(id)) return id;
    }

    throw new ObjectStorageError('Não foi possível gerar um código único para o objeto. Tente novamente.');
  }

  async function createObject(input, { registeredBy = null } = {}) {
    await wait(delay);

    const errors = validateObjectForm(input);
    if (Object.keys(errors).length > 0) throw new ObjectValidationError(errors);

    const userRecords = readUserRecords();
    const existingIds = new Set([...seedIds, ...userRecords.map((record) => record.id)]);
    const timestamp = now().toISOString();

    const record = {
      id: createUniqueId(existingIds),
      ...normalizeObjectForm(input),
      status: OBJECT_STATUS.pendingApproval,
      registeredBy: typeof registeredBy === 'string' ? registeredBy : null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    writeUserRecords([...userRecords, record]);
    return clone(record);
  }

  async function listObjectsByCreator(creatorId) {
    await wait(delay);

    return getAllRecords()
      .filter((record) => creatorId && record.registeredBy === creatorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(clone);
  }

  async function listObjects({ status } = {}) {
    await wait(delay);

    return getAllRecords()
      .filter((record) => !status || record.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(clone);
  }

  async function getObjectById(id) {
    await wait(delay);

    const normalizedId = normalizeObjectId(id);
    const record = getAllRecords().find((item) => item.id === normalizedId);
    if (!record) throw new ObjectNotFoundError(normalizedId);

    return clone(record);
  }

  async function updateObject(id, changes = {}) {
    await wait(delay);

    const normalizedId = normalizeObjectId(id);

    if (seedIds.has(normalizedId)) {
      throw new ObjectUpdateNotAllowedError('Registros de demonstração não podem ser alterados.');
    }

    const userRecords = readUserRecords();
    const index = userRecords.findIndex((record) => record.id === normalizedId);
    if (index === -1) throw new ObjectNotFoundError(normalizedId);

    const current = userRecords[index];

    if (current.status !== OBJECT_STATUS.pendingApproval) {
      throw new ObjectUpdateNotAllowedError('Apenas registros pendentes de aprovação podem ser alterados.');
    }

    const editableChanges = OBJECT_FORM_FIELDS.reduce((accumulator, field) => {
      if (Object.prototype.hasOwnProperty.call(changes, field)) accumulator[field] = changes[field];
      return accumulator;
    }, {});

    const merged = { ...current, ...editableChanges };
    const errors = validateObjectForm(merged);
    if (Object.keys(errors).length > 0) throw new ObjectValidationError(errors);

    const updated = {
      ...current,
      ...normalizeObjectForm(merged),
      updatedAt: now().toISOString(),
    };

    const nextRecords = [...userRecords];
    nextRecords[index] = updated;
    writeUserRecords(nextRecords);

    return clone(updated);
  }

  async function changeObjectStatus(id, nextStatus, { reopen = false } = {}) {
    await wait(delay);

    const normalizedId = normalizeObjectId(id);
    const current = getAllRecords().find((record) => record.id === normalizedId);
    if (!current) throw new ObjectNotFoundError(normalizedId);

    const allowed = reopen
      ? OBJECT_REOPEN_TRANSITIONS[current.status] === nextStatus
      : canTransitionStatus(current.status, nextStatus);

    if (!allowed) {
      throw new ObjectUpdateNotAllowedError(
        `Não é possível alterar o status de "${OBJECT_STATUS_LABELS[current.status]}" para "${
          OBJECT_STATUS_LABELS[nextStatus] ?? nextStatus
        }".`
      );
    }

    const change = { status: nextStatus, updatedAt: now().toISOString() };

    if (seedIds.has(normalizedId)) {
      writeSeedStatusChange(normalizedId, change);
      return clone({ ...current, ...change });
    }

    const userRecords = readUserRecords();
    const index = userRecords.findIndex((record) => record.id === normalizedId);
    const updated = { ...userRecords[index], ...change };
    const nextRecords = [...userRecords];
    nextRecords[index] = updated;
    writeUserRecords(nextRecords);

    return clone(updated);
  }

  async function countObjectsByStatus() {
    await wait(delay);

    return getAllRecords().reduce(
      (counts, record) => ({ ...counts, [record.status]: counts[record.status] + 1 }),
      Object.fromEntries(Object.values(OBJECT_STATUS).map((status) => [status, 0]))
    );
  }

  return {
    createObject,
    listObjects,
    listObjectsByCreator,
    getObjectById,
    updateObject,
    changeObjectStatus,
    countObjectsByStatus,
  };
}

const mockObjectService = createMockObjectService();

export default mockObjectService;
