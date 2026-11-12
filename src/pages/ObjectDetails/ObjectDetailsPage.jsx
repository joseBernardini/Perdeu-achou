import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, CircleAlert, Package, RotateCw, SearchX, ShieldCheck } from 'lucide-react';
import Button from '../../components/Button/Button';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatePanel from '../../components/StatePanel/StatePanel';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { getCategoryById } from '../../data/categories';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import objectService from '../../services/objectService';
import { ObjectNotFoundError } from '../../services/serviceErrors';
import { OBJECT_STATUS, PUBLIC_OBJECT_STATUSES, ROUTES } from '../../utils/constants';
import { formatDateTime, formatISODate } from '../../utils/date';
import RecoveryActionPanel from './RecoveryActionPanel';
import './ObjectDetailsPage.css';

const CLOSED_STATUSES = [OBJECT_STATUS.inReturn, OBJECT_STATUS.returned];

function resolveViewState(object) {
  if (PUBLIC_OBJECT_STATUSES.includes(object.status)) return 'available';
  if (CLOSED_STATUSES.includes(object.status)) return 'closed';
  return 'not-found';
}

function ObjectDetailsPage() {
  const { objectId } = useParams();
  const [state, setState] = useState({ status: 'loading', object: null });
  const requestIdRef = useRef(0);

  const loadObject = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState({ status: 'loading', object: null });

    try {
      const object = await objectService.getObjectById(objectId);
      if (requestIdRef.current !== requestId) return;
      setState({ status: resolveViewState(object), object });
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setState({ status: error instanceof ObjectNotFoundError ? 'not-found' : 'error', object: null });
    }
  }, [objectId]);

  useEffect(() => {
    loadObject();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadObject]);

  const { status, object } = state;
  const isAvailable = status === 'available';
  const category = isAvailable ? getCategoryById(object.category) : null;
  const CategoryIcon = category?.icon ?? Package;
  const pageTitle = isAvailable ? object.name : 'Detalhes do objeto';

  useDocumentTitle(pageTitle);

  return (
    <div className="object-details-page">
      <PageHeader
        breadcrumbs={[
          { label: 'Início', to: ROUTES.home },
          { label: 'Objetos encontrados', to: ROUTES.objects },
          { label: pageTitle },
        ]}
        title={pageTitle}
      >
        <Button to={ROUTES.objects} variant="ghost" icon={ArrowLeft} iconPosition="start">
          Voltar para a listagem
        </Button>
      </PageHeader>

      <div className="container object-details-page__body" aria-busy={status === 'loading'}>
        {status === 'loading' && (
          <p className="object-details-page__loading" role="status">
            Carregando informações do objeto...
          </p>
        )}

        {status === 'error' && (
          <StatePanel
            icon={CircleAlert}
            tone="error"
            role="alert"
            title="Não foi possível carregar o objeto"
            description="Ocorreu um problema ao consultar este registro. Tente novamente em alguns instantes."
          >
            <Button variant="secondary" icon={RotateCw} iconPosition="start" onClick={loadObject}>
              Tentar novamente
            </Button>
          </StatePanel>
        )}

        {status === 'not-found' && (
          <StatePanel
            icon={SearchX}
            title="Objeto não encontrado"
            description="Não há um objeto disponível para consulta com o código informado. Confira o código ou volte para a listagem de objetos encontrados."
          >
            <Button to={ROUTES.objects} variant="secondary" icon={ArrowLeft} iconPosition="start">
              Ver objetos encontrados
            </Button>
          </StatePanel>
        )}

        {status === 'closed' && (
          <StatePanel
            icon={ShieldCheck}
            title="Este objeto não está mais disponível para consulta"
            description={`O registro ${object.id} já está em atendimento pela instituição.`}
          >
            <StatusBadge status={object.status} />
            <Button to={ROUTES.objects} variant="secondary" icon={ArrowLeft} iconPosition="start">
              Ver objetos encontrados
            </Button>
          </StatePanel>
        )}

        {isAvailable && (
          <div className="object-details">
            <article className="object-details__main" aria-labelledby="detalhes-descricao-titulo">
              <div className="object-details__identity">
                <span className="object-details__icon" aria-hidden="true">
                  <CategoryIcon size={22} strokeWidth={1.6} />
                </span>
                <div>
                  <span className="object-details__category">{category?.title ?? 'Sem categoria'}</span>
                  <span className="object-details__code">{object.id}</span>
                </div>
                <StatusBadge status={object.status} className="object-details__status" />
              </div>

              <section className="object-details__section">
                <h2 id="detalhes-descricao-titulo" className="object-details__section-title">
                  Descrição
                </h2>
                <p className="object-details__description">{object.description}</p>
              </section>

              <section className="object-details__section" aria-labelledby="detalhes-encontro-titulo">
                <h2 id="detalhes-encontro-titulo" className="object-details__section-title">
                  Informações do registro
                </h2>
                <dl className="object-details__list">
                  <div>
                    <dt>Local onde foi encontrado</dt>
                    <dd>{object.location}</dd>
                  </div>
                  <div>
                    <dt>Data em que foi encontrado</dt>
                    <dd>
                      <time dateTime={object.foundDate}>{formatISODate(object.foundDate)}</time>
                    </dd>
                  </div>
                  <div>
                    <dt>Registrado em</dt>
                    <dd>
                      <time dateTime={object.createdAt}>{formatDateTime(object.createdAt)}</time>
                    </dd>
                  </div>
                  <div>
                    <dt>Código</dt>
                    <dd className="object-details__mono">{object.id}</dd>
                  </div>
                </dl>
              </section>

              {object.notes && (
                <section className="object-details__section" aria-labelledby="detalhes-observacoes-titulo">
                  <h2 id="detalhes-observacoes-titulo" className="object-details__section-title">
                    Observações
                  </h2>
                  <p className="object-details__description">{object.notes}</p>
                </section>
              )}
            </article>

            <RecoveryActionPanel object={object} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ObjectDetailsPage;
