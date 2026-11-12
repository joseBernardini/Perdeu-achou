import { CircleAlert } from 'lucide-react';
import './FormField.css';

export function getFieldDescriptionIds(id, { hint, error } = {}) {
  const ids = [hint && `${id}-ajuda`, error && `${id}-erro`].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

function FormField({ id, label, hint, error, optional = false, length, maxLength, children, as = 'div' }) {
  const Wrapper = as;
  const isGroup = as === 'fieldset';
  const LabelElement = isGroup ? 'legend' : 'label';
  const remaining = typeof maxLength === 'number' ? maxLength - (length ?? 0) : null;

  return (
    <Wrapper className={`form-field${error ? ' form-field--invalid' : ''}`}>
      <div className="form-field__header">
        <LabelElement className="form-field__label" {...(isGroup ? {} : { htmlFor: id })}>
          {label}
          {optional && <span className="form-field__optional">(opcional)</span>}
        </LabelElement>
        {remaining !== null && (
          <span className={`form-field__counter${remaining < 0 ? ' form-field__counter--over' : ''}`} aria-hidden="true">
            {length ?? 0}/{maxLength}
          </span>
        )}
      </div>

      {hint && (
        <p id={`${id}-ajuda`} className="form-field__hint">
          {hint}
        </p>
      )}

      {children}

      {error && (
        <p id={`${id}-erro`} className="form-field__error">
          <CircleAlert size={16} strokeWidth={2} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </Wrapper>
  );
}

export default FormField;
