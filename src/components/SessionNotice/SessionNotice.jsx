import { Link } from 'react-router-dom';
import { CircleAlert, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import './SessionNotice.css';

function SessionNotice() {
  const { notice, dismissNotice } = useAuth();

  if (!notice) return null;

  return (
    <div className="session-notice" role="alert">
      <div className="container session-notice__inner">
        <CircleAlert size={18} strokeWidth={1.75} aria-hidden="true" />
        <p className="session-notice__text">
          {notice.message}{' '}
          {notice.type === 'session-expired' && (
            <Link to={ROUTES.login} onClick={dismissNotice}>
              Entrar novamente
            </Link>
          )}
        </p>
        <button type="button" className="session-notice__close" onClick={dismissNotice} aria-label="Fechar aviso">
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default SessionNotice;
