# Tổng hợp Trạng Thái (Status) trong Hệ thống Manga

Tài liệu này liệt kê toàn bộ các trạng thái hiện tại được sử dụng trong hệ thống (dựa theo `constants.js`) và giải thích ý nghĩa của từng trạng thái trong quy trình nghiệp vụ.

---

## 1. Trạng thái Truyện (Series Status)
Đại diện cho vòng đời tổng thể của một bộ truyện tranh.

- **Proposed**: Truyện mới được Mangaka đệ trình lên hệ thống, chưa được ai xem xét.
- **Under Review**: Hội đồng biên tập (Editorial Board) đang trong quá trình bỏ phiếu để duyệt truyện.
- **Approved**: Truyện đã được hội đồng thông qua, nhưng chưa chính thức đi vào hoạt động (đang chờ sắp xếp Tantou Editor hoặc chuẩn bị).
- **Active**: Truyện đang xuất bản định kỳ bình thường, các Chapter mới liên tục được ra mắt.
- **On-Hold**: Tạm hoãn xuất bản. Bao gồm mọi lý do: nghỉ lễ, tác giả ốm, tìm ý tưởng, lý do kỹ thuật hoặc pháp lý. Truyện không bị hủy và có thể trở lại `Active` khi vấn đề được giải quyết.
- **Cancelled**: Truyện đã chính thức bị hủy bỏ (bởi quyết định của Hội đồng do thứ hạng thấp hoặc vi phạm nội quy).

---

## 2. Trạng thái Đề xuất (Proposal Status)
Vòng đời của một bản đề xuất nội dung truyện mới.

- **Draft**: Bản nháp, Mangaka đang viết dở và chưa gửi lên Hội đồng.
- **Pending Review**: Đã gửi lên hệ thống và đang nằm trong danh sách chờ Hội đồng xử lý.
- **Under Review**: Hội đồng đang tích cực xem xét và bỏ phiếu.
- **Approved**: Đề xuất đã được chấp thuận. Sẽ sinh ra một `Series` mới tương ứng.
- **Rejected**: Đề xuất bị từ chối (kèm lý do). Mangaka phải làm một Proposal khác.

---

## 3. Trạng thái Chương (Chapter Status)
Quá trình một chương truyện từ lúc lên ý tưởng đến khi phát hành.

- **Draft**: Mangaka vừa khởi tạo chapter, đang lên kịch bản hoặc phân trang.
- **In Progress**: Đang được thi công (chia task cho Assistant vẽ, đi nét, lên màu...).
- **Ready for Submission**: 100% các trang (PageTask) đã được vẽ xong và Approved bởi Mangaka, sẵn sàng gom lại thành bản thảo.
- **Submitted**: Bản thảo của Chapter đã được nộp cho Tantou Editor để kiểm duyệt.
- **Published**: Chapter đã được phát hành chính thức tới độc giả.
- **Late**: Đang bị trễ tiến độ (sắp tới hạn nhưng chưa nộp).
- **Overdue**: Quá hạn (vượt quá ngày Deadline tính toán từ Publication Date).

---

## 4. Trạng thái Nhiệm vụ (Task Status)
Công việc chi tiết (PageTask) do Mangaka giao cho các Assistant (Trợ lý).

- **Pending**: Task vừa được giao nhưng Assistant chưa bắt tay vào làm.
- **In Progress**: Assistant đang làm task này.
- **Submitted**: Assistant đã làm xong và gửi kết quả lại cho Mangaka kiểm tra.
- **Approved**: Mangaka đã xem, hài lòng và chốt kết quả của trang vẽ.
- **Rejected**: Mangaka không hài lòng, trả lại bắt Assistant sửa lại.
- **Overdue**: Assistant làm quá hạn Deadline do Mangaka đề ra.
- **Unassigned**: Task bị mồ côi (Do Assistant được giao bị nghỉ việc/Deactivate tài khoản).
- **Suspended**: Task bị đình chỉ (Thường do Series vừa bị Cancel, mọi Task đang làm bị đóng băng).

---

## 5. Trạng thái Bản thảo (Manuscript Status)
Giai đoạn duyệt bản thảo giữa Mangaka và Tantou Editor.

- **Draft**: Mangaka đang tổng hợp file bản thảo.
- **Submitted**: Đã nộp file lên cho Editor.
- **Under Review**: Editor đang đọc và kiểm tra chất lượng bản thảo.
- **Revision Required**: Editor yêu cầu Mangaka phải sửa lại một số chỗ (Tối đa 3 lần).
- **Approved**: Editor đã chốt bản thảo. Chapter này sẵn sàng để Published.

---

## 6. Trạng thái Quyết định Hội đồng (Decision Status)
Vòng đời của một phiên bỏ phiếu (Voting Decision) của Editorial Board.

- **Open**: Phiên bỏ phiếu đang diễn ra, các thành viên đang vào đưa ra lựa chọn (Approve/Reject/Cancel/Change).
- **Finalized**: Phiên bỏ phiếu đã kết thúc, đã đủ Quorum (số lượng phiếu tối thiểu) và có kết quả chung cuộc.
- **Deferred**: Bị hoãn lại (Do hết thời hạn mà chưa thu thập đủ Quorum).
- **Expired**: Hết hạn bỏ phiếu theo quy định.
