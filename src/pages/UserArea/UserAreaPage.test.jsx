import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { DEMO_SESSION_STORAGE_KEY, DEMO_USERS_STORAGE_KEY } from '../../services/mock/mockAuthService';
import { OBJECTS_STORAGE_KEY } from '../../services/mock/mockObjectService';
import { ROUTER_FUTURE_FLAGS } from '../../utils/constants';

const USER = { id: 'USR-AAAA1111', name: 'Pessoa de Teste', email: 'pessoa@exemplo.com', role: 'user', profileType: 'aluno' };

function renderApp(path = '/minha-area') {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE_FLAGS}>
      <App />
    </MemoryRouter>
  );
}

function storedObject(id, status, registeredBy) {
  return {
    id,
    name: `Objeto ${id}`,
    category: 'eletronicos',
    description: 'Descrição do objeto com detalhes suficientes.',
    location: 'Biblioteca',
    foundDate: '2026-11-10',
    notes: '',
    status,
    registeredBy,
    createdAt: '2026-11-10T10:00:00.000Z',
    updatedAt: '2026-11-10T10:00:00.000Z',
  };
}

describe('Área do usuário', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(DEMO_USERS_STORAGE_KEY, JSON.stringify([USER]));
    window.localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify({ userId: USER.id }));
  });

  it('exibe o perfil com papel e tipo, sem opção de alterar o papel', async () => {
    renderApp();

    const profile = await screen.findByRole('region', { name: 'Meu perfil' });
    expect(within(profile).getByText('pessoa@exemplo.com')).toBeInTheDocument();
    expect(within(profile).getByText('Aluno')).toBeInTheDocument();
    expect(within(profile).getByText('Usuário')).toBeInTheDocument();

    fireEvent.click(within(profile).getByRole('button', { name: 'Editar perfil' }));

    expect(within(profile).queryByText(/Administrador/)).not.toBeInTheDocument();
    expect(within(profile).getAllByRole('radio').map((radio) => radio.value)).toEqual(['aluno', 'funcionario']);
  });

  it('atualiza apenas nome e tipo de perfil', async () => {
    renderApp();

    const profile = await screen.findByRole('region', { name: 'Meu perfil' });
    fireEvent.click(within(profile).getByRole('button', { name: 'Editar perfil' }));
    fireEvent.change(within(profile).getByLabelText('Nome'), { target: { value: 'Pessoa Atualizada' } });
    fireEvent.click(within(profile).getByRole('radio', { name: 'Funcionário' }));
    fireEvent.click(within(profile).getByRole('button', { name: 'Salvar alterações' }));

    expect(await within(profile).findByText('Perfil atualizado')).toBeInTheDocument();
    expect(within(profile).getByText('Pessoa Atualizada')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(DEMO_USERS_STORAGE_KEY))[0]).toMatchObject({
      name: 'Pessoa Atualizada',
      profileType: 'funcionario',
      role: 'user',
    });
  });

  it('valida o nome ao editar o perfil', async () => {
    renderApp();

    const profile = await screen.findByRole('region', { name: 'Meu perfil' });
    fireEvent.click(within(profile).getByRole('button', { name: 'Editar perfil' }));
    fireEvent.change(within(profile).getByLabelText('Nome'), { target: { value: 'A' } });
    fireEvent.click(within(profile).getByRole('button', { name: 'Salvar alterações' }));

    expect(within(profile).getByLabelText('Nome')).toHaveAccessibleDescription('O nome deve ter pelo menos 3 caracteres.');
  });

  it('lista somente os objetos registrados pelo próprio usuário, com a situação', async () => {
    window.localStorage.setItem(
      OBJECTS_STORAGE_KEY,
      JSON.stringify([
        storedObject('OBJ-AAAA1111', 'pendente_aprovacao', USER.id),
        storedObject('OBJ-BBBB2222', 'pendente_aprovacao', 'USR-BBBB2222'),
      ])
    );

    renderApp();

    const section = await screen.findByRole('region', { name: 'Objetos que registrei' });
    expect(await within(section).findByText('Objeto OBJ-AAAA1111')).toBeInTheDocument();
    expect(within(section).getByText('Aguardando a análise de um administrador.')).toBeInTheDocument();
    expect(within(section).queryByText('Objeto OBJ-BBBB2222')).not.toBeInTheDocument();
  });

  it('informa quando o usuário ainda não registrou objetos', async () => {
    renderApp();

    expect(await screen.findByRole('heading', { name: 'Você ainda não registrou objetos' })).toBeInTheDocument();
  });
});
