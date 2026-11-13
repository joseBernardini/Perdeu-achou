import fs from 'fs';
import path from 'path';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-perdeu-achou';

const ADMIN = 'admin-uid';
const SECOND_ADMIN = 'admin-dois-uid';
const ALICE = 'alice-uid';
const BOB = 'bob-uid';
const DISABLED = 'desativado-uid';

const PENDING_OBJECT = 'OBJ-PEND0001';
const AVAILABLE_OBJECT = 'OBJ-DSPN0001';
const ADMIN_OBJECT = 'OBJ-ADMN0001';
const ALICE_CLAIM = 'SOL-ACEA0001';
const BOB_CLAIM = 'SOL-BBBB0001';

let testEnv;

const past = Timestamp.fromDate(new Date('2026-11-01T12:00:00.000Z'));

function profile(uid, overrides = {}) {
  return {
    uid,
    displayName: `Pessoa ${uid}`,
    email: `${uid}@exemplo.com`,
    profileType: 'aluno',
    role: 'user',
    createdAt: past,
    active: true,
    ...overrides,
  };
}

function storedObject(code, overrides = {}) {
  return {
    code,
    title: 'Garrafa térmica',
    category: 'acessorios',
    description: 'Garrafa térmica azul com tampa preta.',
    locationFound: 'Biblioteca',
    dateFound: '2026-11-01',
    notes: '',
    status: 'disponivel',
    createdBy: ALICE,
    createdAt: past,
    updatedAt: past,
    reviewedBy: null,
    reviewedAt: null,
    activeClaimId: null,
    ...overrides,
  };
}

function storedClaim(objectId, requesterId, overrides = {}) {
  return {
    objectId,
    objectCode: objectId,
    requesterId,
    message: 'A garrafa tem um amassado na base e meu nome gravado por dentro.',
    additionalInfo: '',
    status: 'pendente',
    createdAt: past,
    updatedAt: past,
    reviewedBy: null,
    reviewedAt: null,
    ...overrides,
  };
}

function newObject(uid, overrides = {}) {
  return {
    code: 'OBJ-NEWW0001',
    title: 'Fone de ouvido',
    category: 'eletronicos',
    description: 'Fone de ouvido branco com estojo arranhado.',
    locationFound: 'Sala 104',
    dateFound: '2026-11-01',
    notes: '',
    status: 'pendente_aprovacao',
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedBy: null,
    reviewedAt: null,
    activeClaimId: null,
    ...overrides,
  };
}

function newClaim(uid, objectId, overrides = {}) {
  return {
    objectId,
    objectCode: objectId,
    requesterId: uid,
    message: 'O fone tem um adesivo de estrela na lateral e a capa é verde.',
    additionalInfo: '',
    status: 'pendente',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedBy: null,
    reviewedAt: null,
    ...overrides,
  };
}

function db(uid) {
  return uid
    ? testEnv.authenticatedContext(uid, { email: `${uid}@exemplo.com` }).firestore()
    : testEnv.unauthenticatedContext().firestore();
}

function auditLog(firestore, data) {
  return {
    ref: doc(collection(firestore, 'auditLogs')),
    data: { actorRole: 'admin', result: 'sucesso', createdAt: serverTimestamp(), ...data },
  };
}

function createClaimBatch(firestore, uid, claimId, objectId) {
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, 'claims', claimId), newClaim(uid, objectId));
  batch.set(doc(firestore, 'pendingClaims', `${objectId}_${uid}`), {
    objectId,
    requesterId: uid,
    claimId,
    createdAt: serverTimestamp(),
  });
  return batch.commit();
}

function approveClaimBatch(firestore, actor, claimId, objectId, requesterId) {
  const batch = writeBatch(firestore);
  batch.update(doc(firestore, 'objects', objectId), { status: 'em_devolucao', updatedAt: serverTimestamp(), activeClaimId: claimId });
  batch.update(doc(firestore, 'claims', claimId), {
    status: 'aprovada',
    updatedAt: serverTimestamp(),
    reviewedBy: actor,
    reviewedAt: serverTimestamp(),
  });
  batch.delete(doc(firestore, 'pendingClaims', `${objectId}_${requesterId}`));
  const log = auditLog(firestore, {
    type: 'solicitacao_aprovada',
    targetType: 'solicitacao',
    targetId: claimId,
    actorId: actor,
    details: { from: 'pendente', to: 'aprovada', objectId },
  });
  batch.set(log.ref, log.data);
  return batch.commit();
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await setDoc(doc(firestore, 'users', ADMIN), profile(ADMIN, { role: 'admin', profileType: 'funcionario' }));
    await setDoc(doc(firestore, 'users', SECOND_ADMIN), profile(SECOND_ADMIN, { role: 'admin', profileType: 'funcionario' }));
    await setDoc(doc(firestore, 'users', ALICE), profile(ALICE));
    await setDoc(doc(firestore, 'users', BOB), profile(BOB));
    await setDoc(doc(firestore, 'users', DISABLED), profile(DISABLED, { active: false }));
    await setDoc(doc(firestore, 'objects', PENDING_OBJECT), storedObject(PENDING_OBJECT, { status: 'pendente_aprovacao' }));
    await setDoc(doc(firestore, 'objects', AVAILABLE_OBJECT), storedObject(AVAILABLE_OBJECT));
    await setDoc(doc(firestore, 'objects', ADMIN_OBJECT), storedObject(ADMIN_OBJECT, { status: 'pendente_aprovacao', createdBy: ADMIN }));
    await setDoc(doc(firestore, 'claims', ALICE_CLAIM), storedClaim(AVAILABLE_OBJECT, ALICE));
    await setDoc(doc(firestore, 'pendingClaims', `${AVAILABLE_OBJECT}_${ALICE}`), {
      objectId: AVAILABLE_OBJECT,
      requesterId: ALICE,
      claimId: ALICE_CLAIM,
      createdAt: past,
    });
    await setDoc(doc(firestore, 'claims', BOB_CLAIM), storedClaim(AVAILABLE_OBJECT, BOB));
    await setDoc(doc(firestore, 'pendingClaims', `${AVAILABLE_OBJECT}_${BOB}`), {
      objectId: AVAILABLE_OBJECT,
      requesterId: BOB,
      claimId: BOB_CLAIM,
      createdAt: past,
    });
  });
});

describe('usuário não autenticado', () => {
  it('consulta objetos disponíveis', async () => {
    await assertSucceeds(getDoc(doc(db(), 'objects', AVAILABLE_OBJECT)));
    await assertSucceeds(getDocs(query(collection(db(), 'objects'), where('status', '==', 'disponivel'))));
  });

  it('não acessa recursos privados', async () => {
    await assertFails(getDoc(doc(db(), 'objects', PENDING_OBJECT)));
    await assertFails(getDocs(collection(db(), 'objects')));
    await assertFails(getDoc(doc(db(), 'users', ALICE)));
    await assertFails(getDoc(doc(db(), 'claims', ALICE_CLAIM)));
    await assertFails(getDocs(collection(db(), 'auditLogs')));
  });

  it('não cria objetos nem solicitações', async () => {
    await assertFails(setDoc(doc(db(), 'objects', 'OBJ-NEWW0001'), newObject('ninguem')));
    await assertFails(setDoc(doc(db(), 'claims', 'SOL-NEWW0001'), newClaim('ninguem', AVAILABLE_OBJECT)));
  });
});

describe('perfis de usuário', () => {
  it('permite consultar e atualizar os próprios dados autorizados', async () => {
    await assertSucceeds(getDoc(doc(db(ALICE), 'users', ALICE)));
    await assertSucceeds(updateDoc(doc(db(ALICE), 'users', ALICE), { displayName: 'Alice Souza', profileType: 'funcionario' }));
  });

  it('impede o usuário de alterar o próprio papel e campos protegidos', async () => {
    await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), { role: 'admin' }));
    await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), { active: false }));
    await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), { uid: BOB }));
    await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), { createdAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db(ALICE), 'users', ALICE), { email: 'outro@exemplo.com' }));
  });

  it('impede criar perfil administrador ou perfil de terceiros', async () => {
    const carol = 'carol-uid';
    const base = { uid: carol, displayName: 'Carol', email: `${carol}@exemplo.com`, profileType: 'aluno', createdAt: serverTimestamp(), active: true };

    await assertFails(setDoc(doc(db(carol), 'users', carol), { ...base, role: 'admin' }));
    await assertFails(setDoc(doc(db(carol), 'users', 'outra-pessoa'), { ...base, uid: 'outra-pessoa', role: 'user' }));
    await assertFails(setDoc(doc(db(carol), 'users', carol), { ...base, role: 'user', email: 'falso@exemplo.com' }));
    await assertSucceeds(setDoc(doc(db(carol), 'users', carol), { ...base, role: 'user' }));
  });

  it('impede acessar dados privados de outros usuários', async () => {
    await assertFails(getDoc(doc(db(ALICE), 'users', BOB)));
    await assertFails(getDocs(collection(db(ALICE), 'users')));
    await assertFails(updateDoc(doc(db(ALICE), 'users', BOB), { displayName: 'Invasão' }));
  });

  it('permite ao administrador consultar perfis, mas não alterar papéis', async () => {
    await assertSucceeds(getDoc(doc(db(ADMIN), 'users', ALICE)));
    await assertSucceeds(getDocs(collection(db(ADMIN), 'users')));
    await assertFails(updateDoc(doc(db(ADMIN), 'users', ALICE), { role: 'admin' }));
  });
});

describe('cadastro de objetos', () => {
  it('permite ao usuário criar um registro pendente em seu nome', async () => {
    await assertSucceeds(setDoc(doc(db(ALICE), 'objects', 'OBJ-NEWW0001'), newObject(ALICE)));
  });

  it('recusa status, criador ou campos administrativos definidos pelo usuário', async () => {
    const ref = doc(db(ALICE), 'objects', 'OBJ-NEWW0001');
    await assertFails(setDoc(ref, newObject(ALICE, { status: 'disponivel' })));
    await assertFails(setDoc(ref, newObject(ALICE, { createdBy: BOB })));
    await assertFails(setDoc(ref, newObject(ALICE, { reviewedBy: ALICE })));
    await assertFails(setDoc(ref, newObject(ALICE, { activeClaimId: 'SOL-ABCD1234' })));
    await assertFails(setDoc(ref, newObject(ALICE, { createdAt: past })));
    await assertFails(setDoc(ref, { ...newObject(ALICE), extra: 'campo' }));
  });

  it('valida campos obrigatórios, datas e código', async () => {
    const ref = doc(db(ALICE), 'objects', 'OBJ-NEWW0001');
    await assertFails(setDoc(ref, newObject(ALICE, { title: 'ab' })));
    await assertFails(setDoc(ref, newObject(ALICE, { category: 'veiculos' })));
    await assertFails(setDoc(ref, newObject(ALICE, { dateFound: '2999-01-01' })));
    await assertFails(setDoc(ref, newObject(ALICE, { dateFound: '2026-02-30' })));
    await assertFails(setDoc(ref, newObject(ALICE, { dateFound: '01/11/2026' })));
    await assertFails(setDoc(ref, newObject(ALICE, { code: 'OBJ-OUTRO001' })));
    await assertFails(setDoc(doc(db(ALICE), 'objects', 'codigo-livre'), newObject(ALICE, { code: 'codigo-livre' })));
  });

  it('impede sobrescrever um código existente', async () => {
    await assertFails(setDoc(doc(db(ALICE), 'objects', AVAILABLE_OBJECT), newObject(ALICE, { code: AVAILABLE_OBJECT })));
  });

  it('permite ao criador consultar os próprios registros pendentes', async () => {
    await assertSucceeds(getDoc(doc(db(ALICE), 'objects', PENDING_OBJECT)));
    await assertSucceeds(getDocs(query(collection(db(ALICE), 'objects'), where('createdBy', '==', ALICE))));
    await assertFails(getDoc(doc(db(BOB), 'objects', PENDING_OBJECT)));
  });

  it('impede contas desativadas de criar registros', async () => {
    await assertFails(setDoc(doc(db(DISABLED), 'objects', 'OBJ-NEWW0001'), newObject(DISABLED)));
  });
});

describe('decisões sobre objetos', () => {
  const approval = (actor) => ({ status: 'disponivel', updatedAt: serverTimestamp(), reviewedBy: actor, reviewedAt: serverTimestamp() });

  it('impede o usuário comum de aprovar ou rejeitar objetos', async () => {
    await assertFails(updateDoc(doc(db(ALICE), 'objects', PENDING_OBJECT), approval(ALICE)));
    await assertFails(updateDoc(doc(db(BOB), 'objects', PENDING_OBJECT), { ...approval(BOB), status: 'reprovado' }));
  });

  it('permite ao administrador aprovar um objeto e registrar a auditoria', async () => {
    const firestore = db(ADMIN);
    const batch = writeBatch(firestore);
    batch.update(doc(firestore, 'objects', PENDING_OBJECT), approval(ADMIN));
    const log = auditLog(firestore, {
      type: 'objeto_aprovado',
      targetType: 'objeto',
      targetId: PENDING_OBJECT,
      actorId: ADMIN,
      details: { from: 'pendente_aprovacao', to: 'disponivel' },
    });
    batch.set(log.ref, log.data);

    await assertSucceeds(batch.commit());
  });

  it('impede o administrador de aprovar o próprio objeto', async () => {
    await assertFails(updateDoc(doc(db(ADMIN), 'objects', ADMIN_OBJECT), approval(ADMIN)));
    await assertSucceeds(updateDoc(doc(db(SECOND_ADMIN), 'objects', ADMIN_OBJECT), approval(SECOND_ADMIN)));
  });

  it('impede alterar campos do registro ou pular etapas do fluxo', async () => {
    const ref = doc(db(ADMIN), 'objects', PENDING_OBJECT);
    await assertFails(updateDoc(ref, { ...approval(ADMIN), title: 'Outro título' }));
    await assertFails(updateDoc(ref, { ...approval(ADMIN), reviewedBy: BOB }));
    await assertFails(updateDoc(ref, { status: 'devolvido', updatedAt: serverTimestamp(), reviewedBy: ADMIN, reviewedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db(ADMIN), 'objects', AVAILABLE_OBJECT), { status: 'em_devolucao', updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(doc(db(ADMIN), 'objects', AVAILABLE_OBJECT)));
  });
});

describe('solicitações de recuperação', () => {
  it('permite consultar apenas as próprias solicitações', async () => {
    await assertSucceeds(getDoc(doc(db(ALICE), 'claims', ALICE_CLAIM)));
    await assertSucceeds(getDocs(query(collection(db(ALICE), 'claims'), where('requesterId', '==', ALICE))));
    await assertFails(getDoc(doc(db(ALICE), 'claims', BOB_CLAIM)));
    await assertFails(getDocs(collection(db(ALICE), 'claims')));
    await assertFails(getDocs(query(collection(db(ALICE), 'claims'), where('requesterId', '==', BOB))));
  });

  it('permite criar uma solicitação pendente com a trava de duplicidade', async () => {
    const carol = 'carol-uid';
    await testEnv.withSecurityRulesDisabled((context) => setDoc(doc(context.firestore(), 'users', carol), profile(carol)));

    await assertSucceeds(createClaimBatch(db(carol), carol, 'SOL-CARA0001', AVAILABLE_OBJECT));
  });

  it('impede solicitação duplicada pendente', async () => {
    await assertFails(createClaimBatch(db(ALICE), ALICE, 'SOL-ACEA0002', AVAILABLE_OBJECT));
  });

  it('impede solicitação sem a trava, para objeto indisponível ou com status forjado', async () => {
    const carol = 'carol-uid';
    await testEnv.withSecurityRulesDisabled((context) => setDoc(doc(context.firestore(), 'users', carol), profile(carol)));

    await assertFails(setDoc(doc(db(carol), 'claims', 'SOL-CARA0001'), newClaim(carol, AVAILABLE_OBJECT)));
    await assertFails(createClaimBatch(db(carol), carol, 'SOL-CARA0002', PENDING_OBJECT));

    const firestore = db(carol);
    const batch = writeBatch(firestore);
    batch.set(doc(firestore, 'claims', 'SOL-CARA0003'), newClaim(carol, AVAILABLE_OBJECT, { status: 'aprovada' }));
    batch.set(doc(firestore, 'pendingClaims', `${AVAILABLE_OBJECT}_${carol}`), {
      objectId: AVAILABLE_OBJECT,
      requesterId: carol,
      claimId: 'SOL-CARA0003',
      createdAt: serverTimestamp(),
    });
    await assertFails(batch.commit());
  });

  it('impede o solicitante de alterar o status da própria solicitação', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'claims', ALICE_CLAIM), {
        status: 'aprovada',
        updatedAt: serverTimestamp(),
        reviewedBy: ALICE,
        reviewedAt: serverTimestamp(),
      })
    );
    await assertFails(deleteDoc(doc(db(ALICE), 'pendingClaims', `${AVAILABLE_OBJECT}_${ALICE}`)));
  });

  it('permite ao administrador rejeitar uma solicitação e liberar a trava', async () => {
    const firestore = db(ADMIN);
    const batch = writeBatch(firestore);
    batch.update(doc(firestore, 'claims', BOB_CLAIM), {
      status: 'rejeitada',
      updatedAt: serverTimestamp(),
      reviewedBy: ADMIN,
      reviewedAt: serverTimestamp(),
    });
    batch.delete(doc(firestore, 'pendingClaims', `${AVAILABLE_OBJECT}_${BOB}`));
    const log = auditLog(firestore, {
      type: 'solicitacao_rejeitada',
      targetType: 'solicitacao',
      targetId: BOB_CLAIM,
      actorId: ADMIN,
      details: { from: 'pendente', to: 'rejeitada', reason: 'As informações não conferem com o objeto.', objectId: AVAILABLE_OBJECT },
    });
    batch.set(log.ref, log.data);

    await assertSucceeds(batch.commit());
  });

  it('aprova uma solicitação e impede uma segunda aprovação para o mesmo objeto', async () => {
    await assertSucceeds(approveClaimBatch(db(ADMIN), ADMIN, ALICE_CLAIM, AVAILABLE_OBJECT, ALICE));
    await assertFails(approveClaimBatch(db(SECOND_ADMIN), SECOND_ADMIN, BOB_CLAIM, AVAILABLE_OBJECT, BOB));
  });

  it('impede aprovar uma solicitação sem atualizar o objeto', async () => {
    const firestore = db(ADMIN);
    const batch = writeBatch(firestore);
    batch.update(doc(firestore, 'claims', ALICE_CLAIM), {
      status: 'aprovada',
      updatedAt: serverTimestamp(),
      reviewedBy: ADMIN,
      reviewedAt: serverTimestamp(),
    });
    batch.delete(doc(firestore, 'pendingClaims', `${AVAILABLE_OBJECT}_${ALICE}`));
    await assertFails(batch.commit());
  });

  it('impede o administrador de analisar a própria solicitação', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'claims', 'SOL-ADMN0001'), storedClaim(AVAILABLE_OBJECT, ADMIN));
      await setDoc(doc(context.firestore(), 'pendingClaims', `${AVAILABLE_OBJECT}_${ADMIN}`), {
        objectId: AVAILABLE_OBJECT,
        requesterId: ADMIN,
        claimId: 'SOL-ADMN0001',
        createdAt: past,
      });
    });

    await assertFails(approveClaimBatch(db(ADMIN), ADMIN, 'SOL-ADMN0001', AVAILABLE_OBJECT, ADMIN));
    await assertSucceeds(approveClaimBatch(db(SECOND_ADMIN), SECOND_ADMIN, 'SOL-ADMN0001', AVAILABLE_OBJECT, ADMIN));
  });

  it('conclui a devolução mantendo objeto e solicitação consistentes', async () => {
    await assertSucceeds(approveClaimBatch(db(ADMIN), ADMIN, ALICE_CLAIM, AVAILABLE_OBJECT, ALICE));

    const firestore = db(ADMIN);
    const batch = writeBatch(firestore);
    batch.update(doc(firestore, 'objects', AVAILABLE_OBJECT), {
      status: 'devolvido',
      updatedAt: serverTimestamp(),
      reviewedBy: ADMIN,
      reviewedAt: serverTimestamp(),
    });
    batch.update(doc(firestore, 'claims', ALICE_CLAIM), {
      status: 'concluida',
      updatedAt: serverTimestamp(),
      reviewedBy: ADMIN,
      reviewedAt: serverTimestamp(),
    });
    const log = auditLog(firestore, {
      type: 'objeto_devolvido',
      targetType: 'objeto',
      targetId: AVAILABLE_OBJECT,
      actorId: ADMIN,
      details: { from: 'em_devolucao', to: 'devolvido', requestId: ALICE_CLAIM },
    });
    batch.set(log.ref, log.data);

    await assertSucceeds(batch.commit());
    await assertFails(
      updateDoc(doc(db(ADMIN), 'objects', AVAILABLE_OBJECT), {
        status: 'disponivel',
        updatedAt: serverTimestamp(),
        activeClaimId: null,
      })
    );
  });
});

describe('histórico de auditoria', () => {
  it('é restrito a administradores e não pode ser alterado', async () => {
    const firestore = db(ADMIN);
    const logRef = doc(collection(firestore, 'auditLogs'));
    const batch = writeBatch(firestore);
    batch.update(doc(firestore, 'objects', PENDING_OBJECT), {
      status: 'reprovado',
      updatedAt: serverTimestamp(),
      reviewedBy: ADMIN,
      reviewedAt: serverTimestamp(),
    });
    batch.set(logRef, {
      type: 'objeto_rejeitado',
      targetType: 'objeto',
      targetId: PENDING_OBJECT,
      actorId: ADMIN,
      actorRole: 'admin',
      details: { from: 'pendente_aprovacao', to: 'reprovado', reason: 'Descrição contém dados pessoais.' },
      result: 'sucesso',
      createdAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());

    await assertSucceeds(getDocs(collection(db(ADMIN), 'auditLogs')));
    await assertFails(getDocs(collection(db(ALICE), 'auditLogs')));
    await assertFails(updateDoc(doc(db(ADMIN), 'auditLogs', logRef.id), { result: 'alterado' }));
    await assertFails(deleteDoc(doc(db(ADMIN), 'auditLogs', logRef.id)));
  });

  it('impede usuários comuns e registros forjados', async () => {
    const entry = {
      type: 'objeto_aprovado',
      targetType: 'objeto',
      targetId: PENDING_OBJECT,
      details: { from: 'pendente_aprovacao', to: 'disponivel' },
      actorRole: 'admin',
      result: 'sucesso',
      createdAt: serverTimestamp(),
    };

    await assertFails(setDoc(doc(collection(db(ALICE), 'auditLogs')), { ...entry, actorId: ALICE }));
    await assertFails(setDoc(doc(collection(db(ADMIN), 'auditLogs')), { ...entry, actorId: ADMIN }));
    await assertFails(setDoc(doc(collection(db(ADMIN), 'auditLogs')), { ...entry, actorId: SECOND_ADMIN }));
  });
});
