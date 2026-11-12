import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert, Inbox, LogIn, LogOut, RotateCw, Search, UserPlus } from 'lucide-react';
import Button from '../../components/Button/Button';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatePanel from '../../components/StatePanel/StatePanel';
import { useAuth } from '../../contexts/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import recoveryRequestService from '../../services/recoveryRequestService';
import { ROUTES } from '../../utils/constants';
import RequestCard from './RequestCard';
import './UserAreaPage.css';

function UserAreaPage() {
  const { user, status: authStatus, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState({ status: 'loading', requests: [] });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const requestIdRef = useRef(0);

  useDocumentTitle('Minha área');

  const loadRequests = useCallback(async () => {
    if (!user) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState({ status: 'loading', requests: [] });

    try {
      const requests = await recoveryRequestService.listRequestsByRequester(user.id);
      if (requestIdRef.current !== requestId) return;
      setState({ status: 'success', requests });
    } catch {
      if (requestIdRef.current !== requestId) return;
      setState({ status: 'error', requests: [] });
    }
  }, [user]);

  useEffect(() => {
    loadRequests();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadRequests]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate(ROUTES.home);
  };

  if (!user) {
    const authState = { from: location.pathname, reason: 'user-area' };

    return (
      <div className="user-area">
        <PageHeader breadcrumbs={[{ label: 'Início', to: ROUTES.home }, { label: 'Minha área' }]} title="Minha área" />
        <div className="container user-area__body">
          {authStatus === 'loading' ? (
            <p className="user-area__loading" role="status">
              Verificando sua sessão...
            </p>
          ) : (
            <StatePanel
              icon={LogIn}
              title="Entre na sua conta para ver suas solicitações"
              description="A área do usuário reúne as solicitações de recuperação enviadas por você e a situação de cada uma."
            >
              <Button to={ROUTES.login} state={authState} icon={LogIn} iconPosition="start">
                Entrar
              </Button>
              <Button to={ROUTES.signUp} state={authState} variant="secondary" icon={UserPlus} iconPosition="start">
                Criar conta
              </Button>
            </StatePanel>
          )}
        </div>
      </div>
    );
  }

  const { status, requests } = state;

  return (
    <div className="user-area">
      <PageHeader
        breadcrumbs={[{ label: 'Início', to: ROUTES.home }, { label: 'Minha área' }]}
        title="Minha área"
        lead={`Olá, ${user.name}. Acompanhe aqui as solicitações de recuperação enviadas por você.`}
      >
        <Button variant="ghost" icon={LogOut} iconPosition="start" onClick={handleSignOut} loading={isSigningOut} loadingText="Saindo">
          Sair
        </Button>
      </PageHeader>

      <section className="container user-area__body" aria-labelledby="minhas-solicitacoes" aria-busy={status === 'loading'}>
        <div className="user-area__toolbar">
          <h2 id="minhas-solicitacoes" className="user-area__title">
            Minhas solicitações
          </h2>
          {status === 'success' && requests.length > 0 && (
            <p className="user-area__count">
              {requests.length === 1 ? '1 solicitação' : `${requests.length} solicitações`}
            </p>
          )}
        </div>

        {status === 'loading' && (
          <p className="user-area__loading" role="status">
            Carregando suas solicitações...
          </p>
        )}

        {status === 'error' && (
          <StatePanel
            icon={CircleAlert}
            tone="error"
            role="alert"
            headingLevel={3}
            title="Não foi possível carregar suas solicitações"
            description="Ocorreu um problema ao consultar os registros. Tente novamente em alguns instantes."
          >
            <Button variant="secondary" icon={RotateCw} iconPosition="start" onClick={loadRequests}>
              Tentar novamente
            </Button>
          </StatePanel>
        )}

        {status === 'success' && requests.length === 0 && (
          <StatePanel
            icon={Inbox}
            headingLevel={3}
            title="Você ainda não enviou solicitações"
            description="Ao reconhecer um objeto na consulta, abra os detalhes e use a opção Solicitar recuperação. A solicitação aparecerá aqui."
          >
            <Button to={ROUTES.objects} icon={Search} iconPosition="start">
              Consultar objetos
            </Button>
          </StatePanel>
        )}

        {status === 'success' && requests.length > 0 && (
          <ul className="user-area__list">
            {requests.map((request) => (
              <li key={request.id}>
                <RequestCard request={request} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default UserAreaPage;
