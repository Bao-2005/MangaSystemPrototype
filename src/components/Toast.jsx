import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const toasts = [];
let setToastsGlobal = null;

export function showToast(message, type = 'info') {
  const id = Date.now();
  const newToast = { id, message, type };
  if (setToastsGlobal) {
    setToastsGlobal(prev => [...prev, newToast]);
    setTimeout(() => {
      setToastsGlobal(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  setToastsGlobal = setToasts;

  const icons = {
    success: <CheckCircle size={18} className="text-emerald-400" />,
    error: <XCircle size={18} className="text-rose-400" />,
    warning: <AlertTriangle size={18} className="text-amber-400" />,
    info: <Info size={18} className="text-blue-400" />,
  };

  const bgColors = {
    success: 'border-emerald-500/30',
    error: 'border-rose-500/30',
    warning: 'border-amber-500/30',
    info: 'border-blue-500/30',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div key={toast.id} className={`glass-card p-3 flex items-start gap-3 page-enter border ${bgColors[toast.type]}`}>
          {icons[toast.type]}
          <p className="text-sm text-text-primary flex-1">{toast.message}</p>
          <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-text-muted hover:text-text-primary">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
