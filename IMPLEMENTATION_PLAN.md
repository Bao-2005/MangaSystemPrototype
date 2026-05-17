# MangaHub Prototype — Main Flow UI with Business Rules

## Mục tiêu

Xây dựng **prototype frontend** cho hệ thống MangaHub, bao gồm toàn bộ **9 bước Main Flow** (P1–P9) với mock data và **55 Business Rules** được enforce trực tiếp trên UI. Prototype sẽ cho phép test workflow từ đầu đến cuối mà không cần backend thực.

## Tech Stack

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| React | 19.x | UI Framework |
| Vite | 6.x | Build tool & dev server |
| Tailwind CSS | 4.x | Styling |
| React Router | 7.x | Client-side routing |
| Zustand | 5.x | Lightweight state management (mock data store) |
| Lucide React | Icons | Icon library |

---

## Danh sách 55 Business Rules được enforce

### XC — Authentication & RBAC (8 BRs)

| BR | Tên | Cách enforce trên UI |
|---|---|---|
| **BR-01** | Internal Account Provisioning | Không có trang đăng ký. Chỉ có Login với preset accounts |
| **BR-03** | Permission Enforcement | Menu/actions ẩn dựa trên role hiện tại |
| **BR-04** | Object-Level Authorization | Chỉ owner mới thấy nút Edit/Delete trên entity |
| **BR-05** | Active Role Requirement | User không có role → redirect về trang lỗi |
| **BR-09** | Series Ownership Constraint | UI hiển thị owner và không cho transfer |
| **BR-10** | Mangaka–Assistant Conflict Rule | Validate khi assign: không cho assign Mangaka làm Assistant cùng series |
| **BR-12** | Assistant Workload Limit | Hiển thị warning khi assign nếu assistant đã có ≥ 20 active tasks |
| **BR-13** | Assistant Performance Monitoring | Hiển thị performance score trên profile |

### P1 — Series Proposal (7 BRs)

| BR | Tên | Cách enforce trên UI |
|---|---|---|
| **BR-14** | Proposal Lifecycle | State machine: Draft → Pending Review → Under Review → Approved/Rejected |
| **BR-15** | Proposal Validation Requirements | Form validation: Title ≤ 100 chars, Synopsis 200–2000 chars, ≥ 1 sample chapter ≥ 5 pages |
| **BR-16** | Proposal Edit Restriction | Disable edit khi status ≠ Draft |
| **BR-17** | Unique Active Series Title | Check trùng title khi submit |
| **BR-19** | Single Active Proposal Limit | Block tạo proposal mới nếu đã có 1 pending/under review |
| **BR-21** | Series Lifecycle Policy | Enforce state transitions hợp lệ |
| **BR-24** | Activation Preconditions | Chỉ activate khi: Approved + có Editor assigned |

### P2 — Editorial Board Voting (8 BRs)

| BR | Tên | Cách enforce trên UI |
|---|---|---|
| **BR-27** | Voting Eligibility | Chỉ Board member active & không conflict mới thấy nút Vote |
| **BR-28** | Conflict of Interest Definition | Auto-detect và disable vote nếu user là Mangaka/Editor/Assistant của series |
| **BR-29** | Quorum Requirement | Hiển thị progress bar quorum (cần ≥ 3 votes) |
| **BR-30** | Invalid Vote Exclusion | Vote bị conflict không tính vào quorum |
| **BR-33** | Majority Rule | Auto-calculate: Approve > 50% → Approved, tie → Deferred |
| **BR-34** | Finalization Rule | Chỉ finalize khi đạt quorum VÀ kết quả xác định |
| **BR-35** | Reject Reason Requirement | Textarea bắt buộc ≥ 50 chars khi vote Reject |
| **BR-37** | Deferred & Expired Handling | Auto-update trạng thái khi hết voting window |

### P3 — Chapter Creation & Task Assignment (9 BRs)

| BR | Tên | Cách enforce trên UI |
|---|---|---|
| **BR-40** | Chapter Creation Eligibility | Chỉ Mangaka owner + series Active mới tạo được chapter |
| **BR-42** | Publication Date Validation | Date picker: không cho chọn quá khứ, auto-calculate deadline (pub − 14 ngày) |
| **BR-46** | Ready-for-Submission Condition | Disable "Submit Manuscript" nếu chưa 100% approved tasks |
| **BR-49** | Page Range Non-Overlap | Validate overlap khi tạo task mới |
| **BR-52** | Assignment Authority | Chỉ Mangaka owner mới thấy nút Assign |
| **BR-54** | Due Date Validation | Task dueDate phải ≤ chapter deadline, ≥ today, trước submission deadline ≥ 3 ngày |
| **BR-56** | Page Range Validation | pageStart ≤ pageEnd, nằm trong range hợp lệ |
| **BR-57** | Assistant-Only Assignment | Dropdown chỉ hiển thị users có role Assistant & Active |
| **BR-59** | Mandatory Task Fields | Form require: pageRange, taskType, dueDate, assistantId |

### P4 — Page Progress Tracking (7 BRs)

| BR | Tên | Cách enforce trên UI |
|---|---|---|
| **BR-60** | Task Completion Rule | Chỉ Approved mới tính completed — badge hiển thị rõ |
| **BR-61** | Chapter Completion Formula | Progress bar = Approved / Total × 100% |
| **BR-64** | Reject Reason Requirement | Textarea bắt buộc ≥ 20 chars khi Mangaka reject |
| **BR-65** | Rejected Task Workflow | Rejected → quay về In-Progress tự động |
| **BR-66** | Assistant Task Visibility | Assistant chỉ thấy task của mình |
| **BR-68** | Standard Task Lifecycle | State machine: Pending → In-Progress → Submitted → Approved/Rejected |
| **BR-69** | Assistant Status Transition | Assistant chỉ được: Pending→In-Progress, In-Progress→Submitted |

### P5 & P6 — Manuscript & Editor Review (6 BRs)

| BR | Tên | Cách enforce trên UI |
|---|---|---|
| **BR-67** | Manuscript Submission Requirement | Block submit nếu chưa 100% PageTask Approved |
| **BR-72** | Manuscript Submission Authority | Chỉ Mangaka owner thấy nút Submit |
| **BR-73** | Versioning Policy | Auto-increment version, hiển thị history |
| **BR-74** | Editor Access Restriction | Chỉ assigned Editor thấy nút Review |
| **BR-75** | Latest Version Review Only | Editor chỉ review latest version |
| **BR-83** | Maximum Revision Limit | Counter revision, disable sau 3 lần → escalate notice |

### P7 & P8 — Vote Data & Ranking (6 BRs)

| BR | Tên | Cách enforce trên UI |
|---|---|---|
| **BR-87** | Vote Data Entry Authority | Chỉ Board member active thấy form nhập vote |
| **BR-88** | VoteRecord Uniqueness | Check trùng series + period khi nhập |
| **BR-89** | VoteRecord Validation | Validate: readerCount ≥ voteCount, cả hai ≥ 0 |
| **BR-90** | Ranking Formula | Auto-calculate score, handle readerCount = 0 |
| **BR-92** | Automatic Ranking | Auto-recalculate khi VoteRecord confirmed |
| **BR-94** | Bottom 20% Review Flag | Auto-flag và highlight series bottom 20% |

### P9 — Cancel / Change Decision (4 BRs)

| BR | Tên | Cách enforce trên UI |
|---|---|---|
| **BR-101** | Cancellation Decision Quorum | Quorum ≥ 3 votes required |
| **BR-102** | Mandatory Reason | Textarea bắt buộc cho Cancel/Change |
| **BR-104** | Cancellation Workflow Effect | Cascade: Cancel → Suspended chapters/tasks |
| **BR-108** | Cancellation Majority Rule | > 50% votes + quorum → Cancel, ngược lại → Continue |

---

## Cấu trúc dự án

```
d:\Class\SU26\SWP391\prototype/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Router + Layout
│   ├── index.css                   # Global styles + Tailwind
│   │
│   ├── data/                       # Mock data
│   │   ├── users.js                # 10 users, 5 roles
│   │   ├── series.js               # 8 series (đủ status)
│   │   ├── chapters.js             # 15 chapters
│   │   ├── pageTasks.js            # 40 page tasks
│   │   ├── manuscripts.js          # 10 manuscripts (multi-version)
│   │   ├── voteRecords.js          # 20 vote records
│   │   ├── boardDecisions.js       # 8 decisions
│   │   └── notifications.js        # 30 notifications
│   │
│   ├── store/                      # Zustand stores
│   │   ├── authStore.js            # Login state, role switching
│   │   ├── seriesStore.js          # Series + Proposals CRUD
│   │   ├── chapterStore.js         # Chapters + Tasks
│   │   ├── manuscriptStore.js      # Manuscripts + Versions
│   │   ├── votingStore.js          # Board decisions + Votes
│   │   ├── rankingStore.js         # Vote records + Rankings
│   │   └── notificationStore.js    # Notifications
│   │
│   ├── components/                 # Shared UI components
│   │   ├── Layout.jsx              # Sidebar + Header + Content
│   │   ├── Sidebar.jsx             # Role-based navigation
│   │   ├── Header.jsx              # User info + Role switcher + Notifications
│   │   ├── StatusBadge.jsx         # Color-coded status badges
│   │   ├── ProgressBar.jsx         # Animated progress bar
│   │   ├── Modal.jsx               # Reusable modal
│   │   ├── DataTable.jsx           # Sortable data table
│   │   ├── FormField.jsx           # Input with validation
│   │   ├── EmptyState.jsx          # Empty state placeholder
│   │   └── Toast.jsx               # Notification toasts
│   │
│   ├── pages/                      # Page components (1 per flow step)
│   │   ├── LoginPage.jsx           # P0: Role selection login
│   │   ├── DashboardPage.jsx       # Dashboard per role
│   │   │
│   │   ├── series/                 # P1: Series Proposal
│   │   │   ├── SeriesListPage.jsx
│   │   │   ├── SeriesDetailPage.jsx
│   │   │   └── ProposalFormPage.jsx
│   │   │
│   │   ├── voting/                 # P2: Board Voting
│   │   │   ├── VotingListPage.jsx
│   │   │   └── VotingDetailPage.jsx
│   │   │
│   │   ├── chapters/               # P3 + P4: Chapters & Tasks
│   │   │   ├── ChapterListPage.jsx
│   │   │   ├── ChapterDetailPage.jsx
│   │   │   └── TaskBoardPage.jsx   # Kanban-style task board
│   │   │
│   │   ├── manuscripts/            # P5 + P6: Manuscripts & Review
│   │   │   ├── ManuscriptListPage.jsx
│   │   │   └── ManuscriptReviewPage.jsx
│   │   │
│   │   ├── ranking/                # P7 + P8: Votes & Ranking
│   │   │   ├── VoteEntryPage.jsx
│   │   │   └── RankingPage.jsx
│   │   │
│   │   └── decisions/              # P9: Cancel/Change
│   │       ├── DecisionListPage.jsx
│   │       └── DecisionVotingPage.jsx
│   │
│   └── utils/                      # Helper functions
│       ├── validators.js           # BR validation functions
│       ├── permissions.js          # Role-based permission checks
│       ├── calculations.js         # Ranking, completion formulas
│       └── constants.js            # Enums, status lists, config
```

---

## Routing Plan

| Route | Page | Roles có quyền truy cập |
|---|---|---|
| `/login` | LoginPage | Public |
| `/` | DashboardPage | All authenticated |
| `/series` | SeriesListPage | All |
| `/series/new` | ProposalFormPage | Mangaka |
| `/series/:id` | SeriesDetailPage | All (view), Mangaka (edit if owner) |
| `/voting` | VotingListPage | Board |
| `/voting/:id` | VotingDetailPage | Board |
| `/series/:seriesId/chapters` | ChapterListPage | Mangaka (owner), Editor (assigned) |
| `/chapters/:id` | ChapterDetailPage | Mangaka, Editor, Assistant (own tasks) |
| `/chapters/:id/tasks` | TaskBoardPage | Mangaka (owner), Assistant (own tasks) |
| `/manuscripts` | ManuscriptListPage | Mangaka, Editor |
| `/manuscripts/:id/review` | ManuscriptReviewPage | Editor (assigned) |
| `/ranking/votes` | VoteEntryPage | Board |
| `/ranking` | RankingPage | All |
| `/decisions` | DecisionListPage | Board |
| `/decisions/:id` | DecisionVotingPage | Board |

---

## Mock Data Design

### Users (10 accounts)

| ID | Username | Role(s) | Status |
|---|---|---|---|
| U01 | `tanaka_mangaka` | Mangaka | Active |
| U02 | `oda_mangaka` | Mangaka | Active |
| U03 | `suzuki_assistant` | Assistant | Active |
| U04 | `yamada_assistant` | Assistant | Active |
| U05 | `sato_assistant` | Assistant | Active |
| U06 | `nakamura_editor` | Tantou Editor | Active |
| U07 | `watanabe_editor` | Tantou Editor | Active |
| U08 | `takahashi_board` | Editorial Board | Active |
| U09 | `matsumoto_board` | Editorial Board | Active |
| U10 | `admin_system` | Admin, Editorial Board | Active |

### Series (8 series — đủ các trạng thái)

- 3 Active, 1 Proposed, 1 Under Review, 1 On-Hold, 1 Cancelled, 1 Hiatus

### Chapters (15 chapters across active series)

- Đủ trạng thái: Draft, In-Progress, Ready for Submission, Published, Late, Overdue

### Page Tasks (40 tasks)

- Đủ trạng thái: Pending, In-Progress, Submitted, Approved, Rejected, Overdue

---

## Proposed Changes

### Phase 1: Project Setup & Core Infrastructure

#### [NEW] `prototype/` — Vite + React + Tailwind project

- Khởi tạo project với `npx create-vite`
- Cài đặt dependencies: `react-router-dom`, `zustand`, `lucide-react`
- Cấu hình Tailwind CSS
- Setup `index.css` với design system (colors, fonts, spacing)

#### [NEW] `src/data/` — Mock Data Layer

- Tạo toàn bộ mock data files với đủ dữ liệu test
- Dữ liệu phải nhất quán (FK references đúng)

#### [NEW] `src/utils/` — Validators & Permissions

- `validators.js`: Tất cả validation functions cho 55 BRs
- `permissions.js`: Role-based access control logic
- `calculations.js`: Ranking formula, completion percentage
- `constants.js`: Enums, config values

#### [NEW] `src/store/` — Zustand Stores

- 7 stores quản lý state toàn bộ ứng dụng
- CRUD operations trên mock data
- BR validation tích hợp trong store actions

---

### Phase 2: Layout & Shared Components

#### [NEW] `src/components/` — UI Component Library

- `Layout.jsx`: Sidebar + Header + Main content area, dark theme
- `Sidebar.jsx`: Dynamic menu dựa trên role, collapsible
- `Header.jsx`: User avatar, role indicator, notification bell, role switcher (demo)
- Shared components: StatusBadge, ProgressBar, Modal, DataTable, FormField, Toast

---

### Phase 3: Pages — Main Flow (P1–P9)

#### P0 — Login (LoginPage)
- Grid hiển thị 10 preset accounts
- Click để login → set role → redirect dashboard
- **BR-01**: Không có form đăng ký

#### P1 — Series Proposal (3 pages)
- **SeriesListPage**: Danh sách series, filter theo status
- **ProposalFormPage**: Form tạo proposal với full validation
- **SeriesDetailPage**: Chi tiết series, lifecycle status
- **BRs**: BR-14, BR-15, BR-16, BR-17, BR-19, BR-21, BR-24

#### P2 — Board Voting (2 pages)
- **VotingListPage**: Danh sách decisions chờ vote
- **VotingDetailPage**: Vote UI với quorum tracker, conflict detection
- **BRs**: BR-27, BR-28, BR-29, BR-30, BR-33, BR-34, BR-35, BR-37

#### P3+P4 — Chapters & Tasks (3 pages)
- **ChapterListPage**: Timeline/list chapters
- **ChapterDetailPage**: Chapter info + progress + task list
- **TaskBoardPage**: Kanban board (Pending | In-Progress | Submitted | Approved)
- **BRs**: BR-40, BR-42, BR-46, BR-49, BR-52, BR-54, BR-56, BR-57, BR-59, BR-60, BR-61, BR-64, BR-65, BR-66, BR-68, BR-69

#### P5+P6 — Manuscripts (2 pages)
- **ManuscriptListPage**: Danh sách manuscripts + version history
- **ManuscriptReviewPage**: Review UI với annotation area, revision counter
- **BRs**: BR-67, BR-72, BR-73, BR-74, BR-75, BR-83

#### P7+P8 — Votes & Ranking (2 pages)
- **VoteEntryPage**: Form nhập vote data
- **RankingPage**: Bảng xếp hạng animated, bottom 20% highlighted
- **BRs**: BR-87, BR-88, BR-89, BR-90, BR-92, BR-94

#### P9 — Cancel/Change (2 pages)
- **DecisionListPage**: Danh sách flagged series
- **DecisionVotingPage**: Vote Cancel/Change/Continue
- **BRs**: BR-101, BR-102, BR-104, BR-108

---

## UI Design Direction

- **Theme**: Dark mode manga-inspired (dark navy/purple gradients)
- **Accent Colors**: Cyan (#06b6d4) cho primary, Amber (#f59e0b) cho warnings, Rose (#f43f5e) cho errors
- **Typography**: Inter font (Google Fonts)
- **Cards**: Glassmorphism với backdrop blur
- **Animations**: Smooth transitions, hover effects, progress bar animations
- **Icons**: Lucide React icons throughout

---

## Verification Plan

### Automated Tests
- Chạy `npm run dev` và verify tất cả routes load thành công
- Browser testing: navigate qua toàn bộ 9 flow steps

### Manual Verification — BR Testing Scenarios

| Scenario | BRs tested | Expected Result |
|---|---|---|
| Login as Mangaka → Tạo proposal thiếu synopsis | BR-15 | Form error, block submit |
| Login as Mangaka → Tạo proposal khi đã có 1 pending | BR-19 | Block, hiển thị warning |
| Login as Board → Vote series mà mình là Mangaka | BR-27, BR-28 | Disable vote button |
| Vote Reject không có reason | BR-35 | Block, require ≥ 50 chars |
| Quorum chưa đủ 3 → cố finalize | BR-29, BR-34 | Block finalize |
| Mangaka assign task overlap page range | BR-49 | Error, show overlap |
| Assistant tự approve task | BR-69 | Không có nút Approve |
| Submit manuscript khi chưa 100% approved | BR-67 | Block submit |
| Revision lần thứ 4 | BR-83 | Escalate notice, block revision |
| Nhập voteCount > readerCount | BR-89 | Validation error |
| Bottom 20% auto-flag | BR-94 | Highlight in ranking table |
| Cancel vote < 3 | BR-101 | Block finalize |

---

> [!IMPORTANT]
> Prototype này chỉ là **frontend UI + mock data** — không có backend thật. Mọi dữ liệu được lưu trong Zustand store (mất khi refresh). Mục đích là để **validate UI flow** và **demo business rules enforcement**.

## Open Questions

> [!NOTE]
> 1. **Ngôn ngữ giao diện**: Nên dùng **Tiếng Anh** hay **Tiếng Việt** cho labels/text trên UI?
> 2. **Sample images**: Có cần generate ảnh minh họa cho manga pages / thumbnails hay chỉ dùng placeholder text?
> 3. **Notification panel**: Có cần implement notification bell với dropdown real-time hay chỉ cần trang notifications riêng?
