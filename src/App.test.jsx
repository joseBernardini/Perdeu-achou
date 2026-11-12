import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { ROUTER_FUTURE_FLAGS } from './utils/constants';

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]} future={ROUTER_FUTURE_FLAGS}>
      <App />
    </MemoryRouter>
  );
}

describe('App', () => {
  it('exibe a mensagem institucional como título principal', () => {
    renderApp();

    expect(
      screen.getByRole('heading', { level: 1, name: /Encontrou ou perdeu alguma coisa\?/ })
    ).toBeInTheDocument();
  });

  it('exibe a navegação principal com os links previstos', () => {
    renderApp();

    const nav = screen.getByRole('navigation', { name: 'Navegação principal' });

    expect(within(nav).getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: 'Como funciona' })).toHaveAttribute('href', '/#como-funciona');
    expect(within(nav).getByRole('link', { name: 'Categorias' })).toHaveAttribute('href', '/#categorias');
  });

  it('exibe as seções institucionais da página inicial', () => {
    renderApp();

    expect(screen.getByRole('heading', { level: 2, name: 'Objetos organizados por categoria' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Do objeto encontrado à devolução' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Cada devolução passa pela conferência da instituição' })
    ).toBeInTheDocument();
  });

  it('exibe as categorias de objetos', () => {
    renderApp();

    ['Eletrônicos', 'Documentos', 'Materiais escolares', 'Acessórios', 'Vestuário', 'Outros'].forEach((name) => {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
    });
  });

  it('identifica as ações ainda indisponíveis', () => {
    renderApp();

    screen.getAllByRole('button', { name: /Consultar objetos|Entrar/ }).forEach((button) => {
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAccessibleDescription('Disponível em breve');
    });
  });

  it('abre e fecha o menu de navegação', () => {
    renderApp();

    const toggle = screen.getByRole('button', { name: 'Abrir menu' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('redireciona rotas inexistentes para a página inicial', () => {
    renderApp('/rota-inexistente');

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
