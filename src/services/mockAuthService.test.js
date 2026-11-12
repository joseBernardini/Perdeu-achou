import { USER_ROLES } from '../utils/constants';
import { createMockAuthService, DEMO_SESSION_STORAGE_KEY, DEMO_USERS_STORAGE_KEY } from './mockAuthService';
import { EmailAlreadyRegisteredError, FormValidationError, InvalidCredentialsError } from './serviceErrors';

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

const signUpValues = {
  name: '  Pessoa   de Teste ',
  email: 'Pessoa.Teste@Exemplo.com',
  password: 'senha-demo-123',
  passwordConfirmation: 'senha-demo-123',
};

function buildService() {
  const storage = createMemoryStorage();
  return { storage, service: createMockAuthService({ storage, delay: 0 }) };
}

describe('mockAuthService', () => {
  it('cria uma conta de demonstração com identificador interno e inicia a sessão', async () => {
    const { service } = buildService();

    const user = await service.signUp(signUpValues);

    expect(user).toEqual({
      id: expect.stringMatching(/^USR-[0-9A-Z]{8}$/),
      name: 'Pessoa de Teste',
      email: 'pessoa.teste@exemplo.com',
      role: USER_ROLES.member,
    });
    expect(service.getCurrentUser()).toEqual(user);
  });

  it('não armazena a senha', async () => {
    const { service, storage } = buildService();

    await service.signUp(signUpValues);

    expect(storage.data[DEMO_USERS_STORAGE_KEY]).not.toContain(signUpValues.password);
    expect(storage.data[DEMO_SESSION_STORAGE_KEY]).not.toContain(signUpValues.password);
  });

  it('sempre cria contas com o perfil de usuário comum', async () => {
    const { service } = buildService();

    const user = await service.signUp({ ...signUpValues, role: USER_ROLES.staff });

    expect(user.role).toBe(USER_ROLES.member);
  });

  it('impede contas duplicadas com o mesmo e-mail', async () => {
    const { service } = buildService();
    await service.signUp(signUpValues);

    await expect(service.signUp({ ...signUpValues, email: 'pessoa.teste@exemplo.com' })).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError
    );
  });

  it('valida os dados do cadastro', async () => {
    const { service } = buildService();

    await expect(
      service.signUp({ name: 'A', email: 'invalido', password: '123', passwordConfirmation: '321' })
    ).rejects.toMatchObject({
      fieldErrors: {
        name: 'O nome deve ter pelo menos 3 caracteres.',
        email: 'Informe um e-mail válido, como nome@exemplo.com.',
        password: 'A senha deve ter pelo menos 8 caracteres.',
        passwordConfirmation: 'As senhas informadas não são iguais.',
      },
    });
  });

  it('entra com uma conta existente e encerra a sessão', async () => {
    const { service } = buildService();
    const created = await service.signUp(signUpValues);
    await service.signOut();

    expect(service.getCurrentUser()).toBeNull();

    const user = await service.signIn({ email: ' PESSOA.TESTE@exemplo.com ', password: 'qualquer' });

    expect(user.id).toBe(created.id);
    expect(service.getCurrentUser()?.id).toBe(created.id);
  });

  it('recusa e-mails sem conta de demonstração', async () => {
    const { service } = buildService();

    await expect(service.signIn({ email: 'ninguem@exemplo.com', password: 'qualquer' })).rejects.toBeInstanceOf(
      InvalidCredentialsError
    );
    await expect(service.signIn({ email: '', password: '' })).rejects.toBeInstanceOf(FormValidationError);
  });

  it('notifica mudanças de sessão aos interessados', async () => {
    const { service } = buildService();
    const listener = jest.fn();
    const unsubscribe = service.onAuthStateChanged(listener);
    await Promise.resolve();

    const user = await service.signUp(signUpValues);
    await service.signOut();
    unsubscribe();

    expect(listener.mock.calls.map(([value]) => value?.id ?? null)).toEqual([null, user.id, null]);
  });

  it('responde da mesma forma à recuperação de senha, sem revelar se a conta existe', async () => {
    const { service } = buildService();

    await expect(service.requestPasswordReset({ email: 'ninguem@exemplo.com' })).resolves.toEqual({
      email: 'ninguem@exemplo.com',
    });
    await expect(service.requestPasswordReset({ email: 'invalido' })).rejects.toBeInstanceOf(FormValidationError);
  });
});
