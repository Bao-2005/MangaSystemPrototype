import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVotingStore } from '../../store/votingStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useEscalationStore } from '../../store/escalationStore';
import { canVoteOnDecision } from '../../utils/permissions';
import { validateRejectReason } from '../../utils/validators';
import { calculateVotingResult } from '../../utils/calculations';
import { CONFIG, ROLES } from '../../utils/constants';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import Modal from '../../components/Modal';
import { showToast } from '../../utils/toast';
import { ArrowLeft, ThumbsUp, ThumbsDown, AlertTriangle, Shield, Clock, CheckCircle, Timer, Crown } from 'lucide-react';

export default function VotingDetailPage() {
  const { id } = useParams();
  const allDecisions = useVotingStore(s => s.decisions);
  const { addVote, finalizeDecision, extendVotingDeadline, assignRequiredVoter, chiefFinalizeDecision } = useVotingStore();
  const { series: allSeries, proposals: allProposals, updateProposal, addSeries, activateSeries } = useSeriesStore();
  const { currentUser, getUserById, getBoardMembers } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { addChiefAction } = useEscalationStore();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reasonError, setReasonError] = useState(null);

  // Chief states
  const [showChiefExtendModal, setShowChiefExtendModal] = useState(false);
  const [showChiefVoterModal, setShowChiefVoterModal] = useState(false);
  const [showChiefOverrideModal, setShowChiefOverrideModal] = useState(false);
  const [chiefExtendDate, setChiefExtendDate] = useState('');
  const [chiefVoterId, setChiefVoterId] = useState('');
  const [chiefOverrideChoice, setChiefOverrideChoice] = useState('');
  const [chiefReason, setChiefReason] = useState('');

  const boardMembers = getBoardMembers ? getBoardMembers() : [];

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

      const mangakaUser = getUserById(mangakaId);
      const tantouEditorId = mangakaUser?.editorId || linkedProposal?.assignedEditorId;
      const editor = tantouEditorId ? getUserById(tantouEditorId) : null;

      // Activate existing series immediately, or create new active one
      if (linkedSeries) {
        activateSeries(linkedSeries.id, tantouEditorId);
      } else if (linkedProposal?.seriesId) {
        const existingSeries = useSeriesStore.getState().series.find(s => s.id === linkedProposal.seriesId);
        if (existingSeries) {
          activateSeries(linkedProposal.seriesId, tantouEditorId);
        } else {
          addSeries({
            title: linkedProposal.title,
            genre: linkedProposal.genre,
            publicationType: linkedProposal.publicationType,
            synopsis: linkedProposal.synopsis,
            mangakaId: linkedProposal.mangakaId,
            editorId: tantouEditorId,
            status: 'Active',
            assistantIds: [],
            activatedAt: new Date().toISOString(),
          });
        }
      }

      // Notify Mangaka
      if (mangakaId) {
        addNotification({
          recipientId: mangakaId,
          title: '🎉 Proposal Approved!',
          message: `Your proposal "${seriesTitle}" has been approved and activated! Your Tantou Editor ${editor?.displayName || 'assigned'} has been confirmed.`,
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

  // Chief action handlers
  const handleChiefExtendDeadline = () => {
    if (!chiefExtendDate) { showToast('Please select a new deadline', 'error'); return; }
    extendVotingDeadline(decision.id, chiefExtendDate);
    addChiefAction({
      type: 'Extend Deadline',
      entityType: 'BoardDecision',
      entityId: decision.id,
      description: `Extended voting deadline for ${decision.id} to ${chiefExtendDate}`,
      reason: chiefReason || 'Chief override extension'
    });
    showToast(`Deadline extended to ${chiefExtendDate}`, 'success');
    setShowChiefExtendModal(false);
    setChiefExtendDate('');
    setChiefReason('');
  };

  const handleChiefAssignVoter = () => {
    if (!chiefVoterId) { showToast('Please select a board member', 'error'); return; }
    const voter = getUserById(chiefVoterId);
    assignRequiredVoter(decision.id, chiefVoterId);
    addChiefAction({
      type: 'Assign Required Voter',
      entityType: 'BoardDecision',
      entityId: decision.id,
      description: `Assigned ${voter?.displayName} as required voter for ${decision.id}`,
      reason: chiefReason || 'Quorum not met'
    });
    addNotification({
      recipientId: chiefVoterId,
      title: '👑 Required Vote',
      message: `The Editor-in-Chief requires your vote on decision ${decision.id}. Please vote promptly.`,
      type: 'warning',
      link: `/voting/${decision.id}`
    });
    showToast(`${voter?.displayName} assigned as required voter`, 'success');
    setShowChiefVoterModal(false);
    setChiefVoterId('');
    setChiefReason('');
  };

  const handleChiefOverride = () => {
    if (!chiefOverrideChoice) { showToast('Please select Approve or Reject', 'error'); return; }
    if (!chiefReason) { showToast('Please provide a reason for override', 'error'); return; }
    
    chiefFinalizeDecision(decision.id, chiefOverrideChoice === 'approve' ? 'Approved' : 'Rejected', chiefReason);
    
    addChiefAction({
      type: 'Chief Override Finalize',
      entityType: 'BoardDecision',
      entityId: decision.id,
      description: `Chief override finalized ${decision.id} as ${chiefOverrideChoice === 'approve' ? 'Approved' : 'Rejected'}`,
      reason: chiefReason
    });

    const seriesTitle = displayEntity?.title || decision.proposalTitle || 'Unknown';
    const mangakaId = linkedProposal?.mangakaId || linkedSeries?.mangakaId;
    
    if (chiefOverrideChoice === 'approve') {
      if (linkedProposal) {
        updateProposal(linkedProposal.id, { status: 'Approved' });
      }

      const mangakaUser = getUserById(mangakaId);
      const tantouEditorId = mangakaUser?.editorId || linkedProposal?.assignedEditorId;
      const editor = tantouEditorId ? getUserById(tantouEditorId) : null;

      if (linkedSeries) {
        activateSeries(linkedSeries.id, tantouEditorId);
      } else if (linkedProposal?.seriesId) {
        const existingSeries = useSeriesStore.getState().series.find(s => s.id === linkedProposal.seriesId);
        if (existingSeries) {
          activateSeries(linkedProposal.seriesId, tantouEditorId);
        } else {
          addSeries({
            title: linkedProposal.title,
            genre: linkedProposal.genre,
            publicationType: linkedProposal.publicationType,
            synopsis: linkedProposal.synopsis,
            mangakaId: linkedProposal.mangakaId,
            editorId: tantouEditorId,
            status: 'Active',
            assistantIds: [],
            activatedAt: new Date().toISOString(),
          });
        }
      }
      if (mangakaId) {
        addNotification({
          recipientId: mangakaId,
          title: '🎉 Proposal Approved!',
          message: `Your proposal "${seriesTitle}" has been approved and activated by the Editor-in-Chief! Your Tantou Editor ${editor?.displayName || 'assigned'} has been confirmed.`,
          type: 'success',
          link: '/series',
        });
      }
    } else {
      if (linkedProposal) {
        updateProposal(linkedProposal.id, { status: 'Rejected' });
      }
      if (linkedSeries) {
        useSeriesStore.getState().updateSeriesStatus(linkedSeries.id, 'Rejected');
      }
      if (mangakaId) {
        addNotification({
          recipientId: mangakaId,
          title: '❌ Proposal Rejected',
          message: `Your proposal "${seriesTitle}" has been rejected by the Editor-in-Chief.`,
          type: 'alert',
          link: '/series',
        });
      }
    }

    showToast(`Decision finalized via Chief override: ${chiefOverrideChoice === 'approve' ? 'Approved' : 'Rejected'}`, 'success');
    setShowChiefOverrideModal(false);
    setChiefOverrideChoice('');
    setChiefReason('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/voting" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={16} /> Back to Voting
      </Link>

      {/* Required voter warning */}
      {decision.requiredVoters?.includes(currentUser.id) && !hasVoted && !isFinalized && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 shadow-lg shadow-amber-500/5">
          <Crown size={24} className="text-amber-400 flex-shrink-0 mt-0.5 animate-bounce" />
          <div>
            <h3 className="text-sm font-bold text-amber-400">👑 Chief Directive — Mandatory Vote Required</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              The Editor-in-Chief has designated you as a <strong>required voter</strong> for this decision. Your vote is mandatory to reach the quorum threshold and complete the review process. Please cast your vote (Approve or Reject) as soon as possible.
            </p>
          </div>
        </div>
      )}

      {/* Decision Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-3">
          <StatusBadge status={isFinalized ? decision.result : decision.status} size="lg" />
          <span className="text-xs text-text-muted">{decision.id}</span>
          {decision.isExtended && (
            <span className="badge bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">📅 Deadline Extended</span>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-1">{decision.decisionType}</h1>
        <p className="text-sm text-text-secondary">{displayEntity?.title || decision.proposalTitle || 'Unknown Series'}</p>
        {displayEntity && (
          <p className="text-xs text-text-muted mt-2 line-clamp-3">{displayEntity.synopsis}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-text-muted">
          <span>Created: {decision.createdAt}</span>
          <span className="flex items-center gap-1">
            Deadline: <span className={decision.isExtended ? 'text-cyan-400 font-bold' : ''}>{decision.votingDeadline}</span>
            {decision.isExtended && <span className="text-cyan-400 font-semibold bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/20 ml-1 text-[9px]">(Extended by Chief)</span>}
          </span>
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

          {/* BR-No-Response-Escalation: Board member can escalate to Chief when deadline expired + quorum not met */}
          {!isFinalized && !quorumReached && currentUser.roles.includes('Editorial Board') && (() => {
            const deadline = new Date(decision.votingDeadline + 'T23:59:59');
            return deadline < new Date();
          })() && (
            <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <p className="text-xs text-rose-400 font-semibold mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Deadline expired — quorum not reached
              </p>
              <p className="text-xs text-text-muted mb-3">The voting deadline has passed without enough votes. This should be escalated to the Editor-in-Chief for resolution (BR-No-Response-Escalation).</p>
              <button
                onClick={() => {
                  const { createEscalation, addChiefAction } = useEscalationStore.getState();
                  const existing = useEscalationStore.getState().escalations.find(e =>
                    e.type === 'Insufficient Votes' && e.entityId === decision.id && e.status === 'Pending'
                  );
                  if (existing) { showToast('Escalation already exists for this decision', 'warning'); return; }
                  createEscalation({
                    type: 'Insufficient Votes',
                    entityType: 'BoardDecision',
                    entityId: decision.id,
                    seriesId: decision.seriesId,
                    title: `Decision ${decision.id} has insufficient votes (deadline expired)`,
                    description: `Board Decision ${decision.id} deadline has passed with only ${validVotes.length}/${CONFIG.QUORUM_MIN} votes. Escalated by ${currentUser.displayName} for Chief resolution.`,
                    priority: 'Critical',
                    relatedUserId: null,
                    decisionId: decision.id,
                  });
                  addChiefAction({
                    type: 'Escalate to Chief',
                    entityType: 'BoardDecision',
                    entityId: decision.id,
                    description: `Escalated ${decision.id} to Chief — quorum not met after deadline`,
                    reason: `${validVotes.length}/${CONFIG.QUORUM_MIN} votes received`,
                  });
                  addNotification({ recipientId: 'U12', title: '🚨 Escalation: Insufficient Votes', message: `Decision ${decision.id} deadline has expired with insufficient votes. Please review in the Chief Dashboard.`, type: 'warning', link: '/chief' });
                  showToast('Escalated to Editor-in-Chief', 'success');
                }}
                className="btn btn-ghost text-xs py-1.5 px-3 text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 w-full"
              >
                <AlertTriangle size={14} /> Escalate to Editor-in-Chief
              </button>
            </div>
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
          {decision.chiefOverride && (
            <span className="badge bg-amber-500/20 text-amber-400 text-xs mt-1 inline-block">👑 Finalized via Chief Override</span>
          )}
          {decision.chiefOverrideReason && (
            <p className="text-xs text-text-secondary mt-1 italic">" {decision.chiefOverrideReason} "</p>
          )}
          <p className="text-xs text-text-muted mt-1">Finalized at {decision.finalizedAt}</p>
          {decision.result === 'Approved' && linkedProposal && (
            <p className="text-xs text-emerald-400 mt-2">Series is now Active. Your Tantou Editor has been confirmed.</p>
          )}
        </div>
      )}

      {/* Editor-in-Chief Actions Panel */}
      {currentUser?.roles?.includes(ROLES.EDITOR_IN_CHIEF) && (
        <div className="glass-card p-5 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={20} className="text-amber-400" />
            <h2 className="text-sm font-bold text-amber-400">Editor-in-Chief Executive Actions</h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowChiefExtendModal(true)} className="btn btn-ghost text-xs py-1.5 px-3 border border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
              Extend Deadline
            </button>
            <button onClick={() => setShowChiefVoterModal(true)} className="btn btn-ghost text-xs py-1.5 px-3 border border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
              Assign Required Voter
            </button>
            {!isFinalized && (
              <button onClick={() => setShowChiefOverrideModal(true)} className="btn btn-danger text-xs py-1.5 px-3 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30">
                Override Finalize
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reject Vote Modal — BR-35 */}
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

      {/* Chief Extend Deadline Modal */}
      <Modal isOpen={showChiefExtendModal} onClose={() => { setShowChiefExtendModal(false); setChiefReason(''); setChiefExtendDate(''); }} title="👑 Extend Voting Deadline" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              New Deadline <span className="text-danger">*</span>
            </label>
            <input type="date" className="form-input" value={chiefExtendDate} onChange={e => setChiefExtendDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Reason (optional)</label>
            <textarea className="form-input h-20 resize-none" value={chiefReason} onChange={e => setChiefReason(e.target.value)} placeholder="Reason for extension..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowChiefExtendModal(false); setChiefReason(''); setChiefExtendDate(''); }} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleChiefExtendDeadline} disabled={!chiefExtendDate} className="btn btn-primary flex-1">
              Extend Deadline
            </button>
          </div>
        </div>
      </Modal>

      {/* Chief Assign Required Voter Modal */}
      <Modal isOpen={showChiefVoterModal} onClose={() => { setShowChiefVoterModal(false); setChiefReason(''); setChiefVoterId(''); }} title="👑 Assign Required Voter" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Select Board Member <span className="text-danger">*</span>
            </label>
            <select className="form-input" value={chiefVoterId} onChange={e => setChiefVoterId(e.target.value)}>
              <option value="">Select a board member...</option>
              {boardMembers.map(m => (
                <option key={m.id} value={m.id}>{m.avatar} {m.displayName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Reason (optional)</label>
            <textarea className="form-input h-20 resize-none" value={chiefReason} onChange={e => setChiefReason(e.target.value)} placeholder="Reason for assignment..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowChiefVoterModal(false); setChiefReason(''); setChiefVoterId(''); }} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleChiefAssignVoter} disabled={!chiefVoterId} className="btn btn-primary flex-1">
              Assign Voter
            </button>
          </div>
        </div>
      </Modal>

      {/* Chief Override Finalize Modal */}
      <Modal isOpen={showChiefOverrideModal} onClose={() => { setShowChiefOverrideModal(false); setChiefReason(''); setChiefOverrideChoice(''); }} title="👑 Chief Override Finalize" size="md">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <strong>Warning:</strong> This will bypass the normal voting process and finalize the decision with your authority as Editor-in-Chief.
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Decision</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setChiefOverrideChoice('approve')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${chiefOverrideChoice === 'approve' ? 'bg-emerald-500 text-white font-bold shadow' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}
              >
                <CheckCircle size={16} className="inline mr-1" /> Approve
              </button>
              <button
                type="button"
                onClick={() => setChiefOverrideChoice('reject')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${chiefOverrideChoice === 'reject' ? 'bg-rose-500 text-white font-bold shadow' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}
              >
                <AlertTriangle size={16} className="inline mr-1" /> Reject
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Reason <span className="text-danger">*</span>
            </label>
            <textarea className="form-input h-24 resize-none" value={chiefReason} onChange={e => setChiefReason(e.target.value)} placeholder="Provide detailed reason for override..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowChiefOverrideModal(false); setChiefReason(''); setChiefOverrideChoice(''); }} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleChiefOverride} disabled={!chiefOverrideChoice || !chiefReason} className="btn btn-danger flex-1">
              Override Finalize
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
