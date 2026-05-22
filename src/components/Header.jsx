import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, LogOut, X, ExternalLink, CheckCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

const TYPE_ICON = {
  success: '🎉',
  alert: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  task_submitted: '📨',
  deadline_reminder: '⏰',
  voting_result: '🗳️',
  task_approved: '✅',
  task_assigned: '📋',
  manuscript_submitted: '📄',
  vote_required: '🏛️',
  series_cancelled: '🚫',
  task_overdue: '🔴',
};

export default function Header() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { getByRecipient, getUnreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [showNotif, setShowNotif] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = currentUser ? getUnreadCount(currentUser.id) : 0;
  const notifs = currentUser ? getByRecipient(currentUser.id).slice(0, 15) : [];

  // Close on outside click
  useEffect(() => {
    if (!showNotif) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotif]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Resolve display text — support both old (content) and new (title+message) format
  const getTitle = (n) => n.title || n.content || 'Notification';
  const getMessage = (n) => n.message || null;
  const getIcon = (n) => TYPE_ICON[n.type] || '🔔';

  const typeColors = {
    success: 'border-l-emerald-400 bg-emerald-500/5',
    alert: 'border-l-rose-400 bg-rose-500/5',
    warning: 'border-l-amber-400 bg-amber-500/5',
    info: 'border-l-cyan-400 bg-cyan-500/5',
    vote_required: 'border-l-rose-400 bg-rose-500/5',
    task_overdue: 'border-l-rose-400 bg-rose-500/5',
    deadline_reminder: 'border-l-amber-400 bg-amber-500/5',
  };

  const getItemColor = (n) =>
    typeColors[n.type] || 'border-l-primary bg-primary/5';

  return (
    <header className="h-16 border-b border-border bg-bg-secondary/80 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 relative z-40">
      {/* Left — User info */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{currentUser?.avatar}</span>
        <span className="text-sm font-semibold text-text-primary">{currentUser?.displayName}</span>
        <span className="badge bg-primary/20 text-primary text-xs">{currentUser?.roles?.join(', ')}</span>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-3" ref={panelRef}>
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <Bell size={20} className={`${unreadCount > 0 ? 'text-amber-400' : 'text-text-secondary'} transition-colors`} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-danger rounded-full text-[10px] font-bold flex items-center justify-center text-white px-1 pulse-ring">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel — fixed to avoid z-index clipping */}
          {showNotif && (
            <div
              className="fixed right-4 top-[68px] w-[420px] max-h-[560px] flex flex-col shadow-2xl shadow-black/40 rounded-2xl overflow-hidden border border-border page-enter"
              style={{ zIndex: 9999, background: 'var(--color-bg-secondary)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-primary/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-amber-400" />
                  <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-black bg-danger text-white px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead(currentUser.id)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-semibold"
                    >
                      <CheckCheck size={13} />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotif(false)}
                    className="p-1 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto flex-1">
                {notifs.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={32} className="mx-auto text-text-muted mb-2 opacity-40" />
                    <p className="text-sm text-text-muted">No notifications yet</p>
                  </div>
                ) : (
                  notifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) { navigate(n.link); setShowNotif(false); }
                      }}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 border-l-4 cursor-pointer hover:bg-bg-hover/50 transition-all ${
                        !n.read ? getItemColor(n) : 'border-l-transparent opacity-70'
                      }`}
                    >
                      {/* Icon */}
                      <span className="text-base flex-shrink-0 mt-0.5">{getIcon(n)}</span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold leading-snug ${!n.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {getTitle(n)}
                        </p>
                        {getMessage(n) && (
                          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed line-clamp-2">
                            {getMessage(n)}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-[10px] text-text-muted">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                          {n.link && (
                            <span className="text-[10px] text-primary/60 flex items-center gap-0.5">
                              <ExternalLink size={9} /> view
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unread dot */}
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5 animate-pulse" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifs.length > 0 && (
                <div className="px-4 py-2 border-t border-border flex-shrink-0 bg-bg-primary/30 text-center">
                  <span className="text-xs text-text-muted">Showing {notifs.length} most recent notifications</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="btn btn-ghost text-sm py-2 px-3">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
