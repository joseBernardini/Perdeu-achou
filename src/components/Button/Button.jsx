import { useId } from 'react';
import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
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
  loading = false,
  loadingText,
  className = '',
  ...rest
}) {
  const hintId = useId();
  const classes = ['button', `button--${variant}`, `button--${size}`, unavailable && 'button--unavailable', loading && 'button--loading', className]
    .filter(Boolean)
    .join(' ');

  const content = loading ? (
    <>
      <LoaderCircle className="button__icon button__spinner" size={18} strokeWidth={2} aria-hidden="true" />
      <span>{loadingText ?? children}</span>
    </>
  ) : (
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

  if (loading) {
    const { onClick, ...buttonProps } = rest;

    return (
      <button
        type="button"
        className={classes}
        {...buttonProps}
        aria-disabled="true"
        aria-busy="true"
        onClick={(event) => event.preventDefault()}
      >
        {content}
      </button>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}

export default Button;
