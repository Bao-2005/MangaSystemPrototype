import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVotingStore } from '../../store/votingStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import { canVoteOnDecision } from '../../utils/permissions';
import { validateRejectReason } from '../../utils/validators';
import { calculateVotingResult } from '../../utils/calculations';
import { CONFIG } from '../../utils/constants';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import Modal from '../../components/Modal';
import { showToast } from '../../components/Toast';
import { ArrowLeft, ThumbsUp, ThumbsDown, AlertTriangle, Shield, Clock, CheckCircle } from 'lucide-react';

export default function VotingDetailPage() {
  const { id } = useParams();
  const allDecisions = useVotingStore(s => s.decisions);
  const { addVote, finalizeDecision } = useVotingStore();
  const { series: allSeries } = useSeriesStore();
  const { currentUser, getUserById } = useAuthStore();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reasonError, setReasonError] = useState(null);

  const decision = useMemo(() => allDecisions.find(d => d.id === id), [allDecisions, id]);

  if (!decision) return <div className="text-center py-20 text-text-muted">Decision not found</div>;

  const linkedSeries = allSeries.find(s => s.id === decision.seriesId);

  // BR-27, BR-28: Check voting eligibility
  const canVote = linkedSeries ? canVoteOnDecision(currentUser, decision, linkedSeries) : false;
  const hasVoted = decision.votes.some(v => v.voterId === currentUser.id);
  const validVotes = decision.votes.filter(v => !v.isConflict);
  const quorumReached = validVotes.length >= CONFIG.QUORUM_MIN;
  const votingResult = calculateVotingResult(decision.votes);
  const isFinalized = decision.status === 'Finalized';

  // Conflict reason
  let conflictReason = null;
  if (linkedSeries) {
    if (linkedSeries.mangakaId === currentUser.id) conflictReason = 'You are the Mangaka of this series';
    else if (linkedSeries.editorId === currentUser.id) conflictReason = 'You are the Tantou Editor of this series';
    else if (linkedSeries.assistantIds?.includes(currentUser.id)) conflictReason = 'You are an Assistant on this series';
  }

  const handleApprove = () => {
    addVote(decision.id, { voterId: currentUser.id, choice: 'Approve', reason: 'Approved.', isConflict: false });
    showToast('Vote submitted: Approve', 'success');
  };

  const handleReject = () => {
    // BR-35: Reject reason ≥ 50 chars
    const error = validateRejectReason(rejectReason);
    if (error) {
      setReasonError(error);
      return;
    }
    addVote(decision.id, { voterId: currentUser.id, choice: 'Reject', reason: rejectReason, isConflict: false });
    setShowRejectModal(false);
    showToast('Vote submitted: Reject', 'success');
  };

  const handleFinalize = () => {
    finalizeDecision(decision.id);
    showToast('Decision finalized!', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/voting" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={16} /> Back to Voting
      </Link>

      {/* Decision Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-3">
          <StatusBadge status={isFinalized ? decision.result : decision.status} size="lg" />
          <span className="text-xs text-text-muted">{decision.id}</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">{decision.decisionType}</h1>
        <p className="text-sm text-text-secondary">{linkedSeries?.title || decision.proposalTitle || 'Unknown Series'}</p>
        {linkedSeries && (
          <p className="text-xs text-text-muted mt-2 line-clamp-3">{linkedSeries.synopsis}</p>
        )}
        <div className="flex gap-4 mt-4 text-xs text-text-muted">
          <span>Created: {decision.createdAt}</span>
          <span>Deadline: {decision.votingDeadline}</span>
          {decision.finalizedAt && <span>Finalized: {decision.finalizedAt}</span>}
        </div>
      </div>

      {/* BR-29: Quorum Progress */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-bold mb-3">Quorum Progress (BR-29: ≥ {CONFIG.QUORUM_MIN} votes required)</h2>
        <ProgressBar value={validVotes.length} max={CONFIG.QUORUM_MIN} label="Valid Votes" color={quorumReached ? 'success' : 'warning'} />
        <div className="flex items-center gap-2 mt-2">
          {quorumReached
            ? <><CheckCircle size={14} className="text-emerald-400" /><span className="text-xs text-emerald-400">Quorum reached</span></>
            : <><Clock size={14} className="text-amber-400" /><span className="text-xs text-amber-400">Need {CONFIG.QUORUM_MIN - validVotes.length} more vote(s)</span></>
          }
        </div>
        {/* BR-33: Result preview */}
        {validVotes.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-bg-tertiary/50 text-xs">
            <span className="font-semibold">Current result (BR-33): </span>
            <span className={votingResult.result === 'Approved' ? 'text-emerald-400' : votingResult.result === 'Rejected' ? 'text-rose-400' : 'text-amber-400'}>
              {votingResult.result} — {votingResult.reason}
            </span>
          </div>
        )}
      </div>

      {/* Votes list */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-bold mb-3">Votes ({decision.votes.length})</h2>
        {decision.votes.length === 0 ? (
          <p className="text-sm text-text-muted">No votes yet</p>
        ) : (
          <div className="space-y-3">
            {decision.votes.map((v, i) => {
              const voter = getUserById(v.voterId);
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary/30">
                  <span className="text-xl">{voter?.avatar}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{voter?.displayName}</span>
                      <span className={`badge ${v.choice === 'Approve' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {v.choice}
                      </span>
                      {v.isConflict && <span className="badge bg-amber-500/20 text-amber-400">⚠ Conflict (BR-30: Excluded)</span>}
                    </div>
                    {v.reason && <p className="text-xs text-text-secondary mt-1">{v.reason}</p>}
                    <p className="text-[10px] text-text-muted mt-1">{v.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Voting Actions */}
      {!isFinalized && (
        <div className="glass-card p-5">
          {/* BR-28: Conflict warning */}
          {conflictReason && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
              <Shield size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-400">Conflict of Interest (BR-28)</p>
                <p className="text-xs text-text-secondary">{conflictReason}. Your vote would be excluded from quorum.</p>
              </div>
            </div>
          )}

          {hasVoted ? (
            <div className="text-center py-4">
              <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-sm text-emerald-400 font-semibold">You have already voted (BR-32)</p>
            </div>
          ) : canVote ? (
            <div className="flex gap-3">
              <button onClick={handleApprove} className="btn btn-success flex-1">
                <ThumbsUp size={16} /> Approve
              </button>
              <button onClick={() => setShowRejectModal(true)} className="btn btn-danger flex-1">
                <ThumbsDown size={16} /> Reject
              </button>
            </div>
          ) : (
            <p className="text-center text-sm text-text-muted py-4">You are not eligible to vote on this decision</p>
          )}

          {/* Finalize button — BR-34 */}
          {quorumReached && !isFinalized && (
            <button onClick={handleFinalize} className="btn btn-primary w-full mt-3">
              <CheckCircle size={16} /> Finalize Decision (BR-34)
            </button>
          )}
        </div>
      )}

      {/* Reject Modal — BR-35 */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Vote: Reject">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Rejection Reason <span className="text-danger">*</span>
              <span className="text-xs text-text-muted ml-2">(min {CONFIG.REJECT_REASON_MIN_LENGTH} chars — BR-35)</span>
            </label>
            <textarea
              className={`form-input h-32 resize-none ${reasonError ? 'error' : ''}`}
              placeholder="Provide detailed reason for rejection..."
              value={rejectReason} onChange={e => { setRejectReason(e.target.value); setReasonError(null); }}
            />
            <div className="flex justify-between mt-1">
              {reasonError && <p className="text-xs text-danger">{reasonError}</p>}
              <p className="text-xs text-text-muted ml-auto">{rejectReason.length}/{CONFIG.REJECT_REASON_MIN_LENGTH} min</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowRejectModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleReject} className="btn btn-danger flex-1">Submit Reject Vote</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
