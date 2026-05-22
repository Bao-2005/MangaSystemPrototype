import { create } from 'zustand';
import { series as initialSeries, proposals as initialProposals } from '../data/series';
import { useAuthStore } from './authStore';

export const useSeriesStore = create((set, get) => ({
  series: [...initialSeries],
  proposals: [...initialProposals],

  getSeriesById: (id) => get().series.find(s => s.id === id),
  getSeriesByMangaka: (mangakaId) => get().series.filter(s => s.mangakaId === mangakaId),
  getSeriesByEditor: (editorId) => get().series.filter(s => s.editorId === editorId),
  getActiveSeries: () => get().series.filter(s => s.status === 'Active'),
  getProposalsByMangaka: (mangakaId) => get().proposals.filter(p => p.mangakaId === mangakaId),

  addProposal: (proposal) => {
    const id = `PR${String(get().proposals.length + 1).padStart(2, '0')}`;
    const newProposal = { 
      ...proposal, 
      id, 
      status: 'Draft', 
      createdAt: new Date().toISOString(),
      intakeStatus: 'Pending Assignment',
      assignedEditorId: null,
      deadline: null,
      isOverdue: false,
      escalated: false,
      meetingAgenda: false,
      informationComplete: false
    };
    set(state => ({ proposals: [...state.proposals, newProposal] }));
    return newProposal;
  },

  submitProposal: (proposalId) => {
    const proposal = get().proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const users = useAuthStore.getState().users;
    const mangaka = users.find(u => u.id === proposal.mangakaId);
    const editorId = mangaka?.editorId || null;

    // Set 7-day review deadline
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);
    const deadlineStr = deadlineDate.toISOString().split('T')[0];

    set(state => ({
      proposals: state.proposals.map(p =>
        p.id === proposalId ? { 
          ...p, 
          status: 'Pending Review', 
          submittedAt: new Date().toISOString(),
          intakeStatus: 'Assigned',
          assignedEditorId: editorId,
          deadline: deadlineStr
        } : p
      ),
    }));
  },

  updateProposal: (proposalId, data) => {
    set(state => ({
      proposals: state.proposals.map(p => p.id === proposalId ? { ...p, ...data } : p),
    }));
  },

  // --- Proposal Intake Actions ---
  assignEditorToProposal: (proposalId, editorId, deadline) => {
    set(state => ({
      proposals: state.proposals.map(p =>
        p.id === proposalId ? {
          ...p,
          intakeStatus: 'Assigned',
          assignedEditorId: editorId,
          deadline: deadline,
          isOverdue: false,
          escalated: false
        } : p
      ),
    }));
  },

  markProposalInfoComplete: (proposalId, isComplete) => {
    set(state => ({
      proposals: state.proposals.map(p =>
        p.id === proposalId ? { ...p, informationComplete: isComplete } : p
      ),
    }));
  },

  addToMeetingAgenda: (proposalId) => {
    set(state => ({
      proposals: state.proposals.map(p =>
        p.id === proposalId ? { ...p, meetingAgenda: true } : p
      ),
    }));
  },

  sendEditorReminder: (proposalId) => {
    // In a real app, this would trigger an email or notification
    console.log(`Reminder sent to editor for proposal ${proposalId}`);
  },

  escalateProposal: (proposalId) => {
    set(state => ({
      proposals: state.proposals.map(p =>
        p.id === proposalId ? { ...p, escalated: true, intakeStatus: 'Escalated' } : p
      ),
    }));
  },

  rejectProposalAdmin: (proposalId, reason) => {
    set(state => ({
      proposals: state.proposals.map(p =>
        p.id === proposalId ? { 
          ...p, 
          status: 'Rejected',
          intakeStatus: 'Rejected',
          rejectionReason: reason,
          rejectedAt: new Date().toISOString()
        } : p
      ),
    }));
  },

  approveProposalAdmin: (proposalId) => {
    const proposal = get().proposals.find(p => p.id === proposalId);
    if (!proposal) return;
    set(state => ({
      proposals: state.proposals.map(p =>
        p.id === proposalId ? { 
          ...p, 
          status: 'Approved',
          intakeStatus: 'Approved',
          informationComplete: true,
          approvedAt: new Date().toISOString()
        } : p
      ),
      series: state.series.map(s =>
        s.id === proposal.seriesId ? { 
          ...s, 
          status: 'Active', 
          editorId: proposal.assignedEditorId || s.editorId,
          activatedAt: new Date().toISOString() 
        } : s
      )
    }));
  },

  // Called when Tantou Editor approves a proposal.
  // Routes it to Editorial Board for voting (does NOT activate the series).
  editorApproveProposal: (proposalId) => {
    const proposal = get().proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    set(state => ({
      proposals: state.proposals.map(p =>
        p.id === proposalId ? {
          ...p,
          status: 'Under Review',
          editorApprovedAt: new Date().toISOString(),
        } : p
      ),
      series: state.series.map(s =>
        s.id === proposal.seriesId ? { ...s, status: 'Under Review' } : s
      ),
    }));
  },

  checkOverdueAssignments: () => {
    const now = new Date();
    set(state => ({
      proposals: state.proposals.map(p => {
        if (p.intakeStatus === 'Assigned' && p.deadline && new Date(p.deadline) < now && !p.isOverdue) {
          return { ...p, isOverdue: true, intakeStatus: 'Overdue' };
        }
        return p;
      })
    }));
  },
  // ---------------------------------------------

  // BR-24: Activation — called after board approval
  activateSeries: (seriesId, editorId) => {
    set(state => ({
      series: state.series.map(s =>
        s.id === seriesId ? { ...s, status: 'Active', editorId, activatedAt: new Date().toISOString() } : s
      ),
    }));
  },

  updateSeriesStatus: (seriesId, status) => {
    set(state => ({
      series: state.series.map(s => s.id === seriesId ? { ...s, status } : s),
    }));
  },

  addSeries: (seriesData) => {
    const id = `S${String(get().series.length + 1).padStart(2, '0')}`;
    const newSeries = { ...seriesData, id, createdAt: new Date().toISOString(), rankingScore: 0, totalChapters: 0, publishedChapters: 0 };
    set(state => ({ series: [...state.series, newSeries] }));
    return newSeries;
  },
}));
