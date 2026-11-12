import mockObjects from '../services/mock/mockObjects';
import { OBJECT_STATUS } from './constants';
import {
  EMPTY_FILTERS,
  applyObjectFilters,
  clearFilters,
  createSearchIndex,
  describeActiveFilters,
  getDateBounds,
  getLocationGroup,
  getLocationOptions,
  hasActiveFilters,
  parseFilters,
  removeActiveFilter,
  serializeFilters,
  sortObjects,
} from './objectFilters';
import { normalizeSearchText } from './searchText';

const available = mockObjects.filter((item) => item.status === OBJECT_STATUS.available);
const index = createSearchIndex(available);

function search(changes) {
  return applyObjectFilters(available, { ...EMPTY_FILTERS, ...changes }, index);
}

const names = (items) => items.map((item) => item.name);

describe('normalizeSearchText', () => {
  it('ignora acentos, maiúsculas e pontuação', () => {
    expect(normalizeSearchText('  Lápis, CADERNO-Óculos! ')).toBe('lapis caderno oculos');
  });
});

describe('pesquisa de objetos', () => {
  it('pesquisa pelo nome', () => {
    expect(names(search({ query: 'guarda-chuva' }))).toEqual(['Guarda-chuva preto']);
  });

  it('pesquisa pelo código, completo ou parcial, sem diferenciar maiúsculas', () => {
    expect(names(search({ query: 'OBJ-6NHX4PAJ' }))).toEqual(['Calculadora científica']);
    expect(names(search({ query: 'obj-6nhx' }))).toEqual(['Calculadora científica']);
  });

  it('pesquisa pela categoria', () => {
    const results = search({ query: 'vestuario' });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.category === 'vestuario')).toBe(true);
  });

  it('pesquisa sem acentos encontra termos acentuados', () => {
    expect(names(search({ query: 'lapis' }))).toEqual(['Estojo de lápis']);
    expect(names(search({ query: 'oculos sol' }))).toEqual(['Óculos de sol']);
  });

  it('pesquisa pela descrição e pelo local', () => {
    expect(names(search({ query: 'adesivo planeta' }))).toEqual(['Garrafa térmica azul']);
    expect(names(search({ query: 'tampa preta' }))).toEqual(['Calculadora científica', 'Garrafa térmica azul']);
    expect(names(search({ query: 'guarita' }))).toEqual(['Chaveiro com três chaves']);
  });

  it('exige que todos os termos estejam presentes', () => {
    expect(search({ query: 'garrafa jaqueta' })).toHaveLength(0);
  });

  it('ignora pesquisa vazia ou só com espaços e símbolos', () => {
    expect(search({ query: '   ' })).toHaveLength(available.length);
    expect(search({ query: '!!!' })).toHaveLength(available.length);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, query: '  ' })).toBe(false);
  });
});

describe('filtros de objetos', () => {
  it('filtra por várias categorias ao mesmo tempo', () => {
    const results = search({ categories: ['eletronicos', 'documentos'] });

    expect(results.length).toBe(available.filter((item) => ['eletronicos', 'documentos'].includes(item.category)).length);
  });

  it('agrupa os locais pelo trecho principal e filtra por eles', () => {
    expect(getLocationGroup('Biblioteca, mesa próxima às janelas')).toEqual({ key: 'biblioteca', label: 'Biblioteca' });

    const options = getLocationOptions(available);
    const laboratory = options.find((option) => option.label === 'Laboratório de informática');

    expect(laboratory.count).toBe(1);
    expect(names(search({ location: laboratory.key }))).toEqual(['Carregador de notebook']);
  });

  it('filtra pelo período em que o objeto foi encontrado, incluindo as datas limite', () => {
    const results = search({ dateFrom: '2026-11-05', dateTo: '2026-11-07' });

    expect(names(sortObjects(results, 'antigos'))).toEqual([
      'Carregador de notebook',
      'Calculadora científica',
      'Caderno universitário',
    ]);
  });

  it('ignora o período quando a data inicial é posterior à final', () => {
    expect(search({ dateFrom: '2026-11-10', dateTo: '2026-11-01' })).toHaveLength(available.length);
  });

  it('combina pesquisa, categoria, local e período', () => {
    const results = search({
      query: 'preto',
      categories: ['eletronicos', 'acessorios'],
      dateFrom: '2026-10-01',
      dateTo: '2026-11-06',
    });

    expect(names(results)).toEqual(['Carregador de notebook', 'Guarda-chuva preto']);
    expect(search({ query: 'preto', categories: ['vestuario'] })).toHaveLength(0);
  });

  it('informa os limites de data disponíveis', () => {
    expect(getDateBounds(available)).toMatchObject({ min: '2026-10-27', max: '2026-11-11' });
    expect(getDateBounds([])).toBeNull();
  });
});

describe('ordenação de objetos', () => {
  it('ordena dos mais recentes para os mais antigos pela data em que foram encontrados', () => {
    const dates = search({ sort: 'recentes' }).map((item) => item.foundDate);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('ordena dos mais antigos para os mais recentes', () => {
    const dates = search({ sort: 'antigos' }).map((item) => item.foundDate);
    expect(dates).toEqual([...dates].sort());
  });

  it('ordena em ordem alfabética considerando acentos do português', () => {
    const results = names(search({ sort: 'alfabetica' }));

    expect(results[0]).toBe('Caderno universitário');
    expect(results.indexOf('Óculos de sol')).toBeGreaterThan(results.indexOf('Moletom cinza'));
  });
});

describe('estado dos filtros na URL', () => {
  it('interpreta e serializa os parâmetros, descartando valores inválidos', () => {
    const filters = parseFilters(
      new URLSearchParams('busca=lapis&categoria=eletronicos,veiculos&local=Biblioteca&de=2026-02-30&ate=2026-11-10&ordem=invalida')
    );

    expect(filters).toEqual({
      query: 'lapis',
      categories: ['eletronicos'],
      location: 'biblioteca',
      dateFrom: '',
      dateTo: '2026-11-10',
      sort: 'recentes',
    });
    expect(serializeFilters(filters).toString()).toBe('busca=lapis&categoria=eletronicos&local=biblioteca&ate=2026-11-10');
  });

  it('remove filtros individualmente e limpa todos mantendo a ordenação', () => {
    const filters = {
      query: 'preto',
      categories: ['eletronicos', 'acessorios'],
      location: 'biblioteca',
      dateFrom: '2026-11-01',
      dateTo: '',
      sort: 'alfabetica',
    };

    expect(describeActiveFilters(filters).map((item) => item.key)).toEqual([
      'query',
      'category:eletronicos',
      'category:acessorios',
      'location',
      'period',
    ]);
    expect(removeActiveFilter(filters, 'category:eletronicos').categories).toEqual(['acessorios']);
    expect(removeActiveFilter(filters, 'period').dateFrom).toBe('');
    expect(clearFilters(filters)).toEqual({ ...EMPTY_FILTERS, sort: 'alfabetica' });
  });
});
