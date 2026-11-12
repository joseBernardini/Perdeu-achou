import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import App from '../../App';
import { ROUTER_FUTURE_FLAGS } from '../../utils/constants';

let currentLocation;

function LocationProbe() {
  currentLocation = useLocation();
  return null;
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE_FLAGS}>
      <App />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

async function renderLoaded(path = '/objetos') {
  renderAt(path);
  await screen.findAllByRole('article');
}

const resultsHeading = () => screen.getByRole('heading', { level: 2, name: /objetos? (encontrados?|disponíve)/ });
const cardTitles = () => screen.queryAllByRole('article').map((card) => within(card).getByRole('heading').textContent);
const filtersPanel = () => screen.getByRole('complementary', { name: 'Filtros' });

describe('Pesquisa e filtros de objetos', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('pesquisa sem acentos e atualiza a quantidade de resultados', async () => {
    await renderLoaded();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Pesquisar objetos' }), { target: { value: 'lapis' } });

    expect(await screen.findByRole('heading', { name: '1 objeto encontrado' })).toBeInTheDocument();
    expect(cardTitles()).toEqual(['Estojo de lápis']);
    expect(currentLocation.search).toBe('?busca=lapis');
  });

  it('pesquisa pelo código do objeto', async () => {
    await renderLoaded();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'obj-t3eb7mq5' } });

    expect(await screen.findByRole('heading', { name: '1 objeto encontrado' })).toBeInTheDocument();
    expect(cardTitles()).toEqual(['Chaveiro com três chaves']);
  });

  it('informa quando a pesquisa não encontra resultados e limpa a pesquisa', async () => {
    await renderLoaded();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'bicicleta' } });

    expect(await screen.findByRole('heading', { name: 'Nenhum objeto encontrado para "bicicleta"' })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' }).at(-1));

    expect(await screen.findByRole('heading', { name: '12 objetos disponíveis para consulta' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('orienta quando a pesquisa contém apenas símbolos', async () => {
    await renderLoaded();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '***' } });

    expect(screen.getByText('Digite ao menos uma letra ou número para pesquisar.')).toBeInTheDocument();
    expect(resultsHeading()).toHaveTextContent('12 objetos disponíveis para consulta');
  });

  it('combina categorias e local e remove filtros individualmente', async () => {
    await renderLoaded();

    fireEvent.click(within(filtersPanel()).getByRole('checkbox', { name: /Eletrônicos/ }));
    fireEvent.click(within(filtersPanel()).getByRole('checkbox', { name: /Acessórios/ }));

    expect(await screen.findByRole('heading', { name: '6 objetos encontrados' })).toBeInTheDocument();

    fireEvent.change(within(filtersPanel()).getByRole('combobox', { name: 'Local onde foi encontrado' }), {
      target: { value: 'biblioteca' },
    });

    expect(await screen.findByRole('heading', { name: '1 objeto encontrado' })).toBeInTheDocument();
    expect(cardTitles()).toEqual(['Garrafa térmica azul']);

    fireEvent.click(screen.getByRole('button', { name: 'Remover filtro Local: Biblioteca' }));

    expect(await screen.findByRole('heading', { name: '6 objetos encontrados' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remover filtro Local: Biblioteca' })).not.toBeInTheDocument();
  });

  it('informa quando não há resultados para os filtros e limpa todos', async () => {
    renderAt('/objetos?busca=jaqueta&categoria=eletronicos');

    expect(
      await screen.findByRole('heading', { name: 'Nenhum resultado para os filtros selecionados' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0]);

    expect(await screen.findByRole('heading', { name: '12 objetos disponíveis para consulta' })).toBeInTheDocument();
    expect(within(filtersPanel()).getByRole('checkbox', { name: /Eletrônicos/ })).not.toBeChecked();
  });

  it('filtra pelo período e indica período inválido', async () => {
    await renderLoaded();

    fireEvent.change(within(filtersPanel()).getByLabelText('De'), { target: { value: '2026-11-05' } });
    fireEvent.change(within(filtersPanel()).getByLabelText('Até'), { target: { value: '2026-11-07' } });

    expect(await screen.findByRole('heading', { name: '3 objetos encontrados' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remover filtro De 05/11/2026 a 07/11/2026' })).toBeInTheDocument();

    fireEvent.change(within(filtersPanel()).getByLabelText('Até'), { target: { value: '2026-11-01' } });

    expect(screen.getByText(/A data inicial deve ser anterior ou igual à data final/)).toBeInTheDocument();
  });

  it('ordena os resultados', async () => {
    await renderLoaded();
    const sortSelect = screen.getByRole('combobox', { name: 'Ordenar por' });

    expect(cardTitles()[0]).toBe('Óculos de sol');

    fireEvent.change(sortSelect, { target: { value: 'antigos' } });
    expect(cardTitles()[0]).toBe('Guarda-chuva preto');

    fireEvent.change(sortSelect, { target: { value: 'alfabetica' } });
    expect(cardTitles().slice(0, 3)).toEqual(['Caderno universitário', 'Calculadora científica', 'Carregador de notebook']);
    expect(currentLocation.search).toBe('?ordem=alfabetica');
  });

  it('restaura pesquisa e filtros a partir do endereço da página', async () => {
    await renderLoaded('/objetos?busca=preto&categoria=acessorios');

    expect(screen.getByRole('searchbox')).toHaveValue('preto');
    expect(within(filtersPanel()).getByRole('checkbox', { name: /Acessórios/ })).toBeChecked();
    expect(cardTitles()).toEqual(['Guarda-chuva preto']);
  });

  it('mantém alterações feitas em sequência rápida', async () => {
    await renderLoaded('/objetos?busca=oculos');

    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' });
    fireEvent.click(within(filtersPanel()).getByRole('checkbox', { name: /Eletrônicos/ }));

    expect(await screen.findByRole('heading', { name: '3 objetos encontrados' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(currentLocation.search).toBe('?categoria=eletronicos');
  });

  it('volta à listagem completa ao acessar a consulta pelo cabeçalho', async () => {
    await renderLoaded('/objetos?busca=oculos');

    fireEvent.click(screen.getAllByRole('link', { name: 'Consultar objetos' })[0]);

    expect(await screen.findByRole('heading', { name: '12 objetos disponíveis para consulta' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('abre e fecha o painel de filtros em telas menores', async () => {
    await renderLoaded();

    const toggle = screen.getByRole('button', { name: 'Filtros' });
    fireEvent.click(toggle);

    const dialog = screen.getByRole('dialog', { name: 'Filtros' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(within(dialog).getByRole('checkbox', { name: /Vestuário/ }));
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Ver 2 resultados' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtros 1 ativo' })).toHaveFocus();
  });
});
