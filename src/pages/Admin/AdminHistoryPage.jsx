import { Link } from 'react-router-dom';
import useAsyncData from '../../hooks/useAsyncData';
import useUrlFilters from '../../hooks/useUrlFilters';
import adminService from '../../services/adminService';
import {
  ADMIN_EVENT_LABELS,
  ADMIN_EVENT_TYPES,
  OBJECT_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  USER_ROLE_LABELS,
  getAdminObjectPath,
  getAdminRequestPath,
} from '../../utils/constants';
import { formatDateTime } from '../../utils/date';
import { AdminLoadError, AdminPageHeader, useAdminSession } from './AdminShared';
import '../../components/FormField/FormField.css';

const FILTER_KEYS = ['tipo'];
const EVENT_TYPES = Object.values(ADMIN_EVENT_TYPES);

function isValidFilter(key, value) {
  return key !== 'tipo' || EVENT_TYPES.includes(value);
}

function describeChange(event) {
  const { from, to } = event.details ?? {};
  if (!from || !to) return '—';
  const labels = event.targetType === 'solicitacao' ? REQUEST_STATUS_LABELS : OBJECT_STATUS_LABELS;
  return `${labels[from] ?? from} → ${labels[to] ?? to}`;
}

function AdminHistoryPage() {
  const { actor } = useAdminSession();
  const { filters, updateFilter } = useUrlFilters(FILTER_KEYS, isValidFilter);
  const { status, data, reload } = useAsyncData(
    () => adminService.listHistory(actor, { type: filters.tipo || undefined }),
    [actor, filters.tipo]
  );

  return (
    <>
      <AdminPageHeader
        title="Histórico"
        lead="Eventos administrativos registrados com data, tipo e identificador do responsável. Nesta demonstração, o histórico fica salvo apenas neste navegador."
      />

      <div className="admin-toolbar">
        <div className="admin-toolbar__field">
          <label htmlFor="admin-historico-tipo" className="admin-toolbar__label">
            Tipo de evento
          </label>
          <select
            id="admin-historico-tipo"
            className="form-control"
            value={filters.tipo}
            onChange={(event) => updateFilter('tipo', event.target.value)}
          >
            <option value="">Todos os eventos</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {ADMIN_EVENT_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === 'loading' && !data && (
        <p className="admin-loading" role="status">
          Carregando histórico...
        </p>
      )}

      {status === 'error' && <AdminLoadError title="Não foi possível carregar o histórico" onRetry={reload} />}

      {data && data.length === 0 && (
        <div className="admin-panel">
          <p className="admin-panel__empty">
            {filters.tipo ? 'Nenhum evento deste tipo foi registrado.' : 'Nenhuma ação administrativa registrada até o momento.'}
          </p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="visually-hidden">Eventos administrativos</caption>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Evento</th>
                <th scope="col">Registro</th>
                <th scope="col">Alteração</th>
                <th scope="col">Responsável</th>
                <th scope="col">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {data.map((event) => (
                <tr key={event.id}>
                  <td data-label="Data" className="admin-table__nowrap">
                    {formatDateTime(event.createdAt)}
                  </td>
                  <td data-label="Evento" className="admin-table__primary">
                    {ADMIN_EVENT_LABELS[event.type]}
                  </td>
                  <td data-label="Registro">
                    <Link
                      to={event.targetType === 'solicitacao' ? getAdminRequestPath(event.targetId) : getAdminObjectPath(event.targetId)}
                      className="admin-mono"
                    >
                      {event.targetId}
                    </Link>
                  </td>
                  <td data-label="Alteração">{describeChange(event)}</td>
                  <td data-label="Responsável">
                    <span>
                      {USER_ROLE_LABELS[event.actorRole] ?? 'Responsável'}
                      <span className="admin-table__secondary admin-mono">{event.actorId}</span>
                    </span>
                  </td>
                  <td data-label="Motivo">{event.details?.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default AdminHistoryPage;
