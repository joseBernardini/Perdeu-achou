import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import authService from '../services/authService';
import { DEMO_SESSION_STORAGE_KEY, DEMO_USERS_STORAGE_KEY } from '../services/mock/mockAuthService';
import { ROUTER_FUTURE_FLAGS } from '../utils/constants';

const USER = { id: 'USR-AAAA1111', name: 'Pessoa de Teste', email: 'pessoa@exemplo.com', role: 'user', profileType: 'aluno' };

function renderApp(path = '/minha-area') {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE_FLAGS}>
      <App />
    </MemoryRouter>
  );
}

describe('Sessão do usuário', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(DEMO_USERS_STORAGE_KEY, JSON.stringify([USER]));
    window.localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify({ userId: USER.id }));
  });

  it('avisa quando a sessão é encerrada sem uma ação do usuário', async () => {
    renderApp();
    expect(await screen.findByText(/Olá, Pessoa de Teste/)).toBeInTheDocument();

    await act(async () => {
      await authService.signOut();
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Sua sessão expirou ou foi encerrada. Entre novamente para continuar.');
    expect(screen.getByRole('heading', { name: 'Entre na sua conta para ver suas solicitações' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));
    expect(screen.queryByText(/Sua sessão expirou/)).not.toBeInTheDocument();
  });

  it('não exibe o aviso quando o próprio usuário sai', async () => {
    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByText(/Sua sessão expirou/)).not.toBeInTheDocument();
  });
});
