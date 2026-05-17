import { useParams, Link } from 'react-router-dom';
import { useSeriesStore } from '../../store/seriesStore';
import { useChapterStore } from '../../store/chapterStore';
import { useAuthStore } from '../../store/authStore';
import { useVotingStore } from '../../store/votingStore';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import { calculateChapterCompletion } from '../../utils/calculations';
import { BookOpen, Layers, ArrowLeft, Shield, Zap, UserPlus } from 'lucide-react';
import { ROLES } from '../../utils/constants';
import { useMemo, useState } from 'react';
import Modal from '../../components/Modal';
import { showToast } from '../../components/Toast';

export default function SeriesDetailPage() {
  const { id } = useParams();
  const allSeries = useSeriesStore(s => s.series);
  const { activateSeries, updateSeriesStatus } = useSeriesStore();
  const allChapters = useChapterStore(s => s.chapters);
  const tasks = useChapterStore(s => s.tasks);
  const getUserById = useAuthStore(s => s.getUserById);
  const user = useAuthStore(s => s.currentUser);
  const { decisions } = useVotingStore();

  // Editors for assignment dropdown
  const allUsers = useAuthStore(s => s.users);
  const editors = allUsers.filter(u => u.roles.includes(ROLES.TANTOU_EDITOR) && u.status === 'Active');

  const series = useMemo(() => allSeries.find(s => s.id === id), [allSeries, id]);
  const chapters = useMemo(() => allChapters.filter(c => c.seriesId === id), [allChapters, id]);

  // Activation modal state
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedEditorId, setSelectedEditorId] = useState('');

  if (!series) return <div className="text-center text-text-muted py-20">Series not found</div>;

  const owner = getUserById(series.mangakaId);
  const editor = series.editorId ? getUserById(series.editorId) : null;
  const isMangaka = user.roles.includes(ROLES.MANGAKA) && series.mangakaId === user.id;
  const isAdmin = user.roles.includes(ROLES.ADMIN);
  const isBoard = user.roles.includes(ROLES.EDITORIAL_BOARD);

  // Issue #3: Can activate if series is Approved and user is Admin/Board
  const canActivate = series.status === 'Approved' && (isAdmin || isBoard);

  // Get related voting decision for this series
  const relatedDecision = decisions.find(d => d.seriesId === id && d.decisionType === 'Series Approval');

  const handleActivate = () => {
    if (!selectedEditorId) {
      showToast('BR-24: Please select a Tantou Editor before activating', 'error');
      return;
    }
    activateSeries(series.id, selectedEditorId);
    setShowActivateModal(false);
    showToast(`Series "${series.title}" is now Active! Editor assigned.`, 'success');
  };

  return (
    <div className="space-y-6">
      <Link to="/series" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={16} /> Back to Series
      </Link>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={series.status} size="lg" />
              <span className="text-xs text-text-muted">{series.id}</span>
            </div>
            <h1 className="text-3xl font-black text-text-primary mb-1">{series.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm px-3 py-1 rounded-lg bg-bg-tertiary text-text-secondary">{series.genre}</span>
              <span className="text-sm px-3 py-1 rounded-lg bg-bg-tertiary text-text-secondary">{series.publicationType}</span>
              {series.rankingScore > 0 && (
                <span className="text-sm font-bold text-primary">{series.rankingScore}% ranking score</span>
              )}
            </div>
            <p className="text-sm text-text-secondary max-w-2xl">{series.synopsis}</p>
          </div>
        </div>

        {/* Team */}
        <div className="flex gap-6 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-xl">{owner?.avatar}</span>
            <div>
              <p className="text-xs text-text-muted">Mangaka</p>
              <p className="text-sm font-medium">{owner?.displayName}</p>
            </div>
          </div>
          {editor && (
            <div className="flex items-center gap-2">
              <span className="text-xl">{editor.avatar}</span>
              <div>
                <p className="text-xs text-text-muted">Tantou Editor</p>
                <p className="text-sm font-medium">{editor.displayName}</p>
              </div>
            </div>
          )}
          {!editor && series.status === 'Approved' && (
            <div className="flex items-center gap-2 text-amber-400">
              <UserPlus size={18} />
              <div>
                <p className="text-xs text-text-muted">Tantou Editor</p>
                <p className="text-sm font-medium text-amber-400">Not assigned yet</p>
              </div>
            </div>
          )}
          {/* BR-09: Series ownership display */}
          <div className="ml-auto text-xs text-text-muted">
            <p>BR-09: Owner: {owner?.displayName} (non-transferable)</p>
            <p>Created: {series.createdAt}</p>
          </div>
        </div>
      </div>

      {/* Issue #3: Activate Series Panel — BR-24 */}
      {canActivate && (
        <div className="glass-card p-6 border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <Zap size={24} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-emerald-400">Ready to Activate</h2>
              <p className="text-sm text-text-secondary mt-1">
                This series has been approved by the Editorial Board. Assign a Tantou Editor to activate it (BR-24).
              </p>
              <div className="mt-4 p-4 rounded-lg bg-bg-tertiary/50 border border-border">
                <p className="text-xs font-semibold text-text-secondary mb-2">BR-24: Activation Preconditions</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-text-secondary">Board Approval: Received</span>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1">
                  {series.editorId
                    ? <><span className="text-emerald-400">✓</span><span className="text-text-secondary">Editor: Assigned</span></>
                    : <><span className="text-amber-400">○</span><span className="text-amber-400">Editor: Not yet assigned</span></>
                  }
                </div>
              </div>
              <button onClick={() => setShowActivateModal(true)} className="btn btn-success mt-4">
                <Zap size={16} /> Assign Editor & Activate Series
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voting Decision Info */}
      {relatedDecision && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-primary" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-text-secondary">Board Decision: {relatedDecision.id}</p>
              <p className="text-xs text-text-muted">
                Status: <StatusBadge status={relatedDecision.status === 'Finalized' ? relatedDecision.result || relatedDecision.status : relatedDecision.status} />
                {' '}· Votes: {relatedDecision.votes.length}
              </p>
            </div>
            {relatedDecision.status === 'Open' && (isBoard || isAdmin) && (
              <Link to={`/voting/${relatedDecision.id}`} className="btn btn-primary text-xs py-1 px-3">
                Go to Vote →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Chapters */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Chapters ({chapters.length})</h2>
        {isMangaka && series.status === 'Active' && (
          <Link to={`/chapters?seriesId=${id}`} className="btn btn-primary text-sm">
            <Layers size={16} /> Manage Chapters
          </Link>
        )}
      </div>

      {chapters.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <BookOpen size={40} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-muted">
            {series.status === 'Active'
              ? 'No chapters yet. The Mangaka can start creating chapters.'
              : series.status === 'Approved'
                ? 'Series needs to be activated before chapters can be created.'
                : 'No chapters available.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map(ch => {
            const chTasks = tasks.filter(t => t.chapterId === ch.id);
            const completion = calculateChapterCompletion(chTasks);
            return (
              <Link key={ch.id} to={`/chapters/${ch.id}`} className="glass-card p-4 flex items-center gap-4 hover:-translate-y-0.5 transition-all">
                <div className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center text-lg font-bold text-primary">
                  {ch.chapterNo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">{ch.title}</p>
                  <p className="text-xs text-text-muted">Deadline: {ch.deadline} · {chTasks.length} tasks</p>
                </div>
                <div className="w-32">
                  <ProgressBar value={completion} color={completion === 100 ? 'success' : 'primary'} />
                </div>
                <StatusBadge status={ch.status} />
              </Link>
            );
          })}
        </div>
      )}

      {/* Activate Modal — BR-24 */}
      <Modal isOpen={showActivateModal} onClose={() => setShowActivateModal(false)} title="Activate Series (BR-24)" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Assign Tantou Editor <span className="text-danger">*</span>
            </label>
            <select
              className={`form-input ${!selectedEditorId ? '' : ''}`}
              value={selectedEditorId}
              onChange={e => setSelectedEditorId(e.target.value)}
            >
              <option value="">Select an editor...</option>
              {editors.map(e => (
                <option key={e.id} value={e.id}>
                  {e.avatar} {e.displayName}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              The assigned editor will be responsible for reviewing manuscripts for this series.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-bg-tertiary/50 border border-border text-xs text-text-muted">
            <strong>After activation:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Series status will change to <span className="text-emerald-400 font-semibold">Active</span></li>
              <li>Mangaka can start creating chapters</li>
              <li>The assigned editor will receive manuscript review requests</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowActivateModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleActivate} disabled={!selectedEditorId} className="btn btn-success flex-1">
              <Zap size={16} /> Activate Series
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
