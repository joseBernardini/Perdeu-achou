import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin, Package } from 'lucide-react';
import StatusBadge from '../StatusBadge/StatusBadge';
import { getCategoryById } from '../../data/categories';
import { getObjectDetailsPath } from '../../utils/constants';
import { formatISODate } from '../../utils/date';
import './ObjectCard.css';

function ObjectCard({ object }) {
  const category = getCategoryById(object.category);
  const CategoryIcon = category?.icon ?? Package;
  const titleId = `objeto-${object.id}-titulo`;

  return (
    <article className="object-card" aria-labelledby={titleId}>
      <header className="object-card__header">
        <span className="object-card__icon" aria-hidden="true">
          <CategoryIcon size={20} strokeWidth={1.6} />
        </span>
        <div className="object-card__heading">
          <span className="object-card__category">{category?.title ?? 'Sem categoria'}</span>
          <h3 id={titleId} className="object-card__title">
            {object.name}
          </h3>
        </div>
      </header>

      <p className="object-card__description">{object.description}</p>

      <dl className="object-card__meta">
        <div className="object-card__meta-item">
          <dt>
            <MapPin size={16} strokeWidth={1.75} aria-hidden="true" />
            <span className="visually-hidden">Local onde foi encontrado</span>
          </dt>
          <dd>{object.location}</dd>
        </div>
        <div className="object-card__meta-item">
          <dt>
            <CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" />
            <span className="visually-hidden">Encontrado em</span>
          </dt>
          <dd>
            Encontrado em <time dateTime={object.foundDate}>{formatISODate(object.foundDate)}</time>
          </dd>
        </div>
      </dl>

      <footer className="object-card__footer">
        <div className="object-card__identity">
          <span className="object-card__code">
            <span className="visually-hidden">Código </span>
            {object.id}
          </span>
          <StatusBadge status={object.status} />
        </div>
        <Link to={getObjectDetailsPath(object.id)} className="object-card__link">
          Ver detalhes
          <span className="visually-hidden"> de {object.name}</span>
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}

export default ObjectCard;
