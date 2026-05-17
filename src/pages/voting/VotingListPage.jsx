import { Link } from 'react-router-dom';
import { useVotingStore } from '../../store/votingStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/StatusBadge';
import { Vote, Clock, CheckCircle } from 'lucide-react';
import { CONFIG } from '../../utils/constants';

export default function VotingListPage() {
  const { decisions } = useVotingStore();
  const { series } = useSeriesStore();
  const user = useAuthStore(s => s.currentUser);

  const openDecisions = decisions.filter(d => d.status === 'Open' && d.decisionType === 'Series Approval');
  const closedDecisions = decisions.filter(d => d.status === 'Finalized' && d.decisionType === 'Series Approval');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Board Voting</h1>
        <p className="text-sm text-text-secondary mt-1">Review and vote on series proposals (quorum ≥ {CONFIG.QUORUM_MIN})</p>
      </div>

      {/* Open */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock size={18} className="text-amber-400" /> Open Votes ({openDecisions.length})
        </h2>
        {openDecisions.length === 0 ? (
          <div className="glass-card p-8 text-center text-text-muted">No open votes</div>
        ) : (
          <div className="space-y-3">
            {openDecisions.map(d => {
              const s = series.find(s => s.id === d.seriesId);
              const hasVoted = d.votes.some(v => v.voterId === user.id);
              const quorumReached = d.votes.filter(v => !v.isConflict).length >= CONFIG.QUORUM_MIN;
              return (
                <Link key={d.id} to={`/voting/${d.id}`} className="glass-card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-all">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <Vote size={24} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-text-primary">{s?.title || 'Unknown Series'}</h3>
                    <p className="text-xs text-text-muted">{d.decisionType} · Deadline: {d.votingDeadline}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {/* BR-29: Quorum tracker */}
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className={`w-6 h-2 rounded-full ${i < d.votes.filter(v => !v.isConflict).length ? 'bg-primary' : 'bg-bg-tertiary'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-text-muted">{d.votes.filter(v => !v.isConflict).length}/{CONFIG.QUORUM_MIN} quorum</span>
                    </div>
                  </div>
                  {hasVoted
                    ? <span className="badge bg-emerald-500/20 text-emerald-400">✓ Voted</span>
                    : <span className="badge bg-primary/20 text-primary">Vote Now →</span>
                  }
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Closed */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-400" /> Completed ({closedDecisions.length})
        </h2>
        <div className="space-y-3">
          {closedDecisions.map(d => {
            const s = series.find(s => s.id === d.seriesId);
            return (
              <Link key={d.id} to={`/voting/${d.id}`} className="glass-card p-4 flex items-center gap-4 opacity-70 hover:opacity-100 transition-opacity">
                <Vote size={18} className="text-text-muted" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-text-primary">{s?.title || d.proposalTitle || 'Unknown'}</h3>
                  <p className="text-xs text-text-muted">Finalized: {d.finalizedAt}</p>
                </div>
                <StatusBadge status={d.result || 'Unknown'} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
