export const manuscripts = [
  // ── Published chapters — Approved manuscripts ──
  {
    id: 'MS01', chapterId: 'CH01', seriesId: 'S01',
    version: 1, fileURL: '/manuscripts/s01_ch21_v1.pdf',
    status: 'Approved', submittedAt: '2026-03-28', reviewedAt: '2026-03-30',
    editorFeedback: 'Great work on the final chapter. Dialogue and pacing are excellent. Approved.',
    revisionCount: 0,
  },
  {
    id: 'MS02', chapterId: 'CH02', seriesId: 'S01',
    version: 1, fileURL: '/manuscripts/s01_ch22_v1.pdf',
    status: 'Approved', submittedAt: '2026-04-05', reviewedAt: '2026-04-07',
    editorFeedback: 'Clean panels, excellent action choreography. Approved for publication.',
    revisionCount: 0,
  },
  {
    id: 'MS03', chapterId: 'CH05', seriesId: 'S02',
    version: 1, fileURL: '/manuscripts/s02_ch07_v1.pdf',
    status: 'Revision Required', submittedAt: '2026-03-10', reviewedAt: '2026-03-12',
    editorFeedback: 'Panel layout on pages 12–15 needs rework. The action sequence lacks visual clarity. Expand to full-width panels.',
    revisionCount: 1,
  },
  {
    id: 'MS04', chapterId: 'CH05', seriesId: 'S02',
    version: 2, fileURL: '/manuscripts/s02_ch07_v2.pdf',
    status: 'Approved', submittedAt: '2026-03-15', reviewedAt: '2026-03-17',
    editorFeedback: 'Great improvements on panel flow. Approved.',
    revisionCount: 1,
  },
  {
    id: 'MS05', chapterId: 'CH07', seriesId: 'S03',
    version: 1, fileURL: '/manuscripts/s03_ch15_v1.pdf',
    status: 'Approved', submittedAt: '2026-03-25', reviewedAt: '2026-03-26',
    editorFeedback: 'Mecha designs outstanding. Approved without revisions.',
    revisionCount: 0,
  },

  // ── CH11 — Submitted, not yet reviewed (Cancelled series S07) ──
  {
    id: 'MS06', chapterId: 'CH11', seriesId: 'S07',
    version: 1, fileURL: '/manuscripts/s07_ch09_v1.pdf',
    status: 'Submitted', submittedAt: '2026-02-12', reviewedAt: null,
    editorFeedback: null, revisionCount: 0,
  },

  // ── CH03 — Currently Under Review for Blade of Eternity Ch.23 ──
  {
    id: 'MS09', chapterId: 'CH03', seriesId: 'S01',
    version: 1, fileURL: '/manuscripts/s01_ch23_v1.pdf',
    status: 'Revision Required', submittedAt: '2026-05-01', reviewedAt: '2026-05-03',
    editorFeedback: 'The climax on pages 18–22 needs better buildup. The villain motivation feels rushed. Please address before next submission.',
    revisionCount: 1,
  },
  {
    id: 'MS10', chapterId: 'CH03', seriesId: 'S01',
    version: 2, fileURL: '/manuscripts/s01_ch23_v2.pdf',
    status: 'Revision Required', submittedAt: '2026-05-08', reviewedAt: '2026-05-10',
    editorFeedback: 'Villain motivation improved but pages 20–22 still feel rushed. The pacing needs one more pass — tighten the dialogue.',
    revisionCount: 2,
  },

  // ── MS11 — MAX REVISIONS (revisionCount=3): Tantou Editor can escalate to Chief ──
  // This is Blade of Eternity Ch.23 version 3 — at max revision limit
  {
    id: 'MS11', chapterId: 'CH03', seriesId: 'S01',
    version: 3, fileURL: '/manuscripts/s01_ch23_v3.pdf',
    status: 'Revision Required', submittedAt: '2026-05-15', reviewedAt: '2026-05-17',
    editorFeedback: 'Three revisions and page 20–22 pacing still not resolved. Per BR-83, maximum revisions reached. Escalation required.',
    revisionCount: 3,
  },

  // ── MS12 — Moonlit Academy Ch.7: Submitted but editor (Watanabe) not reviewing (ESC02) ──
  {
    id: 'MS12', chapterId: 'CH06', seriesId: 'S02',
    version: 1, fileURL: '/manuscripts/s02_ch07_newsubmit_v1.pdf',
    status: 'Submitted', submittedAt: '2026-05-08', reviewedAt: null,
    editorFeedback: null, revisionCount: 0,
  },

  // ── Legacy revision examples ──
  {
    id: 'MS07', chapterId: 'CH01', seriesId: 'S01',
    version: 1, fileURL: '/manuscripts/s01_ch21_draft_v1.pdf',
    status: 'Revision Required', submittedAt: '2026-03-20', reviewedAt: '2026-03-22',
    editorFeedback: 'Background detail insufficient on pages 5–8. Character expressions on page 15 need more emotion.',
    revisionCount: 1,
  },
  {
    id: 'MS08', chapterId: 'CH01', seriesId: 'S01',
    version: 2, fileURL: '/manuscripts/s01_ch21_draft_v2.pdf',
    status: 'Revision Required', submittedAt: '2026-03-24', reviewedAt: '2026-03-25',
    editorFeedback: 'Background is better. Page 15 close-up still needs more intensity.',
    revisionCount: 2,
  },
];

export const annotations = [
  { id: 'AN01', manuscriptId: 'MS03', version: 1, page: 12, x: 120, y: 340, content: 'Panel layout too cramped — expand to full width', author: 'U07', createdAt: '2026-03-12' },
  { id: 'AN02', manuscriptId: 'MS03', version: 1, page: 14, x: 80, y: 200, content: 'Action lines missing — add motion blur effect', author: 'U07', createdAt: '2026-03-12' },
  { id: 'AN03', manuscriptId: 'MS07', version: 1, page: 5, x: 200, y: 150, content: 'Background is empty — add city skyline detail', author: 'U06', createdAt: '2026-03-22' },
  { id: 'AN04', manuscriptId: 'MS07', version: 1, page: 15, x: 150, y: 280, content: 'Expression too flat for this emotional scene', author: 'U06', createdAt: '2026-03-22' },
  { id: 'AN05', manuscriptId: 'MS08', version: 2, page: 15, x: 160, y: 290, content: 'Close-up panel — eyes still lack intensity', author: 'U06', createdAt: '2026-03-25' },
  { id: 'AN06', manuscriptId: 'MS11', version: 3, page: 20, x: 180, y: 310, content: 'Pacing still rushed — consider splitting this page into 2', author: 'U06', createdAt: '2026-05-17' },
  { id: 'AN07', manuscriptId: 'MS11', version: 3, page: 22, x: 100, y: 260, content: 'Climax panel feels anticlimactic — needs more dramatic impact', author: 'U06', createdAt: '2026-05-17' },
];
