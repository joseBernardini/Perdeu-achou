import { Link } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import useAsyncData from '../../hooks/useAsyncData';
import adminService from '../../services/adminService';
import {
  OBJECT_STATUS,
  REQUEST_STATUS,
  REQUEST_STATUS_LABELS,
  ROUTES,
  getAdminObjectPath,
  getAdminRequestPath,
} from '../../utils/constants';
import { formatDateTime, formatISODate } from '../../utils/date';
import { AdminLoadError, AdminPageHeader, AdminTimeline, useAdminSession } from './AdminShared';

const PREVIEW_LIMIT = 5;

function AdminOverviewPage() {
  const { actor } = useAdminSession();
  const { status, data, error, reload } = useAsyncData(async () => {
    const [overview, objects, requests, events] = await Promise.all([
      adminService.getOverview(actor),
      adminService.listObjects(actor),
      adminService.listRequests(actor),
      adminService.listHistory(actor, { limit: PREVIEW_LIMIT }),
    ]);

    return {
      overview,
      pendingObjects: objects.filter((object) => object.status === OBJECT_STATUS.pendingApproval).slice(0, PREVIEW_LIMIT),
      pendingRequests: requests.filter((request) => request.status === REQUEST_STATUS.pending).slice(0, PREVIEW_LIMIT),
      events,
    };
  }, [actor]);

  const indicators = data
    ? [
        { id: 'total', label: 'Objetos cadastrados', value: data.overview.totalObjects, hint: 'Todos os status' },
        { id: 'pendentes', label: 'Aguardando aprovação', value: data.overview.pendingObjects, attention: true },
        { id: 'disponiveis', label: 'Objetos disponíveis', value: data.overview.availableObjects, hint: 'Visíveis na consulta' },
        { id: 'solicitacoes', label: 'Solicitações pendentes', value: data.overview.pendingRequests, attention: true },
        { id: 'devolvidos', label: 'Objetos devolvidos', value: data.overview.returnedObjects },
      ]
    : [];

  return (
    <>
      <AdminPageHeader
        title="Visão geral"
        lead="Acompanhe os registros que precisam de análise e o andamento das devoluções."
      />

      {status === 'loading' && !data && (
        <p className="admin-loading" role="status">
          Carregando indicadores...
        </p>
      )}

      {status === 'error' && <AdminLoadError title="Não foi possível carregar a visão geral" error={error} onRetry={reload} />}

      {data && (
        <>
          <section aria-labelledby="indicadores-titulo">
            <h2 id="indicadores-titulo" className="visually-hidden">
              Indicadores
            </h2>
            <dl className="admin-indicators">
              {indicators.map((indicator) => (
                <div
                  key={indicator.id}
                  className={`admin-indicator${indicator.attention && indicator.value > 0 ? ' admin-indicator--attention' : ''}`}
                >
                  <dt className="admin-indicator__label">{indicator.label}</dt>
                  <dd className="admin-indicator__value">{indicator.value}</dd>
                  {indicator.hint && <dd className="admin-indicator__hint">{indicator.hint}</dd>}
                </div>
              ))}
            </dl>
          </section>

          <div className="admin-columns admin-section">
            <section className="admin-panel" aria-labelledby="pendencias-objetos">
              <div className="admin-panel__header">
                <h2 id="pendencias-objetos" className="admin-panel__title">
                  Objetos aguardando aprovação
                </h2>
                <Link to={`${ROUTES.adminObjects}?status=${OBJECT_STATUS.pendingApproval}`} className="admin-section__link">
                  Ver todos
                </Link>
              </div>
              {data.pendingObjects.length === 0 ? (
                <p className="admin-panel__empty">Nenhum registro aguardando aprovação.</p>
              ) : (
                <ul className="admin-list">
                  {data.pendingObjects.map((object) => (
                    <li key={object.id} className="admin-list__item">
                      <span className="admin-list__main">
                        <Link to={getAdminObjectPath(object.id)} className="admin-list__title">
                          {object.name}
                        </Link>
                        <span className="admin-list__meta">
                          <span className="admin-mono">{object.id}</span> · encontrado em {formatISODate(object.foundDate)}
                        </span>
                      </span>
                      <StatusBadge status={object.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin-panel" aria-labelledby="pendencias-solicitacoes">
              <div className="admin-panel__header">
                <h2 id="pendencias-solicitacoes" className="admin-panel__title">
                  Solicitações pendentes
                </h2>
                <Link to={`${ROUTES.adminRequests}?status=${REQUEST_STATUS.pending}`} className="admin-section__link">
                  Ver todas
                </Link>
              </div>
              {data.pendingRequests.length === 0 ? (
                <p className="admin-panel__empty">Nenhuma solicitação pendente.</p>
              ) : (
                <ul className="admin-list">
                  {data.pendingRequests.map((request) => (
                    <li key={request.id} className="admin-list__item">
                      <span className="admin-list__main">
                        <Link to={getAdminRequestPath(request.id)} className="admin-list__title">
                          {request.object?.name ?? request.objectId}
                        </Link>
                        <span className="admin-list__meta">
                          <span className="admin-mono">{request.id}</span> · {formatDateTime(request.createdAt)}
                        </span>
                      </span>
                      <StatusBadge status={request.status} label={REQUEST_STATUS_LABELS[request.status]} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="admin-panel admin-section" aria-labelledby="eventos-recentes">
            <div className="admin-panel__header">
              <h2 id="eventos-recentes" className="admin-panel__title">
                Eventos recentes
              </h2>
              <Link to={ROUTES.adminHistory} className="admin-section__link">
                Ver histórico
              </Link>
            </div>
            <div className="admin-panel__body">
              <AdminTimeline events={data.events} emptyText="Nenhuma ação administrativa registrada até o momento." />
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default AdminOverviewPage;
