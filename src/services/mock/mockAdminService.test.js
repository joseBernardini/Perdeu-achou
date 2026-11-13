import mockObjects from './mockObjects';
import { ADMIN_EVENT_TYPES, OBJECT_STATUS, REQUEST_STATUS, USER_ROLES } from '../../utils/constants';
import { createMockAdminService } from './mockAdminService';
import { createMockObjectService, SEED_STATUS_STORAGE_KEY } from './mockObjectService';
import { createMockRecoveryRequestService } from './mockRecoveryRequestService';
import {
  FormValidationError,
  NotAuthenticatedError,
  ObjectUpdateNotAllowedError,
  PermissionDeniedError,
  RequestStatusChangeError,
} from '../serviceErrors';

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

const seedPending = mockObjects.find((item) => item.status === OBJECT_STATUS.pendingApproval);
const seedAvailable = mockObjects.find((item) => item.status === OBJECT_STATUS.available);
const seedReturned = mockObjects.find((item) => item.status === OBJECT_STATUS.returned);

const staff = { id: 'USR-STAF1111', role: USER_ROLES.admin };
const admin = { id: 'USR-ADMN1111', role: USER_ROLES.admin };
const member = { id: 'USR-MEMB1111', role: USER_ROLES.user };
const REQUESTER_A = 'USR-AAAA1111';
const REQUESTER_B = 'USR-BBBB2222';
const REASON = 'Informações insuficientes para confirmar a propriedade.';
const MESSAGE = 'A garrafa tem um amassado na base e um adesivo de planeta descolando na lateral.';

function buildServices() {
  const storage = createMemoryStorage();
  const objects = createMockObjectService({ storage, delay: 0 });
  const requests = createMockRecoveryRequestService({ storage, objects, delay: 0 });
  const admin = createMockAdminService({ storage, delay: 0 });
  return { storage, objects, requests, admin };
}

async function createRequest(requests, requesterId, objectId = seedAvailable.id) {
  return requests.createRequest({ objectId, message: MESSAGE }, { requesterId });
}

describe('mockAdminService', () => {
  it('exige perfil de funcionário ou administrador', async () => {
    const { admin: service } = buildServices();

    await expect(service.getOverview(null)).rejects.toBeInstanceOf(NotAuthenticatedError);
    await expect(service.getOverview(member)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(service.getOverview(staff)).resolves.toBeDefined();
  });

  it('calcula os indicadores a partir dos dados e os atualiza após as ações', async () => {
    const { admin: service, requests } = buildServices();
    const count = (status) => mockObjects.filter((item) => item.status === status).length;

    const before = await service.getOverview(staff);

    expect(before).toMatchObject({
      totalObjects: mockObjects.length,
      pendingObjects: count(OBJECT_STATUS.pendingApproval),
      availableObjects: count(OBJECT_STATUS.available),
      returnedObjects: count(OBJECT_STATUS.returned),
      pendingRequests: 0,
    });

    await service.approveObject(seedPending.id, staff);
    await createRequest(requests, REQUESTER_A);

    const after = await service.getOverview(staff);

    expect(after.pendingObjects).toBe(before.pendingObjects - 1);
    expect(after.availableObjects).toBe(before.availableObjects + 1);
    expect(after.pendingRequests).toBe(1);
  });

  it('aprova registros pendentes, guardando a alteração separada dos dados iniciais', async () => {
    const { admin: service, objects, storage } = buildServices();

    const updated = await service.approveObject(seedPending.id, staff);

    expect(updated.status).toBe(OBJECT_STATUS.available);
    expect((await objects.getObjectById(seedPending.id)).status).toBe(OBJECT_STATUS.available);
    expect(JSON.parse(storage.data[SEED_STATUS_STORAGE_KEY])).toEqual({
      [seedPending.id]: { status: OBJECT_STATUS.available, updatedAt: expect.any(String) },
    });
    expect(mockObjects.find((item) => item.id === seedPending.id).status).toBe(OBJECT_STATUS.pendingApproval);
  });

  it('impede o administrador de analisar um objeto registrado por ele', async () => {
    const { admin: service, objects } = buildServices();
    const created = await objects.createObject(
      {
        name: 'Pen drive prateado',
        category: 'eletronicos',
        description: 'Pen drive prateado com tampa giratória.',
        location: 'Laboratório',
        foundDate: '2026-11-10',
      },
      { registeredBy: staff.id }
    );

    await expect(service.approveObject(created.id, staff)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(service.rejectObject(created.id, staff, REASON)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(service.approveObject(created.id, admin)).resolves.toMatchObject({ status: OBJECT_STATUS.available });
  });

  it('rejeita registros pendentes exigindo motivo', async () => {
    const { admin: service } = buildServices();

    await expect(service.rejectObject(seedPending.id, staff, 'curto')).rejects.toBeInstanceOf(FormValidationError);

    const updated = await service.rejectObject(seedPending.id, staff, REASON);

    expect(updated.status).toBe(OBJECT_STATUS.rejected);
    await expect(service.approveObject(seedPending.id, staff)).rejects.toBeInstanceOf(ObjectUpdateNotAllowedError);
  });

  it('percorre o fluxo completo até a devolução e registra o histórico', async () => {
    const { admin: service, requests } = buildServices();
    const request = await createRequest(requests, REQUESTER_A);

    await service.approveRequest(request.id, staff);
    let details = await service.getRequestDetails(request.id, staff);

    expect(details.request.status).toBe(REQUEST_STATUS.approved);
    expect(details.object.status).toBe(OBJECT_STATUS.inReturn);

    await service.completeRequest(request.id, staff);
    details = await service.getRequestDetails(request.id, staff);

    expect(details.request.status).toBe(REQUEST_STATUS.completed);
    expect(details.object.status).toBe(OBJECT_STATUS.returned);

    const events = await service.listHistory(staff);
    expect(events.map((event) => event.type)).toEqual([ADMIN_EVENT_TYPES.objectReturned, ADMIN_EVENT_TYPES.requestApproved]);
    expect(events[0]).toMatchObject({ actorId: staff.id, actorRole: USER_ROLES.admin, targetId: seedAvailable.id });
  });

  it('impede aprovar duas solicitações para o mesmo objeto', async () => {
    const { admin: service, requests } = buildServices();
    const first = await createRequest(requests, REQUESTER_A);
    const second = await createRequest(requests, REQUESTER_B);

    await service.approveRequest(first.id, staff);

    await expect(service.approveRequest(second.id, staff)).rejects.toBeInstanceOf(RequestStatusChangeError);
    expect((await service.getRequestDetails(second.id, staff)).request.status).toBe(REQUEST_STATUS.pending);

    await service.rejectRequest(second.id, staff, REASON);
    expect((await service.getRequestDetails(second.id, staff)).request.status).toBe(REQUEST_STATUS.rejected);
  });

  it('cancela uma aprovação e devolve o objeto para a consulta', async () => {
    const { admin: service, requests, objects } = buildServices();
    const request = await createRequest(requests, REQUESTER_A);
    await service.approveRequest(request.id, staff);

    await service.rejectRequest(request.id, staff, REASON);

    expect((await objects.getObjectById(seedAvailable.id)).status).toBe(OBJECT_STATUS.available);
    const [event] = await service.listHistory(staff, { type: ADMIN_EVENT_TYPES.requestApprovalCanceled });
    expect(event.details.reason).toBe(REASON);
  });

  it('não permite que o funcionário analise a própria solicitação', async () => {
    const { admin: service, requests } = buildServices();
    const request = await createRequest(requests, staff.id);

    await expect(service.approveRequest(request.id, staff)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(service.rejectRequest(request.id, staff, REASON)).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it('só conclui devoluções de solicitações aprovadas', async () => {
    const { admin: service, requests } = buildServices();
    const request = await createRequest(requests, REQUESTER_A);

    await expect(service.completeRequest(request.id, staff)).rejects.toBeInstanceOf(RequestStatusChangeError);
  });

  it('impede que um objeto devolvido volte a ficar disponível sem reabertura por administrador', async () => {
    const { admin: service, objects } = buildServices();

    await expect(objects.changeObjectStatus(seedReturned.id, OBJECT_STATUS.available)).rejects.toBeInstanceOf(
      ObjectUpdateNotAllowedError
    );
    await expect(service.reopenObject(seedReturned.id, member, REASON)).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(service.reopenObject(seedReturned.id, admin, '')).rejects.toBeInstanceOf(FormValidationError);

    const reopened = await service.reopenObject(seedReturned.id, admin, 'Devolução registrada por engano no balcão.');

    expect(reopened.status).toBe(OBJECT_STATUS.available);
    const [event] = await service.listHistory(staff);
    expect(event).toMatchObject({ type: ADMIN_EVENT_TYPES.objectReopened, actorRole: USER_ROLES.admin });
    await expect(service.reopenObject(seedAvailable.id, admin, REASON)).rejects.toBeInstanceOf(ObjectUpdateNotAllowedError);
  });

  it('lista objetos com solicitações pendentes e solicitações com o nome do solicitante', async () => {
    const { admin: service, requests, storage } = buildServices();
    storage.setItem(
      'perdeu-achou:usuarios-demonstracao:v1',
      JSON.stringify([{ id: REQUESTER_A, name: 'Pessoa A', email: 'a@exemplo.com', role: USER_ROLES.user }])
    );
    await createRequest(requests, REQUESTER_A);

    const objectsList = await service.listObjects(staff);
    const requestsList = await service.listRequests(staff);

    expect(objectsList.find((item) => item.id === seedAvailable.id).pendingRequestCount).toBe(1);
    expect(requestsList[0].requester).toEqual({ id: REQUESTER_A, name: 'Pessoa A' });
    expect(requestsList[0].requester).not.toHaveProperty('email');
  });
});
