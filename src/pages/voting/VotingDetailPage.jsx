import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVotingStore } from '../../store/votingStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { canVoteOnDecision } from '../../utils/permissions';
import { validateRejectReason } from '../../utils/validators';
import { calculateVotingResult } from '../../utils/calculations';
import { CONFIG } from '../../utils/constants';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import Modal from '../../components/Modal';
import { showToast } from '../../components/Toast';
import { ArrowLeft, ThumbsUp, ThumbsDown, AlertTriangle, Shield, Clock, CheckCircle, Timer } from 'lucide-react';

export default function VotingDetailPage() {
  const { id } = useParams();
  const allDecisions = useVotingStore(s => s.decisions);
  const { addVote, finalizeDecision } = useVotingStore();
  const { series: allSeries, proposals: allProposals, updateProposal, addSeries } = useSeriesStore();
  const { currentUser, getUserById } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reasonError, setReasonError] = useState(null);

  const decision = useMemo(() => allDecisions.find(d => d.id === id), [allDecisions, id]);

  if (!decision) return <div className="text-center py-20 text-text-muted">Decision not found</div>;

  // Issue #2: Look up linked series OR proposal (since proposals use proposal ID as seriesId)
  const linkedSeries = allSeries.find(s => s.id === decision.seriesId);
  const linkedProposal = allProposals.find(p =>
    p.id === decision.proposalId ||  // direct proposal reference
    p.id === decision.seriesId ||     // old-style: proposal ID used as seriesId
    p.seriesId === decision.seriesId  // proposal linked to this series
  );
  const displayEntity = linkedSeries || linkedProposal;

  // BR-27, BR-28: Check voting eligibility
  // For proposals, we use the proposal's mangakaId for conflict detection
  const conflictCheckEntity = linkedSeries || (linkedProposal ? {
    mangakaId: linkedProposal.mangakaId,
    editorId: null,
    assistantIds: [],
  } : null);

  const canVote = conflictCheckEntity ? canVoteOnDecision(currentUser, decision, conflictCheckEntity) : false;
  const hasVoted = decision.votes.some(v => v.voterId === currentUser.id);
  const validVotes = decision.votes.filter(v => !v.isConflict);
  const quorumReached = validVotes.length >= CONFIG.QUORUM_MIN;
  const votingResult = calculateVotingResult(decision.votes);
  const isFinalized = decision.status === 'Finalized';

  // Conflict reason
  let conflictReason = null;
  if (conflictCheckEntity) {
    if (conflictCheckEntity.mangakaId === currentUser.id) conflictReason = 'You are the Mangaka of this series';
    else if (conflictCheckEntity.editorId === currentUser.id) conflictReason = 'You are the Tantou Editor of this series';
    else if (conflictCheckEntity.assistantIds?.includes(currentUser.id)) conflictReason = 'You are an Assistant on this series';
  }

  const handleApprove = () => {
    addVote(decision.id, { voterId: currentUser.id, choice: 'Approve', reason: 'Approved.', isConflict: false });
    // Issue #4: Auto-update proposal status to "Under Review" when first vote comes in
    if (linkedProposal && linkedProposal.status === 'Pending Review') {
      updateProposal(linkedProposal.id, { status: 'Under Review' });
    }
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
    // Issue #4: Auto-update proposal status to "Under Review" when first vote comes in
    if (linkedProposal && linkedProposal.status === 'Pending Review') {
      updateProposal(linkedProposal.id, { status: 'Under Review' });
    }
    setShowRejectModal(false);
    showToast('Vote submitted: Reject', 'success');
  };

  // Issue #1: After finalize, update proposal status AND create/update series
  const handleFinalize = () => {
    finalizeDecision(decision.id);

    // Get fresh decision state after finalize
    const updatedDecision = useVotingStore.getState().decisions.find(d => d.id === decision.id);
    const result = updatedDecision?.result;
    const seriesTitle = displayEntity?.title || decision.proposalTitle || 'Unknown';
    const mangakaId = linkedProposal?.mangakaId || linkedSeries?.mangakaId;

    if (result === 'Approved') {
      // Update proposal status if exists
      if (linkedProposal) {
        updateProposal(linkedProposal.id, { status: 'Approved' });
      }

      // Update existing series to Approved, or create new one
      if (linkedSeries) {
        useSeriesStore.getState().updateSeriesStatus(linkedSeries.id, 'Approved');
      } else if (linkedProposal?.seriesId) {
        const existingSeries = useSeriesStore.getState().series.find(s => s.id === linkedProposal.seriesId);
        if (existingSeries) {
          useSeriesStore.getState().updateSeriesStatus(linkedProposal.seriesId, 'Approved');
        } else {
          addSeries({
            title: linkedProposal.title,
            genre: linkedProposal.genre,
            publicationType: linkedProposal.publicationType,
            synopsis: linkedProposal.synopsis,
            mangakaId: linkedProposal.mangakaId,
            editorId: null,
            status: 'Approved',
            assistantIds: [],
            activatedAt: null,
          });
        }
      }

      // Notify Mangaka
      if (mangakaId) {
        addNotification({
          recipientId: mangakaId,
          title: '🎉 Proposal Approved!',
          message: `Your proposal "${seriesTitle}" has been approved by the Editorial Board! An editor will be assigned before the series can be activated.`,
          type: 'success',
          link: '/series',
        });
      }
      showToast(`Decision finalized: APPROVED — "${seriesTitle}"`, 'success');

    } else if (result === 'Rejected') {
      // Update proposal status
      if (linkedProposal) {
        updateProposal(linkedProposal.id, { status: 'Rejected' });
      }
      // Update series status to rejected
      if (linkedSeries) {
        useSeriesStore.getState().updateSeriesStatus(linkedSeries.id, 'Rejected');
      }

      // Notify Mangaka
      if (mangakaId) {
        addNotification({
          recipientId: mangakaId,
          title: '❌ Proposal Rejected',
          message: `Your proposal "${seriesTitle}" has been rejected by the Editorial Board. You may submit a new proposal.`,
          type: 'alert',
          link: '/series',
        });
      }
      showToast(`Decision finalized: REJECTED — "${seriesTitle}"`, 'warning');

    } else if (result === 'Deferred') {
      showToast('Decision finalized: DEFERRED — Tie vote, no majority', 'warning');
    } else {
      showToast('Decision finalized!', 'success');
    }
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
        <p className="text-sm text-text-secondary">{displayEntity?.title || decision.proposalTitle || 'Unknown Series'}</p>
        {displayEntity && (
          <p className="text-xs text-text-muted mt-2 line-clamp-3">{displayEntity.synopsis}</p>
        )}
        <div className="flex gap-4 mt-4 text-xs text-text-muted">
          <span>Created: {decision.createdAt}</span>
          <span>Deadline: {decision.votingDeadline}</span>
          {decision.finalizedAt && <span>Finalized: {decision.finalizedAt}</span>}
        </div>
        {/* Voting window & countdown */}
        {!isFinalized && (() => {
          const now = new Date();
          const deadline = new Date(decision.votingDeadline + 'T23:59:59');
          const diffMs = deadline - now;
          const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const isUrgent = daysLeft <= 2;
          const isExpired = daysLeft < 0;
          return (
            <div className={`mt-3 p-3 rounded-lg flex items-center gap-3 ${
              isExpired ? 'bg-red-500/10 border border-red-500/20' :
              isUrgent ? 'bg-amber-500/10 border border-amber-500/20' :
              'bg-primary/10 border border-primary/20'
            }`}>
              <Timer size={18} className={isExpired ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-primary'} />
              <div>
                <p className={`text-sm font-semibold ${isExpired ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-primary'}`}>
                  {isExpired ? 'Voting period expired' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
                </p>
                <p className="text-xs text-text-muted">7-day voting window (CONFIG.VOTING_WINDOW_DAYS)</p>
              </div>
            </div>
          );
        })()}
        {/* Show linked proposal info */}
        {linkedProposal && (
          <div className="mt-3 p-3 rounded-lg bg-bg-tertiary/50 text-xs">
            <span className="font-semibold">Proposal: </span>
            <span className="text-text-secondary">{linkedProposal.id} — </span>
            <StatusBadge status={linkedProposal.status} />
            <span className="text-text-muted ml-2">by {getUserById(linkedProposal.mangakaId)?.displayName}</span>
          </div>
        )}
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

      {/* Show finalized result with details */}
      {isFinalized && (
        <div className={`glass-card p-6 text-center ${
          decision.result === 'Approved' ? 'border-emerald-500/30' : 
          decision.result === 'Rejected' ? 'border-rose-500/30' : 'border-amber-500/30'
        }`}>
          <CheckCircle size={40} className={`mx-auto mb-2 ${
            decision.result === 'Approved' ? 'text-emerald-400' : 
            decision.result === 'Rejected' ? 'text-rose-400' : 'text-amber-400'
          }`} />
          <p className={`text-lg font-bold ${
            decision.result === 'Approved' ? 'text-emerald-400' : 
            decision.result === 'Rejected' ? 'text-rose-400' : 'text-amber-400'
          }`}>Decision: {decision.result}</p>
          <p className="text-xs text-text-muted mt-1">Finalized at {decision.finalizedAt}</p>
          {decision.result === 'Approved' && linkedProposal && (
            <p className="text-xs text-emerald-400 mt-2">Series has been created. An editor needs to be assigned before activation.</p>
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
