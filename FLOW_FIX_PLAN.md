# MangaHub Prototype — Flow Fix Plan

Phân tích toàn bộ prototype hiện tại và kế hoạch sửa các vấn đề để có thể test toàn bộ luồng từ đầu (P1) đến cuối (P9).

## Tổng quan vấn đề

Sau khi phân tích chi tiết toàn bộ source code, phát hiện **12 vấn đề chính** ảnh hưởng đến khả năng test flow end-to-end.

---

## 🔴 Vấn đề Nghiêm Trọng (Blocking — Flow bị gãy)

### Issue #1: Board vote finalize KHÔNG cập nhật Proposal/Series status
**File ảnh hưởng:** `votingStore.js`, `VotingDetailPage.jsx`

**Mô tả:** Khi Board member finalize một decision "Series Approval":
- Decision status chuyển sang `Finalized` ✅
- Decision result ghi nhận `Approved` hoặc `Rejected` ✅
- **NHƯNG** Proposal status vẫn giữ nguyên `Pending Review` ❌
- **NHƯNG** Series status vẫn giữ nguyên / KHÔNG được tạo ❌

**Impact:** Mangaka không thể tiếp tục flow → không tạo được chapter → toàn bộ flow P3-P9 bị block.

**Fix cần thực hiện:** Sau khi finalize:
1. Nếu **Approved**: cập nhật Proposal status → `Approved`, tạo Series mới (status `Approved`), notify Mangaka
2. Nếu **Rejected**: cập nhật Proposal status → `Rejected`, notify Mangaka

---

### Issue #2: Proposal submit dùng Proposal ID làm `seriesId` cho Decision
**File ảnh hưởng:** `ProposalFormPage.jsx` (line 55)

**Mô tả:** Khi tạo decision: `seriesId: proposal.id` (ví dụ `PR03`). Nhưng:
- `VotingListPage.jsx` tìm series bằng `series.find(s => s.id === d.seriesId)` → trả về `undefined` vì không có series nào có id = `PR03`
- Hiển thị "Unknown Series" cho proposals mới tạo

**Fix cần thực hiện:** VotingListPage cần fallback search sang proposals khi không tìm thấy series.

---

### Issue #3: Series "Approved" → "Active" không có UI để assign Editor (BR-24)
**File ảnh hưởng:** `SeriesDetailPage.jsx`

**Mô tả:** Theo BR-24, series chỉ có thể Activate khi:
1. Đã được Board Approve ✅
2. Có Editor assigned ❌ — **Không có UI để assign Editor**

`seriesStore.js` có function `activateSeries(seriesId, editorId)` nhưng không có UI nào gọi nó.

**Impact:** Series mới approve bị stuck ở status `Approved`, không thể chuyển sang `Active` → không tạo được chapter.

**Fix cần thực hiện:** Thêm UI cho Admin/Board để assign Editor và Activate series trên SeriesDetailPage.

---

### Issue #4: Proposal `Under Review` status không được set
**File ảnh hưởng:** `ProposalFormPage.jsx`, `seriesStore.js`

**Mô tả:** Flow proposal hiện tại:
- Draft → (submit) → `Pending Review` ✅  
- `Pending Review` → `Under Review` ❌ **KHÔNG BAO GIỜ XẢY RA**

**Fix cần thực hiện:** Khi submit proposal và tạo decision, chuyển proposal sang `Under Review` luôn (hoặc khi Board member đầu tiên vote).

---

## 🟡 Vấn đề Trung Bình (Partial Blocking)

### Issue #5: VotingListPage hiển thị "Unknown Series" cho proposals mới submit
**File ảnh hưởng:** `VotingListPage.jsx` (line 34)

**Fix:** Fallback sang proposals hoặc dùng `d.proposalTitle`.

---

### Issue #6: Chapter status không tự động cập nhật khi task thay đổi
**File ảnh hưởng:** `chapterStore.js`

**Mô tả:** Khi tất cả tasks approved → chapter vẫn giữ `Draft` hoặc `In Progress`, không tự chuyển sang `Ready for Submission`.

**Fix cần thực hiện:** Thêm auto-update chapter status logic.

---

### Issue #7: Manuscript approval không cập nhật Chapter status → Published
**File ảnh hưởng:** `manuscriptStore.js`, `ManuscriptReviewPage.jsx`

**Fix:** Sau approve manuscript, cập nhật chapter → `Published`.

---

### Issue #8: Manuscript submission không cập nhật Chapter status → Submitted  
**File ảnh hưởng:** `ChapterDetailPage.jsx`

**Fix:** Sau submit manuscript, cập nhật chapter → `Submitted`.

---

### Issue #9: Dashboard link `/decisions/${d.id}` bị 404
**File ảnh hưởng:** `DashboardPage.jsx`, `App.jsx`

**Fix:** Thêm route hoặc sửa link.

---

### Issue #10: Mock data inconsistency
**File ảnh hưởng:** `series.js`, `boardDecisions.js`

**Mô tả:** S04 & S05 có status `Approved` nhưng Board Decision vẫn `Open`.

**Fix:** Đồng bộ lại mock data.

---

## 🔵 Vấn đề Nhỏ (UI/UX)

### Issue #11: SeriesListPage "My Proposals" section thiếu action buttons
### Issue #12: Missing VoteEntryPage riêng biệt (đã tích hợp trong RankingPage)

---

## Proposed Changes

### Phase 1: Fix Critical Flow

| File | Thay đổi |
|------|----------|
| `VotingDetailPage.jsx` | Sau finalize: cập nhật proposal status, tạo series, notify |
| `VotingListPage.jsx` | Fallback tìm proposal khi không tìm thấy series |
| `SeriesDetailPage.jsx` | Thêm "Activate Series" UI (select editor + activate button) |
| `ProposalFormPage.jsx` | Set proposal status = `Under Review` khi submit |
| `seriesStore.js` | Thêm `updateProposal` nếu chưa có |

### Phase 2: Fix Status Sync

| File | Thay đổi |
|------|----------|
| `chapterStore.js` | Thêm auto-update chapter status khi task status thay đổi |
| `ManuscriptReviewPage.jsx` | Sau approve: chapter → Published |
| `ChapterDetailPage.jsx` | Sau submit manuscript: chapter → Submitted |

### Phase 3: Fix Data & Routing

| File | Thay đổi |
|------|----------|
| `series.js` | S04 → `Proposed`, S05 → `Under Review` |
| `boardDecisions.js` | Đồng bộ với series/proposal status |
| `App.jsx` | Thêm route `/decisions/:id` |
| `DashboardPage.jsx` | Fix link decisions |

---

## Test Flow hoàn chỉnh (sau khi fix)

### Kịch bản test chính: Từ Proposal → Published Chapter

1. **Login** as `tanaka_mangaka` (U01)
2. **P1**: Vào Series → New Proposal → Điền form → Submit
3. **Switch user** → Login as `takahashi_board` (U08)
4. **P2**: Vào Voting → Thấy proposal mới → Vote Approve
5. **Switch user** → Login as `matsumoto_board` (U09) → Vote Approve
6. **Switch user** → Login as `admin_system` (U10) → Vote Approve
7. **Finalize** decision → Proposal becomes Approved, Series created
8. **P3 prep**: Vào Series Detail → Assign Editor → Activate Series
9. **Switch user** → Login as `tanaka_mangaka` (U01)
10. **P3**: Vào Chapters → Create Chapter → Assign Tasks cho assistants
11. **Switch user** → Login as `suzuki_assistant` (U03)
12. **P4**: Vào task → Start → Submit
13. **Switch user** → Login as `tanaka_mangaka` → Approve task
14. *(Repeat cho tất cả tasks)*
15. **P5**: Khi 100% tasks approved → Submit Manuscript
16. **Switch user** → Login as assigned Editor
17. **P6**: Vào Manuscripts → Review → Approve
18. Chapter status → Published ✅

### Kịch bản phụ: Cancellation Flow (P9)
1. Login as Board member → Vào Ranking → Check bottom 20%
2. Vào Decisions → Vote Cancel cho flagged series
3. Quorum ≥ 3 → Finalize → Series Cancelled, tasks Suspended

---

> **⚠️ LƯU Ý:** Tất cả data được lưu trong Zustand store (in-memory). **Refresh page sẽ mất toàn bộ data test**. Chỉ mock data ban đầu được giữ lại.
