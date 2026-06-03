import type { Status } from '../types';
import { STATUS_COLOR } from '../types';

interface Props {
  status: Status;
}

export default function StatusBadge({ status }: Props) {
  const c = STATUS_COLOR[status];
  return (
    <span style={{
      background: c.soft,
      color: c.bg,
      borderRadius: 99,
      padding: '3px 10px',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      border: `1.5px solid ${c.bg}40`,
    }}>
      {status}
    </span>
  );
}
