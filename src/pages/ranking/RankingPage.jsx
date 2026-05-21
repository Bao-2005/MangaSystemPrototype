import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRankingStore } from '../../store/rankingStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import { canEnterVoteData } from '../../utils/permissions';
import { CONFIG } from '../../utils/constants';
import { BarChart3, Trophy, AlertTriangle, ClipboardList, ArrowRight, ArrowUp } from 'lucide-react';

export default function RankingPage() {
  const user = useAuthStore(s => s.currentUser);
  const allUsers = useAuthStore(s => s.users);
  const { series } = useSeriesStore();
  const { voteRecords, getPeriods, calculateRankings, calculateMangakaRankings } = useRankingStore();

  const periods = getPeriods();
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0] || '2026-Q1');
  const [activeTab, setActiveTab] = useState('series');

  const canEnter = canEnterVoteData(user);

  // BR-90, BR-94: Reactive — tự tính lại khi voteRecords thay đổi
  const seriesRankings = useMemo(
    () => calculateRankings(selectedPeriod, series),
    [selectedPeriod, voteRecords, series]
  );
  const mangakaRankings = useMemo(
    () => calculateMangakaRankings ? calculateMangakaRankings(selectedPeriod, series, allUsers) : [],
    [selectedPeriod, voteRecords, series, allUsers]
  );

  const rankings = activeTab === 'series' ? seriesRankings : mangakaRankings;
  const pendingCount = voteRecords.filter(r => r.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 size={22} className="text-primary" />
            Bảng Xếp Hạng
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Tự động recalculate khi VoteRecord được xác nhận (BR-90, BR-92)
          </p>
        </div>
        {canEnter && (
          <Link to="/ranking/votes" className="btn btn-primary flex items-center gap-2">
            <ClipboardList size={16} />
            Nhập Vote Data (P7)
            {pendingCount > 0 && (
              <span className="ml-1 bg-amber-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </Link>
        )}
      </div>

      {/* Pending alert */}
      {canEnter && pendingCount > 0 && (
        <div className="glass-card p-4 border border-amber-500/30 flex items-center gap-3 text-sm">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
          <span className="text-amber-300">
            Có <strong>{pendingCount}</strong> VoteRecord chưa được xác nhận — ranking hiện tại chưa bao gồm các record này.
          </span>
          <Link to="/ranking/votes" className="ml-auto text-primary hover:underline flex items-center gap-1 text-xs whitespace-nowrap">
            Xác nhận ngay <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Period Selector */}
      <div className="flex gap-2 flex-wrap">
        {periods.length === 0 ? (
          <span className="text-text-muted text-sm">Chưa có dữ liệu kỳ nào</span>
        ) : (
          periods.map(p => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`text-xs px-4 py-1.5 rounded-full transition-all duration-200 font-medium ${
                selectedPeriod === p
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              {p}
            </button>
          ))
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/10">
        <button
          className={`pb-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'series'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveTab('series')}
        >
          🏆 Series Ranking
        </button>
        <button
          className={`pb-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'mangaka'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setActiveTab('mangaka')}
        >
          ✍️ Mangaka Ranking
        </button>
      </div>

      {/* Rankings Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="w-16">Hạng</th>
              <th>{activeTab === 'series' ? 'Tác phẩm' : 'Tác giả'}</th>
              <th>{activeTab === 'series' ? 'Thể loại' : 'Vai trò'}</th>
              <th>Phiếu bầu</th>
              <th>Lượt đọc</th>
              <th>Điểm (BR-90)</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rankings.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-text-muted">
                  <BarChart3 size={32} className="mx-auto mb-2 opacity-30" />
                  <p>Không có dữ liệu ranking cho kỳ <strong>{selectedPeriod}</strong></p>
                  {canEnter && (
                    <Link to="/ranking/votes" className="mt-2 inline-flex items-center gap-1 text-primary text-sm hover:underline">
                      → Nhập dữ liệu vote ngay
                    </Link>
                  )}
                </td>
              </tr>
            ) : (
              rankings.map((r) => (
                <tr key={r.id} className={r.flagged ? 'bg-rose-500/5' : ''}>
                  <td>
                    <div className="flex items-center justify-center">
                      {r.rank <= 3 ? (
                        <span className="text-xl">
                          {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        <span className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-sm font-bold text-text-secondary">
                          {r.rank}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="font-semibold">{r.title}</td>
                  <td className="text-text-secondary text-xs">{r.genre}</td>
                  <td className="font-mono">{r.voteCount?.toLocaleString('vi-VN')}</td>
                  <td className="font-mono">{r.readerCount?.toLocaleString('vi-VN')}</td>
                  <td>
                    <span className={`font-bold text-base ${
                      r.score >= 70 ? 'text-emerald-400'
                      : r.score >= 40 ? 'text-amber-400'
                      : 'text-rose-400'
                    }`}>
                      {r.score}%
                    </span>
                  </td>
                  <td>
                    {r.flagged ? (
                      <span className="badge bg-rose-500/20 text-rose-400 flex items-center gap-1 text-xs">
                        <AlertTriangle size={10} /> Bottom {CONFIG.BOTTOM_PERCENT_FLAG}% (BR-94)
                      </span>
                    ) : r.rank === 1 ? (
                      <span className="badge bg-yellow-500/20 text-yellow-400 flex items-center gap-1 text-xs">
                        <Trophy size={10} /> #1 🏆
                      </span>
                    ) : r.rank <= 3 ? (
                      <span className="badge bg-emerald-500/20 text-emerald-400 flex items-center gap-1 text-xs">
                        <ArrowUp size={10} /> Top 3
                      </span>
                    ) : (
                      <span className="text-text-muted text-xs">—</span>
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
        <strong>BRs enforced:</strong> BR-90 (score = voteCount/readerCount × 100%) · BR-91 (Tie-break: voteCount cao hơn thắng) · BR-92 (Auto-recalculate khi Confirm) · BR-94 (Bottom {CONFIG.BOTTOM_PERCENT_FLAG}% bị flag đỏ — cần ≥ 5 series)
      </div>
    </div>
  );
}
