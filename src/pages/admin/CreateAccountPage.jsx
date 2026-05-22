import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ROLES } from '../../utils/constants';
import { showToast } from '../../components/Toast';
import { UserPlus, CheckCircle, AlertTriangle } from 'lucide-react';

// Roles that Admin can create
const CREATABLE_ROLES = [
  { value: ROLES.MANGAKA, label: 'Mangaka', emoji: '🎨', desc: 'Creates manga series, chapters, and assigns tasks to assistants' },
  { value: ROLES.TANTOU_EDITOR, label: 'Tantou Editor', emoji: '📋', desc: 'Reviews manuscripts, provides feedback, and manages publication quality' },
  { value: ROLES.EDITORIAL_BOARD, label: 'Editorial Board', emoji: '🏛️', desc: 'Votes on series proposals, cancellation reviews, and ranking decisions' },
];

const AVATAR_OPTIONS = ['🎨', '🖌️', '✍️', '🖊️', '✏️', '📋', '📝', '🏛️', '⚖️', '📚', '🎯', '🌟', '🔥', '💎', '🎭', '🎪'];

export default function CreateAccountPage() {
  const navigate = useNavigate();
  const { users, addUser } = useAuthStore();
  const currentUser = useAuthStore(s => s.currentUser);
  const [form, setForm] = useState({ username: '', displayName: '', role: '', avatar: '🎨', editorId: '' });
  const [errors, setErrors] = useState({});
  const [created, setCreated] = useState(null);

  // Only Admin can access
  if (!currentUser?.roles?.includes(ROLES.ADMIN)) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={40} className="mx-auto text-amber-400 mb-3" />
        <p className="text-text-muted">Access Denied — Only Admin can create accounts</p>
      </div>
    );
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    else if (form.username.length < 3) errs.username = 'Username must be at least 3 characters';
    else if (!/^[a-z0-9_]+$/.test(form.username)) errs.username = 'Username must be lowercase letters, numbers, underscores only';
    else if (users.some(u => u.username === form.username)) errs.username = 'Username already exists';

    if (!form.displayName.trim()) errs.displayName = 'Display name is required';
    else if (form.displayName.length < 2) errs.displayName = 'Display name must be at least 2 characters';

    if (!form.role) errs.role = 'Please select a role';
    if (form.role === ROLES.MANGAKA && !form.editorId) {
      errs.editorId = 'Please assign an editor for this Mangaka';
    }

    return errs;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Please fix validation errors', 'error');
      return;
    }

    const newUser = addUser({
      username: form.username.trim(),
      displayName: form.displayName.trim(),
      roles: [form.role],
      avatar: form.avatar,
      ...(form.role === ROLES.MANGAKA ? { editorId: form.editorId } : {})
    });

    setCreated(newUser);
    showToast(`Account created: ${newUser.displayName} (${form.role})`, 'success');
  };

  const handleCreateAnother = () => {
    setCreated(null);
    setForm({ username: '', displayName: '', role: '', avatar: '🎨', editorId: '' });
    setErrors({});
  };

  // Success state
  if (created) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-emerald-400 mb-2">Account Created Successfully</h2>
          <div className="mt-4 p-4 rounded-lg bg-bg-tertiary/50 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">ID</span>
              <span className="text-text-primary font-mono">{created.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Username</span>
              <span className="text-text-primary">@{created.username}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Display Name</span>
              <span className="text-text-primary">{created.avatar} {created.displayName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Role</span>
              <span className="text-text-primary">{created.roles[0]}</span>
            </div>
            {created.editorId && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Assigned Editor</span>
                <span className="text-text-primary">
                  {users.find(u => u.id === created.editorId)?.displayName}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Status</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Joined</span>
              <span className="text-text-primary">{created.joinedAt}</span>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleCreateAnother} className="btn btn-primary flex-1">
              <UserPlus size={16} /> Create Another
            </button>
            <button onClick={() => navigate('/')} className="btn btn-ghost flex-1">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-sm text-text-secondary mt-1">
          Create new accounts for Mangaka, Tantou Editor, or Editorial Board members
        </p>
      </div>

      <div className="glass-card p-6 space-y-5">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Account Role <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CREATABLE_ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => handleChange('role', r.value)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                  form.role === r.value
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                    : 'border-border bg-bg-tertiary/30 hover:border-border-hover hover:bg-bg-tertiary/50'
                }`}
              >
                <span className="text-2xl block mb-2">{r.emoji}</span>
                <p className="text-sm font-bold text-text-primary">{r.label}</p>
                <p className="text-[11px] text-text-muted mt-1 line-clamp-2">{r.desc}</p>
              </button>
            ))}
          </div>
          {errors.role && <p className="text-xs text-danger mt-1">{errors.role}</p>}
        </div>

        {/* Editor Assignment (for Mangaka role only) */}
        {form.role === ROLES.MANGAKA && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Assign Responsible Editor <span className="text-danger">*</span>
            </label>
            <select
              value={form.editorId}
              onChange={e => handleChange('editorId', e.target.value)}
              className={`form-input ${errors.editorId ? 'error' : ''}`}
            >
              <option value="">-- Select Tantou Editor --</option>
              {users.filter(u => u.roles.includes(ROLES.TANTOU_EDITOR) && u.status === 'Active').map(ed => (
                <option key={ed.id} value={ed.id}>{ed.displayName}</option>
              ))}
            </select>
            {errors.editorId && <p className="text-xs text-danger mt-1">{errors.editorId}</p>}
          </div>
        )}

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Username <span className="text-danger">*</span>
            <span className="text-text-muted text-xs ml-2">(lowercase, no spaces)</span>
          </label>
          <input
            type="text" className={`form-input ${errors.username ? 'error' : ''}`}
            placeholder="e.g. tanaka_mangaka"
            value={form.username}
            onChange={e => handleChange('username', e.target.value.toLowerCase().replace(/\s/g, '_'))}
          />
          {errors.username && <p className="text-xs text-danger mt-1">{errors.username}</p>}
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Display Name <span className="text-danger">*</span>
          </label>
          <input
            type="text" className={`form-input ${errors.displayName ? 'error' : ''}`}
            placeholder="e.g. Tanaka Yuki"
            value={form.displayName}
            onChange={e => handleChange('displayName', e.target.value)}
          />
          {errors.displayName && <p className="text-xs text-danger mt-1">{errors.displayName}</p>}
        </div>

        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleChange('avatar', emoji)}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all duration-200 ${
                  form.avatar === emoji
                    ? 'bg-primary/20 border-2 border-primary scale-110'
                    : 'bg-bg-tertiary border border-border hover:border-border-hover hover:scale-105'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {form.displayName && form.role && (
          <div className="p-4 rounded-lg bg-bg-tertiary/50 border border-border">
            <p className="text-xs font-semibold text-text-muted mb-2">Account Preview</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{form.avatar}</span>
              <div>
                <p className="text-sm font-bold text-text-primary">{form.displayName}</p>
                <p className="text-xs text-text-muted">@{form.username || '...'}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-cyan-500 to-teal-500 inline-block mt-1">
                  {form.role}
                </span>
                {form.role === ROLES.MANGAKA && form.editorId && (
                  <p className="text-xs text-text-secondary mt-1">
                    Editor: {users.find(u => u.id === form.editorId)?.displayName}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-3 rounded-lg bg-bg-tertiary/50 border border-border">
          <p className="text-xs text-text-muted">
            <strong>Note:</strong> New accounts are created with <span className="text-emerald-400">Active</span> status.
            The user will appear on the login page immediately.
            Only <span className="text-primary">Admin</span> can create accounts (BR-01).
          </p>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} className="btn btn-primary w-full" disabled={!form.username || !form.displayName || !form.role}>
          <UserPlus size={16} /> Create Account
        </button>
      </div>
    </div>
  );
}
