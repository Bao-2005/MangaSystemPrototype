import { create } from 'zustand';
import { chapters as initialChapters } from '../data/chapters';
import { pageTasks as initialTasks } from '../data/pageTasks';

export const useChapterStore = create((set, get) => ({
  chapters: [...initialChapters],
  tasks: [...initialTasks],

  getChapterById: (id) => get().chapters.find(c => c.id === id),
  getChaptersBySeries: (seriesId) => get().chapters.filter(c => c.seriesId === seriesId),
  getTasksByChapter: (chapterId) => get().tasks.filter(t => t.chapterId === chapterId),
  getTasksByAssistant: (assistantId) => get().tasks.filter(t => t.assistantId === assistantId),
  getTaskById: (taskId) => get().tasks.find(t => t.id === taskId),

  addChapter: (chapter) => {
    const id = `CH${String(get().chapters.length + 1).padStart(2, '0')}`;
    const deadline = new Date(chapter.publicationDate);
    deadline.setDate(deadline.getDate() - 14);
    const newChapter = {
      ...chapter, id, status: 'Draft',
      deadline: deadline.toISOString().split('T')[0],
      createdAt: new Date().toISOString(), submittedAt: null, approvedAt: null,
    };
    set(state => ({ chapters: [...state.chapters, newChapter] }));
    return newChapter;
  },

  updateChapterStatus: (chapterId, status) => {
    set(state => ({
      chapters: state.chapters.map(c => c.id === chapterId ? { ...c, status } : c),
    }));
  },

  addTask: (task) => {
    const id = `T${String(get().tasks.length + 1).padStart(2, '0')}`;
    const newTask = { ...task, id, status: 'Pending', submittedAt: null, approvedAt: null };
    set(state => ({ tasks: [...state.tasks, newTask] }));

    // Issue #6: Auto-update chapter status to "In Progress" when first task is added
    const chapter = get().chapters.find(c => c.id === task.chapterId);
    if (chapter && chapter.status === 'Draft') {
      get().updateChapterStatus(task.chapterId, 'In Progress');
    }

    return newTask;
  },

  // BR-68, BR-69: Task status transitions
  updateTaskStatus: (taskId, newStatus, reason = null) => {
    const now = new Date().toISOString();
    set(state => ({
      tasks: state.tasks.map(t => {
        if (t.id !== taskId) return t;
        const updates = { status: newStatus };
        if (newStatus === 'Submitted') updates.submittedAt = now;
        if (newStatus === 'Approved') updates.approvedAt = now;
        if (newStatus === 'Rejected') {
          updates.rejectReason = reason;
          // BR-65: Rejected → In Progress
        }
        return { ...t, ...updates };
      }),
    }));

    // Issue #6: Auto-update chapter status based on task statuses
    const task = get().tasks.find(t => t.id === taskId);
    if (task) {
      get().autoUpdateChapterStatus(task.chapterId);
    }
  },

  // Issue #6: Automatically update chapter status based on task progress
  autoUpdateChapterStatus: (chapterId) => {
    const chapterTasks = get().tasks.filter(t => t.chapterId === chapterId);
    const chapter = get().chapters.find(c => c.id === chapterId);
    if (!chapter || chapterTasks.length === 0) return;

    // Don't auto-update if chapter is already Published or Submitted
    if (['Published', 'Submitted'].includes(chapter.status)) return;

    const allApproved = chapterTasks.every(t => t.status === 'Approved');
    const hasInProgress = chapterTasks.some(t => ['In Progress', 'Submitted', 'Rejected'].includes(t.status));

    if (allApproved) {
      get().updateChapterStatus(chapterId, 'Ready for Submission');
    } else if (hasInProgress && chapter.status === 'Draft') {
      get().updateChapterStatus(chapterId, 'In Progress');
    }
  },

  // Recalculate deadline based on publication type change
  recalculateDeadlines: (seriesId, newType) => {
    set(state => ({
      chapters: state.chapters.map(c => {
        if (c.seriesId === seriesId && ['Draft', 'In Progress'].includes(c.status)) {
          // Demo logic: Add days based on new publication type
          const daysToAdd = newType === 'Weekly' ? 7 : (newType === 'Bi-Weekly' ? 14 : 30);
          const currentPubDate = new Date(c.publicationDate);
          currentPubDate.setDate(currentPubDate.getDate() + daysToAdd);
          
          const newDeadline = new Date(currentPubDate);
          newDeadline.setDate(newDeadline.getDate() - 14);

          return { 
            ...c, 
            publicationDate: currentPubDate.toISOString().split('T')[0],
            deadline: newDeadline.toISOString().split('T')[0]
          };
        }
        return c;
      }),
    }));
  },

  // BR-104: Cascade cancel — Suspend all tasks in series
  suspendTasksBySeries: (seriesId) => {
    const chapterIds = get().chapters.filter(c => c.seriesId === seriesId).map(c => c.id);
    set(state => ({
      tasks: state.tasks.map(t => {
        if (chapterIds.includes(t.chapterId) && ['Pending', 'In Progress'].includes(t.status)) {
          return { ...t, status: 'Suspended' };
        }
        return t;
      }),
      chapters: state.chapters.map(c => {
        if (c.seriesId === seriesId && ['Draft', 'In Progress'].includes(c.status)) {
          return { ...c, status: 'Suspended' };
        }
        return c;
      }),
    }));
  },
}));
