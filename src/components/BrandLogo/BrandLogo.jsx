import { APP_NAME } from '../../utils/constants';
import './BrandLogo.css';

function BrandLogo() {
  return (
    <a href="/" className="brand-logo" aria-label={`${APP_NAME} — página inicial`}>
      <span className="brand-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <line
            x1="14.6"
            y1="14.6"
            x2="19.5"
            y2="19.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="brand-logo__name">{APP_NAME}</span>
    </a>
  );
}

export default BrandLogo;
