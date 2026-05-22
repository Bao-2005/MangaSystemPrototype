import { Link, useSearchParams } from 'react-router-dom';
import { useChapterStore } from '../../store/chapterStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import { calculateChapterCompletion, formatDate, daysUntil } from '../../utils/calculations';
import { ROLES } from '../../utils/constants';
import { Layers, Clock, AlertTriangle, Plus } from 'lucide-react';

export default function ChapterListPage() {
  const [searchParams] = useSearchParams();
  const filterSeriesId = searchParams.get('seriesId');
  const user = useAuthStore(s => s.currentUser);
  const { chapters, tasks } = useChapterStore();
  const { series } = useSeriesStore();

  const isMangaka = user.roles.includes(ROLES.MANGAKA);
  const isAssistant = user.roles.includes(ROLES.ASSISTANT);

  // Filter chapters based on role
  let visibleChapters = chapters;
  if (isAssistant) {
    const myTaskChapterIds = tasks.filter(t => t.assistantId === user.id).map(t => t.chapterId);
    visibleChapters = chapters.filter(c => myTaskChapterIds.includes(c.id));
  } else if (isMangaka) {
    const mySeries = series.filter(s => s.mangakaId === user.id).map(s => s.id);
    visibleChapters = chapters.filter(c => mySeries.includes(c.seriesId));
  }
  if (filterSeriesId) visibleChapters = visibleChapters.filter(c => c.seriesId === filterSeriesId);



  const activeMangakaSeries = series.filter(s => s.mangakaId === user.id && s.status === 'Active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chapters & Tasks</h1>
          <p className="text-sm text-text-secondary mt-1">{visibleChapters.length} chapters</p>
        </div>
        {isMangaka && (
          <Link to="/chapters/new" className="btn btn-primary"><Plus size={16} /> New Chapter</Link>
        )}
      </div>

      {/* Chapter list */}
      <div className="space-y-3">
        {visibleChapters.map(ch => {
          const chTasks = tasks.filter(t => t.chapterId === ch.id);
          const completion = calculateChapterCompletion(chTasks);
          const s = series.find(s => s.id === ch.seriesId);
          const days = daysUntil(ch.deadline);
          return (
            <Link key={ch.id} to={`/chapters/${ch.id}`} className="glass-card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{ch.chapterNo}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary">{ch.title}</p>
                <p className="text-xs text-text-muted">{s?.title} · {chTasks.length} tasks</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock size={12} /> {formatDate(ch.deadline)}
                  </span>
                  {days <= 3 && days >= 0 && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> {days}d left
                    </span>
                  )}
                  {days < 0 && (
                    <span className="text-xs text-rose-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> Overdue
                    </span>
                  )}
                </div>
              </div>
              <div className="w-32">
                <ProgressBar value={completion} color={completion === 100 ? 'success' : days < 0 ? 'danger' : 'primary'} />
              </div>
              <StatusBadge status={ch.status} />
            </Link>
          );
        })}
      </div>


    </div>
  );
}
