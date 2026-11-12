import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { DEMO_USERS_STORAGE_KEY } from '../../services/mockAuthService';
import { ROUTER_FUTURE_FLAGS } from '../../utils/constants';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE_FLAGS}>
      <App />
    </MemoryRouter>
  );
}

describe('Telas de autenticação demonstrativa', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('identifica claramente o acesso demonstrativo', () => {
    renderAt('/entrar');

    expect(screen.getByText('Acesso demonstrativo.')).toBeInTheDocument();
    expect(screen.getByText(/a senha não é armazenada nem verificada/)).toBeInTheDocument();
  });

  it('valida o cadastro e cria a conta, levando à área do usuário', async () => {
    renderAt('/cadastro');

    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(screen.getByLabelText('Nome')).toHaveAccessibleDescription('Informe seu nome.');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Pessoa de Teste' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-demo-123' } });
    fireEvent.change(screen.getByLabelText('Confirme a senha'), { target: { value: 'senha-diferente' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(screen.getByLabelText('Confirme a senha')).toHaveAccessibleDescription('As senhas informadas não são iguais.');

    fireEvent.change(screen.getByLabelText('Confirme a senha'), { target: { value: 'senha-demo-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Minha área' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Minha área' })).toBeInTheDocument();
    expect(window.localStorage.getItem(DEMO_USERS_STORAGE_KEY)).not.toContain('senha-demo-123');
  });

  it('informa quando o e-mail já possui conta', async () => {
    window.localStorage.setItem(
      DEMO_USERS_STORAGE_KEY,
      JSON.stringify([{ id: 'USR-AAAA1111', name: 'Pessoa', email: 'pessoa@exemplo.com', role: 'usuario' }])
    );
    renderAt('/cadastro');

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Outra pessoa' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-demo-123' } });
    fireEvent.change(screen.getByLabelText('Confirme a senha'), { target: { value: 'senha-demo-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Já existe uma conta de demonstração com este e-mail.')).toBeInTheDocument();
  });

  it('informa quando não é possível entrar', async () => {
    renderAt('/entrar');

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ninguem@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'qualquer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível entrar');
  });

  it('confirma a recuperação de senha sem revelar se a conta existe', async () => {
    renderAt('/recuperar-senha');

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ninguem@exemplo.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar instruções' }));

    expect(await screen.findByText('Solicitação registrada')).toBeInTheDocument();
    expect(screen.getByText(/Se houver uma conta associada a ninguem@exemplo.com/)).toBeInTheDocument();
  });
});
