export const boardDecisions = [
  // ── Approved series decisions (past) ──
  {
    id: 'BD01', seriesId: 'S01', decisionType: 'Series Approval', status: 'Finalized',
    result: 'Approved', reason: null,
    votes: [
      { voterId: 'U08', choice: 'Approve', reason: 'Strong premise with great potential for weekly serialization.', timestamp: '2025-04-15', isConflict: false },
      { voterId: 'U09', choice: 'Approve', reason: 'Unique take on the sword fantasy genre.', timestamp: '2025-04-16', isConflict: false },
      { voterId: 'U10', choice: 'Approve', reason: 'Art quality is exceptional. Approved.', timestamp: '2025-04-17', isConflict: false },
    ],
    votingDeadline: '2025-04-22', createdAt: '2025-04-14', finalizedAt: '2025-04-17',
    requiredVoters: [],
  },
  // ── Rejected series ──
  {
    id: 'BD02', seriesId: null, decisionType: 'Series Approval', status: 'Finalized',
    result: 'Rejected', reason: 'Plot too similar to existing serializations.',
    proposalTitle: 'Dragon Pulse',
    votes: [
      { voterId: 'U08', choice: 'Reject', reason: 'Too similar to current shōnen lineup. Needs more originality in the world-building and character design.', timestamp: '2025-09-10', isConflict: false },
      { voterId: 'U09', choice: 'Reject', reason: 'Agree — derivative premise. The power system is nearly identical to Battle Chronicle which we cancelled last quarter.', timestamp: '2025-09-11', isConflict: false },
      { voterId: 'U10', choice: 'Approve', reason: 'Art is good but I can see the concerns.', timestamp: '2025-09-12', isConflict: false },
    ],
    votingDeadline: '2025-09-17', createdAt: '2025-09-09', finalizedAt: '2025-09-12',
    requiredVoters: [],
  },
  // ── Cancellation decision for S07 ──
  {
    id: 'BD03', seriesId: 'S07', decisionType: 'Cancellation', status: 'Finalized',
    result: 'Cancel', reason: 'Series consistently ranked in bottom 20% for 3 consecutive periods.',
    votes: [
      { voterId: 'U08', choice: 'Cancel', reason: 'Readership declining steadily. No improvement despite editorial guidance.', timestamp: '2026-02-20', isConflict: false },
      { voterId: 'U09', choice: 'Cancel', reason: 'Agree with cancellation. Resources better allocated to new series.', timestamp: '2026-02-21', isConflict: false },
      { voterId: 'U10', choice: 'Continue', reason: 'Story has potential but I understand the numbers.', timestamp: '2026-02-22', isConflict: false },
    ],
    votingDeadline: '2026-02-27', createdAt: '2026-02-19', finalizedAt: '2026-02-22',
    requiredVoters: [],
  },
  // ── BD04: Active voting — Sakura Knights (PR02 / S05) — still open, 1 vote in ──
  // NOTE: deadline 2026-05-25 is past → Board can escalate to Chief
  {
    id: 'BD04', seriesId: 'S05', decisionType: 'Series Approval', status: 'Open',
    result: null, reason: null, proposalId: 'PR02',
    votes: [
      { voterId: 'U08', choice: 'Approve', reason: 'Beautiful art and original concept. Weekly potential.', timestamp: '2026-05-10', isConflict: false },
      { voterId: 'U09', choice: 'Approve', reason: 'Good story structure.', timestamp: '2026-05-11', isConflict: false },
      { voterId: 'U10', choice: 'Approve', reason: 'Ready for serialization.', timestamp: '2026-05-12', isConflict: false },
    ],
    votingDeadline: '2026-05-20', createdAt: '2026-05-08', finalizedAt: null,
    requiredVoters: [],
    isExtended: false,
  },
  // ── BD05: CRITICAL — Whispers of the Deep — 0 votes, deadline PAST → ESC03 ──
  // Deadline set to past date so Board can test "Escalate to Chief" button
  {
    id: 'BD05', seriesId: 'S04', decisionType: 'Series Approval', status: 'Open',
    result: null, reason: null, proposalId: 'PR01',
    votes: [],
    votingDeadline: '2026-05-15', createdAt: '2026-05-12', finalizedAt: null,
    requiredVoters: ['U08'],
    isExtended: false,
  },
  // ── BD06: Ramen Dynasty cancellation review — 1 vote ──
  {
    id: 'BD06', seriesId: 'S06', decisionType: 'Cancellation', status: 'Open',
    result: null, reason: null,
    votes: [
      { voterId: 'U08', choice: 'Continue', reason: 'Despite low ranking, has loyal niche audience.', timestamp: '2026-05-14', isConflict: false },
    ],
    votingDeadline: '2026-05-30', createdAt: '2026-05-10', finalizedAt: null,
    requiredVoters: [],
    isExtended: false,
  },
];
