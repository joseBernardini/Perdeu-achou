import InfoCard from '../../components/InfoCard/InfoCard';
import platformPillars from '../../data/platformPillars';
import { APP_NAME } from '../../utils/constants';
import './HomePage.css';

function HomePage() {
  return (
    <div className="container home">
      <section className="home__hero" aria-labelledby="home-title">
        <span className="home__eyebrow">Plataforma institucional</span>
        <h1 id="home-title" className="home__title">
          {APP_NAME}
        </h1>
        <p className="home__subtitle">
          Um ponto central e confiável para consultar, registrar e recuperar objetos perdidos
          dentro da instituição de ensino.
        </p>
      </section>

      <section aria-labelledby="pillars-title">
        <h2 id="pillars-title" className="visually-hidden">
          Como a plataforma funciona
        </h2>
        <ul className="home__pillars">
          {platformPillars.map((pillar) => (
            <li key={pillar.id}>
              <InfoCard title={pillar.title} description={pillar.description} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default HomePage;
