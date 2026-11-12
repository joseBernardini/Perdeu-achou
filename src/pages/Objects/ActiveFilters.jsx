import { X } from 'lucide-react';
import './ActiveFilters.css';

function ActiveFilters({ items, onRemove, onClear }) {
  if (items.length === 0) return null;

  return (
    <div className="active-filters">
      <h3 className="visually-hidden">Filtros aplicados</h3>
      <ul className="active-filters__list">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              className="active-filters__chip"
              onClick={() => onRemove(item.key)}
              aria-label={`Remover filtro ${item.label}`}
            >
              <span>{item.label}</span>
              <X size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="active-filters__clear" onClick={onClear}>
        Limpar filtros
      </button>
    </div>
  );
}

export default ActiveFilters;
