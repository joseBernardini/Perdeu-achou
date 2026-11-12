import { useEffect, useRef } from 'react';
import { ArrowLeft, CircleCheck, ClipboardList } from 'lucide-react';
import Button from '../../components/Button/Button';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { REQUEST_STATUS_LABELS, ROUTES } from '../../utils/constants';
import { formatDateTime } from '../../utils/date';

function RecoveryRequestSuccess({ request, object }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="request-success" aria-labelledby="solicitacao-enviada-titulo">
      <div className="request-success__header">
        <span className="request-success__icon" aria-hidden="true">
          <CircleCheck size={24} strokeWidth={1.75} />
        </span>
        <div>
          <h2 id="solicitacao-enviada-titulo" ref={headingRef} tabIndex={-1} className="request-success__title">
            Solicitação enviada
          </h2>
          <p className="request-success__subtitle">Enviada em {formatDateTime(request.createdAt)}.</p>
        </div>
      </div>

      <dl className="request-success__details">
        <div>
          <dt>Código da solicitação</dt>
          <dd className="request-success__code">{request.id}</dd>
        </div>
        <div>
          <dt>Objeto</dt>
          <dd>
            {object.name} <span className="request-success__muted">({object.id})</span>
          </dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>
            <StatusBadge status={request.status} label={REQUEST_STATUS_LABELS[request.status]} />
          </dd>
        </div>
      </dl>

      <div className="request-success__next">
        <h3 className="request-success__next-title">Próximos passos</h3>
        <p>
          Um funcionário responsável vai comparar as informações enviadas com o objeto guardado. Acompanhe a situação
          da solicitação na sua área. Se a propriedade for confirmada, você será orientado a retirar o objeto
          presencialmente.
        </p>
      </div>

      <div className="request-success__actions">
        <Button to={ROUTES.userArea} icon={ClipboardList} iconPosition="start">
          Acompanhar minhas solicitações
        </Button>
        <Button to={ROUTES.objects} variant="secondary" icon={ArrowLeft} iconPosition="start">
          Voltar aos objetos encontrados
        </Button>
      </div>
    </section>
  );
}

export default RecoveryRequestSuccess;
