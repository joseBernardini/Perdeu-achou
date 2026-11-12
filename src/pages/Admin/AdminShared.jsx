import { Link, useOutletContext } from 'react-router-dom';
import { ArrowLeft, CircleAlert, RotateCw } from 'lucide-react';
import Button from '../../components/Button/Button';
import StatePanel from '../../components/StatePanel/StatePanel';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { ADMIN_EVENT_LABELS, OBJECT_STATUS_LABELS, REQUEST_STATUS_LABELS, USER_ROLE_LABELS } from '../../utils/constants';
import { formatDateTime } from '../../utils/date';
import { getErrorMessage } from '../../utils/errorMessages';

export function useAdminSession() {
  return useOutletContext();
}

export function AdminPageHeader({ title, lead, back, children }) {
  useDocumentTitle(`${title} · Painel`);

  return (
    <header className="admin-page__header">
      <div>
        {back && (
          <Link to={back.to} className="admin-page__breadcrumb">
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            {back.label}
          </Link>
        )}
        <h1 className="admin-page__title">{title}</h1>
        {lead && <p className="admin-page__lead">{lead}</p>}
      </div>
      {children}
    </header>
  );
}

export function AdminLoadError({ title, error, onRetry }) {
  return (
    <StatePanel
      icon={CircleAlert}
      tone="error"
      role="alert"
      title={title}
      description={getErrorMessage(error, 'Ocorreu um problema ao consultar os dados. Tente novamente.')}
    >
      <Button variant="secondary" icon={RotateCw} iconPosition="start" onClick={() => onRetry()}>
        Tentar novamente
      </Button>
    </StatePanel>
  );
}

function describeStatusChange(event) {
  const { from, to } = event.details ?? {};
  if (!from || !to) return '';

  const labels = event.targetType === 'solicitacao' ? REQUEST_STATUS_LABELS : OBJECT_STATUS_LABELS;
  return `${labels[from] ?? from} → ${labels[to] ?? to}`;
}

export function AdminTimeline({ events, emptyText = 'Nenhum evento registrado.' }) {
  if (events.length === 0) return <p className="admin-panel__empty">{emptyText}</p>;

  return (
    <ol className="admin-timeline">
      {events.map((event) => (
        <li key={event.id} className="admin-timeline__item">
          <p className="admin-timeline__title">{ADMIN_EVENT_LABELS[event.type]}</p>
          <p className="admin-timeline__meta">
            {formatDateTime(event.createdAt)} · {USER_ROLE_LABELS[event.actorRole] ?? 'Responsável'}{' '}
            <span className="admin-mono">{event.actorId}</span>
            {describeStatusChange(event) && ` · ${describeStatusChange(event)}`}
          </p>
          {event.details?.reason && <p className="admin-timeline__reason">Motivo: {event.details.reason}</p>}
        </li>
      ))}
    </ol>
  );
}
