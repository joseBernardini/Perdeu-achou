import { useId } from 'react';
import { Link } from 'react-router-dom';
import { UNAVAILABLE_MESSAGE } from '../../utils/constants';
import './Button.css';

function Button({
  children,
  to,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'end',
  unavailable = false,
  className = '',
  ...rest
}) {
  const hintId = useId();
  const classes = ['button', `button--${variant}`, `button--${size}`, unavailable && 'button--unavailable', className]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {Icon && iconPosition === 'start' && <Icon className="button__icon" size={18} strokeWidth={1.75} aria-hidden="true" />}
      <span>{children}</span>
      {Icon && iconPosition === 'end' && <Icon className="button__icon" size={18} strokeWidth={1.75} aria-hidden="true" />}
    </>
  );

  if (unavailable) {
    return (
      <span className="button-wrapper">
        <button
          type="button"
          className={classes}
          aria-disabled="true"
          aria-describedby={hintId}
          onClick={(event) => event.preventDefault()}
          {...rest}
        >
          {content}
        </button>
        <span id={hintId} role="tooltip" className="button-wrapper__hint">
          {UNAVAILABLE_MESSAGE}
        </span>
      </span>
    );
  }

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}

export default Button;
