import { useEffect, useRef } from 'react';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import './FormAlert.css';

const ICONS = {
  error: CircleAlert,
  success: CircleCheck,
  info: Info,
};

function FormAlert({ tone = 'error', title, children, autoFocus = false }) {
  const ref = useRef(null);
  const Icon = ICONS[tone] ?? Info;

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div
      ref={ref}
      className={`notice-alert notice-alert--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      tabIndex={autoFocus ? -1 : undefined}
    >
      <Icon className="notice-alert__icon" size={20} strokeWidth={1.75} aria-hidden="true" />
      <div className="notice-alert__content">
        {title && <p className="notice-alert__title">{title}</p>}
        {children && <div className="notice-alert__text">{children}</div>}
      </div>
    </div>
  );
}

export default FormAlert;
