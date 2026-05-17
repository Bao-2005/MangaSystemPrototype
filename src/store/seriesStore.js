import { create } from 'zustand';
import { series as initialSeries, proposals as initialProposals } from '../data/series';

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
    const newProposal = { ...proposal, id, status: 'Draft', createdAt: new Date().toISOString() };
    set(state => ({ proposals: [...state.proposals, newProposal] }));
    return newProposal;
  },

  submitProposal: (proposalId) => {
    set(state => ({
      proposals: state.proposals.map(p =>
        p.id === proposalId ? { ...p, status: 'Pending Review', submittedAt: new Date().toISOString() } : p
      ),
    }));
  },

  updateProposal: (proposalId, data) => {
    set(state => ({
      proposals: state.proposals.map(p => p.id === proposalId ? { ...p, ...data } : p),
    }));
  },

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
