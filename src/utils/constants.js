// ── Status Enums ──
export const SERIES_STATUS = {
  PROPOSED: 'Proposed',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  ACTIVE: 'Active',
  ON_HOLD: 'On-Hold',
  CANCELLED: 'Cancelled',
};

export const PROPOSAL_STATUS = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const CHAPTER_STATUS = {
  DRAFT: 'Draft',
  IN_PROGRESS: 'In Progress',
  READY_FOR_SUBMISSION: 'Ready for Submission',
  SUBMITTED: 'Submitted',
  PUBLISHED: 'Published',
  LATE: 'Late',
  OVERDUE: 'Overdue',
};

export const TASK_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  OVERDUE: 'Overdue',
  UNASSIGNED: 'Unassigned',
  SUSPENDED: 'Suspended',
};

export const MANUSCRIPT_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  REVISION_REQUIRED: 'Revision Required',
  APPROVED: 'Approved',
};

export const DECISION_TYPE = {
  SERIES_APPROVAL: 'Series Approval',
  CANCELLATION: 'Cancellation',
  CHANGE_PUBLICATION: 'Change Publication Type',
};

export const DECISION_STATUS = {
  OPEN: 'Open',
  FINALIZED: 'Finalized',
  DEFERRED: 'Deferred',
  EXPIRED: 'Expired',
};

export const VOTE_CHOICE = {
  APPROVE: 'Approve',
  REJECT: 'Reject',
  CANCEL: 'Cancel',
  CONTINUE: 'Continue',
  CHANGE: 'Change',
};

export const ESCALATION_TYPE = {
  NO_EDITOR_ASSIGNED: 'No Editor Assigned',
  NO_REVIEW_RESPONSE: 'No Review Response',
  INSUFFICIENT_VOTES: 'Insufficient Votes',
  EDITOR_CHANGE_REQUEST: 'Editor Change Request',
  DISPUTE: 'Dispute',
};

export const ESCALATION_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
};

// ── Roles ──
export const ROLES = {
  ADMIN: 'Admin',
  EDITORIAL_OFFICE_ADMIN: 'Editorial Office Admin',
  MANGAKA: 'Mangaka',
  ASSISTANT: 'Assistant',
  TANTOU_EDITOR: 'Tantou Editor',
  EDITORIAL_BOARD: 'Editorial Board',
  EDITOR_IN_CHIEF: 'Editor-in-Chief',
};

// ── Genres ──
export const GENRES = [
  'Shōnen', 'Shōjo', 'Seinen', 'Josei', 'Kodomo',
  'Action', 'Romance', 'Fantasy', 'Horror', 'Comedy',
  'Slice of Life', 'Sports', 'Sci-Fi', 'Mystery', 'Isekai',
];

// ── Publication Types ──
export const PUBLICATION_TYPES = [
  'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'One-Shot',
];

// ── Task Types ──
export const TASK_TYPES = [
  'Penciling', 'Inking', 'Toning', 'Background', 'Effects',
  'Lettering', 'Coloring', 'Touch-up',
];

// ── Config ──
export const CONFIG = {
  QUORUM_MIN: 3,
  MAX_REVISION_ROUNDS: 3,
  SUBMISSION_DEADLINE_DAYS: 14,
  MIN_DEADLINE_DAYS: 3,
  TITLE_MAX_LENGTH: 100,
  SYNOPSIS_MIN_LENGTH: 200,
  SYNOPSIS_MAX_LENGTH: 2000,
  REJECT_REASON_MIN_LENGTH: 50,
  TASK_REJECT_REASON_MIN_LENGTH: 20,
  MAX_ACTIVE_TASKS_PER_ASSISTANT: 20,
  BOTTOM_PERCENT_FLAG: 20,
  VOTING_WINDOW_DAYS: 7,
  RATE_PER_PAGE: 50000, // VND
};

// ── Status Colors ──
export const STATUS_COLORS = {
  // Series
  [SERIES_STATUS.PROPOSED]: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  [SERIES_STATUS.UNDER_REVIEW]: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  [SERIES_STATUS.APPROVED]: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  [SERIES_STATUS.ACTIVE]: { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
  [SERIES_STATUS.ON_HOLD]: { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
  [SERIES_STATUS.CANCELLED]: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  // Task
  [TASK_STATUS.PENDING]: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
  [TASK_STATUS.IN_PROGRESS]: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  [TASK_STATUS.SUBMITTED]: { bg: 'bg-violet-500/20', text: 'text-violet-400', dot: 'bg-violet-400' },
  [TASK_STATUS.APPROVED]: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  [TASK_STATUS.REJECTED]: { bg: 'bg-rose-500/20', text: 'text-rose-400', dot: 'bg-rose-400' },
  [TASK_STATUS.OVERDUE]: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  [TASK_STATUS.UNASSIGNED]: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' },
  [TASK_STATUS.SUSPENDED]: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  // Proposal
  [PROPOSAL_STATUS.DRAFT]: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
  [PROPOSAL_STATUS.PENDING_REVIEW]: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  [PROPOSAL_STATUS.UNDER_REVIEW]: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  [PROPOSAL_STATUS.APPROVED]: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  [PROPOSAL_STATUS.REJECTED]: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  // Manuscript
  [MANUSCRIPT_STATUS.DRAFT]: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
  [MANUSCRIPT_STATUS.SUBMITTED]: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  [MANUSCRIPT_STATUS.UNDER_REVIEW]: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  [MANUSCRIPT_STATUS.REVISION_REQUIRED]: { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
  [MANUSCRIPT_STATUS.APPROVED]: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  // Chapter
  [CHAPTER_STATUS.DRAFT]: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
  [CHAPTER_STATUS.IN_PROGRESS]: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  [CHAPTER_STATUS.READY_FOR_SUBMISSION]: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  [CHAPTER_STATUS.SUBMITTED]: { bg: 'bg-violet-500/20', text: 'text-violet-400', dot: 'bg-violet-400' },
  [CHAPTER_STATUS.PUBLISHED]: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  [CHAPTER_STATUS.LATE]: { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
  [CHAPTER_STATUS.OVERDUE]: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  // Decision
  [DECISION_STATUS.OPEN]: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  [DECISION_STATUS.FINALIZED]: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  [DECISION_STATUS.DEFERRED]: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  [DECISION_STATUS.EXPIRED]: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' },
  // Escalation
  [ESCALATION_STATUS.RESOLVED]: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  [ESCALATION_STATUS.DISMISSED]: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' },
};
