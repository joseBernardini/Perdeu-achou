import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert, Info, PackagePlus, RotateCw, SearchX } from 'lucide-react';
import Button from '../../components/Button/Button';
import ObjectCard from '../../components/ObjectCard/ObjectCard';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatePanel from '../../components/StatePanel/StatePanel';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import objectService from '../../services/objectService';
import { OBJECT_STATUS, ROUTES } from '../../utils/constants';
import './ObjectsPage.css';

const SKELETON_ITEMS = 6;

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

function formatAvailableCount(count) {
  return `${count} ${pluralize(count, 'objeto disponível', 'objetos disponíveis')} para consulta`;
}

function buildUnavailableNotes(counts) {
  const notes = [];
  const inReturn = counts[OBJECT_STATUS.inReturn] ?? 0;
  const pending = counts[OBJECT_STATUS.pendingApproval] ?? 0;

  if (inReturn > 0) {
    notes.push(
      `${inReturn} ${pluralize(inReturn, 'objeto está', 'objetos estão')} em processo de devolução e ${pluralize(
        inReturn,
        'não aparece',
        'não aparecem'
      )} na lista.`
    );
  }

  if (pending > 0) {
    notes.push(
      `${pending} ${pluralize(pending, 'registro aguarda', 'registros aguardam')} a análise de um funcionário responsável e ${pluralize(
        pending,
        'será exibido',
        'serão exibidos'
      )} após a aprovação.`
    );
  }

  return notes;
}

function ObjectsPage() {
  const [state, setState] = useState({ status: 'loading', objects: [], counts: {} });
  const requestIdRef = useRef(0);

  useDocumentTitle('Objetos encontrados');

  const loadObjects = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((current) => ({ ...current, status: 'loading' }));

    try {
      const [objects, counts] = await Promise.all([
        objectService.listObjects({ status: OBJECT_STATUS.available }),
        objectService.countObjectsByStatus(),
      ]);

      if (requestIdRef.current !== requestId) return;
      setState({ status: 'success', objects, counts });
    } catch {
      if (requestIdRef.current !== requestId) return;
      setState({ status: 'error', objects: [], counts: {} });
    }
  }, []);

  useEffect(() => {
    loadObjects();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadObjects]);

  const { status, objects, counts } = state;
  const unavailableNotes = status === 'success' ? buildUnavailableNotes(counts) : [];

  return (
    <div className="objects-page">
      <PageHeader
        breadcrumbs={[{ label: 'Início', to: ROUTES.home }, { label: 'Objetos encontrados' }]}
        title="Objetos encontrados"
        lead="Consulte os objetos encontrados na instituição que já foram conferidos por um funcionário responsável. Se reconhecer algum item, acesse os detalhes e anote o código do registro."
      >
        <Button to={ROUTES.registerObject} variant="secondary" icon={PackagePlus} iconPosition="start">
          Registrar objeto encontrado
        </Button>
      </PageHeader>

      <section className="container objects-page__body" aria-labelledby="objetos-resultado" aria-busy={status === 'loading'}>
        <div className="objects-page__summary">
          <h2 id="objetos-resultado" className="objects-page__count" aria-live="polite">
            {status === 'loading' && 'Carregando objetos'}
            {status === 'success' && formatAvailableCount(objects.length)}
            {status === 'error' && 'Consulta indisponível'}
          </h2>

          {unavailableNotes.length > 0 && (
            <div className="objects-page__notice">
              <Info size={18} strokeWidth={1.75} aria-hidden="true" />
              <ul>
                {unavailableNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {status === 'loading' && (
          <ul className="objects-grid" aria-hidden="true">
            {Array.from({ length: SKELETON_ITEMS }, (_, index) => (
              <li key={index} className="object-skeleton">
                <span className="object-skeleton__icon" />
                <span className="object-skeleton__line object-skeleton__line--short" />
                <span className="object-skeleton__line object-skeleton__line--title" />
                <span className="object-skeleton__line" />
                <span className="object-skeleton__line" />
                <span className="object-skeleton__line object-skeleton__line--medium" />
              </li>
            ))}
          </ul>
        )}

        {status === 'error' && (
          <StatePanel
            icon={CircleAlert}
            tone="error"
            role="alert"
            headingLevel={3}
            title="Não foi possível carregar os objetos"
            description="Ocorreu um problema ao consultar os registros. Verifique sua conexão e tente novamente em alguns instantes."
          >
            <Button variant="secondary" icon={RotateCw} iconPosition="start" onClick={loadObjects}>
              Tentar novamente
            </Button>
          </StatePanel>
        )}

        {status === 'success' && objects.length === 0 && (
          <StatePanel
            icon={SearchX}
            headingLevel={3}
            title="Nenhum objeto disponível no momento"
            description="Ainda não há objetos aprovados para consulta. Os novos registros aparecem aqui assim que forem conferidos por um funcionário responsável."
          >
            <Button to={ROUTES.registerObject} variant="secondary" icon={PackagePlus} iconPosition="start">
              Registrar objeto encontrado
            </Button>
          </StatePanel>
        )}

        {status === 'success' && objects.length > 0 && (
          <ul className="objects-grid">
            {objects.map((object) => (
              <li key={object.id}>
                <ObjectCard object={object} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default ObjectsPage;
