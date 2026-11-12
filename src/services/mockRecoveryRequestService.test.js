import mockObjects from '../data/mockObjects';
import { OBJECT_STATUS, REQUEST_STATUS, USER_ROLES } from '../utils/constants';
import { createMockObjectService } from './mockObjectService';
import { canTransitionRequestStatus, createMockRecoveryRequestService, RECOVERY_REQUESTS_STORAGE_KEY } from './mockRecoveryRequestService';
import {
  FormValidationError,
  NotAuthenticatedError,
  ObjectNotFoundError,
  ObjectUnavailableError,
  PermissionDeniedError,
  RequestStatusChangeError,
} from './serviceErrors';

function createMemoryStorage() {
  const data = {};
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

const available = mockObjects.find((item) => item.status === OBJECT_STATUS.available);
const inReturn = mockObjects.find((item) => item.status === OBJECT_STATUS.inReturn);
const pendingObject = mockObjects.find((item) => item.status === OBJECT_STATUS.pendingApproval);

const REQUESTER = 'USR-AAAA1111';
const OTHER_USER = 'USR-BBBB2222';
const staff = { id: 'USR-CCCC3333', role: USER_ROLES.staff };

const validInput = {
  objectId: available.id,
  message: 'A garrafa tem um amassado na base e meu nome gravado embaixo da tampa, do lado de dentro.',
  additionalInfo: '',
};

function buildService() {
  const storage = createMemoryStorage();
  const objects = createMockObjectService({ storage, delay: 0 });
  const service = createMockRecoveryRequestService({ storage, objects, delay: 0 });
  return { storage, service };
}

describe('mockRecoveryRequestService', () => {
  it('cria uma solicitação pendente com identificadores internos', async () => {
    const { service, storage } = buildService();

    const request = await service.createRequest(
      { ...validInput, status: REQUEST_STATUS.approved, requesterId: OTHER_USER },
      { requesterId: REQUESTER }
    );

    expect(request).toEqual({
      id: expect.stringMatching(/^SOL-[0-9A-Z]{8}$/),
      objectId: available.id,
      requesterId: REQUESTER,
      message: validInput.message,
      additionalInfo: '',
      status: REQUEST_STATUS.pending,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(JSON.parse(storage.data[RECOVERY_REQUESTS_STORAGE_KEY])).toHaveLength(1);
  });

  it('exige usuário autenticado', async () => {
    const { service } = buildService();

    await expect(service.createRequest(validInput, {})).rejects.toBeInstanceOf(NotAuthenticatedError);
  });

  it('valida a mensagem e as informações adicionais', async () => {
    const { service } = buildService();

    await expect(
      service.createRequest({ ...validInput, message: 'É meu', additionalInfo: 'a'.repeat(501) }, { requesterId: REQUESTER })
    ).rejects.toMatchObject({
      fieldErrors: {
        message: 'Descreva com mais detalhes: escreva pelo menos 30 caracteres.',
        additionalInfo: 'As informações adicionais devem ter no máximo 500 caracteres.',
      },
    });
    await expect(service.createRequest({ ...validInput, message: '' }, { requesterId: REQUESTER })).rejects.toBeInstanceOf(
      FormValidationError
    );
  });

  it('impede solicitação duplicada pendente do mesmo usuário para o mesmo objeto', async () => {
    const { service } = buildService();
    const first = await service.createRequest(validInput, { requesterId: REQUESTER });

    await expect(service.createRequest(validInput, { requesterId: REQUESTER })).rejects.toMatchObject({
      name: 'DuplicateRequestError',
      existingRequest: { id: first.id },
    });
    await expect(service.createRequest(validInput, { requesterId: OTHER_USER })).resolves.toMatchObject({
      requesterId: OTHER_USER,
    });
    await expect(service.findPendingRequest(available.id, REQUESTER)).resolves.toMatchObject({ id: first.id });
  });

  it('impede solicitações para objetos indisponíveis ou inexistentes', async () => {
    const { service } = buildService();

    await expect(service.createRequest({ ...validInput, objectId: inReturn.id }, { requesterId: REQUESTER })).rejects.toBeInstanceOf(
      ObjectUnavailableError
    );
    await expect(
      service.createRequest({ ...validInput, objectId: pendingObject.id }, { requesterId: REQUESTER })
    ).rejects.toBeInstanceOf(ObjectUnavailableError);
    await expect(
      service.createRequest({ ...validInput, objectId: 'OBJ-00000000' }, { requesterId: REQUESTER })
    ).rejects.toBeInstanceOf(ObjectNotFoundError);
  });

  it('lista apenas as solicitações do usuário, com o resumo do objeto', async () => {
    const { service } = buildService();
    await service.createRequest(validInput, { requesterId: REQUESTER });
    await service.createRequest(validInput, { requesterId: OTHER_USER });

    const requests = await service.listRequestsByRequester(REQUESTER);

    expect(requests).toHaveLength(1);
    expect(requests[0].object).toEqual({
      id: available.id,
      name: available.name,
      category: available.category,
      status: available.status,
    });
    await expect(service.listRequestsByRequester(null)).rejects.toBeInstanceOf(NotAuthenticatedError);
  });

  it('não permite que o próprio solicitante ou usuários comuns alterem o status', async () => {
    const { service } = buildService();
    const request = await service.createRequest(validInput, { requesterId: REQUESTER });

    await expect(
      service.changeRequestStatus(request.id, REQUEST_STATUS.approved, { actor: { id: REQUESTER, role: USER_ROLES.member } })
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(
      service.changeRequestStatus(request.id, REQUEST_STATUS.approved, { actor: { id: REQUESTER, role: USER_ROLES.staff } })
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it('permite que um funcionário altere o status seguindo as transições', async () => {
    const { service } = buildService();
    const request = await service.createRequest(validInput, { requesterId: REQUESTER });

    const approved = await service.changeRequestStatus(request.id, REQUEST_STATUS.approved, { actor: staff });

    expect(approved.status).toBe(REQUEST_STATUS.approved);
    await expect(service.changeRequestStatus(request.id, REQUEST_STATUS.pending, { actor: staff })).rejects.toBeInstanceOf(
      RequestStatusChangeError
    );
    await expect(service.createRequest(validInput, { requesterId: REQUESTER })).resolves.toMatchObject({
      status: REQUEST_STATUS.pending,
    });
  });

  it('define transições coerentes para as solicitações', () => {
    expect(canTransitionRequestStatus(REQUEST_STATUS.pending, REQUEST_STATUS.approved)).toBe(true);
    expect(canTransitionRequestStatus(REQUEST_STATUS.pending, REQUEST_STATUS.rejected)).toBe(true);
    expect(canTransitionRequestStatus(REQUEST_STATUS.approved, REQUEST_STATUS.completed)).toBe(true);
    expect(canTransitionRequestStatus(REQUEST_STATUS.pending, REQUEST_STATUS.completed)).toBe(false);
    expect(canTransitionRequestStatus(REQUEST_STATUS.rejected, REQUEST_STATUS.approved)).toBe(false);
    expect(canTransitionRequestStatus(REQUEST_STATUS.approved, REQUEST_STATUS.rejected)).toBe(true);
    expect(canTransitionRequestStatus(REQUEST_STATUS.completed, REQUEST_STATUS.rejected)).toBe(false);
  });

  it('não reconhece solicitações duplicadas quando a anterior já foi analisada', async () => {
    const { service } = buildService();
    const request = await service.createRequest(validInput, { requesterId: REQUESTER });
    await service.changeRequestStatus(request.id, REQUEST_STATUS.rejected, { actor: staff });

    await expect(service.findPendingRequest(available.id, REQUESTER)).resolves.toBeNull();
  });
});
