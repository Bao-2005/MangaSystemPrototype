import { STATUS_COLORS } from '../utils/constants';

export default function StatusBadge({ status, size = 'sm' }) {
  const colors = STATUS_COLORS[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' };
  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`badge ${colors.bg} ${colors.text} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {status}
    </span>
  );
}
