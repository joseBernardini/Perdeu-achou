import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, Menu, Search, X } from 'lucide-react';
import BrandLogo from '../BrandLogo/BrandLogo';
import Button from '../Button/Button';
import { NAV_LINKS, ROUTES } from '../../utils/constants';
import './Header.css';

function Header() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.key]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const isActive = (link) => location.pathname === ROUTES.home && location.hash === link.hash;

  return (
    <header className={`header${isMenuOpen ? ' header--menu-open' : ''}`}>
      <div className="container header__inner">
        <BrandLogo />

        <button
          type="button"
          className="header__toggle"
          aria-expanded={isMenuOpen}
          aria-controls="header-menu"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X size={22} strokeWidth={1.75} aria-hidden="true" /> : <Menu size={22} strokeWidth={1.75} aria-hidden="true" />}
        </button>

        <div id="header-menu" className="header__menu">
          <nav className="header__nav" aria-label="Navegação principal">
            <ul className="header__nav-list">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <Link
                    to={link.to}
                    className="header__nav-link"
                    aria-current={isActive(link) ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header__actions">
            <Button variant="secondary" size="sm" icon={Search} iconPosition="start" unavailable>
              Consultar objetos
            </Button>
            <Button variant="primary" size="sm" icon={LogIn} iconPosition="start" unavailable>
              Entrar
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
