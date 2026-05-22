import { useState } from 'react';
import { useVotingStore } from '../../store/votingStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useChapterStore } from '../../store/chapterStore';
import { useAuthStore } from '../../store/authStore';
import { canVoteOnDecision } from '../../utils/permissions';
import { calculateCancellationResult } from '../../utils/calculations';
import { validateDecisionReason } from '../../utils/validators';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import Modal from '../../components/Modal';
import { showToast } from '../../utils/toast';
import { CONFIG } from '../../utils/constants';
import { Gavel, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export default function DecisionListPage() {
  const { decisions, addVote, finalizeDecision } = useVotingStore();
  const { series: allSeries, updateSeriesStatus } = useSeriesStore();
  const { suspendTasksBySeries } = useChapterStore();
  const { currentUser, getUserById } = useAuthStore();
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [voteChoice, setVoteChoice] = useState('');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(null);

  const cancelDecisions = decisions.filter(d => d.decisionType === 'Cancellation' || d.decisionType === 'Change Publication Type');

  const openVote = (decision) => {
    setSelectedDecision(decision);
    setVoteChoice('');
    setReason('');
    setReasonError(null);
    setShowVoteModal(true);
  };

  const handleVote = () => {
    // BR-102: Mandatory reason
    if (voteChoice !== 'Continue') {
      const error = validateDecisionReason(reason);
      if (error) { setReasonError(error); return; }
    }

    addVote(selectedDecision.id, {
      voterId: currentUser.id,
      choice: voteChoice,
      reason: reason || `Voted: ${voteChoice}`,
      isConflict: false,
    });
    setShowVoteModal(false);
    showToast(`Vote submitted: ${voteChoice}`, 'success');
  };

  // BR-34, BR-108: Finalize cancellation
  const handleFinalize = (decision) => {
    const result = calculateCancellationResult(decision.votes);
    if (result.result === 'Pending') {
      showToast('BR-101: Quorum not reached (need ≥ 3)', 'error');
      return;
    }

    finalizeDecision(decision.id);

    // BR-104: Cascade effect
    if (result.result === 'Cancel') {
      const s = allSeries.find(s => s.id === decision.seriesId);
      if (s) {
        updateSeriesStatus(decision.seriesId, 'Cancelled');
        suspendTasksBySeries(decision.seriesId);
        showToast(`Series "${s.title}" cancelled. Chapters/tasks suspended (BR-104).`, 'warning');
      }
    } else {
      showToast('Decision: Continue — series remains active', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cancel / Change Decisions</h1>
        <p className="text-sm text-text-secondary mt-1">P9: Board decisions on series cancellation or publication type changes</p>
      </div>

      <div className="space-y-4">
        {cancelDecisions.map(d => {
          const s = allSeries.find(s => s.id === d.seriesId);
          const hasVoted = d.votes.some(v => v.voterId === currentUser.id);
          const validVotes = d.votes.filter(v => !v.isConflict);
          const quorumReached = validVotes.length >= CONFIG.QUORUM_MIN;
          const result = calculateCancellationResult(d.votes);
          const canVote = s ? canVoteOnDecision(currentUser, d, s) : false;
          const isOpen = d.status === 'Open';

          return (
            <div key={d.id} className={`glass-card p-6 ${d.status === 'Finalized' && d.result === 'Cancel' ? 'border-rose-500/30' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Gavel size={18} className="text-amber-400" />
                    <StatusBadge status={d.status === 'Finalized' ? d.result || d.status : d.status} />
                    <span className="text-xs text-text-muted">{d.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">{d.decisionType}</h3>
                  <p className="text-sm text-text-secondary">{s?.title || 'Unknown Series'}</p>
                  {d.reason && <p className="text-xs text-text-muted mt-1">Reason: {d.reason}</p>}
                </div>
                <div className="text-right text-xs text-text-muted">
                  <p>Deadline: {d.votingDeadline}</p>
                  {d.finalizedAt && <p>Finalized: {d.finalizedAt}</p>}
                </div>
              </div>

              {/* Quorum — BR-101 */}
              <div className="mb-4">
                <ProgressBar value={validVotes.length} max={CONFIG.QUORUM_MIN} label={`Quorum (BR-101: ≥ ${CONFIG.QUORUM_MIN})`} color={quorumReached ? 'success' : 'warning'} />
              </div>

              {/* BR-108: Result */}
              {validVotes.length > 0 && (
                <div className="p-3 rounded-lg bg-bg-tertiary/50 mb-4 text-xs">
                  <span className="font-semibold">Current (BR-108): </span>
                  <span className={result.result === 'Cancel' ? 'text-rose-400' : result.result === 'Continue' ? 'text-emerald-400' : 'text-amber-400'}>
                    {result.result} — {result.reason}
                  </span>
                </div>
              )}

              {/* Votes */}
              <div className="space-y-2 mb-4">
                {d.votes.map((v, i) => {
                  const voter = getUserById(v.voterId);
                  return (
                    <div key={i} className="flex items-center gap-3 text-xs p-2 rounded bg-bg-tertiary/20">
                      <span>{voter?.avatar}</span>
                      <span className="font-medium">{voter?.displayName}</span>
                      <span className={`badge ${v.choice === 'Cancel' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{v.choice}</span>
                      {v.reason && <span className="text-text-muted truncate flex-1">{v.reason}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              {isOpen && (
                <div className="flex gap-3">
                  {canVote && !hasVoted ? (
                    <button onClick={() => openVote(d)} className="btn btn-primary"><Gavel size={16} /> Cast Vote</button>
                  ) : hasVoted ? (
                    <span className="text-xs text-emerald-400">✓ You have voted</span>
                  ) : (
                    <span className="text-xs text-text-muted">Not eligible to vote</span>
                  )}
                  {quorumReached && (
                    <button onClick={() => handleFinalize(d)} className="btn btn-danger ml-auto">
                      <CheckCircle size={16} /> Finalize Decision
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vote Modal */}
      <Modal isOpen={showVoteModal} onClose={() => setShowVoteModal(false)} title="Cast Vote (P9)" size="md">
        <div className="space-y-4">
          <div className="flex gap-3">
            {['Cancel', 'Continue', 'Change'].map(choice => (
              <button key={choice} onClick={() => setVoteChoice(choice)}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  voteChoice === choice
                    ? choice === 'Cancel' ? 'bg-rose-500 text-white' : choice === 'Continue' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}>
                {choice === 'Cancel' ? <><XCircle size={16} className="inline mr-1" /> Cancel</> :
                 choice === 'Continue' ? <><CheckCircle size={16} className="inline mr-1" /> Continue</> :
                 <><ArrowRight size={16} className="inline mr-1" /> Change Type</>}
              </button>
            ))}
          </div>
          {voteChoice && voteChoice !== 'Continue' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Reason <span className="text-danger">*</span> (BR-102: Required for Cancel/Change)
              </label>
              <textarea className={`form-input h-24 resize-none ${reasonError ? 'error' : ''}`} value={reason} onChange={e => { setReason(e.target.value); setReasonError(null); }} placeholder="Provide reason..." />
              {reasonError && <p className="text-xs text-danger mt-1">{reasonError}</p>}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setShowVoteModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleVote} disabled={!voteChoice} className="btn btn-primary flex-1">Submit Vote</button>
          </div>
        </div>
      </Modal>

      <div className="glass-card p-4 text-xs text-text-muted">
        <strong>BRs enforced:</strong> BR-101 (Quorum ≥ 3), BR-102 (Mandatory Reason), BR-104 (Cascade Suspend), BR-108 (Majority {'>'} 50%)
      </div>
    </div>
  );
}
