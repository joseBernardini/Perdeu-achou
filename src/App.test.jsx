import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('exibe o nome da plataforma como título principal', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Perdeu, achou!' })).toBeInTheDocument();
  });

  it('exibe os pilares da plataforma', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Consultar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Registrar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recuperar' })).toBeInTheDocument();
  });
});
