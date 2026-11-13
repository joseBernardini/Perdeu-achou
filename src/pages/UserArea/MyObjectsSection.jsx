import { Link } from 'react-router-dom';
import { CircleAlert, PackagePlus, RotateCw } from 'lucide-react';
import Button from '../../components/Button/Button';
import StatePanel from '../../components/StatePanel/StatePanel';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { getCategoryById } from '../../data/categories';
import useAsyncData from '../../hooks/useAsyncData';
import objectService from '../../services/objectService';
import { OBJECT_STATUS, ROUTES, getObjectDetailsPath } from '../../utils/constants';
import { formatISODate } from '../../utils/date';
import { getErrorMessage } from '../../utils/errorMessages';

const STATUS_NOTES = {
  [OBJECT_STATUS.pendingApproval]: 'Aguardando a análise de um administrador.',
  [OBJECT_STATUS.available]: 'Publicado na consulta.',
  [OBJECT_STATUS.inReturn]: 'Em processo de devolução.',
  [OBJECT_STATUS.returned]: 'Devolvido ao proprietário.',
  [OBJECT_STATUS.rejected]: 'Não aprovado para a consulta.',
};

const LINKABLE_STATUSES = [OBJECT_STATUS.available, OBJECT_STATUS.inReturn, OBJECT_STATUS.returned];

function MyObjectsSection({ userId }) {
  const { status, data, error, reload } = useAsyncData(() => objectService.listObjectsByCreator(userId), [userId]);

  return (
    <section className="user-area__section" aria-labelledby="meus-objetos" aria-busy={status === 'loading'}>
      <div className="user-area__toolbar">
        <h2 id="meus-objetos" className="user-area__title">
          Objetos que registrei
        </h2>
        {data && data.length > 0 && (
          <p className="user-area__count">{data.length === 1 ? '1 registro' : `${data.length} registros`}</p>
        )}
      </div>

      {status === 'loading' && !data && (
        <p className="user-area__loading" role="status">
          Carregando seus registros...
        </p>
      )}

      {status === 'error' && (
        <StatePanel
          icon={CircleAlert}
          tone="error"
          role="alert"
          headingLevel={3}
          title="Não foi possível carregar seus registros"
          description={getErrorMessage(error, 'Ocorreu um problema ao consultar os registros. Tente novamente em alguns instantes.')}
        >
          <Button variant="secondary" icon={RotateCw} iconPosition="start" onClick={() => reload()}>
            Tentar novamente
          </Button>
        </StatePanel>
      )}

      {data && data.length === 0 && (
        <StatePanel
          icon={PackagePlus}
          headingLevel={3}
          title="Você ainda não registrou objetos"
          description="Os objetos que você registrar aparecem aqui com a situação da análise."
        >
          <Button to={ROUTES.registerObject} variant="secondary" icon={PackagePlus} iconPosition="start">
            Registrar objeto encontrado
          </Button>
        </StatePanel>
      )}

      {data && data.length > 0 && (
        <ul className="my-objects">
          {data.map((object) => (
            <li key={object.id} className="my-objects__item">
              <div className="my-objects__main">
                <p className="my-objects__title">
                  {LINKABLE_STATUSES.includes(object.status) ? (
                    <Link to={getObjectDetailsPath(object.id)}>{object.name}</Link>
                  ) : (
                    object.name
                  )}
                </p>
                <p className="my-objects__meta">
                  <span className="admin-mono">{object.id}</span> · {getCategoryById(object.category)?.title ?? 'Sem categoria'} ·
                  encontrado em {formatISODate(object.foundDate)}
                </p>
                <p className="my-objects__note">{STATUS_NOTES[object.status]}</p>
              </div>
              <StatusBadge status={object.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default MyObjectsSection;
