import mockObjects from '../data/mockObjects';
import { OBJECT_STATUS } from '../utils/constants';
import { isValidObjectId } from '../utils/objectId';
import { canTransitionStatus, createMockObjectService, OBJECTS_STORAGE_KEY } from './mockObjectService';
import {
  ObjectNotFoundError,
  ObjectStorageError,
  ObjectUpdateNotAllowedError,
  ObjectValidationError,
} from './serviceErrors';

function createMemoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    removeItem: (key) => {
      delete data[key];
    },
    data,
  };
}

const validInput = {
  name: 'Fone de ouvido sem fio',
  category: 'eletronicos',
  description: 'Fone de ouvido sem fio branco, com estojo de carregamento arranhado na tampa.',
  location: 'Sala 204, bloco B',
  foundDate: '2026-11-10',
  notes: '',
};

function buildService(options = {}) {
  const storage = options.storage ?? createMemoryStorage();
  const service = createMockObjectService({ storage, delay: 0, ...options });
  return { service, storage };
}

describe('mockObjectService', () => {
  it('cria um objeto com identificador legível e status pendente de aprovação', async () => {
    const { service } = buildService();

    const record = await service.createObject(validInput);

    expect(record.id).toMatch(/^OBJ-[0-9A-HJKMNP-TV-Z]{8}$/);
    expect(record.status).toBe(OBJECT_STATUS.pendingApproval);
    expect(record.name).toBe(validInput.name);
    expect(record.createdAt).toBe(record.updatedAt);
  });

  it('ignora identificador e status enviados pela interface', async () => {
    const { service } = buildService();

    const record = await service.createObject({ ...validInput, id: 'OBJ-ESCOLHIDO', status: OBJECT_STATUS.available });

    expect(record.id).not.toBe('OBJ-ESCOLHIDO');
    expect(record.status).toBe(OBJECT_STATUS.pendingApproval);
  });

  it('gera um novo identificador quando ocorre colisão', async () => {
    const ids = [mockObjects[0].id, 'OBJ-ABCDEFGH'];
    const { service } = buildService({ generateId: () => ids.shift() });

    const record = await service.createObject(validInput);

    expect(record.id).toBe('OBJ-ABCDEFGH');
  });

  it('gera identificadores distintos em cadastros sucessivos', async () => {
    const { service } = buildService();
    const created = [];

    for (let index = 0; index < 25; index += 1) {
      created.push(await service.createObject(validInput));
    }

    expect(new Set(created.map((record) => record.id)).size).toBe(25);
  });

  it('salva no armazenamento apenas os registros criados pelo usuário', async () => {
    const { service, storage } = buildService();

    const record = await service.createObject(validInput);
    const stored = JSON.parse(storage.data[OBJECTS_STORAGE_KEY]);

    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(record.id);
  });

  it('preserva os registros entre instâncias que compartilham o armazenamento', async () => {
    const storage = createMemoryStorage();
    const first = createMockObjectService({ storage, delay: 0 });
    const record = await first.createObject(validInput);

    const second = createMockObjectService({ storage, delay: 0 });

    await expect(second.getObjectById(record.id)).resolves.toEqual(record);
  });

  it('lista os dados iniciais e os registros criados, filtrando por status', async () => {
    const { service } = buildService();
    const record = await service.createObject(validInput);

    const all = await service.listObjects();
    const pending = await service.listObjects({ status: OBJECT_STATUS.pendingApproval });

    expect(all).toHaveLength(mockObjects.length + 1);
    const seedPendingIds = mockObjects.filter((item) => item.status === OBJECT_STATUS.pendingApproval).map((item) => item.id);

    expect(pending.map((item) => item.id).sort()).toEqual([record.id, ...seedPendingIds].sort());
  });

  it('consulta pelo identificador sem diferenciar maiúsculas e minúsculas', async () => {
    const { service } = buildService();

    const record = await service.getObjectById(mockObjects[0].id.toLowerCase());

    expect(record.id).toBe(mockObjects[0].id);
  });

  it('informa quando o identificador não existe', async () => {
    const { service } = buildService();

    await expect(service.getObjectById('OBJ-00000000')).rejects.toBeInstanceOf(ObjectNotFoundError);
  });

  it('rejeita dados inválidos sem salvar nada', async () => {
    const { service, storage } = buildService();

    await expect(service.createObject({ ...validInput, name: '' })).rejects.toBeInstanceOf(ObjectValidationError);
    expect(storage.data[OBJECTS_STORAGE_KEY]).toBeUndefined();
  });

  it('rejeita datas futuras no serviço', async () => {
    const { service } = buildService();

    await expect(service.createObject({ ...validInput, foundDate: '2999-01-01' })).rejects.toMatchObject({
      fieldErrors: { foundDate: expect.stringContaining('posterior a hoje') },
    });
  });

  it('atualiza registros pendentes criados pelo usuário mantendo campos protegidos', async () => {
    let tick = 0;
    const { service } = buildService({ now: () => new Date(Date.UTC(2026, 10, 12, 12, 0, tick++)) });
    const record = await service.createObject(validInput);

    const updated = await service.updateObject(record.id, {
      location: 'Sala 205, bloco B',
      status: OBJECT_STATUS.available,
      id: 'OBJ-ZZZZZZZZ',
    });

    expect(updated.location).toBe('Sala 205, bloco B');
    expect(updated.status).toBe(OBJECT_STATUS.pendingApproval);
    expect(updated.id).toBe(record.id);
    expect(updated.updatedAt > record.updatedAt).toBe(true);
  });

  it('não permite alterar os registros de demonstração', async () => {
    const { service } = buildService();

    await expect(service.updateObject(mockObjects[0].id, { name: 'Outro nome' })).rejects.toBeInstanceOf(
      ObjectUpdateNotAllowedError
    );
  });

  it('não permite alterar registros que já saíram da análise', async () => {
    const approvedRecord = { ...validInput, id: 'OBJ-ABCDEFGH', status: OBJECT_STATUS.available, createdAt: 'x', updatedAt: 'x' };
    const storage = createMemoryStorage({ [OBJECTS_STORAGE_KEY]: JSON.stringify([approvedRecord]) });
    const { service } = buildService({ storage });

    await expect(service.updateObject('OBJ-ABCDEFGH', { name: 'Outro nome' })).rejects.toBeInstanceOf(
      ObjectUpdateNotAllowedError
    );
  });

  it('ignora conteúdo corrompido no armazenamento', async () => {
    const storage = createMemoryStorage({ [OBJECTS_STORAGE_KEY]: '{corrompido' });
    const { service } = buildService({ storage });

    await expect(service.listObjects()).resolves.toHaveLength(mockObjects.length);
  });

  it('informa falha de gravação em vez de simular sucesso', async () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const { service } = buildService({ storage });

    await expect(service.createObject(validInput)).rejects.toBeInstanceOf(ObjectStorageError);
  });

  it('não altera os dados iniciais quando o registro retornado é modificado', async () => {
    const { service } = buildService();

    const record = await service.getObjectById(mockObjects[0].id);
    record.name = 'Alterado';

    await expect(service.getObjectById(mockObjects[0].id)).resolves.toMatchObject({ name: mockObjects[0].name });
  });

  it('mantém identificadores válidos e únicos nos dados de demonstração', () => {
    expect(mockObjects.every((item) => isValidObjectId(item.id))).toBe(true);
    expect(new Set(mockObjects.map((item) => item.id)).size).toBe(mockObjects.length);
  });

  it('lista apenas objetos disponíveis quando filtrado pelo status disponível', async () => {
    const { service } = buildService();
    await service.createObject(validInput);

    const available = await service.listObjects({ status: OBJECT_STATUS.available });

    expect(available.length).toBeGreaterThan(0);
    expect(available.every((item) => item.status === OBJECT_STATUS.available)).toBe(true);
  });

  it('conta os registros por status, incluindo os criados pelo usuário', async () => {
    const { service } = buildService();
    await service.createObject(validInput);

    const counts = await service.countObjectsByStatus();
    const seedCount = (status) => mockObjects.filter((item) => item.status === status).length;

    expect(counts[OBJECT_STATUS.pendingApproval]).toBe(seedCount(OBJECT_STATUS.pendingApproval) + 1);
    expect(counts[OBJECT_STATUS.available]).toBe(seedCount(OBJECT_STATUS.available));
    expect(Object.values(counts).reduce((total, value) => total + value, 0)).toBe(mockObjects.length + 1);
  });

  it('define transições de status coerentes com o fluxo de devolução', () => {
    expect(canTransitionStatus(OBJECT_STATUS.pendingApproval, OBJECT_STATUS.available)).toBe(true);
    expect(canTransitionStatus(OBJECT_STATUS.pendingApproval, OBJECT_STATUS.rejected)).toBe(true);
    expect(canTransitionStatus(OBJECT_STATUS.available, OBJECT_STATUS.inReturn)).toBe(true);
    expect(canTransitionStatus(OBJECT_STATUS.inReturn, OBJECT_STATUS.returned)).toBe(true);
    expect(canTransitionStatus(OBJECT_STATUS.inReturn, OBJECT_STATUS.available)).toBe(true);
    expect(canTransitionStatus(OBJECT_STATUS.pendingApproval, OBJECT_STATUS.returned)).toBe(false);
    expect(canTransitionStatus(OBJECT_STATUS.returned, OBJECT_STATUS.available)).toBe(false);
    expect(canTransitionStatus(OBJECT_STATUS.rejected, OBJECT_STATUS.available)).toBe(false);
  });

  it('altera o status de um registro seguindo as transições permitidas', async () => {
    const { service } = buildService();
    const record = await service.createObject(validInput);

    const available = await service.changeObjectStatus(record.id, OBJECT_STATUS.available);
    const listed = await service.listObjects({ status: OBJECT_STATUS.available });

    expect(available.status).toBe(OBJECT_STATUS.available);
    expect(listed.map((item) => item.id)).toContain(record.id);
    await expect(service.changeObjectStatus(record.id, OBJECT_STATUS.returned)).rejects.toBeInstanceOf(
      ObjectUpdateNotAllowedError
    );
  });
});
