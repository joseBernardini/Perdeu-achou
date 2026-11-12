import { Check, ShieldCheck } from 'lucide-react';
import trustPoints from '../../../data/trustPoints';
import { SECTION_IDS } from '../../../utils/constants';
import './TrustSection.css';

function TrustSection() {
  return (
    <section id={SECTION_IDS.trust} className="section section--surface trust" aria-labelledby="trust-title" tabIndex={-1}>
      <div className="container trust__inner">
        <header className="trust__header">
          <span className="trust__badge" aria-hidden="true">
            <ShieldCheck size={26} strokeWidth={1.6} />
          </span>
          <span className="section__eyebrow">Validação e devolução</span>
          <h2 id="trust-title" className="section__title">
            Cada devolução passa pela conferência da instituição
          </h2>
          <p className="section__lead">
            Um objeto só volta para as mãos certas quando há critério. Por isso, os funcionários
            responsáveis participam de todo o processo: recebem os itens, mantêm os registros
            atualizados e validam cada solicitação antes da entrega.
          </p>
        </header>

        <ul className="trust__list">
          {trustPoints.map((point) => (
            <li key={point.id} className="trust__item">
              <span className="trust__check" aria-hidden="true">
                <Check size={16} strokeWidth={2.25} />
              </span>
              <div>
                <h3 className="trust__item-title">{point.title}</h3>
                <p className="trust__item-description">{point.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default TrustSection;
