import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

export default function Header() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { getByRecipient, getUnreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [showNotif, setShowNotif] = useState(false);

  const unreadCount = currentUser ? getUnreadCount(currentUser.id) : 0;
  const notifs = currentUser ? getByRecipient(currentUser.id).slice(0, 8) : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const priorityColors = {
    Critical: 'text-rose-400',
    High: 'text-amber-400',
    Normal: 'text-text-secondary',
  };

  return (
    <header className="h-16 border-b border-border bg-bg-secondary/80 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0">
      {/* Left — Breadcrumb area */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">Welcome back,</span>
        <span className="text-sm font-semibold text-text-primary">{currentUser?.displayName}</span>
        <span className="badge bg-primary/20 text-primary text-xs">{currentUser?.roles?.join(', ')}</span>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <Bell size={20} className="text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger rounded-full text-[10px] font-bold flex items-center justify-center text-white pulse-ring">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-96 glass-card p-0 overflow-hidden z-50 page-enter">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="text-sm font-bold">Notifications</h3>
                <button
                  onClick={() => { markAllAsRead(currentUser.id); }}
                  className="text-xs text-primary hover:underline"
                >Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="p-4 text-center text-sm text-text-muted">No notifications</p>
                ) : (
                  notifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 border-b border-border cursor-pointer hover:bg-bg-hover transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-semibold ${priorityColors[n.priority]}`}>●</span>
                        <div className="flex-1">
                          <p className={`text-xs ${n.read ? 'text-text-muted' : 'text-text-primary'}`}>{n.content}</p>
                          <p className="text-[10px] text-text-muted mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <button onClick={handleLogout} className="btn btn-ghost text-sm py-2 px-3">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
