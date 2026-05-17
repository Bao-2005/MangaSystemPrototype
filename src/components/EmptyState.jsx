import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data', message = 'Nothing to show here yet.', action, actionLabel }) {
  return (
    <div className="glass-card p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bg-tertiary/50 mb-4">
        <Icon size={32} className="text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm mx-auto">{message}</p>
      {action && (
        <button onClick={action} className="btn btn-primary mt-4">{actionLabel || 'Take Action'}</button>
      )}
    </div>
  );
}
