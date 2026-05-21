import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Shield } from 'lucide-react';

// BR-01: No self-registration. Only preset accounts via Admin.
export default function LoginPage() {
  const navigate = useNavigate();
  const { users, login } = useAuthStore();

  const handleLogin = (userId) => {
    if (login(userId)) {
      navigate('/');
    }
  };

  const roleColors = {
    Mangaka: 'from-pink-500 to-rose-500',
    Assistant: 'from-cyan-500 to-teal-500',
    'Tantou Editor': 'from-violet-500 to-purple-500',
    'Editorial Board': 'from-amber-500 to-orange-500',
    Admin: 'from-emerald-500 to-green-500',
    'Editorial Office Admin': 'from-sky-500 to-indigo-500',
  };

  const roleBorders = {
    Mangaka: 'hover:border-pink-500/50',
    Assistant: 'hover:border-cyan-500/50',
    'Tantou Editor': 'hover:border-violet-500/50',
    'Editorial Board': 'hover:border-amber-500/50',
    Admin: 'hover:border-emerald-500/50',
    'Editorial Office Admin': 'hover:border-sky-500/50',
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 mb-4">
            <span className="text-3xl">📚</span>
          </div>
          <h1 className="text-4xl font-black gradient-text mb-2">MangaHub</h1>
          <p className="text-text-secondary">Manga Creation & Publishing Management System</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Shield size={14} className="text-amber-400" />
            <p className="text-xs text-text-muted">Internal System — Select an account to login (BR-01: No self-registration)</p>
          </div>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => handleLogin(user.id)}
              className={`glass-card p-4 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${roleBorders[user.roles[0]]}`}
            >
              <div className="text-4xl mb-3">{user.avatar}</div>
              <h3 className="text-sm font-bold text-text-primary mb-1 truncate">{user.displayName}</h3>
              <p className="text-xs text-text-muted mb-3">@{user.username}</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {user.roles.map(role => (
                  <span key={role} className={`text-[10px] px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${roleColors[role]}`}>
                    {role}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 glass-card p-4">
          <h3 className="text-sm font-bold text-text-primary mb-2">🎮 Prototype Demo Guide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-text-secondary">
            <div><span className="text-pink-400 font-semibold">Mangaka:</span> Create series, chapters, assign tasks, submit manuscripts</div>
            <div><span className="text-cyan-400 font-semibold">Assistant:</span> View assigned tasks, update progress, submit work</div>
            <div><span className="text-violet-400 font-semibold">Tantou Editor:</span> Review manuscripts, add annotations, provide feedback</div>
            <div><span className="text-amber-400 font-semibold">Editorial Board:</span> Vote on proposals, enter reader votes, manage rankings</div>
            <div><span className="text-sky-400 font-semibold">Office Admin:</span> Create & manage accounts for Mangaka, Editor, Board members</div>
          </div>
        </div>
      </div>
    </div>
  );
}
