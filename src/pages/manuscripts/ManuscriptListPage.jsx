import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useManuscriptStore } from '../../store/manuscriptStore';
import { useChapterStore } from '../../store/chapterStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/StatusBadge';
import {
  FileText, Eye, ChevronDown, ChevronUp, ChevronRight,
  MessageSquare, CheckCircle2, Clock, RotateCcw, AlertCircle,
  BookOpen, Calendar, Hash, Pin, Layers,
} from 'lucide-react';
import { ROLES } from '../../utils/constants';
import { formatDate } from '../../utils/calculations';

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_META = {
  Approved:          { icon: CheckCircle2, color: 'text-emerald-400', ring: 'border-emerald-500/40 bg-emerald-500/5' },
  Submitted:         { icon: Clock,        color: 'text-violet-400',  ring: 'border-violet-500/40 bg-violet-500/5'  },
  'Revision Required': { icon: RotateCcw,  color: 'text-amber-400',   ring: 'border-amber-500/40 bg-amber-500/5'   },
};
const defaultMeta = { icon: AlertCircle, color: 'text-text-muted', ring: 'border-border bg-bg-secondary' };

// ─── Annotation list ──────────────────────────────────────────────────────────
function AnnotationList({ annotations }) {
  if (!annotations.length) return null;
  // group by page
  const byPage = annotations.reduce((acc, a) => {
    (acc[a.page] = acc[a.page] || []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {Object.entries(byPage).sort(([a], [b]) => +a - +b).map(([page, items]) => (
        <div key={page} className="flex gap-3">
          <span className="flex-shrink-0 mt-0.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[11px] font-bold leading-tight">
            Trang {page}
          </span>
          <div className="space-y-1">
            {items.map(a => (
              <p key={a.id} className="text-sm text-text-secondary leading-snug">{a.content}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Single version detail panel ─────────────────────────────────────────────
function VersionDetail({ ms, annotations }) {
  const msAnnotations = annotations.filter(a => a.manuscriptId === ms.id);

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <Calendar size={12} className="text-primary" />
          Nộp: <span className="text-text-primary font-medium">{formatDate(ms.submittedAt)}</span>
        </span>
        {ms.reviewedAt && (
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-400" />
            Duyệt: <span className="text-text-primary font-medium">{formatDate(ms.reviewedAt)}</span>
          </span>
        )}
        {ms.revisionCount > 0 && (
          <span className="flex items-center gap-1.5">
            <RotateCcw size={12} className="text-amber-400" />
            Lần sửa: <span className="text-amber-400 font-bold">{ms.revisionCount}/3</span>
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <FileText size={12} className="text-text-muted" />
          File: <span className="text-text-primary font-medium font-mono">{ms.fileURL?.split('/').pop()}</span>
        </span>
      </div>

      {/* Editor feedback */}
      {ms.editorFeedback ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wide">Nhận xét biên tập viên</span>
          </div>
          <p className="text-sm text-text-primary leading-relaxed">{ms.editorFeedback}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-bg-tertiary/40 p-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-text-muted" />
            <span className="text-xs text-text-muted italic">Không có nhận xét từ biên tập viên.</span>
          </div>
        </div>
      )}

      {/* Annotations */}
      {msAnnotations.length > 0 ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Pin size={14} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
              Ghi chú trang ({msAnnotations.length})
            </span>
          </div>
          <AnnotationList annotations={msAnnotations} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-bg-tertiary/40 p-4">
          <div className="flex items-center gap-2">
            <Pin size={14} className="text-text-muted" />
            <span className="text-xs text-text-muted italic">Không có ghi chú trang nào.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single version row (collapsible) ────────────────────────────────────────
function VersionRow({ ms, isEditor, annotations, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = STATUS_META[ms.status] || defaultMeta;
  const Icon = meta.icon;
  const msAnnotations = annotations.filter(a => a.manuscriptId === ms.id);
  const hasDetails = ms.editorFeedback || msAnnotations.length > 0;

  return (
    <div className={`rounded-xl border transition-all duration-200 ${meta.ring}`}>
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Version badge */}
        <div className="flex items-center gap-2 w-16 flex-shrink-0">
          <Icon size={15} className={meta.color} />
          <span className="text-sm font-bold text-text-primary">v{ms.version}</span>
        </div>

        <StatusBadge status={ms.status} />

        {/* Meta info */}
        <div className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {formatDate(ms.submittedAt)}
          </span>
          {ms.reviewedAt && (
            <span className="flex items-center gap-1 text-emerald-400/80">
              <CheckCircle2 size={11} /> {formatDate(ms.reviewedAt)}
            </span>
          )}
          {ms.revisionCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
              Sửa {ms.revisionCount}/3
            </span>
          )}
          {hasDetails && (
            <span className="flex items-center gap-1 text-text-muted/70">
              <MessageSquare size={11} />
              {msAnnotations.length > 0 && `${msAnnotations.length} ghi chú`}
              {ms.editorFeedback && msAnnotations.length > 0 && ' · '}
              {ms.editorFeedback && 'có nhận xét'}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditor && ms.status === 'Submitted' && (
            <Link
              to={`/manuscripts/${ms.id}/review`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/80 text-xs font-semibold transition-colors shadow-sm"
            >
              <Eye size={12} /> Xem xét
            </Link>
          )}
          {/* Always show detail button for every version */}
          <button
            onClick={() => setOpen(v => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-tertiary hover:bg-bg-secondary border border-border text-xs text-text-secondary transition-colors"
          >
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {open ? 'Thu gọn' : 'Chi tiết'}
          </button>
        </div>
      </div>

      {/* Expanded detail — always renderable */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border/40">
          <VersionDetail ms={ms} annotations={annotations} />
        </div>
      )}
    </div>
  );
}

// ─── Chapter block (collapsible) ─────────────────────────────────────────────
function ChapterBlock({ chId, versions, chapters, isEditor, annotations }) {
  const [open, setOpen] = useState(true);
  const ch = chapters.find(c => c.id === chId);
  const latest = versions[0];
  const pendingReview = isEditor && versions.some(v => v.status === 'Submitted');

  return (
    <div className="rounded-xl border border-border bg-bg-secondary/40 overflow-hidden">
      {/* Chapter header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Hash size={14} className="text-text-muted flex-shrink-0" />
          <span className="text-sm font-bold text-text-primary truncate">
            Ch.{ch?.chapterNo} — {ch?.title}
          </span>
          <span className="text-xs text-text-muted flex-shrink-0">
            ({versions.length} phiên bản)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {pendingReview && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-semibold">
              Chờ duyệt
            </span>
          )}
          <StatusBadge status={latest.status} />
          {open ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
        </div>
      </button>

      {/* Version list */}
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-border/40 pt-3">
          {versions.map((ms, idx) => (
            <VersionRow
              key={ms.id}
              ms={ms}
              isEditor={isEditor}
              annotations={annotations}
              defaultOpen={idx === 0 && (ms.status === 'Revision Required' || ms.status === 'Submitted')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Manga (series) section ───────────────────────────────────────────────────
function MangaSection({ seriesData, chapterIds, groupedByChapter, chapters, isEditor, annotations }) {
  const [open, setOpen] = useState(true);

  const allVersions = chapterIds.flatMap(id => groupedByChapter[id]);
  const approvedCount  = allVersions.filter(m => m.status === 'Approved').length;
  const submittedCount = allVersions.filter(m => m.status === 'Submitted').length;
  const revisionCount  = allVersions.filter(m => m.status === 'Revision Required').length;
  const hasPending = isEditor && submittedCount > 0;

  return (
    <div className="glass-card overflow-hidden">
      {/* Manga header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-bg-tertiary/30 transition-colors text-left"
      >
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${open ? 'bg-primary/20' : 'bg-bg-tertiary'}`}>
          <BookOpen size={20} className={open ? 'text-primary' : 'text-text-muted'} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-text-primary">{seriesData.title}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-muted">{seriesData.genre}</span>
            <StatusBadge status={seriesData.status} />
            {hasPending && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-semibold animate-pulse">
                {submittedCount} chờ duyệt
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Layers size={11} /> {chapterIds.length} chương
            </span>
            {approvedCount > 0 && (
              <span className="text-emerald-400">{approvedCount} đã duyệt</span>
            )}
            {revisionCount > 0 && (
              <span className="text-amber-400">{revisionCount} cần sửa</span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          {open
            ? <ChevronUp size={18} className="text-text-muted" />
            : <ChevronRight size={18} className="text-text-muted" />
          }
        </div>
      </button>

      {/* Chapter list */}
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-border/40 pt-4">
          {chapterIds.map(chId => (
            <ChapterBlock
              key={chId}
              chId={chId}
              versions={groupedByChapter[chId]}
              chapters={chapters}
              isEditor={isEditor}
              annotations={annotations}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ManuscriptListPage() {
  const { manuscripts, annotations } = useManuscriptStore();
  const { chapters } = useChapterStore();
  const { series } = useSeriesStore();
  const user = useAuthStore(s => s.currentUser);

  const isMangaka = user.roles.includes(ROLES.MANGAKA);
  const isEditor  = user.roles.includes(ROLES.TANTOU_EDITOR);

  // Group manuscripts by chapter, latest version first
  const groupedByChapter = {};
  manuscripts.forEach(ms => {
    if (!groupedByChapter[ms.chapterId]) groupedByChapter[ms.chapterId] = [];
    groupedByChapter[ms.chapterId].push(ms);
  });
  Object.values(groupedByChapter).forEach(g => g.sort((a, b) => b.version - a.version));

  // Filter chapter IDs by role
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

  // Group chapter IDs by series, preserve series order
  const seriesOrder = series.map(s => s.id);
  const groupedBySeries = {};
  visibleChapterIds.forEach(chId => {
    const ch = chapters.find(c => c.id === chId);
    if (!ch) return;
    if (!groupedBySeries[ch.seriesId]) groupedBySeries[ch.seriesId] = [];
    groupedBySeries[ch.seriesId].push(chId);
  });
  // Sort chapters within each series by chapterNo DESCENDING (newest first)
  Object.values(groupedBySeries).forEach(ids =>
    ids.sort((a, b) => {
      const ca = chapters.find(c => c.id === a);
      const cb = chapters.find(c => c.id === b);
      return (cb?.chapterNo ?? 0) - (ca?.chapterNo ?? 0);
    })
  );
  // Sort series by the highest chapterNo among their chapters (most recently active first)
  const visibleSeriesIds = seriesOrder
    .filter(sid => groupedBySeries[sid])
    .sort((sidA, sidB) => {
      const maxChA = Math.max(...groupedBySeries[sidA].map(chId => chapters.find(c => c.id === chId)?.chapterNo ?? 0));
      const maxChB = Math.max(...groupedBySeries[sidB].map(chId => chapters.find(c => c.id === chId)?.chapterNo ?? 0));
      return maxChB - maxChA;
    });

  // Global stats
  const allVisible = visibleChapterIds.flatMap(id => groupedByChapter[id]);
  const stats = [
    { label: 'Manga',      value: visibleSeriesIds.length,                                  color: 'text-primary',    bg: 'bg-primary/10'      },
    { label: 'Chương',     value: visibleChapterIds.length,                                 color: 'text-text-primary', bg: 'bg-bg-secondary'  },
    { label: 'Đã duyệt',   value: allVisible.filter(m => m.status === 'Approved').length,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Chờ duyệt',  value: allVisible.filter(m => m.status === 'Submitted').length,  color: 'text-violet-400',  bg: 'bg-violet-500/10'  },
    { label: 'Cần sửa',    value: allVisible.filter(m => m.status === 'Revision Required').length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Bản thảo</h1>
        <p className="text-sm text-text-secondary mt-1">
          Quản lý nộp bản thảo và đánh giá biên tập — sắp xếp theo manga
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.bg} border border-border`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Manga sections */}
      <div className="space-y-4">
        {visibleSeriesIds.length === 0 && (
          <div className="glass-card p-16 text-center">
            <FileText size={44} className="mx-auto text-text-muted mb-3 opacity-30" />
            <p className="text-text-muted font-medium">Chưa có bản thảo nào</p>
          </div>
        )}

        {visibleSeriesIds.map(sid => {
          const seriesData = series.find(s => s.id === sid);
          if (!seriesData) return null;
          return (
            <MangaSection
              key={sid}
              seriesData={seriesData}
              chapterIds={groupedBySeries[sid]}
              groupedByChapter={groupedByChapter}
              chapters={chapters}
              isEditor={isEditor}
              annotations={annotations}
            />
          );
        })}
      </div>
    </div>
  );
}
