import { ROLES } from './constants';

// ── Role-based menu permissions ──
export const MENU_PERMISSIONS = {
  dashboard: [ROLES.ADMIN, ROLES.EDITORIAL_OFFICE_ADMIN, ROLES.MANGAKA, ROLES.ASSISTANT, ROLES.TANTOU_EDITOR, ROLES.EDITORIAL_BOARD],
  series: [ROLES.ADMIN, ROLES.EDITORIAL_OFFICE_ADMIN, ROLES.MANGAKA, ROLES.ASSISTANT, ROLES.TANTOU_EDITOR, ROLES.EDITORIAL_BOARD],
  'series/new': [ROLES.MANGAKA],
  voting: [ROLES.EDITORIAL_BOARD, ROLES.ADMIN],
  chapters: [ROLES.MANGAKA, ROLES.ASSISTANT, ROLES.TANTOU_EDITOR, ROLES.ADMIN],
  manuscripts: [ROLES.MANGAKA, ROLES.TANTOU_EDITOR, ROLES.ADMIN],
  'ranking/votes': [ROLES.EDITORIAL_BOARD, ROLES.ADMIN],
  ranking: [ROLES.ADMIN, ROLES.MANGAKA, ROLES.TANTOU_EDITOR, ROLES.EDITORIAL_BOARD],
  decisions: [ROLES.EDITORIAL_BOARD, ROLES.ADMIN],
  'admin/create-account': [ROLES.EDITORIAL_OFFICE_ADMIN],
};

// BR-03: Permission Enforcement
export function hasPermission(userRoles, requiredRoles) {
  if (!userRoles || !requiredRoles) return false;
  return userRoles.some(role => requiredRoles.includes(role));
}

// BR-04: Object-Level Authorization — check ownership
export function isOwner(userId, entityOwnerId) {
  return userId === entityOwnerId;
}

// BR-10: Mangaka–Assistant Conflict Rule
export function hasMangakaAssistantConflict(userId, series, role) {
  if (role === ROLES.ASSISTANT && series.mangakaId === userId) return true;
  if (role === ROLES.MANGAKA && series.assistantIds?.includes(userId)) return true;
  return false;
}

// BR-27, BR-28: Voting eligibility & conflict of interest
export function canVoteOnDecision(user, decision, series) {
  if (!user.roles.includes(ROLES.EDITORIAL_BOARD)) return false;
  if (user.status !== 'Active') return false;
  // Conflict checks
  if (series.mangakaId === user.id) return false;
  if (series.editorId === user.id) return false;
  if (series.assistantIds?.includes(user.id)) return false;
  return true;
}

// BR-40: Chapter creation eligibility
export function canCreateChapter(user, series) {
  if (!user.roles.includes(ROLES.MANGAKA)) return false;
  if (series.mangakaId !== user.id) return false;
  if (series.status !== 'Active') return false;
  return true;
}

// BR-52: Assignment authority
export function canAssignTask(user, series) {
  return user.roles.includes(ROLES.MANGAKA) && series.mangakaId === user.id;
}

// BR-66: Assistant task visibility
export function canViewTask(user, task) {
  if (user.roles.includes(ROLES.ADMIN)) return true;
  if (user.roles.includes(ROLES.MANGAKA)) return true;
  if (user.roles.includes(ROLES.TANTOU_EDITOR)) return true;
  if (user.roles.includes(ROLES.ASSISTANT) && task.assistantId === user.id) return true;
  return false;
}

// BR-69: Assistant status transition restriction
export function getAllowedTransitions(role, currentStatus) {
  if (role === ROLES.ASSISTANT) {
    const map = {
      'Pending': ['In Progress'],
      'In Progress': ['Submitted'],
    };
    return map[currentStatus] || [];
  }
  if (role === ROLES.MANGAKA) {
    const map = {
      'Submitted': ['Approved', 'Rejected'],
    };
    return map[currentStatus] || [];
  }
  return [];
}

// BR-72: Manuscript submission authority
export function canSubmitManuscript(user, series) {
  return user.roles.includes(ROLES.MANGAKA) && series.mangakaId === user.id;
}

// BR-74: Editor access restriction
export function canReviewManuscript(user, series) {
  return user.roles.includes(ROLES.TANTOU_EDITOR) && series.editorId === user.id;
}

// BR-87: Vote data entry authority
export function canEnterVoteData(user) {
  return user.roles.includes(ROLES.EDITORIAL_BOARD) && user.status === 'Active';
}

// Menu filter based on role
export function getFilteredMenu(userRoles) {
  return Object.entries(MENU_PERMISSIONS)
    .filter(([, roles]) => hasPermission(userRoles, roles))
    .map(([path]) => path);
}
