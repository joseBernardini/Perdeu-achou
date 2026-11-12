import platformPillars from '../../../data/platformPillars';
import { SECTION_IDS } from '../../../utils/constants';
import './PresentationSection.css';

function PresentationSection() {
  return (
    <section id={SECTION_IDS.presentation} className="section presentation" aria-labelledby="presentation-title" tabIndex={-1}>
      <div className="container presentation__inner">
        <header className="presentation__header">
          <span className="section__eyebrow">A plataforma</span>
          <h2 id="presentation-title" className="section__title">
            Um único lugar para os objetos encontrados na instituição
          </h2>
          <p className="section__lead">
            Sem registros centralizados, objetos perdidos ficam espalhados entre secretarias, salas e
            portarias. A plataforma organiza esse processo do momento em que o item é entregue até a
            devolução ao proprietário.
          </p>
        </header>

        <ol className="presentation__list">
          {platformPillars.map((pillar, index) => (
            <li key={pillar.id} className="presentation__item">
              <span className="presentation__index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="presentation__item-title">{pillar.title}</h3>
                <p className="presentation__item-description">{pillar.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default PresentationSection;
