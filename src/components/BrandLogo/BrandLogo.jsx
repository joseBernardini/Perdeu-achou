import { Link } from 'react-router-dom';
import { APP_NAME, APP_SUBTITLE, ROUTES } from '../../utils/constants';
import './BrandLogo.css';

function BrandLogo({ showSubtitle = true, onClick }) {
  return (
    <Link to={ROUTES.home} className="brand-logo" aria-label={`${APP_NAME} ${APP_SUBTITLE}, página inicial`} onClick={onClick}>
      <span className="brand-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="14.6" y1="14.6" x2="19.5" y2="19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="brand-logo__text">
        <span className="brand-logo__name">{APP_NAME}</span>
        {showSubtitle && <span className="brand-logo__subtitle">{APP_SUBTITLE}</span>}
      </span>
    </Link>
  );
}

export default BrandLogo;
