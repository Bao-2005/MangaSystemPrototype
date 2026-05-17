import { create } from 'zustand';
import { boardDecisions as initialDecisions } from '../data/boardDecisions';
import { calculateVotingResult, calculateCancellationResult } from '../utils/calculations';

export const useVotingStore = create((set, get) => ({
  decisions: [...initialDecisions],

  getDecisionById: (id) => get().decisions.find(d => d.id === id),
  getOpenDecisions: () => get().decisions.filter(d => d.status === 'Open'),
  getDecisionsBySeries: (seriesId) => get().decisions.filter(d => d.seriesId === seriesId),

  // BR-29, BR-30, BR-32: Add vote
  addVote: (decisionId, vote) => {
    set(state => ({
      decisions: state.decisions.map(d => {
        if (d.id !== decisionId) return d;
        // BR-32: Check if already voted
        if (d.votes.some(v => v.voterId === vote.voterId)) return d;
        return { ...d, votes: [...d.votes, { ...vote, timestamp: new Date().toISOString() }] };
      }),
    }));
  },

  // BR-34: Finalize decision
  finalizeDecision: (decisionId) => {
    set(state => ({
      decisions: state.decisions.map(d => {
        if (d.id !== decisionId) return d;
        let resultObj;
        if (d.decisionType === 'Cancellation') {
          resultObj = calculateCancellationResult(d.votes);
        } else {
          resultObj = calculateVotingResult(d.votes);
        }
        if (resultObj.result === 'Pending') return d; // Can't finalize without quorum
        return {
          ...d,
          status: 'Finalized',
          result: resultObj.result,
          finalizedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  // Create new decision (for proposals or cancellation reviews)
  createDecision: (decision) => {
    const id = `BD${String(get().decisions.length + 1).padStart(2, '0')}`;
    const votingDeadline = new Date();
    votingDeadline.setDate(votingDeadline.getDate() + 7);
    const newDecision = {
      ...decision, id, status: 'Open', result: null, votes: [],
      votingDeadline: votingDeadline.toISOString().split('T')[0],
      createdAt: new Date().toISOString(), finalizedAt: null,
    };
    set(state => ({ decisions: [...state.decisions, newDecision] }));
    return newDecision;
  },
}));
