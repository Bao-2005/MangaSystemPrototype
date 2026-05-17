import { useState, useMemo } from 'react';
import { useRankingStore } from '../../store/rankingStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/StatusBadge';
import { showToast } from '../../components/Toast';
import { validateVoteRecord, validateVoteRecordUniqueness } from '../../utils/validators';
import { canEnterVoteData } from '../../utils/permissions';
import { CONFIG } from '../../utils/constants';
import { BarChart3, Trophy, TrendingDown, AlertTriangle, Plus, ArrowUp, ArrowDown } from 'lucide-react';

export default function RankingPage() {
  const user = useAuthStore(s => s.currentUser);
  const { series } = useSeriesStore();
  const { voteRecords, getPeriods, calculateRankings, addVoteRecord, confirmRecord } = useRankingStore();
  const activeSeries = series.filter(s => s.status === 'Active');
  const periods = getPeriods();
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0] || '2026-Q1');

  // BR-87: Check data entry authority
  const canEnter = canEnterVoteData(user);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryForm, setEntryForm] = useState({ seriesId: '', period: selectedPeriod, readerCount: '', voteCount: '' });
  const [entryErrors, setEntryErrors] = useState({});

  // BR-90, BR-91, BR-94: Calculate rankings
  const rankings = useMemo(() => calculateRankings(selectedPeriod, series), [selectedPeriod, voteRecords, series]);

  const pendingRecords = voteRecords.filter(r => r.status === 'Pending');

  const handleAddVoteRecord = () => {
    const record = {
      ...entryForm,
      readerCount: parseInt(entryForm.readerCount),
      voteCount: parseInt(entryForm.voteCount),
      enteredBy: user.id,
    };

    // BR-89: Validate
    const errors = validateVoteRecord(record);
    // BR-88: Check uniqueness
    const uniqueError = validateVoteRecordUniqueness(record.seriesId, record.period, voteRecords);
    if (uniqueError) errors.seriesId = uniqueError;
    if (!record.seriesId) errors.seriesId = 'Series is required';

    if (Object.keys(errors).length > 0) { setEntryErrors(errors); return; }

    addVoteRecord(record);
    setShowEntryForm(false);
    setEntryForm({ seriesId: '', period: selectedPeriod, readerCount: '', voteCount: '' });
    showToast('Vote record added (pending confirmation)', 'success');
  };

  // BR-92: Confirm record triggers recalculation
  const handleConfirm = (recordId) => {
    confirmRecord(recordId);
    showToast('Vote record confirmed — ranking recalculated (BR-92)', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Series Ranking</h1>
          <p className="text-sm text-text-secondary mt-1">Automated ranking based on reader votes (BR-90)</p>
        </div>
        {canEnter && (
          <button onClick={() => setShowEntryForm(!showEntryForm)} className="btn btn-primary">
            <Plus size={16} /> Enter Vote Data (BR-87)
          </button>
        )}
      </div>

      {/* Vote Data Entry Form */}
      {showEntryForm && (
        <div className="glass-card p-5 border-primary/30">
          <h2 className="text-sm font-bold mb-4">Enter Reader Vote Data (P7)</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Series</label>
              <select className={`form-input text-sm ${entryErrors.seriesId ? 'error' : ''}`} value={entryForm.seriesId} onChange={e => setEntryForm(prev => ({ ...prev, seriesId: e.target.value }))}>
                <option value="">Select...</option>
                {activeSeries.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
              {entryErrors.seriesId && <p className="text-xs text-danger mt-1">{entryErrors.seriesId}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Period</label>
              <input type="text" className="form-input text-sm" placeholder="e.g. 2026-Q2" value={entryForm.period} onChange={e => setEntryForm(prev => ({ ...prev, period: e.target.value }))} />
              {entryErrors.period && <p className="text-xs text-danger mt-1">{entryErrors.period}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Reader Count (BR-89: ≥ 0)</label>
              <input type="number" className={`form-input text-sm ${entryErrors.readerCount ? 'error' : ''}`} min={0} value={entryForm.readerCount} onChange={e => setEntryForm(prev => ({ ...prev, readerCount: e.target.value }))} />
              {entryErrors.readerCount && <p className="text-xs text-danger mt-1">{entryErrors.readerCount}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Vote Count (BR-89: ≤ reader)</label>
              <input type="number" className={`form-input text-sm ${entryErrors.voteCount ? 'error' : ''}`} min={0} value={entryForm.voteCount} onChange={e => setEntryForm(prev => ({ ...prev, voteCount: e.target.value }))} />
              {entryErrors.voteCount && <p className="text-xs text-danger mt-1">{entryErrors.voteCount}</p>}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowEntryForm(false)} className="btn btn-ghost">Cancel</button>
            <button onClick={handleAddVoteRecord} className="btn btn-primary">Add Record</button>
          </div>
        </div>
      )}

      {/* Pending confirmations */}
      {pendingRecords.length > 0 && canEnter && (
        <div className="glass-card p-5 border-amber-500/20">
          <h2 className="text-sm font-bold mb-3 text-amber-400">Pending Confirmation ({pendingRecords.length})</h2>
          {pendingRecords.map(r => {
            const s = series.find(s => s.id === r.seriesId);
            return (
              <div key={r.id} className="flex items-center gap-4 p-3 rounded-lg bg-bg-tertiary/30 mb-2">
                <span className="text-sm font-medium">{s?.title}</span>
                <span className="text-xs text-text-muted">{r.period}</span>
                <span className="text-xs">Readers: {r.readerCount?.toLocaleString()} | Votes: {r.voteCount?.toLocaleString()}</span>
                <button onClick={() => handleConfirm(r.id)} className="ml-auto btn btn-success text-xs py-1 px-3">Confirm (BR-92)</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Period Selector */}
      <div className="flex gap-2">
        {periods.map(p => (
          <button key={p} onClick={() => setSelectedPeriod(p)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${selectedPeriod === p ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Rankings Table — BR-90, BR-94 */}
      <div className="glass-card overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Series</th>
              <th>Genre</th>
              <th>Votes</th>
              <th>Readers</th>
              <th>Score (BR-90)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rankings.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-text-muted">No ranking data for this period</td></tr>
            ) : (
              rankings.map((r, i) => (
                <tr key={r.id} className={r.flagged ? 'bg-rose-500/5' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      {r.rank <= 3 ? (
                        <span className={`text-lg ${r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉'}`}>{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉'}</span>
                      ) : (
                        <span className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-sm font-bold">{r.rank}</span>
                      )}
                    </div>
                  </td>
                  <td className="font-medium">{r.title}</td>
                  <td className="text-text-secondary">{r.genre}</td>
                  <td>{r.voteCount?.toLocaleString()}</td>
                  <td>{r.readerCount?.toLocaleString()}</td>
                  <td>
                    <span className={`font-bold ${r.score >= 70 ? 'text-emerald-400' : r.score >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {r.score}%
                    </span>
                  </td>
                  <td>
                    {r.flagged ? (
                      <span className="badge bg-rose-500/20 text-rose-400 flex items-center gap-1">
                        <AlertTriangle size={10} /> Bottom {CONFIG.BOTTOM_PERCENT_FLAG}% (BR-94)
                      </span>
                    ) : r.rank <= 3 ? (
                      <span className="badge bg-emerald-500/20 text-emerald-400">
                        <Trophy size={10} /> Top 3
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* BR info */}
      <div className="glass-card p-4 text-xs text-text-muted">
        <strong>BRs enforced:</strong> BR-87 (Entry Authority), BR-88 (Uniqueness), BR-89 (Validation), BR-90 (Formula), BR-91 (Tie-break), BR-92 (Auto-recalculate), BR-94 (Bottom 20% flag)
      </div>
    </div>
  );
}
