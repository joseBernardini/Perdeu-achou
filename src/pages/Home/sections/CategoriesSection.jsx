import InfoCard from '../../../components/InfoCard/InfoCard';
import categories from '../../../data/categories';
import { SECTION_IDS } from '../../../utils/constants';
import './CategoriesSection.css';

function CategoriesSection() {
  return (
    <section id={SECTION_IDS.categories} className="section section--surface categories" aria-labelledby="categories-title" tabIndex={-1}>
      <div className="container">
        <header className="categories__header">
          <div>
            <span className="section__eyebrow">Categorias</span>
            <h2 id="categories-title" className="section__title">
              Objetos organizados por categoria
            </h2>
          </div>
          <p className="section__lead categories__lead">
            Cada registro é classificado em uma categoria para facilitar a consulta e reduzir o tempo
            até a identificação do objeto.
          </p>
        </header>

        <ul className="categories__grid">
          {categories.map((category) => (
            <li key={category.id}>
              <InfoCard title={category.title} description={category.description} icon={category.icon} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default CategoriesSection;
