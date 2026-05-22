# Kế Hoạch Triển Khai: Auto-Activate Series, Pre-Assigned Tantou Editor & Xóa Role Office Admin

## Mô tả vấn đề

**Hiện tại:**
- Sau khi Board vote finalize với kết quả **Approved** → series chỉ được set `status = 'Approved'`
- Hệ thống yêu cầu thêm một bước thủ công nữa để assign editor → mới được Active
- Mock data: một số series/proposal không có `editorId` sau khi approved

**Mục tiêu thay đổi:**
1. **Mock data**: Mỗi Mangaka đã có sẵn Tantou Editor được assign từ trước (trong `users.js` đã có `editorId`, cần đảm bảo series và proposals cũng phản ánh điều này)
2. **Luồng mới**: Finalize vote Approved → series **tự động Active** ngay lập tức (dùng editorId đã có sẵn từ mangaka), bỏ bước assign tantou sau approve
3. **Xóa role `Editorial Office Admin`**: Toàn bộ references, user U11, trang OfficeAdminProposalsPage, và logic liên quan đến role này bị xóa hoàn toàn khỏi hệ thống

---

## Trạng thái Mock Data Hiện Tại

### Users (đã có `editorId` cho mangaka):
| Mangaka | ID | editorId hiện tại |
|---|---|---|
| Tanaka Yuki | U01 | U06 (Nakamura Takeshi) ✅ |
| Oda Kenji | U02 | U07 (Watanabe Aoi) ✅ |

> **Kết luận:** `users.js` đã OK, không cần sửa.

### Series cần sửa (`editorId: null`):
| Series | ID | Mangaka | Vấn đề |
|---|---|---|---|
| Whispers of the Deep | S04 | U02 (Oda → editor U07) | `editorId: null` → cần `U07` |
| Sakura Knights | S05 | U01 (Tanaka → editor U06) | `editorId: null` → cần `U06` |

### Proposals cần sửa:
| Proposal | ID | Mangaka | `assignedEditorId` hiện tại |
|---|---|---|---|
| Whispers of the Deep | PR01 | U02 | `U07` ✅ (đã đúng) |
| Sakura Knights | PR02 | U01 | `U06` ✅ (đã đúng) |

> **Kết luận:** Proposals đã OK. Chỉ cần sửa **S04** và **S05** trong `series.js`.

---

## Luồng Mới Sau Khi Thay Đổi

```
Mangaka submit proposal
        ↓
Tantou Editor (đã assign sẵn) review → Approve → send to Board
        ↓
Board Members vote
        ↓
Quorum đạt (≥ 3 votes)
        ↓
Finalize Decision → result = 'Approved'
        ↓ [THAY ĐỔI Ở ĐÂY]
Tự động: series.status = 'Active'
          series.editorId = mangaka.editorId (lấy từ user profile)
          series.activatedAt = now()
          proposal.status = 'Approved'
        ↓
Notification → Mangaka: "Series đã được approved và active!"
```

**Luồng cũ (bị xóa):**
```
Mangaka submit
        ↓
[Office Admin assign intake editor]  ← BỎ HOÀN TOÀN
        ↓
Editor review → Send to Board
        ↓
Board vote → Approved → [Assign Editor thủ công] → Active  ← BỎ BƯỚC NÀY
```

---

## Proposed Changes

### 1. Mock Data — `series.js`

#### [MODIFY] [series.js](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/data/series.js)

Sửa 2 series có `editorId: null` thành đúng editor của mangaka:

```diff
// S04 — Mangaka U02 (Oda) → Editor U07
- editorId: null, status: 'Proposed'
+ editorId: 'U07', status: 'Proposed'

// S05 — Mangaka U01 (Tanaka) → Editor U06  
- editorId: null, status: 'Under Review'
+ editorId: 'U06', status: 'Under Review'
```

---

### 2. Voting Store — `votingStore.js`

Không cần sửa `votingStore.js` — logic finalize decision vẫn giữ nguyên, chỉ cập nhật `status = 'Finalized'` và `result`.

---

### 3. Series Store — `seriesStore.js`

#### [MODIFY] [seriesStore.js](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/store/seriesStore.js)

Sửa hàm `approveProposalAdmin` và xóa dependency vào assign editor sau approve:

Hiện tại không có hàm nào trong seriesStore tự động kích hoạt series sau board vote. Việc này được làm trong UI (VotingDetailPage). Không cần sửa seriesStore.

---

### 4. Voting Detail Page — `VotingDetailPage.jsx`

#### [MODIFY] [VotingDetailPage.jsx](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/pages/voting/VotingDetailPage.jsx)

**Hàm `handleFinalize` (lines 103–178):**

Thay đổi logic khi `result === 'Approved'`:

```diff
- // Update series status to 'Approved'
- useSeriesStore.getState().updateSeriesStatus(linkedSeries.id, 'Approved');
- // hoặc tạo series với status: 'Approved'
- addSeries({ ..., status: 'Approved', editorId: null, activatedAt: null });

+ // Lấy editorId từ user profile của mangaka
+ const { users } = useAuthStore.getState();
+ const mangakaUser = users.find(u => u.id === mangakaId);
+ const tantouEditorId = mangakaUser?.editorId || linkedProposal?.assignedEditorId;

+ // Activate series ngay lập tức
+ useSeriesStore.getState().activateSeries(linkedSeries.id, tantouEditorId);
+ // hoặc tạo series mới với status: 'Active'
+ addSeries({ ..., status: 'Active', editorId: tantouEditorId, activatedAt: now() });
```

**Notification message:**
```diff
- message: `Your proposal "..." has been approved! An editor will be assigned before the series can be activated.`
+ message: `Your proposal "..." has been approved and activated! Your Tantou Editor ${editor?.displayName} has been confirmed.`
```

**UI finalized result section (line 531):**
```diff
- <p>Series has been created. An editor needs to be assigned before activation.</p>
+ <p>Series is now Active. Your Tantou Editor has been confirmed.</p>
```

---

### 5. Chief Dashboard — `ChiefDashboardPage.jsx`

#### [MODIFY] [ChiefDashboardPage.jsx](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/pages/chief/ChiefDashboardPage.jsx)

**Hàm `runChiefOverrideFlow` (lines 122–180):**

Tương tự VotingDetailPage, khi `result === 'Approved'`:

```diff
- updateSeriesStatus(linkedSeries.id, 'Approved');
- addSeries({ ..., status: 'Approved', editorId: null });

+ const mangakaUser = allUsers.find(u => u.id === mangakaId);
+ const tantouEditorId = mangakaUser?.editorId || linkedProposal?.assignedEditorId;
+ activateSeries(linkedSeries.id, tantouEditorId);  // dùng hàm activateSeries
+ // hoặc addSeries({ ..., status: 'Active', editorId: tantouEditorId, activatedAt: now() });
```

Cần thêm `activateSeries` vào destructuring từ `useSeriesStore`.

---

### 6. [DELETE] Office Admin Proposals Page — `OfficeAdminProposalsPage.jsx`

#### [DELETE] [OfficeAdminProposalsPage.jsx](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/pages/admin/OfficeAdminProposalsPage.jsx)

Xóa toàn bộ file này. Chức năng review proposal intake được chuyển sang Tantou Editor tự xử lý (editor đã assign sẵn trong user profile).

> [!CAUTION]
> Xóa file này sẽ làm route `/office/proposals` không còn hoạt động. Đảm bảo xóa route tương ứng trong `App.jsx`.

---

### 7. App Router — `App.jsx`

#### [MODIFY] [App.jsx](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/App.jsx)

Xóa route `/office/proposals` và import `OfficeAdminProposalsPage`:

```diff
- import OfficeAdminProposalsPage from './pages/admin/OfficeAdminProposalsPage';
- <Route path="/office/proposals" element={<OfficeAdminProposalsPage />} />
```

---

### 8. Sidebar — `Sidebar.jsx`

#### [MODIFY] [Sidebar.jsx](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/components/Sidebar.jsx)

Xóa `ROLES.EDITORIAL_OFFICE_ADMIN` khỏi tất cả `roles` arrays trong nav items, và xóa nav item `/office/proposals` (vì trang bị xóa):

```diff
- { path: '/office/proposals', label: 'Proposal Reviews', icon: FileText, roles: [ROLES.TANTOU_EDITOR, ROLES.ADMIN, ROLES.EDITORIAL_OFFICE_ADMIN, ROLES.EDITOR_IN_CHIEF] },
+ { path: '/office/proposals', label: 'Proposal Reviews', icon: FileText, roles: [ROLES.TANTOU_EDITOR, ROLES.ADMIN, ROLES.EDITOR_IN_CHIEF] },

// Xóa EDITORIAL_OFFICE_ADMIN khỏi tất cả roles arrays còn lại
- { path: '/', roles: [..., ROLES.EDITORIAL_OFFICE_ADMIN, ...] }
+ { path: '/', roles: [...] }  // bỏ EDITORIAL_OFFICE_ADMIN

// Xóa nav item Create Account cho Office Admin (chỉ Admin còn quyền)
- { path: '/admin/create-account', label: 'Create Account', icon: UserPlus, roles: [ROLES.EDITORIAL_OFFICE_ADMIN, ROLES.ADMIN] },
+ { path: '/admin/create-account', label: 'Create Account', icon: UserPlus, roles: [ROLES.ADMIN] },
```

---

### 9. Create Account Page — `CreateAccountPage.jsx`

#### [MODIFY] [CreateAccountPage.jsx](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/pages/admin/CreateAccountPage.jsx)

Xóa `EDITORIAL_OFFICE_ADMIN` khỏi access check và UI text:

```diff
- if (!currentUser?.roles?.includes(ROLES.ADMIN) && !currentUser?.roles?.includes(ROLES.EDITORIAL_OFFICE_ADMIN))
+ if (!currentUser?.roles?.includes(ROLES.ADMIN))

- <p>Only Admin and Editorial Office Admin can create accounts (BR-01).</p>
+ <p>Only Admin can create accounts (BR-01).</p>

// Xóa role option 'Editorial Office Admin' khỏi dropdown tạo tài khoản (nếu có)
```

---

### 10. Dashboard Page — `DashboardPage.jsx`

#### [MODIFY] [DashboardPage.jsx](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/pages/DashboardPage.jsx)

Xóa block stats của Office Admin:

```diff
- const isOfficeAdmin = user.roles.includes(ROLES.EDITORIAL_OFFICE_ADMIN);
- if (isOfficeAdmin) {
-   stats.push(
-     { label: 'Pending Assignment', ... },
-     { label: 'Active Series Total', ... },
-     { label: 'Total Proposals', ... }
-   );
- }
```

---

### 11. Constants — `constants.js`

#### [MODIFY] [constants.js](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/utils/constants.js)

Xóa constant role:

```diff
 export const ROLES = {
   ADMIN: 'Admin',
   MANGAKA: 'Mangaka',
   ASSISTANT: 'Assistant',
   TANTOU_EDITOR: 'Tantou Editor',
   EDITORIAL_BOARD: 'Editorial Board',
   EDITOR_IN_CHIEF: 'Editor-in-Chief',
-  EDITORIAL_OFFICE_ADMIN: 'Editorial Office Admin',
 };
```

---

### 12. Permissions — `permissions.js`

#### [MODIFY] [permissions.js](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/utils/permissions.js)

Xóa `ROLES.EDITORIAL_OFFICE_ADMIN` khỏi tất cả permission arrays:

```diff
- dashboard: [ROLES.ADMIN, ROLES.EDITORIAL_OFFICE_ADMIN, ...]
+ dashboard: [ROLES.ADMIN, ...]

- series: [ROLES.ADMIN, ROLES.EDITORIAL_OFFICE_ADMIN, ...]
+ series: [ROLES.ADMIN, ...]

- 'admin/create-account': [ROLES.EDITORIAL_OFFICE_ADMIN, ROLES.ADMIN],
+ 'admin/create-account': [ROLES.ADMIN],
```

---

### 13. Mock Data Users — `users.js`

#### [MODIFY] [users.js](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/data/users.js)

Xóa user U11 (Kimura Sakura — Office Admin) và xóa hoặc đổi role:

```diff
- { id: 'U11', username: 'office_admin', displayName: 'Kimura Sakura', roles: ['Editorial Office Admin'], ... },
```

> [!NOTE]
> Xóa user U11 sẽ ảnh hưởng đến login page nếu U11 được list là option đăng nhập. Cần kiểm tra `LoginPage.jsx`.

---

### 14. Series Detail Page — `SeriesDetailPage.jsx`

#### [MODIFY] [SeriesDetailPage.jsx](file:///c:/Users/giakh/OneDrive/Desktop/Ky8/SWP/Demo/MangaSystemPrototype/src/pages/series/SeriesDetailPage.jsx)

Kiểm tra và xóa:
- UI "Assign Editor to Activate" cho series status `'Approved'`
- Bất kỳ reference nào đến `EDITORIAL_OFFICE_ADMIN`

---

## Tổng Hợp Files Cần Thay Đổi

| # | File | Loại thay đổi | Nội dung |
|---|---|---|---|
| 1 | `src/data/series.js` | MODIFY | Gán `editorId` cho S04, S05 |
| 2 | `src/pages/voting/VotingDetailPage.jsx` | MODIFY | `handleFinalize`: Approved → `activateSeries()` |
| 3 | `src/pages/chief/ChiefDashboardPage.jsx` | MODIFY | `runChiefOverrideFlow`: Approved → `activateSeries()` |
| 4 | `src/pages/admin/OfficeAdminProposalsPage.jsx` | **DELETE** | Xóa toàn bộ file |
| 5 | `src/App.jsx` | MODIFY | Xóa route `/office/proposals` |
| 6 | `src/components/Sidebar.jsx` | MODIFY | Xóa `EDITORIAL_OFFICE_ADMIN` khỏi nav items |
| 7 | `src/pages/admin/CreateAccountPage.jsx` | MODIFY | Xóa Office Admin khỏi access check |
| 8 | `src/pages/DashboardPage.jsx` | MODIFY | Xóa block `isOfficeAdmin` stats |
| 9 | `src/utils/constants.js` | MODIFY | Xóa `EDITORIAL_OFFICE_ADMIN` khỏi ROLES |
| 10 | `src/utils/permissions.js` | MODIFY | Xóa `EDITORIAL_OFFICE_ADMIN` khỏi permission arrays |
| 11 | `src/data/users.js` | MODIFY | Xóa user U11 (Kimura Sakura) |
| 12 | `src/pages/series/SeriesDetailPage.jsx` | MODIFY | Xóa UI "Assign Editor to Activate" |

## Các Hàm Được Dùng

| Hàm | File | Mục đích |
|---|---|---|
| `activateSeries(seriesId, editorId)` | `seriesStore.js` L184 | Set series Active + gán editor |
| `updateSeriesStatus(seriesId, status)` | `seriesStore.js` L192 | Không còn dùng cho flow vote nữa |
| `addSeries(data)` | `seriesStore.js` L204 | Tạo series mới (truyền `status: 'Active'`) |
| `finalizeDecision(decisionId)` | `votingStore.js` L25 | Finalize vote, set result |

---

## Verification Plan

### Kiểm tra sau khi sửa:

**Flow Auto-Activate:**
1. **Mock data S04, S05**: Vào trang Series List → kiểm tra S04 (Whispers) và S05 (Sakura Knights) đã có editorId hiển thị
2. **Finalize vote flow**:
   - Login là Editorial Board member (U08/U09/U10)
   - Vào BD04 (Sakura Knights — Open, hiện 1 vote)
   - Vote Approve để đạt quorum ≥ 3 votes
   - Bấm Finalize Decision
   - **Kỳ vọng**: S05 chuyển sang `status = 'Active'`, `editorId = 'U06'`, `activatedAt` được set
3. **Chief Override flow**: Login là Chief (U12) → Dùng Override Finalize với Approve → kiểm tra series Active
4. **Notification**: Mangaka nhận được thông báo "series active và editor confirmed"
5. **UI finalized card**: Không còn text "An editor needs to be assigned"

**Xóa Office Admin:**
6. **Login page**: Không còn user Kimura Sakura (U11) trong danh sách đăng nhập
7. **Sidebar**: Login bằng bất kỳ role nào → không thấy menu "Proposal Reviews" (hoặc chỉ thấy với Tantou Editor/Admin)
8. **Route /office/proposals**: Truy cập trực tiếp → 404 hoặc redirect
9. **Create Account**: Login Admin (U10) → vào trang Create Account còn hoạt động; Login U11 (nếu còn) → Access Denied
10. **Dashboard**: Login bằng Editor (U06/U07) → không thấy "Pending Assignment" stats của Office Admin

---

## Open Questions & Notes

> [!NOTE]
> **Trạng thái `'Approved'` trong system**: Sau khi thay đổi, status `'Approved'` cho series sẽ không còn xuất hiện trong flow vote nữa. Series sẽ nhảy thẳng từ `'Under Review'` → `'Active'`. Hằng số `SERIES_STATUS.APPROVED` trong `constants.js` vẫn giữ lại để không phá vỡ StatusBadge rendering (phòng trường hợp có data cũ).

> [!WARNING]
> **BoardDecision BD04 trong mock data**: BD04 chỉ có 1 vote (chưa đạt quorum 3). Nếu muốn demo flow mới ngay sau khi implement, cần thêm 2 votes vào BD04 trong `boardDecisions.js` để có thể test Finalize ngay.

> [!IMPORTANT]
> **OfficeAdminProposalsPage bị xóa — ai review proposal intake?**
> Sau khi xóa role Office Admin, luồng proposal intake trở thành:
> - Mangaka submit → Tantou Editor (đã gán sẵn từ `user.editorId`) **tự động nhận** proposal để review
> - Trang `/office/proposals` vẫn giữ nhưng chỉ có **Tantou Editor** và **Admin** truy cập được
> - Logic assign intake editor trong proposal data (`assignedEditorId`) vẫn dùng `user.editorId` của mangaka thay vì Office Admin assign thủ công
>
> **Kết quả**: Bỏ Office Admin **KHÔNG** có nghĩa là xóa trang OfficeAdminProposalsPage hoàn toàn mà là:
> - Xóa role `EDITORIAL_OFFICE_ADMIN` khỏi mọi nơi trong code
> - Đổi quyền truy cập trang proposals về chỉ còn `Tantou Editor` + `Admin`  
> - Xóa user U11 khỏi mock data
> - Trang proposals vẫn tồn tại nhưng được đổi tên/scope phù hợp hơn
