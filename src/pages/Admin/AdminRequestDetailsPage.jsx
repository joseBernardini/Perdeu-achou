import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CircleCheck, CircleX, PackageCheck, SearchX, Undo2 } from 'lucide-react';
import Button from '../../components/Button/Button';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import FormAlert from '../../components/FormAlert/FormAlert';
import StatePanel from '../../components/StatePanel/StatePanel';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { getCategoryById } from '../../data/categories';
import useAsyncData from '../../hooks/useAsyncData';
import adminService from '../../services/adminService';
import { RequestNotFoundError } from '../../services/serviceErrors';
import { validateAdminReason } from '../../utils/adminValidation';
import { OBJECT_STATUS, OBJECT_STATUS_LABELS, REQUEST_STATUS, REQUEST_STATUS_LABELS, ROUTES, getAdminObjectPath, getAdminRequestPath } from '../../utils/constants';
import { formatDateTime, formatISODate } from '../../utils/date';
import { AdminLoadError, AdminPageHeader, AdminTimeline, useAdminSession } from './AdminShared';

const DIALOGS = {
  approve: {
    title: 'Aprovar solicitação',
    confirmLabel: 'Aprovar solicitação',
    loadingLabel: 'Aprovando',
    success: 'Solicitação aprovada. O objeto passou para "Em processo de devolução" e saiu da consulta pública.',
  },
  reject: {
    title: 'Rejeitar solicitação',
    confirmLabel: 'Rejeitar solicitação',
    loadingLabel: 'Rejeitando',
    tone: 'danger',
    requireReason: true,
    reasonLabel: 'Motivo da rejeição',
    success: 'Solicitação rejeitada.',
  },
  cancel: {
    title: 'Cancelar aprovação',
    confirmLabel: 'Cancelar aprovação',
    loadingLabel: 'Cancelando',
    tone: 'danger',
    requireReason: true,
    reasonLabel: 'Motivo do cancelamento',
    success: 'Aprovação cancelada. O objeto voltou a ficar disponível na consulta pública.',
  },
  complete: {
    title: 'Concluir devolução',
    confirmLabel: 'Confirmar devolução',
    loadingLabel: 'Concluindo',
    success: 'Devolução concluída. O objeto passou a constar como devolvido.',
  },
};

function AdminRequestDetailsPage() {
  const { requestId } = useParams();
  const { actor } = useAdminSession();
  const [dialog, setDialog] = useState(null);
  const [feedback, setFeedback] = useState('');
  const { status, data, error, reload } = useAsyncData(
    () => adminService.getRequestDetails(requestId, actor),
    [requestId, actor]
  );

  if (status === 'loading' && !data) {
    return (
      <p className="admin-loading" role="status">
        Carregando solicitação...
      </p>
    );
  }

  if (status === 'error') {
    if (error instanceof RequestNotFoundError) {
      return (
        <>
          <AdminPageHeader title="Solicitação não encontrada" back={{ to: ROUTES.adminRequests, label: 'Solicitações' }} />
          <StatePanel icon={SearchX} title="Não há solicitação com este código" description="Confira o código ou volte para a lista de solicitações." />
        </>
      );
    }
    return <AdminLoadError title="Não foi possível carregar a solicitação" onRetry={reload} />;
  }

  const { request, object, otherPendingCount, otherApprovedRequest, events } = data;
  const isOwnRequest = request.requesterId === actor.id;
  const objectAvailable = object.status === OBJECT_STATUS.available;
  const category = getCategoryById(object.category);

  const actions = {
    approve: () => adminService.approveRequest(request.id, actor),
    reject: (reason) => adminService.rejectRequest(request.id, actor, reason),
    cancel: (reason) => adminService.rejectRequest(request.id, actor, reason),
    complete: () => adminService.completeRequest(request.id, actor),
  };

  const handleConfirm = async (reason) => {
    const type = dialog;
    await actions[type](reason);
    setDialog(null);
    setFeedback(DIALOGS[type].success);
    await reload({ silent: true });
  };

  const objectLabel = (
    <>
      <strong>{object.name}</strong> ({object.id})
    </>
  );

  const dialogDescriptions = {
    approve: (
      <>
        <p>
          Confirme somente se as informações enviadas comprovam a propriedade de {objectLabel}.
        </p>
        <p>
          O objeto passará para <strong>Em processo de devolução</strong> e outras solicitações para ele não poderão ser
          aprovadas enquanto esta estiver ativa.
        </p>
      </>
    ),
    reject: <p>A solicitação {request.id} será encerrada como rejeitada. O objeto continua com o status atual.</p>,
    cancel: (
      <p>
        A aprovação da solicitação {request.id} será cancelada e {objectLabel} voltará a ficar disponível na consulta
        pública.
      </p>
    ),
    complete: (
      <p>
        Confirme que {objectLabel} foi entregue ao solicitante após a conferência presencial. O objeto passará a constar
        como <strong>devolvido</strong> e a solicitação será concluída.
      </p>
    ),
  };

  return (
    <>
      <AdminPageHeader
        title={`Solicitação ${request.id}`}
        back={{ to: ROUTES.adminRequests, label: 'Solicitações' }}
      />

      {feedback && (
        <div className="admin-section__header">
          <FormAlert tone="success" title="Ação concluída" autoFocus>
            {feedback}
          </FormAlert>
        </div>
      )}

      <div className="admin-detail">
        <div className="admin-detail__main">
          <section className="admin-panel" aria-labelledby="dados-solicitacao">
            <div className="admin-panel__header">
              <h2 id="dados-solicitacao" className="admin-panel__title">
                Dados da solicitação
              </h2>
              <StatusBadge status={request.status} label={REQUEST_STATUS_LABELS[request.status]} />
            </div>
            <dl className="admin-panel__body admin-fields">
              <div>
                <dt>Código</dt>
                <dd className="admin-mono">{request.id}</dd>
              </div>
              <div>
                <dt>Enviada em</dt>
                <dd>{formatDateTime(request.createdAt)}</dd>
              </div>
              <div>
                <dt>Solicitante</dt>
                <dd>
                  {request.requester?.name ?? 'Conta não encontrada'}
                  <span className="admin-table__secondary admin-mono">{request.requesterId}</span>
                </dd>
              </div>
              <div>
                <dt>Última atualização</dt>
                <dd>{formatDateTime(request.updatedAt)}</dd>
              </div>
              <div className="admin-fields--full">
                <dt>Mensagem enviada</dt>
                <dd className="admin-text-block">{request.message}</dd>
              </div>
              {request.additionalInfo && (
                <div className="admin-fields--full">
                  <dt>Informações adicionais</dt>
                  <dd className="admin-text-block">{request.additionalInfo}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="admin-panel" aria-labelledby="objeto-relacionado">
            <div className="admin-panel__header">
              <h2 id="objeto-relacionado" className="admin-panel__title">
                Objeto relacionado
              </h2>
              <StatusBadge status={object.status} />
            </div>
            <dl className="admin-panel__body admin-fields">
              <div>
                <dt>Objeto</dt>
                <dd>
                  <Link to={getAdminObjectPath(object.id)}>{object.name}</Link>
                  <span className="admin-table__secondary admin-mono">{object.id}</span>
                </dd>
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
              <div className="admin-fields--full">
                <dt>Descrição registrada</dt>
                <dd className="admin-text-block">{object.description}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-panel" aria-labelledby="historico-solicitacao">
            <div className="admin-panel__header">
              <h2 id="historico-solicitacao" className="admin-panel__title">
                Histórico
              </h2>
            </div>
            <div className="admin-panel__body">
              <AdminTimeline events={events} />
            </div>
          </section>
        </div>

        <aside className="admin-detail__aside" aria-labelledby="acoes-solicitacao">
          <section className="admin-panel">
            <div className="admin-panel__header">
              <h2 id="acoes-solicitacao" className="admin-panel__title">
                Ações
              </h2>
            </div>
            <div className="admin-panel__body admin-actions">
              {isOwnRequest && (
                <p className="admin-actions__note">
                  Esta solicitação foi enviada pela sua conta. Outro funcionário precisa analisá-la.
                </p>
              )}

              {!isOwnRequest && request.status === REQUEST_STATUS.pending && (
                <>
                  {otherPendingCount > 0 && (
                    <p className="admin-actions__note">
                      {otherPendingCount === 1
                        ? 'Há outra solicitação pendente para este objeto.'
                        : `Há outras ${otherPendingCount} solicitações pendentes para este objeto.`}{' '}
                      Compare as informações antes de decidir.
                    </p>
                  )}
                  {objectAvailable ? (
                    <Button icon={CircleCheck} iconPosition="start" onClick={() => setDialog('approve')}>
                      Aprovar solicitação
                    </Button>
                  ) : (
                    <p className="admin-actions__note">
                      A aprovação não está disponível porque o objeto está com status &quot;
                      {OBJECT_STATUS_LABELS[object.status]}&quot;.
                      {otherApprovedRequest && (
                        <>
                          {' '}
                          A devolução está vinculada à solicitação{' '}
                          <Link to={getAdminRequestPath(otherApprovedRequest.id)}>{otherApprovedRequest.id}</Link>.
                        </>
                      )}
                    </p>
                  )}
                  <Button variant="secondary" icon={CircleX} iconPosition="start" onClick={() => setDialog('reject')}>
                    Rejeitar solicitação
                  </Button>
                </>
              )}

              {!isOwnRequest && request.status === REQUEST_STATUS.approved && (
                <>
                  <p className="admin-actions__note">
                    Após a entrega presencial e a conferência das informações, conclua a devolução.
                  </p>
                  <Button icon={PackageCheck} iconPosition="start" onClick={() => setDialog('complete')}>
                    Concluir devolução
                  </Button>
                  <Button variant="secondary" icon={Undo2} iconPosition="start" onClick={() => setDialog('cancel')}>
                    Cancelar aprovação
                  </Button>
                </>
              )}

              {(request.status === REQUEST_STATUS.rejected || request.status === REQUEST_STATUS.completed) && (
                <p className="admin-actions__note">Solicitação encerrada. Não há ações disponíveis.</p>
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

export default AdminRequestDetailsPage;
