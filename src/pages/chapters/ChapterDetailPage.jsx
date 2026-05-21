import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useChapterStore } from '../../store/chapterStore';
import { useSeriesStore } from '../../store/seriesStore';
import { useAuthStore } from '../../store/authStore';
import { useManuscriptStore } from '../../store/manuscriptStore';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import Modal from '../../components/Modal';
import { showToast } from '../../components/Toast';
import { calculateChapterCompletion, formatDate } from '../../utils/calculations';
import { canAssignTask, getAllowedTransitions } from '../../utils/permissions';
import { validateTaskFields, validatePageRange, validatePageRangeOverlap, validateTaskDueDate, validateTaskRejectReason } from '../../utils/validators';
import { ROLES, TASK_TYPES, CONFIG } from '../../utils/constants';
import { ArrowLeft, Plus, Check, X, Clock, ChevronRight, Send } from 'lucide-react';

export default function ChapterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const allChapters = useChapterStore(s => s.chapters);
  const allTasks = useChapterStore(s => s.tasks);
  const { addTask, updateTaskStatus } = useChapterStore();
  const { series: allSeries } = useSeriesStore();
  const { currentUser, getAssistants, getUserById } = useAuthStore();
  const { submitManuscript } = useManuscriptStore();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTaskId, setRejectTaskId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState(null);
  const [taskForm, setTaskForm] = useState({ pageStart: '', pageEnd: '', taskType: '', dueDate: '', assistantId: '' });
  const [taskErrors, setTaskErrors] = useState({});

  const chapter = useMemo(() => allChapters.find(c => c.id === id), [allChapters, id]);
  const chapterTasks = useMemo(() => allTasks.filter(t => t.chapterId === id), [allTasks, id]);

  if (!chapter) return <div className="text-center py-20 text-text-muted">Chapter not found</div>;

  const linkedSeries = allSeries.find(s => s.id === chapter.seriesId);
  const isMangaka = currentUser.roles.includes(ROLES.MANGAKA) && linkedSeries?.mangakaId === currentUser.id;
  const isAssistant = currentUser.roles.includes(ROLES.ASSISTANT);
  const completion = calculateChapterCompletion(chapterTasks);
  const allApproved = chapterTasks.length > 0 && chapterTasks.every(t => t.status === 'Approved');
  const assistants = getAssistants();

  // BR-80: Disable submit if an Approved manuscript already exists for this chapter
  const { manuscripts } = useManuscriptStore();
  const hasApprovedManuscript = manuscripts.some(m => m.chapterId === id && m.status === 'Approved');

  // BR-66: Filter tasks for assistant
  const visibleTasks = isAssistant
    ? chapterTasks.filter(t => t.assistantId === currentUser.id)
    : chapterTasks;

  // Group tasks by status for kanban
  const taskGroups = {
    'Pending': visibleTasks.filter(t => t.status === 'Pending'),
    'In Progress': visibleTasks.filter(t => t.status === 'In Progress'),
    'Submitted': visibleTasks.filter(t => t.status === 'Submitted'),
    'Approved': visibleTasks.filter(t => t.status === 'Approved'),
    'Rejected': visibleTasks.filter(t => t.status === 'Rejected'),
  };

  const groupColors = {
    'Pending': 'border-slate-500/30',
    'In Progress': 'border-cyan-500/30',
    'Submitted': 'border-violet-500/30',
    'Approved': 'border-emerald-500/30',
    'Rejected': 'border-rose-500/30',
  };

  // BR-69: Allowed transitions
  const getActions = (task) => {
    const role = isAssistant ? ROLES.ASSISTANT : isMangaka ? ROLES.MANGAKA : null;
    if (!role) return [];
    return getAllowedTransitions(role, task.status);
  };

  const handleStatusChange = (taskId, newStatus) => {
    if (newStatus === 'Rejected') {
      setRejectTaskId(taskId);
      setRejectReason('');
      setRejectError(null);
      setShowRejectModal(true);
      return;
    }
    updateTaskStatus(taskId, newStatus);
    showToast(`Task updated to ${newStatus}`, 'success');
  };

  const handleRejectSubmit = () => {
    const error = validateTaskRejectReason(rejectReason);
    if (error) { setRejectError(error); return; }
    updateTaskStatus(rejectTaskId, 'Rejected', rejectReason);
    // BR-65: Rejected goes back to In Progress
    setTimeout(() => updateTaskStatus(rejectTaskId, 'In Progress'), 100);
    setShowRejectModal(false);
    showToast('Task rejected — moved back to In Progress (BR-65)', 'warning');
  };

  const handleAddTask = () => {
    // BR-59: Validate mandatory fields
    const fieldErrors = validateTaskFields(taskForm);
    // BR-56: Validate page range
    const rangeError = validatePageRange(parseInt(taskForm.pageStart), parseInt(taskForm.pageEnd), chapter.totalPages);
    if (rangeError) fieldErrors.pageRange = rangeError;
    // BR-49: Check overlap
    const overlapError = validatePageRangeOverlap(
      { start: parseInt(taskForm.pageStart), end: parseInt(taskForm.pageEnd) },
      chapterTasks.map(t => ({ ...t, pageStart: t.pageStart, pageEnd: t.pageEnd }))
    );
    if (overlapError) fieldErrors.pageRange = overlapError;
    // BR-54: Validate due date
    if (taskForm.dueDate) {
      const dueDateError = validateTaskDueDate(taskForm.dueDate, chapter.deadline);
      if (dueDateError) fieldErrors.dueDate = dueDateError;
    }
    // BR-57: Only active assistants
    if (taskForm.assistantId) {
      const ast = getUserById(taskForm.assistantId);
      if (!ast || !ast.roles.includes('Assistant') || ast.status !== 'Active') {
        fieldErrors.assistantId = 'BR-57: Must assign to an active Assistant';
      }
      // BR-12: Workload limit
      const astTaskCount = useChapterStore.getState().tasks.filter(t => t.assistantId === taskForm.assistantId && ['Pending', 'In Progress'].includes(t.status)).length;
      if (astTaskCount >= CONFIG.MAX_ACTIVE_TASKS_PER_ASSISTANT) {
        fieldErrors.assistantId = `BR-12: Assistant already has ${astTaskCount}/${CONFIG.MAX_ACTIVE_TASKS_PER_ASSISTANT} active tasks`;
      }
    }

    if (Object.keys(fieldErrors).length > 0) { setTaskErrors(fieldErrors); return; }

    addTask({ chapterId: id, ...taskForm, pageStart: parseInt(taskForm.pageStart), pageEnd: parseInt(taskForm.pageEnd) });
    setShowTaskModal(false);
    setTaskForm({ pageStart: '', pageEnd: '', taskType: '', dueDate: '', assistantId: '' });
    showToast('Task assigned!', 'success');
  };

  // BR-67, BR-46: Submit manuscript
  const handleSubmitManuscript = () => {
    if (!allApproved) {
      showToast('BR-67: All tasks must be Approved before submitting manuscript', 'error');
      return;
    }
    submitManuscript(id, chapter.seriesId);
    // Issue #8: Update chapter status to Submitted
    useChapterStore.getState().updateChapterStatus(id, 'Submitted');
    showToast('Manuscript submitted! Chapter status updated to Submitted.', 'success');
    navigate('/manuscripts');
  };

  return (
    <div className="space-y-6">
      <Link to="/chapters" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={16} /> Back to Chapters
      </Link>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={chapter.status} size="lg" />
              <span className="text-xs text-text-muted">{chapter.id}</span>
            </div>
            <h1 className="text-2xl font-bold">Ch.{chapter.chapterNo} — {chapter.title}</h1>
            <p className="text-sm text-text-secondary">{linkedSeries?.title} · {chapter.totalPages} pages</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-text-muted">Deadline: <span className="font-semibold text-text-primary">{formatDate(chapter.deadline)}</span></p>
            <p className="text-text-muted">Publication: <span className="font-semibold text-text-primary">{formatDate(chapter.publicationDate)}</span></p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={completion} label={`Completion (BR-61: Approved/${chapterTasks.length} total)`} color={completion === 100 ? 'success' : 'primary'} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {isMangaka && (
          <>
            <button onClick={() => setShowTaskModal(true)} className="btn btn-primary"><Plus size={16} /> Assign Task (BR-52)</button>
            <div className="relative group">
              <button
                onClick={handleSubmitManuscript}
                disabled={!allApproved || hasApprovedManuscript}
                className="btn btn-success disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                {hasApprovedManuscript ? 'Đã duyệt' : 'Submit Manuscript'}
                {!hasApprovedManuscript && !allApproved && ' (BR-67: Need 100%)'}
              </button>
              {hasApprovedManuscript && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-xs text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                  Bản thảo đã được duyệt — không thể nộp lại
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(taskGroups).map(([status, group]) => (
          <div key={status} className={`kanban-column rounded-xl bg-bg-secondary/50 p-3 border ${groupColors[status]}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-text-secondary uppercase">{status}</h3>
              <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">{group.length}</span>
            </div>
            <div className="space-y-2">
              {group.map(task => {
                const assistant = getUserById(task.assistantId);
                const actions = getActions(task);
                return (
                  <div key={task.id} className="glass-card p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">p.{task.pageStart}-{task.pageEnd}</span>
                      <span className="text-text-muted">{task.id}</span>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary">{task.taskType}</span>
                    <div className="flex items-center gap-1">
                      <span>{assistant?.avatar}</span>
                      <span className="text-text-muted truncate">{assistant?.displayName}</span>
                    </div>
                    <div className="text-text-muted flex items-center gap-1">
                      <Clock size={10} /> {formatDate(task.dueDate)}
                    </div>
                    {/* Action buttons based on BR-69 */}
                    {actions.length > 0 && (
                      <div className="flex gap-1 pt-1 border-t border-border">
                        {actions.map(action => (
                          <button key={action} onClick={() => handleStatusChange(task.id, action)}
                            className={`flex-1 py-1 rounded text-[10px] font-semibold transition-colors ${
                              action === 'Approved' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : action === 'Rejected' ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                              : 'bg-primary/20 text-primary hover:bg-primary/30'
                            }`}>
                            {action === 'Approved' ? '✓ Approve' : action === 'Rejected' ? '✗ Reject' : action === 'In Progress' ? '▶ Start' : '📤 Submit'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Assign Page Task" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Page Start (BR-56)</label>
              <input type="number" className={`form-input ${taskErrors.pageRange ? 'error' : ''}`} min={1} max={chapter.totalPages} value={taskForm.pageStart} onChange={e => setTaskForm(prev => ({ ...prev, pageStart: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Page End</label>
              <input type="number" className={`form-input ${taskErrors.pageRange ? 'error' : ''}`} min={1} max={chapter.totalPages} value={taskForm.pageEnd} onChange={e => setTaskForm(prev => ({ ...prev, pageEnd: e.target.value }))} />
            </div>
          </div>
          {taskErrors.pageRange && <p className="text-xs text-danger">{taskErrors.pageRange}</p>}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Task Type (BR-51)</label>
            <select className={`form-input ${taskErrors.taskType ? 'error' : ''}`} value={taskForm.taskType} onChange={e => setTaskForm(prev => ({ ...prev, taskType: e.target.value }))}>
              <option value="">Select...</option>
              {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {taskErrors.taskType && <p className="text-xs text-danger mt-1">{taskErrors.taskType}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Due Date (BR-54)</label>
            <input type="date" className={`form-input ${taskErrors.dueDate ? 'error' : ''}`} value={taskForm.dueDate} onChange={e => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))} />
            {taskErrors.dueDate && <p className="text-xs text-danger mt-1">{taskErrors.dueDate}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Assistant (BR-57: Active only)</label>
            <select className={`form-input ${taskErrors.assistantId ? 'error' : ''}`} value={taskForm.assistantId} onChange={e => setTaskForm(prev => ({ ...prev, assistantId: e.target.value }))}>
              <option value="">Select assistant...</option>
              {assistants.map(a => <option key={a.id} value={a.id}>{a.avatar} {a.displayName} ({a.activeTasks || 0} active)</option>)}
            </select>
            {taskErrors.assistantId && <p className="text-xs text-danger mt-1">{taskErrors.assistantId}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowTaskModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleAddTask} className="btn btn-primary flex-1">Assign Task</button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal — BR-64 */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Task (BR-64)">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-text-secondary">
            Reason (min {CONFIG.TASK_REJECT_REASON_MIN_LENGTH} chars)
          </label>
          <textarea className={`form-input h-24 resize-none ${rejectError ? 'error' : ''}`} value={rejectReason} onChange={e => { setRejectReason(e.target.value); setRejectError(null); }} />
          {rejectError && <p className="text-xs text-danger">{rejectError}</p>}
          <p className="text-xs text-text-muted">{rejectReason.length}/{CONFIG.TASK_REJECT_REASON_MIN_LENGTH} min</p>
          <div className="flex gap-3">
            <button onClick={() => setShowRejectModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleRejectSubmit} className="btn btn-danger flex-1">Reject</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
