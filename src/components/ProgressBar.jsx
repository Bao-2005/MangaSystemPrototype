export default function ProgressBar({ value, max = 100, label, color = 'primary', showPercent = true }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  const colorMap = {
    primary: 'from-cyan-500 to-blue-500',
    success: 'from-emerald-500 to-green-500',
    warning: 'from-amber-500 to-orange-500',
    danger: 'from-rose-500 to-red-500',
  };

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-text-secondary">{label}</span>}
          {showPercent && <span className="text-xs font-semibold text-text-primary">{percent}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorMap[color]} progress-fill`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
