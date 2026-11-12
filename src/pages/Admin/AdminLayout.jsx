import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, History, LayoutDashboard, LogOut, Menu, Package, ShieldCheck, X } from 'lucide-react';
import AuthGate from '../../components/AuthGate/AuthGate';
import SessionNotice from '../../components/SessionNotice/SessionNotice';
import { useAuth } from '../../contexts/AuthContext';
import useScrollToHash from '../../hooks/useScrollToHash';
import { APP_NAME, ROUTES, USER_ROLE_LABELS } from '../../utils/constants';
import './Admin.css';

const NAV_ITEMS = [
  { to: ROUTES.admin, label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: ROUTES.adminObjects, label: 'Objetos', icon: Package },
  { to: ROUTES.adminRequests, label: 'Solicitações', icon: ClipboardList },
  { to: ROUTES.adminHistory, label: 'Histórico', icon: History },
  { to: ROUTES.adminRoles, label: 'Perfis e permissões', icon: ShieldCheck },
];

function AdminGateScreen() {
  return (
    <div className="admin-entry">
      <main className="admin-entry__card" aria-labelledby="painel-acesso-titulo">
        <p className="admin-entry__app">{APP_NAME}</p>
        <h1 id="painel-acesso-titulo" className="admin-entry__title">
          Painel administrativo
        </h1>
        <p className="admin-entry__lead">
          Área dos administradores responsáveis pela análise dos objetos encontrados e das solicitações de recuperação.
        </p>
        <AuthGate
          requireAdmin
          title="Entre com uma conta de administrador"
          description="O acesso ao painel exige uma conta com o papel de administrador."
        />
        <Link to={ROUTES.home} className="admin-entry__back">
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          Voltar ao site
        </Link>
      </main>
    </div>
  );
}

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const outletContext = useMemo(
    () => (user ? { actor: { id: user.id, role: user.role }, session: { role: user.role, displayName: user.name } } : null),
    [user]
  );

  if (!user || !isAdmin) {
    return <AdminGateScreen />;
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate(ROUTES.home);
    } catch {
      setIsSigningOut(false);
    }
  };

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
        </div>

        <div className="admin-header__session">
          <div className="admin-header__actor">
            <span className="admin-header__actor-name">{user.name}</span>
            <span className="admin-header__actor-role">{USER_ROLE_LABELS[user.role]}</span>
          </div>
          <button type="button" className="admin-header__exit" onClick={handleSignOut} disabled={isSigningOut}>
            <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>{isSigningOut ? 'Saindo' : 'Sair'}</span>
          </button>
        </div>
      </header>

      <SessionNotice />

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
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
