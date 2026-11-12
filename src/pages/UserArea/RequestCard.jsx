import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { getCategoryById } from '../../data/categories';
import { REQUEST_STATUS_DESCRIPTIONS, REQUEST_STATUS_LABELS, getObjectDetailsPath } from '../../utils/constants';
import { formatDateTime } from '../../utils/date';

function RequestCard({ request }) {
  const { object } = request;
  const category = object ? getCategoryById(object.category) : null;
  const CategoryIcon = category?.icon ?? Package;
  const titleId = `solicitacao-${request.id}-titulo`;

  return (
    <article className="request-card" aria-labelledby={titleId}>
      <header className="request-card__header">
        <span className="request-card__icon" aria-hidden="true">
          <CategoryIcon size={20} strokeWidth={1.6} />
        </span>
        <div className="request-card__heading">
          <h3 id={titleId} className="request-card__title">
            {object ? (
              <Link to={getObjectDetailsPath(object.id)}>{object.name}</Link>
            ) : (
              'Objeto não disponível para consulta'
            )}
          </h3>
          <p className="request-card__codes">
            <span>Objeto {request.objectId}</span>
            <span aria-hidden="true">·</span>
            <span>Solicitação {request.id}</span>
          </p>
        </div>
        <StatusBadge
          status={request.status}
          label={REQUEST_STATUS_LABELS[request.status]}
          className="request-card__status"
        />
      </header>

      <dl className="request-card__body">
        <div className="request-card__row">
          <dt>Situação atual</dt>
          <dd>{REQUEST_STATUS_DESCRIPTIONS[request.status]}</dd>
        </div>
        <div className="request-card__row">
          <dt>Enviada em</dt>
          <dd>
            <time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time>
          </dd>
        </div>
        <div className="request-card__row request-card__row--full">
          <dt>Mensagem enviada</dt>
          <dd className="request-card__message">{request.message}</dd>
        </div>
        {request.additionalInfo && (
          <div className="request-card__row request-card__row--full">
            <dt>Informações adicionais</dt>
            <dd className="request-card__message">{request.additionalInfo}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

export default RequestCard;
