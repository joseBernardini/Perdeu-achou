import { OBJECT_STATUS_LABELS } from '../../utils/constants';
import './StatusBadge.css';

function StatusBadge({ status, label, className = '' }) {
  return (
    <span className={`status-badge status-badge--${status} ${className}`.trim()}>
      <span className="status-badge__dot" aria-hidden="true" />
      {label ?? OBJECT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default StatusBadge;
