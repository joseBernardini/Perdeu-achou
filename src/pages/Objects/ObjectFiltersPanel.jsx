import { useEffect, useRef } from 'react';
import { CircleAlert, X } from 'lucide-react';
import Button from '../../components/Button/Button';
import categories from '../../data/categories';
import { isDateRangeInvalid } from '../../utils/objectFilters';
import '../../components/FormField/FormField.css';
import './ObjectFiltersPanel.css';

function pluralizeResults(count) {
  return count === 1 ? 'Ver 1 resultado' : `Ver ${count} resultados`;
}

function ObjectFiltersPanel({
  id,
  filters,
  categoryCounts,
  locationOptions,
  dateBounds,
  resultCount,
  isOpen,
  onClose,
  onToggleCategory,
  onChange,
  onClear,
  canClear,
}) {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const showPeriod = Boolean(dateBounds && dateBounds.distinct > 1);
  const invalidRange = isDateRangeInvalid(filters);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && <div className="filters-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside
        ref={panelRef}
        id={id}
        className={`filters-panel${isOpen ? ' filters-panel--open' : ''}`}
        aria-labelledby={`${id}-titulo`}
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? 'true' : undefined}
      >
        <div className="filters-panel__header">
          <h2 id={`${id}-titulo`} className="filters-panel__title">
            Filtros
          </h2>
          {canClear && (
            <button type="button" className="filters-panel__clear filters-panel__desktop-only" onClick={onClear}>
              Limpar filtros
            </button>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            className="filters-panel__close"
            onClick={onClose}
            aria-label="Fechar filtros"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <div className="filters-panel__body">
          <fieldset className="filters-panel__group">
            <legend className="filters-panel__legend">Categoria</legend>
            <ul className="filters-panel__options">
              {categories.map((category) => {
                const inputId = `${id}-categoria-${category.id}`;
                const count = categoryCounts[category.id] ?? 0;

                return (
                  <li key={category.id}>
                    <label htmlFor={inputId} className="filters-panel__option">
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={filters.categories.includes(category.id)}
                        onChange={() => onToggleCategory(category.id)}
                      />
                      <span className="filters-panel__option-label">{category.title}</span>
                      <span className="filters-panel__option-count">
                        {count}
                        <span className="visually-hidden"> {count === 1 ? 'objeto' : 'objetos'}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          {locationOptions.length > 1 && (
            <div className="filters-panel__group">
              <label htmlFor={`${id}-local`} className="filters-panel__legend">
                Local onde foi encontrado
              </label>
              <select
                id={`${id}-local`}
                className="form-control filters-panel__select"
                value={filters.location}
                onChange={(event) => onChange({ location: event.target.value })}
              >
                <option value="">Todos os locais</option>
                {locationOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {showPeriod && (
            <fieldset className="filters-panel__group">
              <legend className="filters-panel__legend">Período em que foi encontrado</legend>
              <div className="filters-panel__dates">
                <div>
                  <label htmlFor={`${id}-data-inicial`} className="filters-panel__date-label">
                    De
                  </label>
                  <input
                    id={`${id}-data-inicial`}
                    type="date"
                    className="form-control"
                    min={dateBounds.min}
                    max={filters.dateTo || dateBounds.max}
                    value={filters.dateFrom}
                    aria-invalid={invalidRange || undefined}
                    aria-describedby={invalidRange ? `${id}-periodo-erro` : undefined}
                    onChange={(event) => onChange({ dateFrom: event.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor={`${id}-data-final`} className="filters-panel__date-label">
                    Até
                  </label>
                  <input
                    id={`${id}-data-final`}
                    type="date"
                    className="form-control"
                    min={filters.dateFrom || dateBounds.min}
                    max={dateBounds.max}
                    value={filters.dateTo}
                    aria-invalid={invalidRange || undefined}
                    aria-describedby={invalidRange ? `${id}-periodo-erro` : undefined}
                    onChange={(event) => onChange({ dateTo: event.target.value })}
                  />
                </div>
              </div>
              {invalidRange && (
                <p id={`${id}-periodo-erro`} className="form-field__error">
                  <CircleAlert size={16} strokeWidth={2} aria-hidden="true" />
                  <span>A data inicial deve ser anterior ou igual à data final. O período não foi aplicado.</span>
                </p>
              )}
            </fieldset>
          )}
        </div>

        <div className="filters-panel__footer">
          <Button variant="ghost" onClick={onClear} disabled={!canClear}>
            Limpar
          </Button>
          <Button variant="primary" onClick={onClose}>
            {pluralizeResults(resultCount)}
          </Button>
        </div>
      </aside>
    </>
  );
}

export default ObjectFiltersPanel;
