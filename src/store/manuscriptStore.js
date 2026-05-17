import { create } from 'zustand';
import { manuscripts as initialManuscripts, annotations as initialAnnotations } from '../data/manuscripts';

export const useManuscriptStore = create((set, get) => ({
  manuscripts: [...initialManuscripts],
  annotations: [...initialAnnotations],

  getManuscriptsByChapter: (chapterId) => get().manuscripts.filter(m => m.chapterId === chapterId),
  getManuscriptsBySeries: (seriesId) => get().manuscripts.filter(m => m.seriesId === seriesId),
  getLatestManuscript: (chapterId) => {
    const mss = get().manuscripts.filter(m => m.chapterId === chapterId);
    return mss.sort((a, b) => b.version - a.version)[0] || null;
  },
  getAnnotationsByManuscript: (msId) => get().annotations.filter(a => a.manuscriptId === msId),

  // BR-73: Submit new version
  submitManuscript: (chapterId, seriesId) => {
    const existing = get().manuscripts.filter(m => m.chapterId === chapterId);
    const version = existing.length + 1;
    const revisionCount = existing.filter(m => m.status === 'Revision Required').length;
    const id = `MS${String(get().manuscripts.length + 1).padStart(2, '0')}`;
    const ms = {
      id, chapterId, seriesId, version,
      fileURL: `/manuscripts/${seriesId}_${chapterId}_v${version}.pdf`,
      status: 'Submitted', submittedAt: new Date().toISOString(),
      reviewedAt: null, editorFeedback: null, revisionCount,
    };
    set(state => ({ manuscripts: [...state.manuscripts, ms] }));
    return ms;
  },

  // BR-75, BR-80: Review manuscript
  reviewManuscript: (msId, decision, feedback) => {
    set(state => ({
      manuscripts: state.manuscripts.map(m => {
        if (m.id !== msId) return m;
        return {
          ...m,
          status: decision, // 'Approved' or 'Revision Required'
          editorFeedback: feedback,
          reviewedAt: new Date().toISOString(),
          revisionCount: decision === 'Revision Required' ? m.revisionCount + 1 : m.revisionCount,
        };
      }),
    }));
  },

  addAnnotation: (annotation) => {
    const id = `AN${String(get().annotations.length + 1).padStart(2, '0')}`;
    set(state => ({ annotations: [...state.annotations, { ...annotation, id, createdAt: new Date().toISOString() }] }));
  },
}));
