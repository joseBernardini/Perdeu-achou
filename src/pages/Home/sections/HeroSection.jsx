import { ArrowRight, Search, Tag } from 'lucide-react';
import Button from '../../../components/Button/Button';
import { APP_NAME, APP_SUBTITLE, ROUTES, SECTION_IDS } from '../../../utils/constants';
import './HeroSection.css';

const recordFields = ['Categoria', 'Descrição', 'Local onde foi encontrado', 'Data do registro'];
const recordStages = ['Registrado', 'Solicitado', 'Devolvido'];

function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <div className="hero__content">
          <p className="hero__eyebrow">
            <span>{APP_NAME}</span>
            <span className="hero__eyebrow-divider" aria-hidden="true" />
            <span>{APP_SUBTITLE}</span>
          </p>

          <h1 id="hero-title" className="hero__title">
            Encontrou ou perdeu alguma coisa? <span className="hero__title-accent">A gente ajuda você a encontrar.</span>
          </h1>

          <p className="hero__description">
            Os objetos encontrados na instituição são registrados pelos funcionários responsáveis e ficam
            disponíveis para consulta. Quem reconhecer um item solicita a recuperação, e a devolução
            acontece após a validação.
          </p>

          <div className="hero__actions">
            <Button variant="primary" size="lg" icon={Search} iconPosition="start" unavailable>
              Consultar objetos
            </Button>
            <Button variant="secondary" size="lg" icon={ArrowRight} to={`${ROUTES.home}#${SECTION_IDS.howItWorks}`}>
              Entender o funcionamento
            </Button>
          </div>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="record-card">
            <div className="record-card__header">
              <span className="record-card__hole" />
              <span className="record-card__label">
                <Tag size={16} strokeWidth={1.75} />
                Ficha de registro
              </span>
              <span className="record-card__code">Nº ____</span>
            </div>

            <dl className="record-card__fields">
              {recordFields.map((field) => (
                <div key={field} className="record-card__field">
                  <dt>{field}</dt>
                  <dd />
                </div>
              ))}
            </dl>

            <ol className="record-card__stages">
              {recordStages.map((stage, index) => (
                <li key={stage} className="record-card__stage">
                  <span className="record-card__stage-index">{String(index + 1).padStart(2, '0')}</span>
                  {stage}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
