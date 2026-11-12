import { Link } from 'react-router-dom';
import BrandLogo from '../BrandLogo/BrandLogo';
import { APP_NAME, NAV_LINKS, ROUTES, SECTION_IDS } from '../../utils/constants';
import './Footer.css';

const usefulLinks = [
  ...NAV_LINKS,
  { id: 'objetos-encontrados', label: 'Objetos encontrados', to: ROUTES.objects },
  { id: 'registrar-objeto', label: 'Registrar objeto encontrado', to: ROUTES.registerObject },
  { id: SECTION_IDS.trust, label: 'Validação e devolução', to: `${ROUTES.home}#${SECTION_IDS.trust}` },
];

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <BrandLogo />
            <p className="footer__description">
              Plataforma institucional para registrar, consultar e recuperar objetos encontrados nas
              dependências da instituição de ensino.
            </p>
          </div>

          <nav className="footer__column" aria-labelledby="footer-links-title">
            <h2 id="footer-links-title" className="footer__heading">
              Links úteis
            </h2>
            <ul className="footer__list">
              {usefulLinks.map((link) => (
                <li key={link.id}>
                  <Link to={link.to} className="footer__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section className="footer__column" aria-labelledby="footer-operation-title">
            <h2 id="footer-operation-title" className="footer__heading">
              Funcionamento
            </h2>
            <ul className="footer__list footer__list--text">
              <li>Objetos encontrados devem ser entregues aos funcionários responsáveis.</li>
              <li>Toda solicitação de recuperação passa por validação antes da devolução.</li>
              <li>A retirada é feita mediante comprovação de propriedade.</li>
            </ul>
          </section>
        </div>

        <div className="footer__bottom">
          <p>
            © {currentYear} {APP_NAME} Todos os direitos reservados.
          </p>
          <p>Sistema de Achados e Perdidos</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
