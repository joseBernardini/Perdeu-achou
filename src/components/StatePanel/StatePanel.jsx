import './StatePanel.css';

function StatePanel({ icon: Icon, title, description, tone = 'neutral', headingLevel = 2, role, children }) {
  const Heading = `h${headingLevel}`;

  return (
    <div className={`state-panel state-panel--${tone}`} role={role}>
      {Icon && <Icon className="state-panel__icon" size={24} strokeWidth={1.75} aria-hidden="true" />}
      <Heading className="state-panel__title">{title}</Heading>
      {description && <p className="state-panel__text">{description}</p>}
      {children && <div className="state-panel__actions">{children}</div>}
    </div>
  );
}

export default StatePanel;
