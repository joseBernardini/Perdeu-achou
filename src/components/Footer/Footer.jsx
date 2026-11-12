import { APP_NAME } from '../../utils/constants';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>
          © {currentYear} {APP_NAME} · Sistema institucional de objetos perdidos e encontrados
        </p>
      </div>
    </footer>
  );
}

export default Footer;
