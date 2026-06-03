import type { Status } from '../types';
import { STATUS_COLOR } from '../types';

interface Props {
  status: Status;
  onClick?: () => void;
  options?: Status[];
}

export default function StatusBadge({ status, onClick, options }: Props) {
  if (options && onClick) {
    return (
      <select
        value={status}
        onChange={onClick as any}
        style={{
          background: STATUS_COLOR[status],
          color: '#fff',
          border: 'none',
          borderRadius: 20,
          padding: '3px 10px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {options.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    );
  }

  return (
    <span style={{
      background: STATUS_COLOR[status],
      color: '#fff',
      borderRadius: 20,
      padding: '3px 10px',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}
