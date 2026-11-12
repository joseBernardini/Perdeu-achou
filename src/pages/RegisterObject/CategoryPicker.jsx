import categories from '../../data/categories';
import './CategoryPicker.css';

function CategoryPicker({ name, value, onChange, onBlur, invalid, describedBy, firstOptionRef }) {
  return (
    <div className="category-picker">
      {categories.map((category, index) => {
        const Icon = category.icon;
        const inputId = `${name}-${category.id}`;

        return (
          <label key={category.id} htmlFor={inputId} className="category-option">
            <input
              ref={index === 0 ? firstOptionRef : undefined}
              id={inputId}
              type="radio"
              name={name}
              value={category.id}
              checked={value === category.id}
              onChange={onChange}
              onBlur={onBlur}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className="category-option__input"
            />
            <span className="category-option__box">
              <Icon className="category-option__icon" size={20} strokeWidth={1.6} aria-hidden="true" />
              <span className="category-option__label">{category.title}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default CategoryPicker;
