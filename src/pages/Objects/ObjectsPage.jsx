import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, Info, PackagePlus, RotateCw, SearchX, SlidersHorizontal } from 'lucide-react';
import Button from '../../components/Button/Button';
import ObjectCard from '../../components/ObjectCard/ObjectCard';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatePanel from '../../components/StatePanel/StatePanel';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useObjectFilters from '../../hooks/useObjectFilters';
import objectService from '../../services/objectService';
import { OBJECT_STATUS, ROUTES } from '../../utils/constants';
import {
  SORT_OPTIONS,
  applyObjectFilters,
  createSearchIndex,
  describeActiveFilters,
  getCategoryCounts,
  getDateBounds,
  getLocationOptions,
  hasActiveFilters,
  hasRefinementFilters,
} from '../../utils/objectFilters';
import ActiveFilters from './ActiveFilters';
import ObjectFiltersPanel from './ObjectFiltersPanel';
import SearchBar from './SearchBar';
import './ObjectsPage.css';

const SKELETON_ITEMS = 6;
const FILTERS_PANEL_ID = 'filtros-objetos';

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

function formatAvailableCount(count) {
  return `${count} ${pluralize(count, 'objeto disponível', 'objetos disponíveis')} para consulta`;
}

function formatResultCount(count) {
  return `${count} ${pluralize(count, 'objeto encontrado', 'objetos encontrados')}`;
}

function buildUnavailableNotes(counts) {
  const notes = [];
  const inReturn = counts[OBJECT_STATUS.inReturn] ?? 0;
  const pending = counts[OBJECT_STATUS.pendingApproval] ?? 0;

  if (inReturn > 0) {
    notes.push(
      `${inReturn} ${pluralize(inReturn, 'objeto está', 'objetos estão')} em processo de devolução e ${pluralize(
        inReturn,
        'não aparece',
        'não aparecem'
      )} na lista.`
    );
  }

  if (pending > 0) {
    notes.push(
      `${pending} ${pluralize(pending, 'registro aguarda', 'registros aguardam')} a análise de um funcionário responsável e ${pluralize(
        pending,
        'será exibido',
        'serão exibidos'
      )} após a aprovação.`
    );
  }

  return notes;
}

function ObjectsPage() {
  const [state, setState] = useState({ status: 'loading', objects: [], counts: {} });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const requestIdRef = useRef(0);
  const filtersToggleRef = useRef(null);
  const { filters, updateFilters, toggleCategory, removeFilter, resetFilters } = useObjectFilters();
  const deferredFilters = useDeferredValue(filters);

  useDocumentTitle('Objetos encontrados');

  const loadObjects = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((current) => ({ ...current, status: 'loading' }));

    try {
      const [objects, counts] = await Promise.all([
        objectService.listObjects({ status: OBJECT_STATUS.available }),
        objectService.countObjectsByStatus(),
      ]);

      if (requestIdRef.current !== requestId) return;
      setState({ status: 'success', objects, counts });
    } catch {
      if (requestIdRef.current !== requestId) return;
      setState({ status: 'error', objects: [], counts: {} });
    }
  }, []);

  useEffect(() => {
    loadObjects();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadObjects]);

  const { status, objects, counts } = state;

  const searchIndex = useMemo(() => createSearchIndex(objects), [objects]);
  const locationOptions = useMemo(() => getLocationOptions(objects), [objects]);
  const categoryCounts = useMemo(() => getCategoryCounts(objects), [objects]);
  const dateBounds = useMemo(() => getDateBounds(objects), [objects]);
  const results = useMemo(
    () => applyObjectFilters(objects, deferredFilters, searchIndex),
    [objects, deferredFilters, searchIndex]
  );

  const isFiltering = hasActiveFilters(filters);
  const refinementCount = describeActiveFilters({ ...filters, query: '' }, locationOptions).length;
  const activeFilterItems = describeActiveFilters(filters, locationOptions);
  const hasData = status === 'success' && objects.length > 0;
  const showTools = status === 'loading' || hasData;
  const unavailableNotes = status === 'success' && !isFiltering ? buildUnavailableNotes(counts) : [];

  const closeFilters = useCallback(() => {
    setIsFiltersOpen(false);
    filtersToggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isFiltersOpen || typeof window.matchMedia !== 'function') return undefined;

    const desktopQuery = window.matchMedia('(min-width: 1025px)');
    const handleChange = (event) => {
      if (event.matches) setIsFiltersOpen(false);
    };

    desktopQuery.addEventListener('change', handleChange);
    return () => desktopQuery.removeEventListener('change', handleChange);
  }, [isFiltersOpen]);

  let countLabel = 'Carregando objetos';
  if (status === 'error') countLabel = 'Consulta indisponível';
  if (status === 'success') countLabel = isFiltering ? formatResultCount(results.length) : formatAvailableCount(objects.length);

  return (
    <div className="objects-page">
      <PageHeader
        breadcrumbs={[{ label: 'Início', to: ROUTES.home }, { label: 'Objetos encontrados' }]}
        title="Objetos encontrados"
        lead="Consulte os objetos encontrados na instituição que já foram conferidos por um funcionário responsável. Se reconhecer algum item, acesse os detalhes e anote o código do registro."
      >
        <Button to={ROUTES.registerObject} variant="secondary" icon={PackagePlus} iconPosition="start">
          Registrar objeto encontrado
        </Button>
      </PageHeader>

      <div className="container objects-page__body">
        {showTools && (
          <div className="objects-page__search">
            <SearchBar value={filters.query} onChange={(query) => updateFilters({ query })} />
          </div>
        )}

        <div className={`objects-page__layout${showTools ? '' : ' objects-page__layout--single'}`}>
          {showTools && (
            <ObjectFiltersPanel
              id={FILTERS_PANEL_ID}
              filters={filters}
              categoryCounts={categoryCounts}
              locationOptions={locationOptions}
              dateBounds={dateBounds}
              resultCount={results.length}
              isOpen={isFiltersOpen}
              onClose={closeFilters}
              onToggleCategory={toggleCategory}
              onChange={updateFilters}
              onClear={resetFilters}
              canClear={isFiltering}
            />
          )}

          <section className="objects-page__results" aria-labelledby="objetos-resultado" aria-busy={status === 'loading'}>
            <div className="objects-page__toolbar">
              <h2 id="objetos-resultado" className="objects-page__count" aria-live="polite">
                {countLabel}
              </h2>

              {hasData && (
                <div className="objects-page__controls">
                  <button
                    ref={filtersToggleRef}
                    type="button"
                    className="objects-page__filters-toggle"
                    aria-expanded={isFiltersOpen}
                    aria-controls={FILTERS_PANEL_ID}
                    onClick={() => setIsFiltersOpen(true)}
                  >
                    <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden="true" />
                    Filtros
                    {refinementCount > 0 && (
                      <span className="objects-page__filters-count">
                        {refinementCount}
                        <span className="visually-hidden"> {pluralize(refinementCount, 'ativo', 'ativos')}</span>
                      </span>
                    )}
                  </button>

                  <div className="objects-page__sort">
                    <label htmlFor="ordenacao-objetos" className="objects-page__sort-label">
                      Ordenar por
                    </label>
                    <select
                      id="ordenacao-objetos"
                      className="objects-page__sort-select"
                      value={filters.sort}
                      onChange={(event) => updateFilters({ sort: event.target.value })}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {hasData && <ActiveFilters items={activeFilterItems} onRemove={removeFilter} onClear={resetFilters} />}

            {unavailableNotes.length > 0 && (
              <div className="objects-page__notice">
                <Info size={18} strokeWidth={1.75} aria-hidden="true" />
                <ul>
                  {unavailableNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {status === 'loading' && (
              <ul className="objects-grid" aria-hidden="true">
                {Array.from({ length: SKELETON_ITEMS }, (_, index) => (
                  <li key={index} className="object-skeleton">
                    <span className="object-skeleton__icon" />
                    <span className="object-skeleton__line object-skeleton__line--short" />
                    <span className="object-skeleton__line object-skeleton__line--title" />
                    <span className="object-skeleton__line" />
                    <span className="object-skeleton__line" />
                    <span className="object-skeleton__line object-skeleton__line--medium" />
                  </li>
                ))}
              </ul>
            )}

            {status === 'error' && (
              <StatePanel
                icon={CircleAlert}
                tone="error"
                role="alert"
                headingLevel={3}
                title="Não foi possível carregar os objetos"
                description="Ocorreu um problema ao consultar os registros. Verifique sua conexão e tente novamente em alguns instantes."
              >
                <Button variant="secondary" icon={RotateCw} iconPosition="start" onClick={loadObjects}>
                  Tentar novamente
                </Button>
              </StatePanel>
            )}

            {status === 'success' && objects.length === 0 && (
              <StatePanel
                icon={SearchX}
                headingLevel={3}
                title="Nenhum objeto disponível no momento"
                description="Ainda não há objetos aprovados para consulta. Os novos registros aparecem aqui assim que forem conferidos por um funcionário responsável."
              >
                <Button to={ROUTES.registerObject} variant="secondary" icon={PackagePlus} iconPosition="start">
                  Registrar objeto encontrado
                </Button>
              </StatePanel>
            )}

            {hasData && results.length === 0 && (
              <StatePanel
                icon={SearchX}
                headingLevel={3}
                title={
                  hasRefinementFilters(deferredFilters)
                    ? 'Nenhum resultado para os filtros selecionados'
                    : `Nenhum objeto encontrado para "${deferredFilters.query.trim()}"`
                }
                description={
                  hasRefinementFilters(deferredFilters)
                    ? 'Remova algum dos filtros aplicados ou limpe todos para voltar à listagem completa.'
                    : 'Confira a grafia ou pesquise por outra característica do objeto, como a cor, o material ou o local.'
                }
              >
                <Button variant="secondary" onClick={resetFilters}>
                  Limpar filtros
                </Button>
              </StatePanel>
            )}

            {hasData && results.length > 0 && (
              <ul className="objects-grid">
                {results.map((object) => (
                  <li key={object.id}>
                    <ObjectCard object={object} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default ObjectsPage;
