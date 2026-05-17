import { CONFIG } from './constants';

// BR-15: Proposal Validation Requirements
export function validateProposal(proposal) {
  const errors = {};
  if (!proposal.title || proposal.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (proposal.title.length > CONFIG.TITLE_MAX_LENGTH) {
    errors.title = `Title must be ≤ ${CONFIG.TITLE_MAX_LENGTH} characters`;
  }
  if (!proposal.genre) errors.genre = 'Genre is required';
  if (!proposal.publicationType) errors.publicationType = 'Publication type is required';
  if (!proposal.synopsis || proposal.synopsis.trim().length < CONFIG.SYNOPSIS_MIN_LENGTH) {
    errors.synopsis = `Synopsis must be ≥ ${CONFIG.SYNOPSIS_MIN_LENGTH} characters`;
  } else if (proposal.synopsis.length > CONFIG.SYNOPSIS_MAX_LENGTH) {
    errors.synopsis = `Synopsis must be ≤ ${CONFIG.SYNOPSIS_MAX_LENGTH} characters`;
  }
  if (!proposal.samplePages || proposal.samplePages < 5) {
    errors.samplePages = 'Must have ≥ 5 sample pages';
  }
  return errors;
}

// BR-17: Unique Active Series Title
export function validateUniqueTitle(title, existingSeries, excludeId = null) {
  const duplicate = existingSeries.find(
    s => s.title.toLowerCase() === title.toLowerCase() && s.status === 'Active' && s.id !== excludeId
  );
  return duplicate ? `Title "${title}" is already used by an active series` : null;
}

// BR-35: Reject Reason Requirement (Board voting)
export function validateRejectReason(reason) {
  if (!reason || reason.trim().length < CONFIG.REJECT_REASON_MIN_LENGTH) {
    return `Rejection reason must be ≥ ${CONFIG.REJECT_REASON_MIN_LENGTH} characters`;
  }
  return null;
}

// BR-64: Task Reject Reason Requirement
export function validateTaskRejectReason(reason) {
  if (!reason || reason.trim().length < CONFIG.TASK_REJECT_REASON_MIN_LENGTH) {
    return `Rejection reason must be ≥ ${CONFIG.TASK_REJECT_REASON_MIN_LENGTH} characters`;
  }
  return null;
}

// BR-42: Publication Date Validation
export function validatePublicationDate(pubDate, createdDate = new Date()) {
  const pub = new Date(pubDate);
  const created = new Date(createdDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (pub <= today) return 'Publication date must be in the future';

  const deadline = new Date(pub);
  deadline.setDate(deadline.getDate() - CONFIG.SUBMISSION_DEADLINE_DAYS);

  const minDeadline = new Date(created);
  minDeadline.setDate(minDeadline.getDate() + CONFIG.MIN_DEADLINE_DAYS);

  if (deadline < minDeadline) {
    return `Publication date must be at least ${CONFIG.SUBMISSION_DEADLINE_DAYS + CONFIG.MIN_DEADLINE_DAYS} days from creation date`;
  }
  return null;
}

// BR-54: Due Date Validation
export function validateTaskDueDate(dueDate, chapterDeadline) {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(chapterDeadline);

  if (due < today) return 'Due date cannot be in the past';
  if (due > deadline) return 'Due date must be ≤ chapter deadline';

  const minBeforeDeadline = new Date(deadline);
  minBeforeDeadline.setDate(minBeforeDeadline.getDate() - CONFIG.MIN_DEADLINE_DAYS);
  if (due > minBeforeDeadline) {
    return `Due date must be at least ${CONFIG.MIN_DEADLINE_DAYS} days before submission deadline`;
  }
  return null;
}

// BR-49: Page Range Non-Overlap
export function validatePageRangeOverlap(newRange, existingTasks, excludeTaskId = null) {
  for (const task of existingTasks) {
    if (task.id === excludeTaskId) continue;
    if (task.status === 'Suspended' || task.status === 'Unassigned') continue;
    if (newRange.start <= task.pageEnd && newRange.end >= task.pageStart) {
      return `Page range overlaps with task "${task.id}" (pages ${task.pageStart}-${task.pageEnd})`;
    }
  }
  return null;
}

// BR-56: Page Range Validation
export function validatePageRange(start, end, totalPages) {
  if (start > end) return 'Page start must be ≤ page end';
  if (start < 1) return 'Page start must be ≥ 1';
  if (end > totalPages) return `Page end must be ≤ total pages (${totalPages})`;
  return null;
}

// BR-59: Mandatory Task Fields
export function validateTaskFields(task) {
  const errors = {};
  if (!task.pageStart || !task.pageEnd) errors.pageRange = 'Page range is required';
  if (!task.taskType) errors.taskType = 'Task type is required';
  if (!task.dueDate) errors.dueDate = 'Due date is required';
  if (!task.assistantId) errors.assistantId = 'Assistant is required';
  return errors;
}

// BR-89: VoteRecord Validation
export function validateVoteRecord(record) {
  const errors = {};
  if (!record.period) errors.period = 'Period is required';
  if (record.readerCount === undefined || record.readerCount < 0) {
    errors.readerCount = 'Reader count must be ≥ 0';
  }
  if (record.voteCount === undefined || record.voteCount < 0) {
    errors.voteCount = 'Vote count must be ≥ 0';
  }
  if (record.readerCount !== undefined && record.voteCount !== undefined && record.voteCount > record.readerCount) {
    errors.voteCount = 'Vote count must be ≤ reader count';
  }
  return errors;
}

// BR-88: VoteRecord Uniqueness
export function validateVoteRecordUniqueness(seriesId, period, existingRecords) {
  const duplicate = existingRecords.find(r => r.seriesId === seriesId && r.period === period);
  return duplicate ? 'A vote record for this series and period already exists' : null;
}

// BR-102: Mandatory Reason Requirement for Cancel/Change decisions
export function validateDecisionReason(reason) {
  if (!reason || reason.trim().length === 0) {
    return 'Reason is required for Cancel/Change decisions';
  }
  return null;
}

// BR-19: Single Active Proposal Limit
export function validateSingleActiveProposal(mangakaId, proposals) {
  const activeProposal = proposals.find(
    p => p.mangakaId === mangakaId && ['Pending Review', 'Under Review'].includes(p.status)
  );
  return activeProposal
    ? `You already have an active proposal: "${activeProposal.title}"`
    : null;
}
