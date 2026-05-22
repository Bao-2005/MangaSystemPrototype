import { Link, useSearchParams } from 'react-router-dom';
import { useChapterStore } from '../../store/chapterStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import { calculateChapterCompletion, formatDate, daysUntil } from '../../utils/calculations';
import { ROLES } from '../../utils/constants';
import { Clock, AlertTriangle, Plus } from 'lucide-react';
import { useState } from 'react';
import Modal from '../../components/Modal';
import { validatePublicationDate } from '../../utils/validators';
import { canCreateChapter } from '../../utils/permissions';
import { showToast } from '../../utils/toast';

export default function ChapterListPage() {
  const [searchParams] = useSearchParams();
  const filterSeriesId = searchParams.get('seriesId');
  const user = useAuthStore(s => s.currentUser);
  const { chapters, tasks, addChapter } = useChapterStore();
  const { series } = useSeriesStore();
  const [showModal, setShowModal] = useState(false);
  const [newChapter, setNewChapter] = useState({ seriesId: filterSeriesId || '', chapterNo: '', title: '', publicationDate: '', totalPages: 24 });
  const [errors, setErrors] = useState({});

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

  const handleCreate = () => {
    const errs = {};
    if (!newChapter.seriesId) errs.seriesId = 'Series is required';
    if (!newChapter.chapterNo) errs.chapterNo = 'Chapter number is required';
    if (!newChapter.title) errs.title = 'Title is required';
    // BR-42: Publication date validation
    const dateError = validatePublicationDate(newChapter.publicationDate);
    if (dateError) errs.publicationDate = dateError;
    if (!newChapter.publicationDate) errs.publicationDate = 'Publication date is required';

    // BR-40: Check eligibility
    const selectedSeries = series.find(s => s.id === newChapter.seriesId);
    if (selectedSeries && !canCreateChapter(user, selectedSeries)) {
      errs.seriesId = 'BR-40: Only the Mangaka owner of an Active series can create chapters';
    }

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    addChapter(newChapter);
    setShowModal(false);
    showToast('Chapter created!', 'success');
    setNewChapter({ seriesId: filterSeriesId || '', chapterNo: '', title: '', publicationDate: '', totalPages: 24 });
  };

  const activeMangakaSeries = series.filter(s => s.mangakaId === user.id && s.status === 'Active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chapters & Tasks</h1>
          <p className="text-sm text-text-secondary mt-1">{visibleChapters.length} chapters</p>
        </div>
        {isMangaka && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus size={16} /> New Chapter</button>
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

      {/* Create Chapter Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Chapter" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Series (BR-40: Must be Active & owned by you)</label>
            <select className={`form-input ${errors.seriesId ? 'error' : ''}`} value={newChapter.seriesId} onChange={e => setNewChapter(prev => ({ ...prev, seriesId: e.target.value }))}>
              <option value="">Select series...</option>
              {activeMangakaSeries.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            {errors.seriesId && <p className="text-xs text-danger mt-1">{errors.seriesId}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Chapter Number</label>
              <input type="number" className={`form-input ${errors.chapterNo ? 'error' : ''}`} min={1} value={newChapter.chapterNo} onChange={e => setNewChapter(prev => ({ ...prev, chapterNo: parseInt(e.target.value) || '' }))} />
              {errors.chapterNo && <p className="text-xs text-danger mt-1">{errors.chapterNo}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Total Pages</label>
              <input type="number" className="form-input" min={1} value={newChapter.totalPages} onChange={e => setNewChapter(prev => ({ ...prev, totalPages: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
            <input type="text" className={`form-input ${errors.title ? 'error' : ''}`} value={newChapter.title} onChange={e => setNewChapter(prev => ({ ...prev, title: e.target.value }))} />
            {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Publication Date (BR-42: Deadline = PubDate − 14 days)</label>
            <input type="date" className={`form-input ${errors.publicationDate ? 'error' : ''}`} value={newChapter.publicationDate} onChange={e => setNewChapter(prev => ({ ...prev, publicationDate: e.target.value }))} />
            {errors.publicationDate && <p className="text-xs text-danger mt-1">{errors.publicationDate}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleCreate} className="btn btn-primary flex-1">Create Chapter</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
