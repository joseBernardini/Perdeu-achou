import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, CircleAlert, ClipboardList, LogIn, RotateCw, SearchX, ShieldCheck, UserPlus } from 'lucide-react';
import Button from '../../components/Button/Button';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatePanel from '../../components/StatePanel/StatePanel';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import objectService from '../../services/objectService';
import recoveryRequestService from '../../services/recoveryRequestService';
import {
  DuplicateRequestError,
  NotAuthenticatedError,
  ObjectNotFoundError,
  ObjectUnavailableError,
} from '../../services/serviceErrors';
import { OBJECT_STATUS, ROUTES, getObjectDetailsPath } from '../../utils/constants';
import { formatDateTime } from '../../utils/date';
import ObjectSummary from './ObjectSummary';
import RecoveryRequestForm from './RecoveryRequestForm';
import RecoveryRequestSuccess from './RecoveryRequestSuccess';
import { getErrorMessage } from '../../utils/errorMessages';
import './RecoveryRequestPage.css';

const HIDDEN_STATUSES = [OBJECT_STATUS.pendingApproval, OBJECT_STATUS.rejected];

function RecoveryRequestPage() {
  const { objectId } = useParams();
  const location = useLocation();
  const { user, status: authStatus } = useAuth();
  const [view, setView] = useState({ status: 'loading', object: null, request: null });
  const requestIdRef = useRef(0);

  useDocumentTitle('Solicitar recuperação');

  const load = useCallback(async () => {
    if (!user) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setView({ status: 'loading', object: null, request: null });

    try {
      const object = await objectService.getObjectById(objectId);
      if (requestIdRef.current !== requestId) return;

      if (HIDDEN_STATUSES.includes(object.status)) {
        setView({ status: 'not-found', object: null, request: null });
        return;
      }

      if (object.status !== OBJECT_STATUS.available) {
        setView({ status: 'unavailable', object, request: null });
        return;
      }

      const pending = await recoveryRequestService.findPendingRequest(object.id, user.id);
      if (requestIdRef.current !== requestId) return;

      setView(pending ? { status: 'duplicate', object, request: pending } : { status: 'form', object, request: null });
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setView({ status: error instanceof ObjectNotFoundError ? 'not-found' : 'error', object: null, request: null, error });
    }
  }, [objectId, user]);

  useEffect(() => {
    load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        const request = await recoveryRequestService.createRequest(
          { ...values, objectId: view.object.id },
          { requesterId: user?.id }
        );
        setView((current) => ({ ...current, status: 'success', request }));
        window.scrollTo({ top: 0 });
      } catch (error) {
        if (error instanceof DuplicateRequestError) {
          setView((current) => ({ ...current, status: 'duplicate', request: error.existingRequest }));
          return;
        }
        if (error instanceof ObjectUnavailableError) {
          setView((current) => ({ ...current, status: 'unavailable' }));
          return;
        }
        if (error instanceof ObjectNotFoundError) {
          setView({ status: 'not-found', object: null, request: null });
          return;
        }
        if (error instanceof NotAuthenticatedError) {
          setView((current) => ({ ...current, status: 'unauthenticated' }));
          return;
        }
        throw error;
      }
    },
    [user, view.object]
  );

  const { status, object, request } = view;
  const detailsPath = getObjectDetailsPath(objectId);
  const authState = { from: location.pathname, reason: 'auth-required' };
  const isUnauthenticated = authStatus !== 'loading' && (!user || status === 'unauthenticated');

  let content = null;

  if (authStatus === 'loading' && !user) {
    content = (
      <p className="recovery-page__loading" role="status">
        Verificando sua sessão...
      </p>
    );
  } else if (isUnauthenticated) {
    content = (
      <StatePanel
        icon={LogIn}
        title="Entre na sua conta para continuar"
        description="A solicitação de recuperação fica vinculada à sua conta, para que você possa acompanhar o andamento da análise."
      >
        <Button to={ROUTES.login} state={authState} icon={LogIn} iconPosition="start">
          Entrar
        </Button>
        <Button to={ROUTES.signUp} state={authState} variant="secondary" icon={UserPlus} iconPosition="start">
          Criar conta
        </Button>
      </StatePanel>
    );
  } else if (status === 'loading') {
    content = (
      <p className="recovery-page__loading" role="status">
        Carregando informações do objeto...
      </p>
    );
  } else if (status === 'error') {
    content = (
      <StatePanel
        icon={CircleAlert}
        tone="error"
        role="alert"
        title="Não foi possível carregar o objeto"
        description={getErrorMessage(view.error, 'Ocorreu um problema ao consultar este registro. Tente novamente em alguns instantes.')}
      >
        <Button variant="secondary" icon={RotateCw} iconPosition="start" onClick={load}>
          Tentar novamente
        </Button>
      </StatePanel>
    );
  } else if (status === 'not-found') {
    content = (
      <StatePanel
        icon={SearchX}
        title="Objeto não encontrado"
        description="Não há um objeto disponível para consulta com o código informado. Confira o código ou volte para a listagem."
      >
        <Button to={ROUTES.objects} variant="secondary" icon={ArrowLeft} iconPosition="start">
          Ver objetos encontrados
        </Button>
      </StatePanel>
    );
  } else if (status === 'unavailable') {
    content = (
      <StatePanel
        icon={ShieldCheck}
        title="Objeto indisponível para solicitações"
        description={`O objeto ${object.id} já está em atendimento pela instituição e não recebe novas solicitações de recuperação.`}
      >
        <StatusBadge status={object.status} />
        <Button to={ROUTES.objects} variant="secondary" icon={ArrowLeft} iconPosition="start">
          Ver objetos encontrados
        </Button>
      </StatePanel>
    );
  } else if (status === 'duplicate') {
    content = (
      <StatePanel
        icon={ClipboardList}
        title="Você já solicitou a recuperação deste objeto"
        description={`Sua solicitação ${request.id}, enviada em ${formatDateTime(
          request.createdAt
        )}, ainda está pendente de análise. Não é necessário enviar outra.`}
      >
        <Button to={ROUTES.userArea} icon={ClipboardList} iconPosition="start">
          Acompanhar minhas solicitações
        </Button>
        <Button to={detailsPath} variant="secondary" icon={ArrowLeft} iconPosition="start">
          Voltar ao objeto
        </Button>
      </StatePanel>
    );
  } else if (status === 'success') {
    content = <RecoveryRequestSuccess request={request} object={object} />;
  } else if (status === 'form') {
    content = (
      <div className="recovery-page__layout">
        <div className="recovery-page__main">
          <RecoveryRequestForm object={object} onSubmit={handleSubmit} cancelTo={detailsPath} />
        </div>
        <aside className="recovery-page__aside" aria-labelledby="objeto-solicitado-titulo">
          <ObjectSummary object={object} headingId="objeto-solicitado-titulo" />
        </aside>
      </div>
    );
  }

  return (
    <div className="recovery-page">
      <PageHeader
        breadcrumbs={[
          { label: 'Início', to: ROUTES.home },
          { label: 'Objetos encontrados', to: ROUTES.objects },
          { label: object?.name ?? 'Objeto', to: detailsPath },
          { label: 'Solicitar recuperação' },
        ]}
        title="Solicitar recuperação"
        lead="Explique por que você acredita ser o proprietário do objeto. Um funcionário responsável vai analisar as informações antes de organizar a devolução."
      />
      <div className="container recovery-page__body">{content}</div>
    </div>
  );
}

export default RecoveryRequestPage;
