import { useParams, Link } from 'react-router-dom';
import { useSeriesStore } from '../../store/seriesStore';
import { useChapterStore } from '../../store/chapterStore';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import { calculateChapterCompletion } from '../../utils/calculations';
import { BookOpen, Layers, ArrowLeft } from 'lucide-react';
import { ROLES } from '../../utils/constants';
import { useMemo } from 'react';

export default function SeriesDetailPage() {
  const { id } = useParams();
  const allSeries = useSeriesStore(s => s.series);
  const allChapters = useChapterStore(s => s.chapters);
  const tasks = useChapterStore(s => s.tasks);
  const getUserById = useAuthStore(s => s.getUserById);
  const user = useAuthStore(s => s.currentUser);

  const series = useMemo(() => allSeries.find(s => s.id === id), [allSeries, id]);
  const chapters = useMemo(() => allChapters.filter(c => c.seriesId === id), [allChapters, id]);

  if (!series) return <div className="text-center text-text-muted py-20">Series not found</div>;

  const owner = getUserById(series.mangakaId);
  const editor = series.editorId ? getUserById(series.editorId) : null;
  const isMangaka = user.roles.includes(ROLES.MANGAKA) && series.mangakaId === user.id;

  return (
    <div className="space-y-6">
      <Link to="/series" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={16} /> Back to Series
      </Link>

      {/* Header */}
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
                <p className="text-sm font-medium">{editor.displayName}</p>
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
          <p className="text-text-muted">No chapters yet</p>
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
    </div>
  );
}
