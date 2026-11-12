import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { OBJECTS_STORAGE_KEY } from '../../services/mockObjectService';
import { ROUTER_FUTURE_FLAGS, ROUTES } from '../../utils/constants';
import { getTodayISODate } from '../../utils/date';

function renderPage(initialEntry = ROUTES.registerObject) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]} future={ROUTER_FUTURE_FLAGS}>
      <App />
    </MemoryRouter>
  );
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Nome do objeto'), { target: { value: 'Óculos de grau' } });
  fireEvent.click(screen.getByLabelText('Acessórios'));
  fireEvent.change(screen.getByLabelText('Descrição detalhada'), {
    target: { value: 'Óculos de grau com armação preta retangular e estojo vermelho.' },
  });
  fireEvent.change(screen.getByLabelText('Local onde foi encontrado'), { target: { value: 'Biblioteca, segundo andar' } });
  fireEvent.change(screen.getByLabelText('Data em que foi encontrado'), { target: { value: getTodayISODate() } });
}

describe('RegisterObjectPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('é acessível pelo botão do cabeçalho', () => {
    renderPage(ROUTES.home);

    fireEvent.click(screen.getByRole('link', { name: 'Registrar objeto' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Registrar objeto encontrado' })).toBeInTheDocument();
  });

  it('exibe as mensagens de erro e impede o envio de um formulário vazio', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Registrar objeto' }));

    expect(screen.getByRole('heading', { name: 'Corrija 5 campos para continuar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do objeto')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Nome do objeto')).toHaveAccessibleDescription(
      expect.stringContaining('Informe o nome do objeto.')
    );
    expect(window.localStorage.getItem(OBJECTS_STORAGE_KEY)).toBeNull();
  });

  it('impede o cadastro com data futura', () => {
    renderPage();
    fillValidForm();

    fireEvent.change(screen.getByLabelText('Data em que foi encontrado'), { target: { value: '2999-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar objeto' }));

    expect(screen.getByLabelText('Data em que foi encontrado')).toHaveAccessibleDescription(
      expect.stringContaining('A data não pode ser posterior a hoje')
    );
    expect(window.localStorage.getItem(OBJECTS_STORAGE_KEY)).toBeNull();
  });

  it('remove a mensagem de erro quando o campo é corrigido', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Registrar objeto' }));
    fireEvent.change(screen.getByLabelText('Nome do objeto'), { target: { value: 'Mochila preta' } });

    expect(screen.getByLabelText('Nome do objeto')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('heading', { name: 'Corrija 4 campos para continuar' })).toBeInTheDocument();
  });

  it('registra o objeto, exibe o código gerado e salva no armazenamento local', async () => {
    renderPage();
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Registrar objeto' }));

    expect(screen.getByRole('button', { name: 'Registrando objeto' })).toHaveAttribute('aria-busy', 'true');

    const success = await screen.findByRole('region', { name: 'Objeto registrado com sucesso' });
    const codeOccurrences = within(success).getAllByText(/^OBJ-[0-9A-Z]{8}$/);
    const code = codeOccurrences[0].textContent;

    expect(codeOccurrences.every((element) => element.textContent === code)).toBe(true);

    expect(within(success).getByText('Pendente de aprovação')).toBeInTheDocument();
    expect(within(success).getByRole('heading', { name: 'Próxima etapa' })).toBeInTheDocument();

    const stored = JSON.parse(window.localStorage.getItem(OBJECTS_STORAGE_KEY));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ id: code, name: 'Óculos de grau', status: 'pendente_aprovacao' });
  });

  it('exibe erro e mantém os dados quando o armazenamento falha', async () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    renderPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar objeto' }));

    expect(await screen.findByRole('heading', { name: 'O objeto não foi registrado' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Objeto registrado com sucesso' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nome do objeto')).toHaveValue('Óculos de grau');

    setItem.mockRestore();
  });

  it('permite registrar outro objeto após o sucesso', async () => {
    renderPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar objeto' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Registrar outro objeto' }));

    expect(screen.getByLabelText('Nome do objeto')).toHaveValue('');
  });
});
