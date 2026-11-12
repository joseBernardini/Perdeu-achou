import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import mockObjects from '../../data/mockObjects';
import { RECOVERY_REQUESTS_STORAGE_KEY } from '../../services/mockRecoveryRequestService';
import { DEMO_SESSION_STORAGE_KEY, DEMO_USERS_STORAGE_KEY } from '../../services/mockAuthService';
import { OBJECT_STATUS, ROUTER_FUTURE_FLAGS } from '../../utils/constants';

const available = mockObjects.find((item) => item.status === OBJECT_STATUS.available);
const inReturn = mockObjects.find((item) => item.status === OBJECT_STATUS.inReturn);
const OWNER_MESSAGE = 'Tem um amassado na base e meu nome gravado por dentro da tampa, perto da rosca.';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE_FLAGS}>
      <App />
    </MemoryRouter>
  );
}

function signInAsDemoUser() {
  const user = { id: 'USR-AAAA1111', name: 'Pessoa de Teste', email: 'pessoa@exemplo.com', role: 'usuario', createdAt: '2026-11-01T10:00:00.000Z' };
  window.localStorage.setItem(DEMO_USERS_STORAGE_KEY, JSON.stringify([user]));
  window.localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify({ userId: user.id }));
  return user;
}

describe('Fluxo de solicitação de recuperação', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('consulta, reconhece o objeto, entra na conta e envia a solicitação', async () => {
    window.localStorage.setItem(
      DEMO_USERS_STORAGE_KEY,
      JSON.stringify([{ id: 'USR-AAAA1111', name: 'Pessoa de Teste', email: 'pessoa@exemplo.com', role: 'usuario' }])
    );

    renderAt('/objetos');

    fireEvent.click(await screen.findByRole('link', { name: `Ver detalhes de ${available.name}` }));
    expect(await screen.findByRole('heading', { level: 1, name: available.name })).toBeInTheDocument();
    expect(screen.getByText(available.description)).toBeInTheDocument();
    expect(screen.getAllByText(available.id).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('link', { name: 'Solicitar recuperação' }));
    expect(await screen.findByRole('heading', { name: 'Entre na sua conta para continuar' })).toBeInTheDocument();

    fireEvent.click(within(screen.getByRole('main')).getByRole('link', { name: 'Entrar' }));
    expect(await screen.findByText('É necessário entrar na sua conta para solicitar a recuperação de um objeto.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'qualquer-senha' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Como ajudar na validação' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Objeto solicitado' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitação' }));
    expect(screen.getByLabelText('Por que você acredita ser o proprietário?')).toHaveAccessibleDescription(
      expect.stringContaining('Explique por que você acredita ser o proprietário do objeto.')
    );
    expect(window.localStorage.getItem(RECOVERY_REQUESTS_STORAGE_KEY)).toBeNull();

    fireEvent.change(screen.getByLabelText('Por que você acredita ser o proprietário?'), { target: { value: OWNER_MESSAGE } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitação' }));

    const success = await screen.findByRole('region', { name: 'Solicitação enviada' });
    expect(within(success).getByText(/^SOL-[0-9A-Z]{8}$/)).toBeInTheDocument();
    expect(within(success).getByText('Pendente')).toBeInTheDocument();

    const stored = JSON.parse(window.localStorage.getItem(RECOVERY_REQUESTS_STORAGE_KEY));
    expect(stored).toEqual([
      expect.objectContaining({ objectId: available.id, requesterId: 'USR-AAAA1111', message: OWNER_MESSAGE, status: 'pendente' }),
    ]);

    fireEvent.click(within(success).getByRole('link', { name: 'Acompanhar minhas solicitações' }));

    const card = await screen.findByRole('article', { name: available.name });
    expect(within(card).getByText(`Objeto ${available.id}`)).toBeInTheDocument();
    expect(within(card).getByText(OWNER_MESSAGE)).toBeInTheDocument();
    expect(within(card).getByText('Aguardando a análise de um funcionário responsável.')).toBeInTheDocument();
    expect(within(card).queryByRole('button')).not.toBeInTheDocument();
  });

  it('informa quando já existe uma solicitação pendente', async () => {
    signInAsDemoUser();
    window.localStorage.setItem(
      RECOVERY_REQUESTS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'SOL-AAAA1111',
          objectId: available.id,
          requesterId: 'USR-AAAA1111',
          message: OWNER_MESSAGE,
          additionalInfo: '',
          status: 'pendente',
          createdAt: '2026-11-10T12:00:00.000Z',
          updatedAt: '2026-11-10T12:00:00.000Z',
        },
      ])
    );

    renderAt(`/objetos/${available.id}/solicitar`);

    expect(await screen.findByRole('heading', { name: 'Você já solicitou a recuperação deste objeto' })).toBeInTheDocument();
    expect(screen.getByText(/SOL-AAAA1111/)).toBeInTheDocument();
  });

  it('mostra na página de detalhes que a solicitação já foi enviada', async () => {
    signInAsDemoUser();
    window.localStorage.setItem(
      RECOVERY_REQUESTS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'SOL-AAAA1111',
          objectId: available.id,
          requesterId: 'USR-AAAA1111',
          message: OWNER_MESSAGE,
          additionalInfo: '',
          status: 'pendente',
          createdAt: '2026-11-10T12:00:00.000Z',
          updatedAt: '2026-11-10T12:00:00.000Z',
        },
      ])
    );

    renderAt(`/objetos/${available.id}`);

    expect(await screen.findByRole('link', { name: 'Acompanhar solicitação' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Solicitar recuperação' })).not.toBeInTheDocument();
  });

  it('informa quando o objeto está indisponível para solicitações', async () => {
    signInAsDemoUser();

    renderAt(`/objetos/${inReturn.id}/solicitar`);

    expect(await screen.findByRole('heading', { name: 'Objeto indisponível para solicitações' })).toBeInTheDocument();
  });

  it('informa quando o objeto não existe', async () => {
    signInAsDemoUser();

    renderAt('/objetos/OBJ-00000000/solicitar');

    expect(await screen.findByRole('heading', { name: 'Objeto não encontrado' })).toBeInTheDocument();
  });

  it('mostra a área do usuário vazia e exige autenticação', async () => {
    renderAt('/minha-area');

    expect(await screen.findByRole('heading', { name: 'Entre na sua conta para ver suas solicitações' })).toBeInTheDocument();
  });

  it('mostra a ausência de solicitações e permite sair', async () => {
    signInAsDemoUser();
    renderAt('/minha-area');

    expect(await screen.findByRole('heading', { name: 'Você ainda não enviou solicitações' })).toBeInTheDocument();
    expect(screen.getByText(/Olá, Pessoa de Teste/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    expect(window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY)).toBeNull();
  });
});
