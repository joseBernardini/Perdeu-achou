import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CircleCheck, CircleX, RotateCcw, SearchX } from 'lucide-react';
import Button from '../../components/Button/Button';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import FormAlert from '../../components/FormAlert/FormAlert';
import StatePanel from '../../components/StatePanel/StatePanel';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { getCategoryById } from '../../data/categories';
import useAsyncData from '../../hooks/useAsyncData';
import adminService from '../../services/adminService';
import { ObjectNotFoundError } from '../../services/serviceErrors';
import { validateAdminReason } from '../../utils/adminValidation';
import {
  OBJECT_REOPEN_TRANSITIONS,
  OBJECT_STATUS,
  OBJECT_STATUS_LABELS,
  REQUEST_STATUS,
  REQUEST_STATUS_LABELS,
  ROUTES,
  USER_ROLES,
  getAdminRequestPath,
} from '../../utils/constants';
import { formatDateTime, formatISODate } from '../../utils/date';
import { AdminLoadError, AdminPageHeader, AdminTimeline, useAdminSession } from './AdminShared';

const DIALOGS = {
  approve: {
    title: 'Aprovar registro',
    confirmLabel: 'Aprovar e publicar',
    loadingLabel: 'Aprovando',
    success: 'Registro aprovado. O objeto já aparece na consulta pública como disponível.',
  },
  reject: {
    title: 'Rejeitar registro',
    confirmLabel: 'Rejeitar registro',
    loadingLabel: 'Rejeitando',
    tone: 'danger',
    requireReason: true,
    reasonLabel: 'Motivo da rejeição',
    success: 'Registro rejeitado. O objeto não será exibido na consulta pública.',
  },
  reopen: {
    title: 'Reabrir registro',
    confirmLabel: 'Reabrir registro',
    loadingLabel: 'Reabrindo',
    tone: 'danger',
    requireReason: true,
    reasonLabel: 'Justificativa da reabertura',
    success: 'Registro reaberto com a justificativa registrada no histórico.',
  },
};

function AdminObjectDetailsPage() {
  const { objectId } = useParams();
  const { actor } = useAdminSession();
  const [dialog, setDialog] = useState(null);
  const [feedback, setFeedback] = useState('');
  const { status, data, error, reload } = useAsyncData(() => adminService.getObjectDetails(objectId, actor), [objectId, actor]);

  if (status === 'loading' && !data) {
    return (
      <p className="admin-loading" role="status">
        Carregando objeto...
      </p>
    );
  }

  if (status === 'error') {
    if (error instanceof ObjectNotFoundError) {
      return (
        <>
          <AdminPageHeader title="Objeto não encontrado" back={{ to: ROUTES.adminObjects, label: 'Objetos' }} />
          <StatePanel icon={SearchX} title="Não há objeto com este código" description="Confira o código ou volte para a lista de objetos." />
        </>
      );
    }
    return <AdminLoadError title="Não foi possível carregar o objeto" onRetry={reload} />;
  }

  const { object, requests, events } = data;
  const category = getCategoryById(object.category);
  const reopenTarget = OBJECT_REOPEN_TRANSITIONS[object.status];
  const isAdmin = actor.role === USER_ROLES.admin;
  const activeRequest = requests.find((request) => request.status === REQUEST_STATUS.approved);

  const actions = {
    approve: () => adminService.approveObject(object.id, actor),
    reject: (reason) => adminService.rejectObject(object.id, actor, reason),
    reopen: (reason) => adminService.reopenObject(object.id, actor, reason),
  };

  const handleConfirm = async (reason) => {
    const type = dialog;
    await actions[type](reason);
    setDialog(null);
    setFeedback(DIALOGS[type].success);
    await reload({ silent: true });
  };

  const dialogDescriptions = {
    approve: (
      <p>
        O objeto <strong>{object.name}</strong> ({object.id}) passará para <strong>Disponível</strong> e será exibido na
        consulta pública. Confirme apenas se as informações estiverem adequadas e não contiverem dados pessoais.
      </p>
    ),
    reject: (
      <p>
        O objeto <strong>{object.name}</strong> ({object.id}) passará para <strong>Reprovado</strong> e não aparecerá na
        consulta pública.
      </p>
    ),
    reopen: (
      <>
        <p>
          O registro <strong>{object.id}</strong> passará de <strong>{OBJECT_STATUS_LABELS[object.status]}</strong> para{' '}
          <strong>{OBJECT_STATUS_LABELS[reopenTarget]}</strong>.
        </p>
        <p>Use esta ação somente para corrigir um encerramento indevido. A justificativa fica registrada no histórico.</p>
      </>
    ),
  };

  return (
    <>
      <AdminPageHeader title={object.name} back={{ to: ROUTES.adminObjects, label: 'Objetos' }} />

      {feedback && (
        <div className="admin-section__header">
          <FormAlert tone="success" title="Ação concluída" autoFocus>
            {feedback}
          </FormAlert>
        </div>
      )}

      <div className="admin-detail">
        <div className="admin-detail__main">
          <section className="admin-panel" aria-labelledby="dados-objeto">
            <div className="admin-panel__header">
              <h2 id="dados-objeto" className="admin-panel__title">
                Dados do registro
              </h2>
              <StatusBadge status={object.status} />
            </div>
            <dl className="admin-panel__body admin-fields">
              <div>
                <dt>Código</dt>
                <dd className="admin-mono">{object.id}</dd>
              </div>
              <div>
                <dt>Categoria</dt>
                <dd>{category?.title ?? 'Sem categoria'}</dd>
              </div>
              <div>
                <dt>Local onde foi encontrado</dt>
                <dd>{object.location}</dd>
              </div>
              <div>
                <dt>Data em que foi encontrado</dt>
                <dd>{formatISODate(object.foundDate)}</dd>
              </div>
              <div>
                <dt>Registrado em</dt>
                <dd>{formatDateTime(object.createdAt)}</dd>
              </div>
              <div>
                <dt>Última atualização</dt>
                <dd>{formatDateTime(object.updatedAt)}</dd>
              </div>
              <div>
                <dt>Registrado por</dt>
                <dd className="admin-mono">{object.registeredBy ?? 'Registro de demonstração'}</dd>
              </div>
              <div className="admin-fields--full">
                <dt>Descrição</dt>
                <dd className="admin-text-block">{object.description}</dd>
              </div>
              {object.notes && (
                <div className="admin-fields--full">
                  <dt>Observações</dt>
                  <dd className="admin-text-block">{object.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="admin-panel" aria-labelledby="solicitacoes-objeto">
            <div className="admin-panel__header">
              <h2 id="solicitacoes-objeto" className="admin-panel__title">
                Solicitações de recuperação
              </h2>
            </div>
            {requests.length === 0 ? (
              <p className="admin-panel__empty">Nenhuma solicitação para este objeto.</p>
            ) : (
              <ul className="admin-list">
                {requests.map((request) => (
                  <li key={request.id} className="admin-list__item">
                    <span className="admin-list__main">
                      <Link to={getAdminRequestPath(request.id)} className="admin-list__title admin-mono">
                        {request.id}
                      </Link>
                      <span className="admin-list__meta">
                        {request.requester?.name ?? 'Solicitante'} · {formatDateTime(request.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={request.status} label={REQUEST_STATUS_LABELS[request.status]} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="admin-panel" aria-labelledby="historico-objeto">
            <div className="admin-panel__header">
              <h2 id="historico-objeto" className="admin-panel__title">
                Histórico
              </h2>
            </div>
            <div className="admin-panel__body">
              <AdminTimeline events={events} />
            </div>
          </section>
        </div>

        <aside className="admin-detail__aside" aria-labelledby="acoes-objeto">
          <section className="admin-panel">
            <div className="admin-panel__header">
              <h2 id="acoes-objeto" className="admin-panel__title">
                Ações
              </h2>
            </div>
            <div className="admin-panel__body admin-actions">
              {object.status === OBJECT_STATUS.pendingApproval && (
                <>
                  <p className="admin-actions__note">Confira se a descrição permite a identificação sem expor dados pessoais.</p>
                  <Button icon={CircleCheck} iconPosition="start" onClick={() => setDialog('approve')}>
                    Aprovar registro
                  </Button>
                  <Button variant="secondary" icon={CircleX} iconPosition="start" onClick={() => setDialog('reject')}>
                    Rejeitar registro
                  </Button>
                </>
              )}

              {object.status === OBJECT_STATUS.available && (
                <p className="admin-actions__note">
                  O objeto está disponível na consulta. A devolução é organizada pela análise das solicitações de recuperação.
                </p>
              )}

              {object.status === OBJECT_STATUS.inReturn && (
                <p className="admin-actions__note">
                  O objeto está em processo de devolução
                  {activeRequest && (
                    <>
                      {' '}
                      pela solicitação <Link to={getAdminRequestPath(activeRequest.id)}>{activeRequest.id}</Link>
                    </>
                  )}
                  . Conclua ou cancele a devolução na solicitação.
                </p>
              )}

              {reopenTarget && (
                <>
                  <p className="admin-actions__note">
                    Registro encerrado como {OBJECT_STATUS_LABELS[object.status].toLowerCase()}.{' '}
                    {isAdmin
                      ? 'Um administrador pode reabri-lo com justificativa.'
                      : 'Somente administradores podem reabrir registros encerrados.'}
                  </p>
                  {isAdmin && (
                    <Button variant="secondary" icon={RotateCcw} iconPosition="start" onClick={() => setDialog('reopen')}>
                      Reabrir registro
                    </Button>
                  )}
                </>
              )}
            </div>
          </section>
        </aside>
      </div>

      {dialog && (
        <ConfirmDialog
          {...DIALOGS[dialog]}
          description={dialogDescriptions[dialog]}
          validateReason={validateAdminReason}
          onConfirm={handleConfirm}
          onCancel={() => setDialog(null)}
        />
      )}
    </>
  );
}

export default AdminObjectDetailsPage;
