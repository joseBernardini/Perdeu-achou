import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import mockObjects from '../../data/mockObjects';
import objectService from '../../services/objectService';
import { OBJECTS_STORAGE_KEY } from '../../services/mockObjectService';
import { OBJECT_STATUS, ROUTER_FUTURE_FLAGS, ROUTES } from '../../utils/constants';

const availableSeeds = mockObjects.filter((item) => item.status === OBJECT_STATUS.available);
const hiddenSeeds = mockObjects.filter((item) => item.status !== OBJECT_STATUS.available);

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE_FLAGS}>
      <App />
    </MemoryRouter>
  );
}

function storeUserRecords(records) {
  window.localStorage.setItem(OBJECTS_STORAGE_KEY, JSON.stringify(records));
}

const userRecord = {
  id: 'OBJ-NNNN2222',
  name: 'Garrafa de vidro',
  category: 'acessorios',
  description: 'Garrafa de vidro com capa de silicone verde e tampa de bambu.',
  location: 'Sala 301, bloco C',
  foundDate: '2026-11-12',
  notes: '',
  createdAt: '2026-11-12T10:00:00.000Z',
  updatedAt: '2026-11-12T10:00:00.000Z',
};

describe('ObjectsPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('é acessível pela página inicial', async () => {
    renderAt(ROUTES.home);

    fireEvent.click(screen.getAllByRole('link', { name: 'Consultar objetos' })[0]);

    expect(screen.getByRole('heading', { level: 1, name: 'Objetos encontrados' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /objetos disponíveis para consulta/ })).toBeInTheDocument();
  });

  it('exibe o carregamento e depois a quantidade e os cards dos objetos disponíveis', async () => {
    renderAt(ROUTES.objects);

    expect(screen.getByRole('heading', { name: 'Carregando objetos' })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: `${availableSeeds.length} objetos disponíveis para consulta` })
    ).toBeInTheDocument();

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(availableSeeds.length);

    const firstCard = within(screen.getByRole('article', { name: availableSeeds[0].name }));
    expect(firstCard.getByText(availableSeeds[0].id)).toBeInTheDocument();
    expect(firstCard.getByText('Disponível')).toBeInTheDocument();
    expect(firstCard.getByText(availableSeeds[0].location)).toBeInTheDocument();
    expect(firstCard.getByRole('link', { name: `Ver detalhes de ${availableSeeds[0].name}` })).toHaveAttribute(
      'href',
      `/objetos/${availableSeeds[0].id}`
    );
  });

  it('não exibe registros pendentes, reprovados, em devolução ou devolvidos', async () => {
    renderAt(ROUTES.objects);
    await screen.findByRole('heading', { name: /objetos disponíveis para consulta/ });

    hiddenSeeds.forEach((item) => {
      expect(screen.queryByText(item.id)).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Pendente de aprovação')).not.toBeInTheDocument();
  });

  it('informa os registros indisponíveis', async () => {
    renderAt(ROUTES.objects);

    expect(await screen.findByText(/1 objeto está em processo de devolução/)).toBeInTheDocument();
    expect(screen.getByText(/2 registros aguardam a análise/)).toBeInTheDocument();
  });

  it('mantém novos registros pendentes fora da listagem e exibe os aprovados', async () => {
    storeUserRecords([
      { ...userRecord, status: OBJECT_STATUS.pendingApproval },
      { ...userRecord, id: 'OBJ-NNNN3333', name: 'Agenda de capa vermelha', status: OBJECT_STATUS.available },
    ]);

    renderAt(ROUTES.objects);

    expect(
      await screen.findByRole('heading', { name: `${availableSeeds.length + 1} objetos disponíveis para consulta` })
    ).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Agenda de capa vermelha' })).toBeInTheDocument();
    expect(screen.queryByText('OBJ-NNNN2222')).not.toBeInTheDocument();
    expect(screen.getByText(/3 registros aguardam a análise/)).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(OBJECTS_STORAGE_KEY))).toHaveLength(2);
  });

  it('exibe a listagem vazia', async () => {
    jest.spyOn(objectService, 'listObjects').mockResolvedValue([]);
    jest.spyOn(objectService, 'countObjectsByStatus').mockResolvedValue({});

    renderAt(ROUTES.objects);

    expect(await screen.findByRole('heading', { name: 'Nenhum objeto disponível no momento' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '0 objetos disponíveis para consulta' })).toBeInTheDocument();
  });

  it('exibe erro de consulta e permite tentar novamente', async () => {
    const listSpy = jest.spyOn(objectService, 'listObjects').mockRejectedValueOnce(new Error('Falha'));

    renderAt(ROUTES.objects);

    expect(await screen.findByRole('heading', { name: 'Não foi possível carregar os objetos' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(
      await screen.findByRole('heading', { name: `${availableSeeds.length} objetos disponíveis para consulta` })
    ).toBeInTheDocument();
    expect(listSpy).toHaveBeenCalledTimes(2);
  });
});
