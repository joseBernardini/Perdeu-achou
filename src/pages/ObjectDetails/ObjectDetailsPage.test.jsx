import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import mockObjects from '../../services/mock/mockObjects';
import objectService from '../../services/objectService';
import { OBJECT_STATUS, ROUTER_FUTURE_FLAGS, ROUTES } from '../../utils/constants';

const findSeed = (status) => mockObjects.find((item) => item.status === status);
const available = findSeed(OBJECT_STATUS.available);

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE_FLAGS}>
      <App />
    </MemoryRouter>
  );
}

describe('ObjectDetailsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('abre os detalhes a partir do card da listagem', async () => {
    renderAt(ROUTES.objects);

    fireEvent.click(await screen.findByRole('link', { name: `Ver detalhes de ${available.name}` }));

    expect(await screen.findByRole('heading', { level: 1, name: available.name })).toBeInTheDocument();
    expect(screen.getByText(available.description)).toBeInTheDocument();
    expect(screen.getByText(available.location)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reconheceu este objeto?' })).toBeInTheDocument();
  });

  it('não exibe detalhes de registros pendentes', async () => {
    const pending = findSeed(OBJECT_STATUS.pendingApproval);
    renderAt(`/objetos/${pending.id}`);

    expect(await screen.findByRole('heading', { name: 'Objeto não encontrado' })).toBeInTheDocument();
    expect(screen.queryByText(pending.description)).not.toBeInTheDocument();
  });

  it('não exibe detalhes de registros reprovados', async () => {
    const rejected = findSeed(OBJECT_STATUS.rejected);
    renderAt(`/objetos/${rejected.id}`);

    expect(await screen.findByRole('heading', { name: 'Objeto não encontrado' })).toBeInTheDocument();
  });

  it('informa quando o objeto já está em devolução', async () => {
    const inReturn = findSeed(OBJECT_STATUS.inReturn);
    renderAt(`/objetos/${inReturn.id}`);

    expect(
      await screen.findByRole('heading', { name: 'Este objeto não está mais disponível para consulta' })
    ).toBeInTheDocument();
    expect(screen.getByText('Em processo de devolução')).toBeInTheDocument();
    expect(screen.queryByText(inReturn.description)).not.toBeInTheDocument();
  });

  it('informa quando o código não existe', async () => {
    renderAt('/objetos/OBJ-00000000');

    expect(await screen.findByRole('heading', { name: 'Objeto não encontrado' })).toBeInTheDocument();
  });

  it('exibe erro quando a consulta falha', async () => {
    jest.spyOn(objectService, 'getObjectById').mockRejectedValueOnce(new Error('Falha'));

    renderAt(`/objetos/${available.id}`);

    expect(await screen.findByRole('heading', { name: 'Não foi possível carregar o objeto' })).toBeInTheDocument();
  });

  it('mantém a rota de cadastro separada da rota de detalhes', () => {
    renderAt(ROUTES.registerObject);

    expect(screen.getByRole('heading', { level: 1, name: 'Registrar objeto encontrado' })).toBeInTheDocument();
  });
});
