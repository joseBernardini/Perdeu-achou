import { getMissingFirebaseVariables } from './firebaseConfig';
import { toServiceError } from './firebaseErrors';
import { claimFromFirestore, claimToFirestore, objectFromFirestore, objectToFirestore, toDomainUser, userProfileToFirestore } from './mappers';

const timestamp = (iso) => ({ toDate: () => new Date(iso) });

describe('configuração do Firebase', () => {
  const complete = {
    apiKey: 'AIzaSyEXEMPLOexemploEXEMPLOexemploEXEMP',
    authDomain: 'projeto.firebaseapp.com',
    projectId: 'projeto',
    messagingSenderId: '123',
    appId: '1:123:web:abc',
  };

  it('aceita uma configuração completa', () => {
    expect(getMissingFirebaseVariables(complete)).toEqual([]);
  });

  it('aponta variáveis ausentes ou com marcadores', () => {
    expect(getMissingFirebaseVariables({ ...complete, apiKey: 'COLE_AQUI_A_API_KEY', appId: '' })).toEqual([
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_APP_ID',
    ]);
  });
});

describe('conversão de dados do Firestore', () => {
  it('converte objetos entre o formato do Firestore e o da interface', () => {
    const values = {
      name: 'Garrafa térmica',
      category: 'acessorios',
      description: 'Garrafa térmica azul com tampa preta.',
      location: 'Biblioteca',
      foundDate: '2026-11-10',
      notes: '',
    };
    const stored = objectToFirestore(values, { code: 'OBJ-ABCDEFGH', createdBy: 'uid-1', status: 'pendente_aprovacao', timestamp: 'TS' });

    expect(stored).toEqual({
      code: 'OBJ-ABCDEFGH',
      title: 'Garrafa térmica',
      category: 'acessorios',
      description: 'Garrafa térmica azul com tampa preta.',
      locationFound: 'Biblioteca',
      dateFound: '2026-11-10',
      notes: '',
      status: 'pendente_aprovacao',
      createdBy: 'uid-1',
      createdAt: 'TS',
      updatedAt: 'TS',
      reviewedBy: null,
      reviewedAt: null,
      activeClaimId: null,
    });

    const domain = objectFromFirestore('OBJ-ABCDEFGH', {
      ...stored,
      createdAt: timestamp('2026-11-10T12:00:00.000Z'),
      updatedAt: timestamp('2026-11-11T08:00:00.000Z'),
    });

    expect(domain).toMatchObject({
      id: 'OBJ-ABCDEFGH',
      name: 'Garrafa térmica',
      location: 'Biblioteca',
      foundDate: '2026-11-10',
      registeredBy: 'uid-1',
      createdAt: '2026-11-10T12:00:00.000Z',
      updatedAt: '2026-11-11T08:00:00.000Z',
    });
  });

  it('não inclui dados pessoais no documento público do objeto', () => {
    const stored = objectToFirestore(
      { name: 'Caderno', category: 'outros', description: 'Caderno cinza com espiral.', location: 'Sala 2', foundDate: '2026-11-01' },
      { code: 'OBJ-ABCDEFGH', createdBy: 'uid-1', status: 'pendente_aprovacao', timestamp: 'TS' }
    );

    expect(Object.keys(stored)).not.toEqual(expect.arrayContaining(['email']));
    expect(JSON.stringify(stored)).not.toMatch(/@/);
  });

  it('converte solicitações com o código do objeto e status recebido', () => {
    const stored = claimToFirestore(
      { message: 'Mensagem com detalhes suficientes para validar.', additionalInfo: '', status: 'pendente' },
      { objectId: 'OBJ-ABCDEFGH', requesterId: 'uid-2', timestamp: 'TS' }
    );

    expect(stored).toMatchObject({ objectId: 'OBJ-ABCDEFGH', objectCode: 'OBJ-ABCDEFGH', requesterId: 'uid-2', status: 'pendente', reviewedBy: null });
    expect(claimFromFirestore('SOL-ABCDEFGH', { ...stored, createdAt: timestamp('2026-11-12T10:00:00.000Z') })).toMatchObject({
      id: 'SOL-ABCDEFGH',
      requesterId: 'uid-2',
      createdAt: '2026-11-12T10:00:00.000Z',
    });
  });

  it('cria todo perfil novo com o papel padrão "user" e ativo', () => {
    expect(userProfileToFirestore({ uid: 'uid-1', displayName: 'Pessoa', email: 'p@exemplo.com', profileType: 'funcionario', timestamp: 'TS' })).toEqual({
      uid: 'uid-1',
      displayName: 'Pessoa',
      email: 'p@exemplo.com',
      profileType: 'funcionario',
      role: 'user',
      createdAt: 'TS',
      active: true,
    });
  });

  it('só reconhece o papel de administrador quando ele está no perfil do Firestore', () => {
    const authUser = { uid: 'uid-1', email: 'p@exemplo.com', displayName: 'Pessoa' };

    expect(toDomainUser(authUser, null)).toMatchObject({ role: 'user', hasProfile: false });
    expect(toDomainUser(authUser, { role: 'administrador' }).role).toBe('user');
    expect(toDomainUser(authUser, { role: 'admin', active: true, displayName: 'Pessoa Admin' })).toMatchObject({
      role: 'admin',
      name: 'Pessoa Admin',
    });
    expect(toDomainUser(null, null)).toBeNull();
  });
});

describe('tradução de erros do Firebase', () => {
  it.each([
    ['auth/email-already-in-use', 'EmailAlreadyRegisteredError'],
    ['auth/invalid-credential', 'InvalidCredentialsError'],
    ['auth/user-disabled', 'AccountDisabledError'],
    ['auth/network-request-failed', 'ConnectionError'],
    ['unavailable', 'ConnectionError'],
    ['permission-denied', 'PermissionDeniedError'],
    ['auth/user-token-expired', 'SessionExpiredError'],
    ['unauthenticated', 'SessionExpiredError'],
    ['auth/too-many-requests', 'AuthError'],
  ])('converte %s em %s', (code, name) => {
    expect(toServiceError({ code }).name).toBe(name);
  });

  it('mantém as mensagens em português', () => {
    expect(toServiceError({ code: 'permission-denied' }).message).toMatch(/permissão/);
    expect(toServiceError({ code: 'auth/weak-password' }).message).toMatch(/senha/);
    expect(toServiceError({ code: 'auth/user-not-found' }, { context: 'signIn' }).name).toBe('InvalidCredentialsError');
  });

  it('preserva erros da própria aplicação', () => {
    const error = new Error('Erro da aplicação');
    expect(toServiceError(error)).toBe(error);
  });
});
