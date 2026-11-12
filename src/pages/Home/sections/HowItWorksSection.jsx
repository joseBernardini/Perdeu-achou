import howItWorks from '../../../data/howItWorks';
import { SECTION_IDS } from '../../../utils/constants';
import './HowItWorksSection.css';

function HowItWorksSection() {
  return (
    <section id={SECTION_IDS.howItWorks} className="section how-it-works" aria-labelledby="how-it-works-title" tabIndex={-1}>
      <div className="container">
        <header className="how-it-works__header">
          <span className="section__eyebrow">Como funciona</span>
          <h2 id="how-it-works-title" className="section__title">
            Do objeto encontrado à devolução
          </h2>
          <p className="section__lead">
            O processo é dividido em cinco etapas, com a participação de quem encontra, de quem perdeu e
            dos funcionários responsáveis pela guarda dos objetos.
          </p>
        </header>

        <ol className="steps">
          {howItWorks.map((step, index) => {
            const Icon = step.icon;

            return (
              <li key={step.id} className="steps__item">
                <div className="steps__marker">
                  <span className="steps__icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.6} />
                  </span>
                </div>
                <div className="steps__body">
                  <span className="steps__number">Etapa {index + 1}</span>
                  <h3 className="steps__title">{step.title}</h3>
                  <p className="steps__description">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorksSection;
