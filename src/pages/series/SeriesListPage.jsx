import { Link } from 'react-router-dom';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/StatusBadge';
import { Plus, Search, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { ROLES, SERIES_STATUS } from '../../utils/constants';

export default function SeriesListPage() {
  const { series, proposals } = useSeriesStore();
  const user = useAuthStore(s => s.currentUser);
  const getUserById = useAuthStore(s => s.getUserById);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const isMangaka = user.roles.includes(ROLES.MANGAKA);

  const statuses = ['All', ...Object.values(SERIES_STATUS)];
  const filtered = series.filter(s => {
    if (filter !== 'All' && s.status !== filter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Series</h1>
          <p className="text-sm text-text-secondary mt-1">{filtered.length} series found</p>
        </div>
        {isMangaka && (
          <Link to="/series/new" className="btn btn-primary">
            <Plus size={16} /> New Proposal
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text" placeholder="Search series..."
            className="form-input pl-9"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filter === s ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Series Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const owner = getUserById(s.mangakaId);
          const editor = s.editorId ? getUserById(s.editorId) : null;
          return (
            <Link key={s.id} to={`/series/${s.id}`} className="glass-card p-5 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <StatusBadge status={s.status} />
                </div>
                <span className="text-xs text-text-muted">{s.id}</span>
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-1 line-clamp-1">{s.title}</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary">{s.genre}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary">{s.publicationType}</span>
              </div>
              <p className="text-xs text-text-muted line-clamp-2 mb-4">{s.synopsis}</p>
              <div className="flex items-center justify-between text-xs text-text-secondary border-t border-border pt-3">
                <span>{owner?.avatar} {owner?.displayName}</span>
                {s.rankingScore > 0 && (
                  <span className="font-semibold text-primary">{s.rankingScore}% score</span>
                )}
              </div>
              {editor && (
                <div className="text-[10px] text-text-muted mt-1">Editor: {editor.displayName}</div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Proposals section for Mangaka */}
      {isMangaka && proposals.filter(p => p.mangakaId === user.id).length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">My Proposals</h2>
          <div className="space-y-3">
            {proposals.filter(p => p.mangakaId === user.id).map(p => (
              <div key={p.id} className="glass-card p-4 flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-text-primary">{p.title}</h3>
                  <p className="text-xs text-text-muted">{p.genre} · {p.publicationType} · Submitted: {p.submittedAt || 'Not yet'}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
