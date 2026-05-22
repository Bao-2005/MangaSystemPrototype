import { CONFIG } from './constants';

// BR-61: Chapter Completion Formula
// completion % = Approved Tasks / Total Required Tasks × 100%
export function calculateChapterCompletion(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const approved = tasks.filter(t => t.status === 'Approved').length;
  return Math.round((approved / tasks.length) * 100);
}

// BR-90: Ranking Formula
// score = (voteCount / readerCount) × 100%
export function calculateRankingScore(voteCount, readerCount) {
  if (readerCount === 0 || readerCount === undefined) return 0;
  return parseFloat(((voteCount / readerCount) * 100).toFixed(2));
}

// BR-91: Tie-Break Rule
export function sortByRanking(seriesWithScores) {
  return [...seriesWithScores].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
    return a.id.localeCompare(b.id);
  });
}

// BR-94: Bottom 20% Review Flag
export function flagBottom20Percent(rankedSeries) {
  if (rankedSeries.length < 5) return rankedSeries.map(s => ({ ...s, flagged: false }));
  const threshold = Math.ceil(rankedSeries.length * (CONFIG.BOTTOM_PERCENT_FLAG / 100));
  return rankedSeries.map((s, i) => ({
    ...s,
    flagged: i >= rankedSeries.length - threshold,
    rank: i + 1,
  }));
}

// BR-33: Majority Rule for voting
export function calculateVotingResult(votes) {
  const validVotes = votes.filter(v => !v.isConflict);
  const approveCount = validVotes.filter(v => v.choice === 'Approve').length;
  const rejectCount = validVotes.filter(v => v.choice === 'Reject').length;
  const total = validVotes.length;

  if (total < CONFIG.QUORUM_MIN) return { result: 'Pending', reason: 'Quorum not reached' };
  if (approveCount > total / 2) return { result: 'Approved', reason: `${approveCount}/${total} approved` };
  if (rejectCount > total / 2) return { result: 'Rejected', reason: `${rejectCount}/${total} rejected` };
  return { result: 'Deferred', reason: 'Tie — no majority' };
}

// BR-108: Cancellation Majority Rule
export function calculateCancellationResult(votes) {
  const validVotes = votes.filter(v => !v.isConflict);
  const cancelCount = validVotes.filter(v => v.choice === 'Cancel').length;
  const total = validVotes.length;

  if (total < CONFIG.QUORUM_MIN) return { result: 'Pending', reason: 'Quorum not reached' };
  if (cancelCount > total / 2) return { result: 'Cancel', reason: `${cancelCount}/${total} voted cancel` };
  return { result: 'Continue', reason: `Majority not reached for cancellation` };
}

// BR-13: Assistant Performance Monitoring
export function calculatePerformanceScore(completedOnTime, totalAssigned) {
  if (totalAssigned === 0) return 100;
  return Math.round((completedOnTime / totalAssigned) * 100);
}

// BR-124: Earnings Formula
export function calculateEarnings(approvedPages, ratePerPage = CONFIG.RATE_PER_PAGE) {
  return approvedPages * ratePerPage;
}

// Format currency
export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Format date
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// Days until deadline
export function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}
