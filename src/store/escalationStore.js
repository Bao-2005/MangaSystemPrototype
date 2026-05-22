import { create } from 'zustand';
import { escalations as initialEscalations, chiefActions as initialActions } from '../data/escalations';

export const useEscalationStore = create((set, get) => ({
  escalations: [...initialEscalations],
  chiefActions: [...initialActions],

  // ── Getters ──
  getPendingEscalations: () => get().escalations.filter(e => e.status === 'Pending' || e.status === 'In Progress'),
  getResolvedEscalations: () => get().escalations.filter(e => e.status === 'Resolved' || e.status === 'Dismissed'),
  getEscalationById: (id) => get().escalations.find(e => e.id === id),
  getByType: (type) => get().escalations.filter(e => e.type === type),
  getBySeriesId: (seriesId) => get().escalations.filter(e => e.seriesId === seriesId),
  getActionLog: () => [...get().chiefActions].sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt)),

  // ── Mutations ──
  resolveEscalation: (id, resolution) => {
    set(state => ({
      escalations: state.escalations.map(e =>
        e.id === id
          ? { ...e, status: 'Resolved', resolution, resolvedAt: new Date().toISOString(), resolvedBy: 'U12' }
          : e
      ),
    }));
  },

  dismissEscalation: (id, reason) => {
    set(state => ({
      escalations: state.escalations.map(e =>
        e.id === id
          ? { ...e, status: 'Dismissed', resolution: reason, resolvedAt: new Date().toISOString(), resolvedBy: 'U12' }
          : e
      ),
    }));
  },

  updateEscalationStatus: (id, status) => {
    set(state => ({
      escalations: state.escalations.map(e =>
        e.id === id ? { ...e, status } : e
      ),
    }));
  },

  addChiefAction: (action) => {
    const id = `CA${String(get().chiefActions.length + 1).padStart(2, '0')}`;
    const newAction = { ...action, id, performedBy: 'U12', performedAt: new Date().toISOString() };
    set(state => ({ chiefActions: [newAction, ...state.chiefActions] }));
  },

  createEscalation: (data) => {
    const id = `ESC${String(get().escalations.length + 1).padStart(2, '0')}`;
    const newEsc = {
      ...data,
      id,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolution: null,
      resolvedBy: null,
    };
    set(state => ({ escalations: [...state.escalations, newEsc] }));
    return newEsc;
  },

  submitEditorResponse: (id, responseText) => {
    set(state => ({
      escalations: state.escalations.map(e =>
        e.id === id
          ? {
              ...e,
              editorResponse: responseText,
              editorResponseAt: new Date().toISOString(),
              status: e.status === 'Pending' ? 'In Progress' : e.status,
            }
          : e
      ),
    }));
  },
}));
