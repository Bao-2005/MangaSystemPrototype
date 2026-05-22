import { create } from 'zustand';
import { voteRecords as initialRecords } from '../data/voteRecords';
import { calculateRankingScore, sortByRanking, flagBottom20Percent } from '../utils/calculations';

export const useRankingStore = create((set, get) => ({
  voteRecords: [...initialRecords],

  getRecordsBySeries: (seriesId) => get().voteRecords.filter(r => r.seriesId === seriesId),
  getRecordsByPeriod: (period) => get().voteRecords.filter(r => r.period === period),
  getPendingRecords: () => get().voteRecords.filter(r => r.status === 'Pending'),

  // BR-87, BR-88, BR-89: Add vote record
  addVoteRecord: (record) => {
    const id = `VR${String(get().voteRecords.length + 1).padStart(2, '0')}`;
    const newRecord = {
      ...record, id, status: 'Pending',
      enteredAt: new Date().toISOString(), confirmedAt: null,
    };
    set(state => ({ voteRecords: [...state.voteRecords, newRecord] }));
    return newRecord;
  },

  snapshots: [],

  // BR-92: Confirm and trigger ranking recalculation
  confirmRecord: (recordId) => {
    set(state => ({
      voteRecords: state.voteRecords.map(r =>
        r.id === recordId ? { ...r, status: 'Confirmed', confirmedAt: new Date().toISOString() } : r
      ),
    }));
  },

  // BR-96: Save ranking snapshot
  saveSnapshot: (period, rankings) => {
    set(state => {
      // BR-95: prevent duplicate snapshot logic
      if (state.snapshots.find(s => s.period === period)) return state;
      return { snapshots: [...state.snapshots, { period, rankings, createdAt: new Date().toISOString() }] };
    });
  },

  // BR-90, BR-91, BR-94: Calculate rankings for a period
  calculateRankings: (period, activeSeries) => {
    // BR-93: Only records belonging to active series are considered
    const activeSeriesIds = activeSeries.map(s => s.id);
    const records = get().voteRecords.filter(r => r.period === period && r.status === 'Confirmed' && activeSeriesIds.includes(r.seriesId));
    
    const ranked = records.map(r => {
      const series = activeSeries.find(s => s.id === r.seriesId);
      return {
        id: r.seriesId,
        title: series?.title || 'Unknown',
        genre: series?.genre || '',
        score: calculateRankingScore(r.voteCount, r.readerCount),
        voteCount: r.voteCount,
        readerCount: r.readerCount,
      };
    });
    const sorted = sortByRanking(ranked);
    return flagBottom20Percent(sorted);
  },

  // Get available periods
  getPeriods: () => {
    const periods = [...new Set(get().voteRecords.map(r => r.period))];
    return periods.sort().reverse();
  },
}));
