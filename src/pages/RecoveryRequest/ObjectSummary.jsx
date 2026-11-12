import { Package } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { getCategoryById } from '../../data/categories';
import { formatISODate } from '../../utils/date';

function ObjectSummary({ object, headingId }) {
  const category = getCategoryById(object.category);
  const CategoryIcon = category?.icon ?? Package;

  return (
    <div className="object-summary">
      <h2 id={headingId} className="object-summary__eyebrow">
        Objeto solicitado
      </h2>
      <div className="object-summary__identity">
        <span className="object-summary__icon" aria-hidden="true">
          <CategoryIcon size={20} strokeWidth={1.6} />
        </span>
        <div>
          <p className="object-summary__name">{object.name}</p>
          <p className="object-summary__code">{object.id}</p>
        </div>
      </div>
      <dl className="object-summary__list">
        <div>
          <dt>Categoria</dt>
          <dd>{category?.title ?? 'Sem categoria'}</dd>
        </div>
        <div>
          <dt>Local onde foi encontrado</dt>
          <dd>{object.location}</dd>
        </div>
        <div>
          <dt>Data em que foi encontrado</dt>
          <dd>{formatISODate(object.foundDate)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <StatusBadge status={object.status} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default ObjectSummary;
