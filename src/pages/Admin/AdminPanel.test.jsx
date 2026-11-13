import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import mockObjects from '../../services/mock/mockObjects';
import { DEMO_SESSION_STORAGE_KEY, DEMO_USERS_STORAGE_KEY } from '../../services/mock/mockAuthService';
import { OBJECTS_STORAGE_KEY } from '../../services/mock/mockObjectService';
import { RECOVERY_REQUESTS_STORAGE_KEY } from '../../services/mock/mockRecoveryRequestService';
import { OBJECT_STATUS, ROUTER_FUTURE_FLAGS } from '../../utils/constants';

const count = (status) => mockObjects.filter((item) => item.status === status).length;
const seedPending = mockObjects.find((item) => item.status === OBJECT_STATUS.pendingApproval);
const seedAvailable = mockObjects.find((item) => item.status === OBJECT_STATUS.available);
const seedReturned = mockObjects.find((item) => item.status === OBJECT_STATUS.returned);
const REASON = 'As informações não conferem com o objeto guardado.';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE_FLAGS}>
      <App />
    </MemoryRouter>
  );
}

const ADMIN = { id: 'USR-STAF1111', name: 'Administração de Teste', email: 'admin@exemplo.com', role: 'admin', profileType: 'funcionario' };
const PERSON_A = { id: 'USR-AAAA1111', name: 'Pessoa A', email: 'a@exemplo.com', role: 'user', profileType: 'aluno' };
const PERSON_B = { id: 'USR-BBBB2222', name: 'Pessoa B', email: 'b@exemplo.com', role: 'user', profileType: 'aluno' };

function signInAs(user = ADMIN) {
  window.localStorage.setItem(DEMO_USERS_STORAGE_KEY, JSON.stringify([ADMIN, PERSON_A, PERSON_B]));
  window.localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify({ userId: user.id }));
}

function storeRequests(requests) {
  window.localStorage.setItem(
    RECOVERY_REQUESTS_STORAGE_KEY,
    JSON.stringify(
      requests.map((request, index) => ({
        objectId: seedAvailable.id,
        message: 'A garrafa tem um amassado na base e um adesivo de planeta descolando.',
        additionalInfo: '',
        status: 'pendente',
        createdAt: `2026-11-1${index}T12:00:00.000Z`,
        updatedAt: `2026-11-1${index}T12:00:00.000Z`,
        ...request,
      }))
    )
  );
}

function indicator(label) {
  const term = screen.getByText(label, { selector: 'dt' });
  return term.parentElement.querySelector('.admin-indicator__value').textContent;
}

async function confirmDialog(reason) {
  const dialog = await screen.findByRole('alertdialog');
  if (reason) fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: reason } });
  fireEvent.click(within(dialog).getAllByRole('button').at(-1));
  return dialog;
}

describe('Painel administrativo', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('exige autenticação para acessar o painel', () => {
    renderAt('/painel');

    expect(screen.getByRole('heading', { level: 1, name: 'Painel administrativo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Entre com uma conta de administrador' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navegação do painel' })).not.toBeInTheDocument();
  });

  it('bloqueia contas sem o papel de administrador e não oferece forma de elevar privilégios', () => {
    signInAs(PERSON_A);
    renderAt('/painel/objetos');

    expect(screen.getByRole('heading', { name: 'Acesso restrito a administradores' })).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navegação do painel' })).not.toBeInTheDocument();
  });

  it('permite o acesso a administradores e mostra o link do painel no site', async () => {
    signInAs(ADMIN);
    const { unmount } = renderAt('/painel');

    expect(await screen.findByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument();
    expect(screen.getByText('Administração de Teste')).toBeInTheDocument();
    unmount();

    renderAt('/');
    expect(screen.getByRole('link', { name: 'Painel' })).toHaveAttribute('href', '/painel');
  });

  it('calcula os indicadores a partir dos dados locais', async () => {
    signInAs(ADMIN);
    storeRequests([{ id: 'SOL-AAAA1111', requesterId: 'USR-AAAA1111' }]);
    renderAt('/painel');

    await screen.findByText('Objetos cadastrados', { selector: 'dt' });

    expect(indicator('Objetos cadastrados')).toBe(String(mockObjects.length));
    expect(indicator('Aguardando aprovação')).toBe(String(count(OBJECT_STATUS.pendingApproval)));
    expect(indicator('Objetos disponíveis')).toBe(String(count(OBJECT_STATUS.available)));
    expect(indicator('Solicitações pendentes')).toBe('1');
    expect(indicator('Objetos devolvidos')).toBe(String(count(OBJECT_STATUS.returned)));
  });

  it('aprova um registro pendente com confirmação e atualiza os indicadores e a consulta pública', async () => {
    signInAs(ADMIN);
    renderAt(`/painel/objetos/${seedPending.id}`);

    fireEvent.click(await screen.findByRole('button', { name: 'Aprovar registro' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Aprovar registro' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Aprovar registro' }));
    await confirmDialog();

    expect(await screen.findByText(/Registro aprovado/)).toBeInTheDocument();
    expect(await screen.findByText('Objeto aprovado')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Visão geral' }));
    await screen.findByText('Objetos cadastrados', { selector: 'dt' });
    expect(indicator('Aguardando aprovação')).toBe(String(count(OBJECT_STATUS.pendingApproval) - 1));
    expect(indicator('Objetos disponíveis')).toBe(String(count(OBJECT_STATUS.available) + 1));
  });

  it('exige motivo para rejeitar um registro', async () => {
    signInAs(ADMIN);
    renderAt(`/painel/objetos/${seedPending.id}`);

    fireEvent.click(await screen.findByRole('button', { name: 'Rejeitar registro' }));
    const dialog = await confirmDialog();

    expect(within(dialog).getByRole('textbox')).toHaveAccessibleDescription(expect.stringContaining('Informe o motivo da decisão.'));

    await confirmDialog(REASON);

    expect(await screen.findByText(/Registro rejeitado/)).toBeInTheDocument();
    expect(screen.getAllByText('Reprovado').length).toBeGreaterThan(0);
  });

  it('pesquisa e filtra objetos por status e categoria', async () => {
    signInAs(ADMIN);
    renderAt('/painel/objetos');

    await screen.findByText(`${mockObjects.length} objetos encontrados`);

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: OBJECT_STATUS.pendingApproval } });
    expect(screen.getByText(`${count(OBJECT_STATUS.pendingApproval)} objetos encontrados de ${mockObjects.length} cadastrados`)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'eletronicos' } });
    fireEvent.change(screen.getByLabelText('Pesquisar'), { target: { value: 'pen drive' } });

    expect(screen.getByText(/^1 objeto encontrado/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pen drive prateado' })).toBeInTheDocument();
  });

  it('aprova uma solicitação, impede outra aprovação simultânea e conclui a devolução', async () => {
    signInAs(ADMIN);
    storeRequests([
      { id: 'SOL-AAAA1111', requesterId: 'USR-AAAA1111' },
      { id: 'SOL-BBBB2222', requesterId: 'USR-BBBB2222' },
    ]);
    const { unmount } = renderAt('/painel/solicitacoes/SOL-AAAA1111');

    expect(await screen.findByText('Pessoa A')).toBeInTheDocument();
    expect(screen.getByText('Há outra solicitação pendente para este objeto.', { exact: false })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Aprovar solicitação' }));
    await confirmDialog();

    expect(await screen.findByText(/Solicitação aprovada\. O objeto passou/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluir devolução' })).toBeInTheDocument();
    unmount();

    const second = renderAt('/painel/solicitacoes/SOL-BBBB2222');
    expect(await screen.findByText(/A aprovação não está disponível porque o objeto está com status/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprovar solicitação' })).not.toBeInTheDocument();
    second.unmount();

    renderAt('/painel/solicitacoes/SOL-AAAA1111');
    fireEvent.click(await screen.findByRole('button', { name: 'Concluir devolução' }));
    await confirmDialog();

    expect(await screen.findByText(/Devolução concluída/)).toBeInTheDocument();
    expect(await screen.findByText('Solicitação encerrada. Não há ações disponíveis.')).toBeInTheDocument();
    expect(screen.getAllByText('Devolvido').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('link', { name: 'Histórico' }));
    expect(await screen.findByRole('cell', { name: 'Objeto devolvido' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Solicitação aprovada' })).toBeInTheDocument();
  });

  it('não permite analisar a própria solicitação', async () => {
    signInAs(ADMIN);
    storeRequests([{ id: 'SOL-AAAA1111', requesterId: ADMIN.id }]);
    renderAt('/painel/solicitacoes/SOL-AAAA1111');

    expect(await screen.findByText(/Esta solicitação foi enviada pela sua conta/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprovar solicitação' })).not.toBeInTheDocument();
  });

  it('não permite ao administrador analisar o objeto que ele mesmo registrou', async () => {
    signInAs(ADMIN);
    window.localStorage.setItem(
      OBJECTS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'OBJ-ADMN0001',
          name: 'Objeto do administrador',
          category: 'outros',
          description: 'Objeto registrado pela própria administração.',
          location: 'Secretaria',
          foundDate: '2026-11-10',
          notes: '',
          status: 'pendente_aprovacao',
          registeredBy: ADMIN.id,
          createdAt: '2026-11-10T10:00:00.000Z',
          updatedAt: '2026-11-10T10:00:00.000Z',
        },
      ])
    );
    renderAt('/painel/objetos/OBJ-ADMN0001');

    expect(await screen.findByText(/Este objeto foi registrado pela sua conta/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprovar registro' })).not.toBeInTheDocument();
  });

  it('permite que administradores reabram registros devolvidos com justificativa', async () => {
    signInAs(ADMIN);
    renderAt(`/painel/objetos/${seedReturned.id}`);

    fireEvent.click(await screen.findByRole('button', { name: 'Reabrir registro' }));
    await confirmDialog('Devolução registrada por engano no balcão.');

    expect(await screen.findByText(/Registro reaberto com a justificativa/)).toBeInTheDocument();
    expect(await screen.findByText('Registro reaberto', { selector: '.admin-timeline__title' })).toBeInTheDocument();
    expect(screen.getAllByText('Disponível').length).toBeGreaterThan(0);
  });

  it('encerra a sessão pelo painel', async () => {
    signInAs(ADMIN);
    renderAt('/painel');

    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    expect(window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('abre a navegação adaptada para telas menores', async () => {
    signInAs(ADMIN);
    renderAt('/painel');

    const toggle = await screen.findByRole('button', { name: 'Abrir navegação do painel' });
    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Fechar navegação do painel' })).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('link', { name: 'Solicitações' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Solicitações' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir navegação do painel' })).toHaveAttribute('aria-expanded', 'false');
  });
});
