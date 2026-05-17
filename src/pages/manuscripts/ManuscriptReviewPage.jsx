import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useManuscriptStore } from '../../store/manuscriptStore';
import { useChapterStore } from '../../store/chapterStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/StatusBadge';
import { showToast } from '../../components/Toast';
import { calculateChapterCompletion, formatDate } from '../../utils/calculations';
import { canReviewManuscript } from '../../utils/permissions';
import { CONFIG } from '../../utils/constants';
import { ArrowLeft, Check, RotateCcw, MessageSquare, AlertTriangle } from 'lucide-react';

export default function ManuscriptReviewPage() {
  const { id } = useParams();
  const { manuscripts, annotations, reviewManuscript, addAnnotation, getAnnotationsByManuscript } = useManuscriptStore();
  const ms = manuscripts.find(m => m.id === id);
  const { chapters, tasks } = useChapterStore();
  const { series } = useSeriesStore();
  const { currentUser } = useAuthStore();
  const [feedback, setFeedback] = useState('');
  const [newAnnotation, setNewAnnotation] = useState('');

  if (!ms) return <div className="text-center py-20 text-text-muted">Manuscript not found</div>;

  const chapter = chapters.find(c => c.id === ms.chapterId);
  const linkedSeries = series.find(s => s.id === ms.seriesId);
  const chapterTasks = tasks.filter(t => t.chapterId === ms.chapterId);
  const completion = calculateChapterCompletion(chapterTasks);
  const msAnnotations = getAnnotationsByManuscript(ms.id);

  // BR-74: Check if user is the assigned editor
  const canReview = linkedSeries ? canReviewManuscript(currentUser, linkedSeries) : false;
  // BR-75: Only review latest version
  const allVersions = manuscripts.filter(m => m.chapterId === ms.chapterId);
  const isLatest = allVersions.every(m => m.version <= ms.version);
  // BR-83: Max revision limit
  const atMaxRevisions = ms.revisionCount >= CONFIG.MAX_REVISION_ROUNDS;
  // BR-84: Completion requirement
  const canApprove = completion === 100;

  const handleApprove = () => {
    if (!canApprove) {
      showToast('BR-84: Cannot approve — chapter completion < 100%', 'error');
      return;
    }
    reviewManuscript(ms.id, 'Approved', feedback || 'Approved.');
    showToast('Manuscript approved! (BR-80: Locked)', 'success');
  };

  const handleRevision = () => {
    if (atMaxRevisions) {
      showToast('BR-83: Maximum 3 revisions reached — escalate to Board', 'error');
      return;
    }
    if (!feedback.trim()) {
      showToast('Feedback is required for revision request', 'error');
      return;
    }
    reviewManuscript(ms.id, 'Revision Required', feedback);
    showToast('Revision requested', 'warning');
  };

  const handleAddAnnotation = () => {
    if (!newAnnotation.trim()) return;
    addAnnotation({
      manuscriptId: ms.id, version: ms.version,
      page: 1, x: Math.random() * 300, y: Math.random() * 400,
      content: newAnnotation, author: currentUser.id,
    });
    setNewAnnotation('');
    showToast('Annotation added', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/manuscripts" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={16} /> Back to Manuscripts
      </Link>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={ms.status} size="lg" />
              <span className="badge bg-primary/20 text-primary">v{ms.version}</span>
              {!isLatest && <span className="badge bg-amber-500/20 text-amber-400">BR-75: Not Latest</span>}
            </div>
            <h1 className="text-xl font-bold">{linkedSeries?.title} — Ch.{chapter?.chapterNo}</h1>
            <p className="text-sm text-text-muted">{chapter?.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-bg-tertiary">
            <p className="text-text-muted">Submitted</p>
            <p className="font-semibold">{formatDate(ms.submittedAt)}</p>
          </div>
          <div className="p-3 rounded-lg bg-bg-tertiary">
            <p className="text-text-muted">Revisions (BR-83: max 3)</p>
            <p className="font-semibold">{ms.revisionCount}/{CONFIG.MAX_REVISION_ROUNDS}</p>
          </div>
          <div className="p-3 rounded-lg bg-bg-tertiary">
            <p className="text-text-muted">Completion (BR-84)</p>
            <p className={`font-semibold ${completion === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>{completion}%</p>
          </div>
        </div>
      </div>

      {/* Manuscript Preview (mock) */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-bold mb-4">Manuscript Preview</h2>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: Math.min(8, chapter?.totalPages || 8) }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-gradient-to-br from-bg-tertiary to-bg-secondary flex items-center justify-center border border-border">
              <span className="text-text-muted text-sm">Page {i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Annotations — BR-78 */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-bold mb-4">Annotations (BR-78: version-bound)</h2>
        {msAnnotations.length === 0 ? (
          <p className="text-sm text-text-muted">No annotations for this version</p>
        ) : (
          <div className="space-y-2">
            {msAnnotations.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary/30">
                <MessageSquare size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-text-primary">Page {a.page}</span>
                    <span className="text-text-muted">v{a.version}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{a.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {canReview && isLatest && ms.status !== 'Approved' && (
          <div className="flex gap-2 mt-3">
            <input
              type="text" className="form-input text-sm" placeholder="Add annotation..."
              value={newAnnotation} onChange={e => setNewAnnotation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddAnnotation()}
            />
            <button onClick={handleAddAnnotation} className="btn btn-ghost text-sm">Add</button>
          </div>
        )}
      </div>

      {/* Review Actions */}
      {canReview && isLatest && ms.status !== 'Approved' && (
        <div className="glass-card p-6">
          <h2 className="text-sm font-bold mb-4">Review Decision</h2>

          {atMaxRevisions && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 mb-4">
              <AlertTriangle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-400">BR-83: Maximum Revisions Reached</p>
                <p className="text-xs text-text-secondary">This chapter has reached 3 revision rounds. Further revision must be escalated to the Board.</p>
              </div>
            </div>
          )}

          {!canApprove && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
              <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400">BR-84: Cannot approve — chapter completion is {completion}%, must be 100%</p>
            </div>
          )}

          <textarea
            className="form-input h-24 resize-none mb-3" placeholder="Provide feedback..."
            value={feedback} onChange={e => setFeedback(e.target.value)}
          />

          <div className="flex gap-3">
            <button onClick={handleApprove} disabled={!canApprove} className="btn btn-success flex-1">
              <Check size={16} /> Approve (BR-80: Lock)
            </button>
            <button onClick={handleRevision} disabled={atMaxRevisions} className="btn btn-warning flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <RotateCcw size={16} /> Request Revision
            </button>
          </div>
        </div>
      )}

      {ms.status === 'Approved' && (
        <div className="glass-card p-6 text-center border-emerald-500/30">
          <Check size={40} className="mx-auto text-emerald-400 mb-2" />
          <p className="text-lg font-bold text-emerald-400">Manuscript Approved</p>
          <p className="text-xs text-text-muted mt-1">BR-80: This manuscript is now locked. Any changes require a new version.</p>
        </div>
      )}
    </div>
  );
}
