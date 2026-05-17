import { Link } from 'react-router-dom';
import { useManuscriptStore } from '../../store/manuscriptStore';
import { useChapterStore } from '../../store/chapterStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/StatusBadge';
import { FileText, Eye, ArrowRight } from 'lucide-react';
import { ROLES } from '../../utils/constants';
import { formatDate } from '../../utils/calculations';

export default function ManuscriptListPage() {
  const { manuscripts } = useManuscriptStore();
  const { chapters } = useChapterStore();
  const { series } = useSeriesStore();
  const user = useAuthStore(s => s.currentUser);
  const getUserById = useAuthStore(s => s.getUserById);

  const isMangaka = user.roles.includes(ROLES.MANGAKA);
  const isEditor = user.roles.includes(ROLES.TANTOU_EDITOR);

  // Group manuscripts by chapter, show latest version first
  const groupedByChapter = {};
  manuscripts.forEach(ms => {
    if (!groupedByChapter[ms.chapterId]) groupedByChapter[ms.chapterId] = [];
    groupedByChapter[ms.chapterId].push(ms);
  });
  Object.values(groupedByChapter).forEach(group => group.sort((a, b) => b.version - a.version));

  // Filter by role
  let visibleChapterIds = Object.keys(groupedByChapter);
  if (isMangaka) {
    const mySeries = series.filter(s => s.mangakaId === user.id).map(s => s.id);
    visibleChapterIds = visibleChapterIds.filter(chId => {
      const ch = chapters.find(c => c.id === chId);
      return ch && mySeries.includes(ch.seriesId);
    });
  } else if (isEditor) {
    const editorSeries = series.filter(s => s.editorId === user.id).map(s => s.id);
    visibleChapterIds = visibleChapterIds.filter(chId => {
      const ch = chapters.find(c => c.id === chId);
      return ch && editorSeries.includes(ch.seriesId);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manuscripts</h1>
        <p className="text-sm text-text-secondary mt-1">Manage manuscript submissions and editorial reviews</p>
      </div>

      <div className="space-y-4">
        {visibleChapterIds.map(chId => {
          const versions = groupedByChapter[chId];
          const latest = versions[0];
          const ch = chapters.find(c => c.id === chId);
          const s = ch ? series.find(s => s.id === ch.seriesId) : null;

          return (
            <div key={chId} className="glass-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-bg-tertiary">
                    <FileText size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{s?.title} — Ch.{ch?.chapterNo} "{ch?.title}"</h3>
                    <p className="text-xs text-text-muted">{versions.length} version(s) · Latest: v{latest.version}</p>
                  </div>
                </div>
                <StatusBadge status={latest.status} />
              </div>

              {/* Version history — BR-73 */}
              <div className="mt-4 space-y-2">
                {versions.map(ms => (
                  <div key={ms.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary/30 text-xs">
                    <span className="font-bold text-primary w-8">v{ms.version}</span>
                    <StatusBadge status={ms.status} />
                    <span className="text-text-muted">Submitted: {formatDate(ms.submittedAt)}</span>
                    {ms.reviewedAt && <span className="text-text-muted">Reviewed: {formatDate(ms.reviewedAt)}</span>}
                    {ms.revisionCount > 0 && (
                      <span className="badge bg-amber-500/20 text-amber-400">Rev #{ms.revisionCount}/3 (BR-83)</span>
                    )}
                    {/* BR-74: Only assigned editor can review */}
                    {isEditor && ms.status === 'Submitted' && (
                      <Link to={`/manuscripts/${ms.id}/review`} className="ml-auto btn btn-primary text-xs py-1 px-3">
                        <Eye size={12} /> Review
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {latest.editorFeedback && (
                <div className="mt-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <p className="text-xs font-semibold text-violet-400 mb-1">Editor Feedback:</p>
                  <p className="text-xs text-text-secondary">{latest.editorFeedback}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
