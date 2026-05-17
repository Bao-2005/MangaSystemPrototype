export default function FormField({ label, required, error, hint, children, charCount, maxCount }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
        {charCount !== undefined && maxCount && (
          <span className="text-text-muted text-xs ml-2">({charCount}/{maxCount})</span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-text-muted mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
