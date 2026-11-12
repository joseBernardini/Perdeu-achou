import { useLocation } from 'react-router-dom';
import { LogIn, ShieldAlert, UserPlus } from 'lucide-react';
import Button from '../Button/Button';
import StatePanel from '../StatePanel/StatePanel';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import './AuthGate.css';

function AuthGate({ children, title, description, requireAdmin = false }) {
  const { user, status, isAdmin } = useAuth();
  const location = useLocation();

  if (status === 'loading' && !user) {
    return (
      <p className="auth-gate__loading" role="status">
        Verificando sua sessão...
      </p>
    );
  }

  if (!user) {
    const authState = { from: `${location.pathname}${location.search}`, reason: 'auth-required' };

    return (
      <StatePanel icon={LogIn} title={title} description={description}>
        <Button to={ROUTES.login} state={authState} icon={LogIn} iconPosition="start">
          Entrar
        </Button>
        <Button to={ROUTES.signUp} state={authState} variant="secondary" icon={UserPlus} iconPosition="start">
          Criar conta
        </Button>
      </StatePanel>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <StatePanel
        icon={ShieldAlert}
        title="Acesso restrito a administradores"
        description="Sua conta não tem permissão para acessar esta área. A promoção de uma conta a administrador é feita manualmente por um responsável autorizado."
      >
        <Button to={ROUTES.home} variant="secondary">
          Voltar ao site
        </Button>
      </StatePanel>
    );
  }

  return children;
}

export default AuthGate;
