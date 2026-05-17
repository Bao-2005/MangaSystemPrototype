export const manuscripts = [
  // Published chapters — Approved manuscripts
  { id: 'MS01', chapterId: 'CH01', seriesId: 'S01', version: 1, fileURL: '/manuscripts/s01_ch21_v1.pdf', status: 'Approved', submittedAt: '2026-03-28', reviewedAt: '2026-03-30', editorFeedback: null, revisionCount: 0 },
  { id: 'MS02', chapterId: 'CH02', seriesId: 'S01', version: 1, fileURL: '/manuscripts/s01_ch22_v1.pdf', status: 'Approved', submittedAt: '2026-04-05', reviewedAt: '2026-04-07', editorFeedback: null, revisionCount: 0 },
  { id: 'MS03', chapterId: 'CH05', seriesId: 'S02', version: 1, fileURL: '/manuscripts/s02_ch07_v1.pdf', status: 'Revision Required', submittedAt: '2026-03-10', reviewedAt: '2026-03-12', editorFeedback: 'Panel layout on pages 12-15 needs rework. The action sequence lacks clarity.', revisionCount: 1 },
  { id: 'MS04', chapterId: 'CH05', seriesId: 'S02', version: 2, fileURL: '/manuscripts/s02_ch07_v2.pdf', status: 'Approved', submittedAt: '2026-03-15', reviewedAt: '2026-03-17', editorFeedback: 'Great improvements. Approved.', revisionCount: 1 },
  { id: 'MS05', chapterId: 'CH07', seriesId: 'S03', version: 1, fileURL: '/manuscripts/s03_ch15_v1.pdf', status: 'Approved', submittedAt: '2026-03-25', reviewedAt: '2026-03-26', editorFeedback: null, revisionCount: 0 },

  // CH08 — Ready for submission (all tasks done, no manuscript yet)
  // CH09 — In progress, not ready

  // CH11 — Submitted but not yet reviewed
  { id: 'MS06', chapterId: 'CH11', seriesId: 'S07', version: 1, fileURL: '/manuscripts/s07_ch09_v1.pdf', status: 'Submitted', submittedAt: '2026-02-12', reviewedAt: null, editorFeedback: null, revisionCount: 0 },

  // Example of revision cycle
  { id: 'MS07', chapterId: 'CH01', seriesId: 'S01', version: 1, fileURL: '/manuscripts/s01_ch21_draft_v1.pdf', status: 'Revision Required', submittedAt: '2026-03-20', reviewedAt: '2026-03-22', editorFeedback: 'Background detail insufficient on pages 5-8. Character expressions on page 15 need more emotion.', revisionCount: 1 },
  { id: 'MS08', chapterId: 'CH01', seriesId: 'S01', version: 2, fileURL: '/manuscripts/s01_ch21_draft_v2.pdf', status: 'Revision Required', submittedAt: '2026-03-24', reviewedAt: '2026-03-25', editorFeedback: 'Background is better. Page 15 still needs work on the close-up panel.', revisionCount: 2 },
];

export const annotations = [
  { id: 'AN01', manuscriptId: 'MS03', version: 1, page: 12, x: 120, y: 340, content: 'Panel layout too cramped — expand to full width', author: 'U07', createdAt: '2026-03-12' },
  { id: 'AN02', manuscriptId: 'MS03', version: 1, page: 14, x: 80, y: 200, content: 'Action lines missing — add motion blur effect', author: 'U07', createdAt: '2026-03-12' },
  { id: 'AN03', manuscriptId: 'MS07', version: 1, page: 5, x: 200, y: 150, content: 'Background is empty — add city skyline detail', author: 'U06', createdAt: '2026-03-22' },
  { id: 'AN04', manuscriptId: 'MS07', version: 1, page: 15, x: 150, y: 280, content: 'Expression too flat for this emotional scene', author: 'U06', createdAt: '2026-03-22' },
  { id: 'AN05', manuscriptId: 'MS08', version: 2, page: 15, x: 160, y: 290, content: 'Close-up panel — eyes still lack intensity', author: 'U06', createdAt: '2026-03-25' },
];
