import categories, { getCategoryById } from '../data/categories';
import { formatISODate, isValidISODate } from './date';
import { getSearchTerms, matchesAllTerms, normalizeSearchText } from './searchText';

export const SORT_OPTIONS = [
  { id: 'recentes', label: 'Mais recentes' },
  { id: 'antigos', label: 'Mais antigos' },
  { id: 'alfabetica', label: 'Ordem alfabética' },
];

export const DEFAULT_SORT = 'recentes';

export const FILTER_PARAMS = {
  query: 'busca',
  categories: 'categoria',
  location: 'local',
  dateFrom: 'de',
  dateTo: 'ate',
  sort: 'ordem',
};

export const EMPTY_FILTERS = {
  query: '',
  categories: [],
  location: '',
  dateFrom: '',
  dateTo: '',
  sort: DEFAULT_SORT,
};

const categoryIds = categories.map((category) => category.id);
const sortIds = SORT_OPTIONS.map((option) => option.id);
const alphabeticalCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

export function getLocationGroup(location) {
  const label = String(location ?? '').split(',')[0].trim();
  return { key: normalizeSearchText(label), label };
}

export function getLocationOptions(objects) {
  const groups = new Map();

  objects.forEach((object) => {
    const { key, label } = getLocationGroup(object.location);
    if (!key) return;
    const current = groups.get(key);
    groups.set(key, { key, label: current?.label ?? label, count: (current?.count ?? 0) + 1 });
  });

  return [...groups.values()].sort((a, b) => alphabeticalCollator.compare(a.label, b.label));
}

export function getCategoryCounts(objects) {
  return objects.reduce((counts, object) => ({ ...counts, [object.category]: (counts[object.category] ?? 0) + 1 }), {});
}

export function getDateBounds(objects) {
  const dates = objects.map((object) => object.foundDate).filter(isValidISODate).sort();
  return dates.length > 0 ? { min: dates[0], max: dates[dates.length - 1], distinct: new Set(dates).size } : null;
}

export function isDateRangeInvalid({ dateFrom, dateTo }) {
  return Boolean(dateFrom && dateTo && dateFrom > dateTo);
}

export function buildSearchIndex(object) {
  return normalizeSearchText(
    [object.name, object.id, object.description, object.location, getCategoryById(object.category)?.title].join(' ')
  );
}

export function parseFilters(searchParams) {
  const query = searchParams.get(FILTER_PARAMS.query) ?? '';
  const requestedCategories = (searchParams.get(FILTER_PARAMS.categories) ?? '').split(',').filter(Boolean);
  const dateFrom = searchParams.get(FILTER_PARAMS.dateFrom) ?? '';
  const dateTo = searchParams.get(FILTER_PARAMS.dateTo) ?? '';
  const sort = searchParams.get(FILTER_PARAMS.sort) ?? DEFAULT_SORT;

  return {
    query,
    categories: categoryIds.filter((id) => requestedCategories.includes(id)),
    location: normalizeSearchText(searchParams.get(FILTER_PARAMS.location) ?? ''),
    dateFrom: isValidISODate(dateFrom) ? dateFrom : '',
    dateTo: isValidISODate(dateTo) ? dateTo : '',
    sort: sortIds.includes(sort) ? sort : DEFAULT_SORT,
  };
}

export function serializeFilters(filters) {
  const params = new URLSearchParams();

  if (filters.query) params.set(FILTER_PARAMS.query, filters.query);
  if (filters.categories.length > 0) params.set(FILTER_PARAMS.categories, filters.categories.join(','));
  if (filters.location) params.set(FILTER_PARAMS.location, filters.location);
  if (filters.dateFrom) params.set(FILTER_PARAMS.dateFrom, filters.dateFrom);
  if (filters.dateTo) params.set(FILTER_PARAMS.dateTo, filters.dateTo);
  if (filters.sort && filters.sort !== DEFAULT_SORT) params.set(FILTER_PARAMS.sort, filters.sort);

  return params;
}

export function hasSearchQuery(filters) {
  return getSearchTerms(filters.query).length > 0;
}

export function hasRefinementFilters(filters) {
  return Boolean(filters.categories.length > 0 || filters.location || filters.dateFrom || filters.dateTo);
}

export function hasActiveFilters(filters) {
  return hasSearchQuery(filters) || hasRefinementFilters(filters);
}

function compareByDate(direction) {
  return (a, b) => {
    const byDate = a.foundDate.localeCompare(b.foundDate) || a.createdAt.localeCompare(b.createdAt);
    return direction === 'asc' ? byDate : -byDate;
  };
}

const sorters = {
  recentes: compareByDate('desc'),
  antigos: compareByDate('asc'),
  alfabetica: (a, b) => alphabeticalCollator.compare(a.name, b.name) || a.id.localeCompare(b.id),
};

export function sortObjects(objects, sort = DEFAULT_SORT) {
  return [...objects].sort(sorters[sort] ?? sorters[DEFAULT_SORT]);
}

export function filterObjects(objects, filters, searchIndex) {
  const terms = getSearchTerms(filters.query);
  const ignoreDates = isDateRangeInvalid(filters);

  return objects.filter((object) => {
    if (filters.categories.length > 0 && !filters.categories.includes(object.category)) return false;
    if (filters.location && getLocationGroup(object.location).key !== filters.location) return false;
    if (!ignoreDates && filters.dateFrom && object.foundDate < filters.dateFrom) return false;
    if (!ignoreDates && filters.dateTo && object.foundDate > filters.dateTo) return false;

    if (terms.length > 0) {
      const indexText = searchIndex?.get(object.id) ?? buildSearchIndex(object);
      if (!matchesAllTerms(indexText, terms)) return false;
    }

    return true;
  });
}

export function applyObjectFilters(objects, filters, searchIndex) {
  return sortObjects(filterObjects(objects, filters, searchIndex), filters.sort);
}

export function createSearchIndex(objects) {
  return new Map(objects.map((object) => [object.id, buildSearchIndex(object)]));
}

export function describeActiveFilters(filters, locationOptions = []) {
  const items = [];

  if (hasSearchQuery(filters)) {
    items.push({ key: 'query', label: `Pesquisa: "${filters.query.trim()}"` });
  }

  filters.categories.forEach((categoryId) => {
    items.push({ key: `category:${categoryId}`, label: getCategoryById(categoryId)?.title ?? categoryId });
  });

  if (filters.location) {
    const option = locationOptions.find((item) => item.key === filters.location);
    items.push({ key: 'location', label: `Local: ${option?.label ?? filters.location}` });
  }

  if (filters.dateFrom && filters.dateTo) {
    items.push({ key: 'period', label: `De ${formatISODate(filters.dateFrom)} a ${formatISODate(filters.dateTo)}` });
  } else if (filters.dateFrom) {
    items.push({ key: 'period', label: `A partir de ${formatISODate(filters.dateFrom)}` });
  } else if (filters.dateTo) {
    items.push({ key: 'period', label: `Até ${formatISODate(filters.dateTo)}` });
  }

  return items;
}

export function removeActiveFilter(filters, key) {
  if (key === 'query') return { ...filters, query: '' };
  if (key === 'location') return { ...filters, location: '' };
  if (key === 'period') return { ...filters, dateFrom: '', dateTo: '' };
  if (key.startsWith('category:')) {
    const categoryId = key.slice('category:'.length);
    return { ...filters, categories: filters.categories.filter((id) => id !== categoryId) };
  }
  return filters;
}

export function clearFilters(filters) {
  return { ...EMPTY_FILTERS, sort: filters.sort };
}
