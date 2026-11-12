import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../../components/Button/Button';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import categories, { getCategoryById } from '../../data/categories';
import useAsyncData from '../../hooks/useAsyncData';
import useUrlFilters from '../../hooks/useUrlFilters';
import adminService from '../../services/adminService';
import { filterAdminObjects } from '../../utils/adminFilters';
import { OBJECT_STATUS, OBJECT_STATUS_LABELS, getAdminObjectPath } from '../../utils/constants';
import { formatISODate } from '../../utils/date';
import { AdminLoadError, AdminPageHeader, useAdminSession } from './AdminShared';
import '../../components/FormField/FormField.css';

const FILTER_KEYS = ['busca', 'status', 'categoria'];
const STATUS_ORDER = [
  OBJECT_STATUS.pendingApproval,
  OBJECT_STATUS.available,
  OBJECT_STATUS.inReturn,
  OBJECT_STATUS.returned,
  OBJECT_STATUS.rejected,
];

function isValidFilter(key, value) {
  if (key === 'status') return STATUS_ORDER.includes(value);
  if (key === 'categoria') return categories.some((category) => category.id === value);
  return true;
}

function AdminObjectsPage() {
  const { actor } = useAdminSession();
  const { filters, updateFilter, clearFilters } = useUrlFilters(FILTER_KEYS, isValidFilter);
  const { status, data, error, reload } = useAsyncData(() => adminService.listObjects(actor), [actor]);

  const results = useMemo(
    () => filterAdminObjects(data ?? [], { query: filters.busca, status: filters.status, category: filters.categoria }),
    [data, filters]
  );
  const hasFilters = Boolean(filters.busca || filters.status || filters.categoria);

  return (
    <>
      <AdminPageHeader
        title="Objetos"
        lead="Analise os registros enviados, aprove os que podem ser publicados e acompanhe o status de cada objeto."
      />

      <div className="admin-toolbar" role="search">
        <div className="admin-toolbar__field">
          <label htmlFor="admin-objetos-busca" className="admin-toolbar__label">
            Pesquisar
          </label>
          <input
            id="admin-objetos-busca"
            type="search"
            className="form-control"
            placeholder="Nome, código, descrição, local ou categoria"
            value={filters.busca}
            onChange={(event) => updateFilter('busca', event.target.value)}
          />
        </div>
        <div className="admin-toolbar__field">
          <label htmlFor="admin-objetos-status" className="admin-toolbar__label">
            Status
          </label>
          <select
            id="admin-objetos-status"
            className="form-control"
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            <option value="">Todos os status</option>
            {STATUS_ORDER.map((value) => (
              <option key={value} value={value}>
                {OBJECT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-toolbar__field">
          <label htmlFor="admin-objetos-categoria" className="admin-toolbar__label">
            Categoria
          </label>
          <select
            id="admin-objetos-categoria"
            className="form-control"
            value={filters.categoria}
            onChange={(event) => updateFilter('categoria', event.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === 'loading' && !data && (
        <p className="admin-loading" role="status">
          Carregando objetos...
        </p>
      )}

      {status === 'error' && <AdminLoadError title="Não foi possível carregar os objetos" error={error} onRetry={reload} />}

      {data && (
        <>
          <p className="admin-result-count" aria-live="polite">
            {results.length === 1 ? '1 objeto encontrado' : `${results.length} objetos encontrados`}
            {hasFilters && ` de ${data.length} cadastrados`}
          </p>

          {results.length === 0 ? (
            <div className="admin-panel">
              <p className="admin-panel__empty">Nenhum objeto corresponde aos filtros selecionados.</p>
              {hasFilters && (
                <div className="admin-panel__body">
                  <Button variant="secondary" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <caption className="visually-hidden">Objetos cadastrados</caption>
                <thead>
                  <tr>
                    <th scope="col">Objeto</th>
                    <th scope="col">Categoria</th>
                    <th scope="col">Local</th>
                    <th scope="col">Encontrado em</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="visually-hidden">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((object) => (
                    <tr key={object.id}>
                      <td data-label="Objeto">
                        <span>
                          <Link to={getAdminObjectPath(object.id)} className="admin-table__primary">
                            {object.name}
                          </Link>
                          <span className="admin-table__secondary admin-mono">{object.id}</span>
                        </span>
                      </td>
                      <td data-label="Categoria">{getCategoryById(object.category)?.title ?? 'Sem categoria'}</td>
                      <td data-label="Local">{object.location}</td>
                      <td data-label="Encontrado em" className="admin-table__nowrap">
                        {formatISODate(object.foundDate)}
                      </td>
                      <td data-label="Status">
                        <span>
                          <StatusBadge status={object.status} />
                          {object.pendingRequestCount > 0 && (
                            <span className="admin-tag">
                              {object.pendingRequestCount === 1
                                ? '1 solicitação'
                                : `${object.pendingRequestCount} solicitações`}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="admin-table__action">
                        <Link to={getAdminObjectPath(object.id)} className="admin-link-button">
                          {object.status === OBJECT_STATUS.pendingApproval ? 'Analisar' : 'Detalhes'}
                          <span className="visually-hidden"> {object.name}</span>
                          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default AdminObjectsPage;
