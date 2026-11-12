import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../../components/Button/Button';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import useAsyncData from '../../hooks/useAsyncData';
import useUrlFilters from '../../hooks/useUrlFilters';
import adminService from '../../services/adminService';
import { filterAdminRequests } from '../../utils/adminFilters';
import { REQUEST_STATUS, REQUEST_STATUS_LABELS, getAdminObjectPath, getAdminRequestPath } from '../../utils/constants';
import { formatDateTime } from '../../utils/date';
import { AdminLoadError, AdminPageHeader, useAdminSession } from './AdminShared';
import '../../components/FormField/FormField.css';

const FILTER_KEYS = ['busca', 'status'];
const STATUS_ORDER = [REQUEST_STATUS.pending, REQUEST_STATUS.approved, REQUEST_STATUS.rejected, REQUEST_STATUS.completed];

function isValidFilter(key, value) {
  return key !== 'status' || STATUS_ORDER.includes(value);
}

function AdminRequestsPage() {
  const { actor } = useAdminSession();
  const { filters, updateFilter, clearFilters } = useUrlFilters(FILTER_KEYS, isValidFilter);
  const { status, data, error, reload } = useAsyncData(() => adminService.listRequests(actor), [actor]);

  const results = useMemo(
    () => filterAdminRequests(data ?? [], { query: filters.busca, status: filters.status }),
    [data, filters]
  );
  const hasFilters = Boolean(filters.busca || filters.status);

  return (
    <>
      <AdminPageHeader
        title="Solicitações"
        lead="Compare as informações enviadas pelos solicitantes com os objetos guardados e organize as devoluções."
      />

      <div className="admin-toolbar" role="search">
        <div className="admin-toolbar__field">
          <label htmlFor="admin-solicitacoes-busca" className="admin-toolbar__label">
            Pesquisar
          </label>
          <input
            id="admin-solicitacoes-busca"
            type="search"
            className="form-control"
            placeholder="Código da solicitação, objeto ou solicitante"
            value={filters.busca}
            onChange={(event) => updateFilter('busca', event.target.value)}
          />
        </div>
        <div className="admin-toolbar__field">
          <label htmlFor="admin-solicitacoes-status" className="admin-toolbar__label">
            Status
          </label>
          <select
            id="admin-solicitacoes-status"
            className="form-control"
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            <option value="">Todos os status</option>
            {STATUS_ORDER.map((value) => (
              <option key={value} value={value}>
                {REQUEST_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === 'loading' && !data && (
        <p className="admin-loading" role="status">
          Carregando solicitações...
        </p>
      )}

      {status === 'error' && <AdminLoadError title="Não foi possível carregar as solicitações" error={error} onRetry={reload} />}

      {data && (
        <>
          <p className="admin-result-count" aria-live="polite">
            {results.length === 1 ? '1 solicitação encontrada' : `${results.length} solicitações encontradas`}
            {hasFilters && ` de ${data.length} recebidas`}
          </p>

          {results.length === 0 ? (
            <div className="admin-panel">
              <p className="admin-panel__empty">
                {data.length === 0
                  ? 'Nenhuma solicitação de recuperação foi enviada até o momento.'
                  : 'Nenhuma solicitação corresponde aos filtros selecionados.'}
              </p>
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
                <caption className="visually-hidden">Solicitações de recuperação</caption>
                <thead>
                  <tr>
                    <th scope="col">Solicitação</th>
                    <th scope="col">Objeto</th>
                    <th scope="col">Solicitante</th>
                    <th scope="col">Enviada em</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="visually-hidden">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((request) => (
                    <tr key={request.id}>
                      <td data-label="Solicitação" className="admin-mono admin-table__nowrap">
                        {request.id}
                      </td>
                      <td data-label="Objeto">
                        <span>
                          <Link to={getAdminObjectPath(request.objectId)} className="admin-table__primary">
                            {request.object?.name ?? 'Objeto removido'}
                          </Link>
                          <span className="admin-table__secondary admin-mono">{request.objectId}</span>
                        </span>
                      </td>
                      <td data-label="Solicitante">
                        <span>
                          {request.requester?.name ?? 'Conta não encontrada'}
                          <span className="admin-table__secondary admin-mono">{request.requesterId}</span>
                        </span>
                      </td>
                      <td data-label="Enviada em" className="admin-table__nowrap">
                        {formatDateTime(request.createdAt)}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={request.status} label={REQUEST_STATUS_LABELS[request.status]} />
                      </td>
                      <td className="admin-table__action">
                        <Link to={getAdminRequestPath(request.id)} className="admin-link-button">
                          {request.status === REQUEST_STATUS.pending ? 'Analisar' : 'Detalhes'}
                          <span className="visually-hidden"> solicitação {request.id}</span>
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

export default AdminRequestsPage;
