import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  FlaskConical,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  X,
} from 'lucide-react';
import useScrollToHash from '../../hooks/useScrollToHash';
import staffSessionService from '../../services/staffSessionService';
import { APP_NAME, ROUTES, USER_ROLE_LABELS } from '../../utils/constants';
import AdminEntry from './AdminEntry';
import './Admin.css';

const NAV_ITEMS = [
  { to: ROUTES.admin, label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: ROUTES.adminObjects, label: 'Objetos', icon: Package },
  { to: ROUTES.adminRequests, label: 'Solicitações', icon: ClipboardList },
  { to: ROUTES.adminHistory, label: 'Histórico', icon: History },
  { to: ROUTES.adminRoles, label: 'Perfis e permissões', icon: ShieldCheck },
];

function AdminLayout() {
  const location = useLocation();
  const [session, setSession] = useState(() => staffSessionService.getSession());
  const [isNavOpen, setIsNavOpen] = useState(false);

  useScrollToHash();

  useEffect(() => {
    setIsNavOpen(false);
  }, [location.key]);

  useEffect(() => {
    if (!isNavOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsNavOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isNavOpen]);

  const startDemo = useCallback((options) => setSession(staffSessionService.startSession(options)), []);

  const endDemo = useCallback(() => {
    staffSessionService.endSession();
    setSession(null);
  }, []);

  if (!session) {
    return <AdminEntry onStart={startDemo} />;
  }

  return (
    <div className={`admin${isNavOpen ? ' admin--nav-open' : ''}`}>
      <a href="#conteudo-painel" className="skip-link">
        Pular para o conteúdo
      </a>

      <header className="admin-header">
        <div className="admin-header__brand">
          <button
            type="button"
            className="admin-header__toggle"
            aria-expanded={isNavOpen}
            aria-controls="admin-navegacao"
            aria-label={isNavOpen ? 'Fechar navegação do painel' : 'Abrir navegação do painel'}
            onClick={() => setIsNavOpen((open) => !open)}
          >
            {isNavOpen ? <X size={20} strokeWidth={1.75} aria-hidden="true" /> : <Menu size={20} strokeWidth={1.75} aria-hidden="true" />}
          </button>
          <Link to={ROUTES.admin} className="admin-header__title">
            <span className="admin-header__app">{APP_NAME}</span>
            <span className="admin-header__area">Painel administrativo</span>
          </Link>
          <span className="admin-header__badge">
            <FlaskConical size={14} strokeWidth={2} aria-hidden="true" />
            Demonstração
          </span>
        </div>

        <div className="admin-header__session">
          <div className="admin-header__actor">
            <span className="admin-header__actor-name">{session.displayName}</span>
            <span className="admin-header__actor-role">
              {USER_ROLE_LABELS[session.role]} · <span className="admin-header__mono">{session.actorId}</span>
            </span>
          </div>
          <button type="button" className="admin-header__exit" onClick={endDemo}>
            <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>Sair da demonstração</span>
          </button>
        </div>
      </header>

      <div className="admin__body">
        {isNavOpen && <div className="admin__backdrop" onClick={() => setIsNavOpen(false)} aria-hidden="true" />}
        <nav id="admin-navegacao" className="admin-nav" aria-label="Navegação do painel">
          <ul className="admin-nav__list">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="admin-nav__link">
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
          <Link to={ROUTES.home} className="admin-nav__back">
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            Voltar ao site
          </Link>
        </nav>

        <main id="conteudo-painel" className="admin__main" tabIndex={-1}>
          <div className="admin-demo-banner" role="note">
            <FlaskConical size={18} strokeWidth={1.75} aria-hidden="true" />
            <p>
              <strong>Ambiente de demonstração.</strong> Os dados ficam salvos apenas neste navegador e o perfil escolhido
              na entrada não é um mecanismo de segurança. A autorização real dos funcionários será implementada
              posteriormente.
            </p>
          </div>
          <Outlet context={{ session, actor: session.actor }} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
