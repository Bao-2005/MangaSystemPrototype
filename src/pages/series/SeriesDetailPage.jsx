import { useParams, Link } from 'react-router-dom';
import { useSeriesStore } from '../../store/seriesStore';
import { useChapterStore } from '../../store/chapterStore';
import { useAuthStore } from '../../store/authStore';
import { useVotingStore } from '../../store/votingStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useEscalationStore } from '../../store/escalationStore';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import { calculateChapterCompletion } from '../../utils/calculations';
import { BookOpen, Layers, ArrowLeft, Shield, Zap, UserPlus, Crown } from 'lucide-react';
import { ROLES } from '../../utils/constants';
import { useMemo, useState } from 'react';
import Modal from '../../components/Modal';
import { showToast } from '../../utils/toast';

export default function SeriesDetailPage() {
  const { id } = useParams();
  const allSeries = useSeriesStore(s => s.series);
  const { activateSeries, reassignEditor } = useSeriesStore();
  const allChapters = useChapterStore(s => s.chapters);
  const tasks = useChapterStore(s => s.tasks);
  const getUserById = useAuthStore(s => s.getUserById);
  const user = useAuthStore(s => s.currentUser);
  const { decisions } = useVotingStore();
  const { addNotification } = useNotificationStore();
  const { addChiefAction, createEscalation, getBySeriesId } = useEscalationStore();

  // Editors for assignment dropdown
  const allUsers = useAuthStore(s => s.users);
  const editors = allUsers.filter(u => u.roles.includes(ROLES.TANTOU_EDITOR) && u.status === 'Active');

  const series = useMemo(() => allSeries.find(s => s.id === id), [allSeries, id]);
  const chapters = useMemo(() => allChapters.filter(c => c.seriesId === id), [allChapters, id]);


  // Active escalations for this series
  const activeEscalations = useMemo(() => {
    if (!series) return [];
    return getBySeriesId ? getBySeriesId(series.id).filter(e => e.status === 'Pending' || e.status === 'In Progress') : [];
  }, [series, getBySeriesId]);



  // Chief editor reassign state
  const [showChiefReassignModal, setShowChiefReassignModal] = useState(false);
  const [chiefEditorId, setChiefEditorId] = useState('');
  const [chiefReassignReason, setChiefReassignReason] = useState('');

  // Mangaka Dispute/Report state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeType, setDisputeType] = useState(''); // 'change' or 'dispute'
  const [disputeReason, setDisputeReason] = useState('');

  if (!series) return <div className="text-center text-text-muted py-20">Series not found</div>;

  const owner = getUserById(series.mangakaId);
  const editor = series.editorId ? getUserById(series.editorId) : null;
  const isMangaka = user.roles.includes(ROLES.MANGAKA) && series.mangakaId === user.id;
  const isAdmin = user.roles.includes(ROLES.ADMIN);
  const isBoard = user.roles.includes(ROLES.EDITORIAL_BOARD);



  // Get related voting decision for this series
  const relatedDecision = decisions.find(d => d.seriesId === id && d.decisionType === 'Series Approval');



  const handleChiefReassign = () => {
    if (!chiefEditorId) { showToast('Please select a Tantou Editor', 'error'); return; }
    const newEditor = getUserById(chiefEditorId);
    reassignEditor(series.id, chiefEditorId);
    
    addChiefAction({
      type: 'Editor Reassignment',
      entityType: 'Series',
      entityId: series.id,
      description: `Reassigned editor from ${editor ? editor.displayName : 'None'} to ${newEditor?.displayName} for series "${series.title}"`,
      reason: chiefReassignReason || 'Chief override reassignment'
    });

    // Notify Mangaka
    if (series.mangakaId) {
      addNotification({
        recipientId: series.mangakaId,
        title: '📋 Tantou Editor Reassigned',
        message: `Tantou Editor for your series "${series.title}" has been reassigned to ${newEditor?.displayName} by the Editor-in-Chief.`,
        type: 'info',
        link: `/series/${series.id}`
      });
    }

    // Notify New Editor
    addNotification({
      recipientId: chiefEditorId,
      title: '👑 Assigned Series',
      message: `The Editor-in-Chief has assigned you as the Tantou Editor for series "${series.title}".`,
      type: 'info',
      link: `/series/${series.id}`
    });

    showToast(`Editor reassigned to ${newEditor?.displayName}`, 'success');
    setShowChiefReassignModal(false);
    setChiefEditorId('');
    setChiefReassignReason('');
  };

  const handleCreateDispute = () => {
    if (!disputeType) { showToast('Please select a request type', 'error'); return; }
    if (!disputeReason) { showToast('Please provide a reason', 'error'); return; }

    const typeLabel = disputeType === 'change' ? 'Editor Change Request' : 'Dispute';
    
    // Create escalation record
    createEscalation({
      type: typeLabel,
      entityType: 'Series',
      entityId: series.id,
      seriesId: series.id,
      title: disputeType === 'change' 
        ? `Mangaka requests editor change for "${series.title}"` 
        : `Dispute: Deadline/Content disagreement on "${series.title}"`,
      description: `Mangaka ${owner?.displayName} raised an issue. Reason: ${disputeReason}`,
      priority: 'Medium',
      requestedBy: user.id,
      currentEditorId: series.editorId,
      disputeParties: { mangakaId: series.mangakaId, editorId: series.editorId }
    });

    // Notify Editor-in-Chief ('U12')
    addNotification({
      recipientId: 'U12', 
      title: disputeType === 'change' ? '🔄 Editor Change Request' : '⚖️ New Dispute Escalated',
      message: `Mangaka ${owner?.displayName} has escalated a new issue for "${series.title}". Check Chief Dashboard for details.`,
      type: 'warning',
      link: '/chief'
    });

    showToast('Your request has been escalated to the Editor-in-Chief', 'success');
    setShowDisputeModal(false);
    setDisputeType('');
    setDisputeReason('');
  };

  return (
    <div className="space-y-6">
      <Link to="/series" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={16} /> Back to Series
      </Link>

      {/* Active Escalation Banner */}
      {activeEscalations.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <Crown size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-400">
              ⚠️ {activeEscalations.length} Active Escalation{activeEscalations.length > 1 ? 's' : ''} for this series
            </p>
            <div className="mt-2 space-y-1">
              {activeEscalations.map(esc => (
                <p key={esc.id} className="text-xs text-text-secondary">
                  <span className="font-semibold text-amber-400/80">[{esc.type}]</span> {esc.title}
                </p>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2">The Editor-in-Chief has been notified and will resolve this through the Chief Dashboard.</p>
          </div>
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{editor.displayName}</p>
                  {isMangaka && series.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => setShowDisputeModal(true)}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline ml-1 cursor-pointer"
                      title="Request editor change or raise a dispute"
                    >
                      Report / Dispute
                    </button>
                  )}
                </div>
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

      {/* Editor-in-Chief Actions Panel */}
      {user?.roles?.includes(ROLES.EDITOR_IN_CHIEF) && (
        <div className="glass-card p-5 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={20} className="text-amber-400" />
            <h2 className="text-sm font-bold text-amber-400">Editor-in-Chief Actions</h2>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span>Current Editor: {editor ? `${editor.avatar} ${editor.displayName}` : 'None assigned'}</span>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setShowChiefReassignModal(true)} className="btn btn-ghost text-xs py-1.5 px-3 border border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
                <UserPlus size={14} className="inline mr-1" /> Reassign Tantou Editor
              </button>
            </div>
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



      {/* Chief Reassign Editor Modal */}
      <Modal isOpen={showChiefReassignModal} onClose={() => { setShowChiefReassignModal(false); setChiefEditorId(''); setChiefReassignReason(''); }} title="👑 Reassign Tantou Editor" size="md">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            <strong>Executive Action:</strong> As Editor-in-Chief, you can reassign the Tantou Editor for this series.
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Select New Tantou Editor <span className="text-danger">*</span>
            </label>
            <select
              className="form-input"
              value={chiefEditorId}
              onChange={e => setChiefEditorId(e.target.value)}
            >
              <option value="">Select an editor...</option>
              {editors.map(e => (
                <option key={e.id} value={e.id}>
                  {e.avatar} {e.displayName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Reason for Reassignment <span className="text-danger">*</span></label>
            <textarea
              className="form-input h-20 resize-none"
              value={chiefReassignReason}
              onChange={e => setChiefReassignReason(e.target.value)}
              placeholder="Provide a reason for reassignment..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowChiefReassignModal(false); setChiefEditorId(''); setChiefReassignReason(''); }} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleChiefReassign} disabled={!chiefEditorId || !chiefReassignReason} className="btn btn-primary flex-1">
              Reassign Editor
            </button>
          </div>
        </div>
      </Modal>

      {/* Mangaka Report/Dispute Modal */}
      <Modal isOpen={showDisputeModal} onClose={() => { setShowDisputeModal(false); setDisputeType(''); setDisputeReason(''); }} title="⚠️ Report / Raise a Dispute" size="md">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <strong>Escalation System:</strong> Submit a formal report directly to the Editor-in-Chief. The Chief will make the final decision to resolve the dispute or assign a new editor.
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Request Type <span className="text-danger">*</span></label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDisputeType('change')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all cursor-pointer text-xs ${disputeType === 'change' ? 'bg-amber-500 text-bg-primary shadow' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}
              >
                🔄 Request Editor Change
              </button>
              <button
                type="button"
                onClick={() => setDisputeType('dispute')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all cursor-pointer text-xs ${disputeType === 'dispute' ? 'bg-rose-500 text-white shadow' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}
              >
                ⚖️ Raise Work Dispute
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Detailed Reason & Evidence <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-input h-28 resize-none text-xs"
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              placeholder="Describe the issue in detail — include dates, examples of delays, disagreements, or any supporting evidence..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowDisputeModal(false); setDisputeType(''); setDisputeReason(''); }} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleCreateDispute} disabled={!disputeType || !disputeReason} className="btn btn-danger flex-1 shadow shadow-rose-500/15">
              Escalate to Editor-in-Chief
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
