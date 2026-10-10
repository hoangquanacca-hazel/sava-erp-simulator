# DECISIONS — quyết định của chủ dự án (ghi nguyên văn ý, có ngày)

Đánh số tiếp nối `docs/implementation/13-DECISION-LOG.md` (DEC-001…018, nhánh `docs/implementation-pack`). DEC-019 cần ADR đối chiếu với DEC-013 (object store + DB, PROPOSED); DEC-020 khớp DEC-009 và OPEN-04.

| Mã | Ngày | Quyết định | Hệ quả cho triển khai |
|---|---|---|---|
| DEC-019 | 08/10/2026 | Định vị sản phẩm: **công cụ đào tạo** (không phải nền tảng dữ liệu SAP cho doanh nghiệp). | P0-04 thu gọn: chạy trong trình duyệt, "bất biến" = SHA-256 + manifest + tải về; không DB/RBAC phía server. Lớp RAW→CLEAN→DQ→đối chiếu được thiết kế thành bài học cho học viên. |
| DEC-020 | 08/10/2026 | **Giữ** 2 báo cáo Z (ZFIR009A, ZFIR159) trong phạm vi. | Vẫn BLOCKED đến khi có spec. Spec phải do chủ dự án viết lại thành mẫu chung SIMULATED; không dùng layout/số liệu/tên trường nguyên bản của doanh nghiệp cũ (rủi ro bảo mật/hợp đồng). |
| DEC-021 | 10/10/2026 | Nhánh nền = nhánh Codex (`feat/sim-p0-mfg`), nay đã vào `main`; giữ `feat/sim-p0-mfg` làm tham chiếu. | `main` = bản chuẩn; không cherry-pick ngược từ nhánh cũ nếu chưa có Auditor. |
| DEC-022 | 10/10/2026 | Chấp nhận Q1 (đóng gói chỉ ở BOM), Q4 (phụ phí màu tách khỏi giá nhựa), Q5 (ESD là dòng BOM). | Đã port bằng oracle độc lập (PR #18); kế hoạch Denso 113.882.210 → 98.664.801. |
| DEC-023 | 10/10/2026 | CK13N 3 dòng tổng hợp chấp nhận được ở P0 (AUD-100). | Chi tiết theo vật tư để P1+. |
| DEC-024 | 10/10/2026 | Dọn nhánh cũ đã nằm trong `main`; giữ `feat/sim-p0-mfg`. | Xóa theo danh sách ở `docs/implementation/18-BRANCH-AND-STATE-MAP.md` sau khi PR-7 merge. |
| DEC-025 | 10/10/2026 | Chi phí máy (SXC, Có 214) KHÔNG được đơn giản hoá; phải mô hình hoá đúng (AUD-036). | Oracle-first; chờ chủ dự án trả lời cấu thành tỷ suất máy và kiểm tra TK 627x theo PDF TT99 (MỞ-04). |
| DEC-026 | 10/10/2026 | Bắt đầu P1: Mua hàng/AP trước, Bán hàng/AR sau. | Làm spec pack + oracle + ≥5 golden case trước khi code. |
| DEC-027 | 10/10/2026 | Chuẩn kế toán hiển thị duy nhất: TT99. | Đã đổi nhãn "Thông tư 200" trong UI (PR sửa nhãn); bảng TK vẫn chờ đối chiếu PDF (MỞ-04). |
