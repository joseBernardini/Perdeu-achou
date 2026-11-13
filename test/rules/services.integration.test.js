import fs from 'fs';
import path from 'path';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '../../src/services/firebase/firebaseApp';
import firebaseAdminService from '../../src/services/firebase/firebaseAdminService';
import firebaseAuthService from '../../src/services/firebase/firebaseAuthService';
import firebaseClaimService from '../../src/services/firebase/firebaseClaimService';
import firebaseObjectService from '../../src/services/firebase/firebaseObjectService';
import { getTodayISODate } from '../../src/utils/date';

jest.mock('../../src/services/firebase/firebaseConfig', () => ({
  firebaseConfig: {
    apiKey: 'demo-api-key',
    authDomain: 'demo-perdeu-achou.firebaseapp.com',
    projectId: 'demo-perdeu-achou',
    messagingSenderId: '0',
    appId: '1:0:web:0',
  },
  isFirebaseConfigured: true,
  firebaseConfigurationError: null,
  missingFirebaseVariables: [],
}));

const PASSWORD = 'senha-segura-123';
const REASON = 'As informações não conferem com o objeto guardado.';
const MESSAGE = 'O objeto tem um adesivo de estrela na lateral e um arranhão perto do conector.';

let testEnv;
const accounts = {};

async function signUp(key, profileType = 'aluno') {
  const user = await firebaseAuthService.signUp({
    name: `Pessoa ${key}`,
    email: `${key}@exemplo.com`,
    password: PASSWORD,
    passwordConfirmation: PASSWORD,
    profileType,
  });
  accounts[key] = user;
  return user;
}

async function signInAs(key) {
  return firebaseAuthService.signIn({ email: `${key}@exemplo.com`, password: PASSWORD });
}

async function registerObject(name) {
  return firebaseObjectService.createObject({
    name,
    category: 'eletronicos',
    description: `${name} com adesivo de estrela na lateral.`,
    location: 'Laboratório de informática',
    foundDate: getTodayISODate(),
    notes: '',
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-perdeu-achou',
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
  await testEnv.clearFirestore();
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perdeu-achou/accounts', { method: 'DELETE' });

  connectAuthEmulator(getFirebaseAuth(), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(getDb(), '127.0.0.1', 8080);

  const admin = await signUp('admin', 'funcionario');
  await testEnv.withSecurityRulesDisabled((context) =>
    updateDoc(doc(context.firestore(), 'users', admin.id), { role: 'admin' })
  );
  await signUp('segundo-admin', 'funcionario');
  await testEnv.withSecurityRulesDisabled((context) =>
    updateDoc(doc(context.firestore(), 'users', accounts['segundo-admin'].id), { role: 'admin' })
  );
  await signUp('alice');
  await signUp('bob');
  await signUp('carol');
});

afterAll(async () => {
  await firebaseAuthService.signOut().catch(() => {});
  await testEnv?.cleanup();
});

describe('serviços do app com Firebase Authentication e Firestore emulados', () => {
  const state = {};

  it('cria perfis com papel "user" e permite atualizar apenas campos autorizados', async () => {
    const user = await signInAs('alice');

    expect(user).toMatchObject({ role: 'user', profileType: 'aluno', email: 'alice@exemplo.com' });
    await expect(updateDoc(doc(getDb(), 'users', user.id), { role: 'admin' })).rejects.toMatchObject({ code: 'permission-denied' });

    const updated = await firebaseAuthService.updateProfile({ name: 'Alice Souza', profileType: 'funcionario' });
    expect(updated).toMatchObject({ name: 'Alice Souza', profileType: 'funcionario', role: 'user' });
  });

  it('registra objeto pendente que não aparece na consulta pública', async () => {
    await signInAs('alice');
    const object = await registerObject('Calculadora científica');
    state.objectId = object.id;

    expect(object.status).toBe('pendente_aprovacao');
    expect((await firebaseObjectService.listObjectsByCreator(accounts.alice.id)).map((item) => item.id)).toContain(object.id);
    expect((await firebaseObjectService.listObjects()).map((item) => item.id)).not.toContain(object.id);
  });

  it('impede um usuário comum de aprovar objetos mesmo forjando o papel na chamada', async () => {
    await signInAs('bob');

    const attempt = firebaseAdminService.approveObject(state.objectId, { id: accounts.bob.id, role: 'admin' });

    await expect(attempt).rejects.toThrow();
    await expect(attempt.catch((error) => error.name)).resolves.toMatch(/^(ObjectNotFoundError|PermissionDeniedError)$/);
  });

  it('permite ao administrador aprovar o objeto e registra a auditoria', async () => {
    const admin = await signInAs('admin');
    const updated = await firebaseAdminService.approveObject(state.objectId, admin);

    expect(updated.status).toBe('disponivel');
    const events = await firebaseAdminService.listHistory(admin, { targetIds: [state.objectId] });
    expect(events[0]).toMatchObject({ type: 'objeto_aprovado', actorId: admin.id, actorRole: 'admin' });
  });

  it('impede o administrador de aprovar o próprio objeto', async () => {
    const admin = await signInAs('admin');
    const own = await registerObject('Pen drive prateado');

    await expect(firebaseAdminService.approveObject(own.id, admin)).rejects.toMatchObject({ name: 'PermissionDeniedError' });

    const secondAdmin = await signInAs('segundo-admin');
    await expect(firebaseAdminService.approveObject(own.id, secondAdmin)).resolves.toMatchObject({ status: 'disponivel' });
  });

  it('cria solicitações e impede duplicidade pendente', async () => {
    await signInAs('bob');
    const bobClaim = await firebaseClaimService.createRequest({ objectId: state.objectId, message: MESSAGE }, { requesterId: accounts.bob.id });
    state.bobClaim = bobClaim.id;

    await expect(
      firebaseClaimService.createRequest({ objectId: state.objectId, message: MESSAGE }, { requesterId: accounts.bob.id })
    ).rejects.toMatchObject({ name: 'DuplicateRequestError' });
    await expect(firebaseClaimService.findPendingRequest(state.objectId, accounts.bob.id)).resolves.toMatchObject({ id: bobClaim.id });

    await signInAs('carol');
    const carolClaim = await firebaseClaimService.createRequest({ objectId: state.objectId, message: MESSAGE }, { requesterId: accounts.carol.id });
    state.carolClaim = carolClaim.id;
  });

  it('impede um usuário de consultar solicitações de terceiros', async () => {
    await signInAs('carol');

    await expect(getDoc(doc(getDb(), 'claims', state.bobClaim))).rejects.toMatchObject({ code: 'permission-denied' });
    const own = await firebaseClaimService.listRequestsByRequester(accounts.carol.id);
    expect(own.map((claim) => claim.id)).toEqual([state.carolClaim]);
  });

  it('aprova uma solicitação, bloqueia a aprovação concorrente e conclui a devolução', async () => {
    const admin = await signInAs('admin');

    await firebaseAdminService.approveRequest(state.bobClaim, admin);
    await expect(firebaseAdminService.approveRequest(state.carolClaim, admin)).rejects.toMatchObject({ name: 'RequestStatusChangeError' });

    await firebaseAdminService.rejectRequest(state.carolClaim, admin, REASON);
    await firebaseAdminService.completeRequest(state.bobClaim, admin);

    const details = await firebaseAdminService.getRequestDetails(state.bobClaim, admin);
    expect(details.request.status).toBe('concluida');
    expect(details.object).toMatchObject({ status: 'devolvido', activeClaimId: state.bobClaim });

    const overview = await firebaseAdminService.getOverview(admin);
    expect(overview).toMatchObject({ returnedObjects: 1, pendingRequests: 0 });
  });

  it('libera nova solicitação após a rejeição e cancela uma aprovação', async () => {
    const admin = await signInAs('admin');
    await firebaseAdminService.reopenObject(state.objectId, admin, 'Devolução registrada por engano no balcão.');

    await signInAs('carol');
    const retry = await firebaseClaimService.createRequest({ objectId: state.objectId, message: MESSAGE }, { requesterId: accounts.carol.id });

    await signInAs('admin');
    await firebaseAdminService.approveRequest(retry.id, admin);
    await firebaseAdminService.rejectRequest(retry.id, admin, REASON);

    const object = await firebaseObjectService.getObjectById(state.objectId);
    expect(object).toMatchObject({ status: 'disponivel', activeClaimId: null });

    const types = (await firebaseAdminService.listHistory(admin, {})).map((event) => event.type);
    expect(types).toEqual(expect.arrayContaining(['objeto_reaberto', 'aprovacao_cancelada', 'objeto_devolvido', 'solicitacao_rejeitada']));
  });

  it('impede o administrador de analisar a própria solicitação', async () => {
    const admin = await signInAs('admin');
    const claim = await firebaseClaimService.createRequest({ objectId: state.objectId, message: MESSAGE }, { requesterId: admin.id });

    await expect(firebaseAdminService.approveRequest(claim.id, admin)).rejects.toMatchObject({ name: 'PermissionDeniedError' });
  });

  it('impede usuário comum de acessar o histórico e dados de outros usuários', async () => {
    const alice = await signInAs('alice');

    await expect(firebaseAdminService.listHistory({ id: alice.id, role: 'admin' }, {})).rejects.toMatchObject({ name: 'PermissionDeniedError' });
    await expect(getDoc(doc(getDb(), 'users', accounts.bob.id))).rejects.toMatchObject({ code: 'permission-denied' });
  });
});
