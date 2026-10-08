# DECISIONS — quyết định của chủ dự án (ghi nguyên văn ý, có ngày)

| Mã | Ngày | Quyết định | Hệ quả cho triển khai |
|---|---|---|---|
| DEC-01 | 08/10/2026 | Định vị sản phẩm: **công cụ đào tạo** (không phải nền tảng dữ liệu SAP cho doanh nghiệp). | P0-04 thu gọn: chạy trong trình duyệt, "bất biến" = SHA-256 + manifest + tải về; không DB/RBAC phía server. Lớp RAW→CLEAN→DQ→đối chiếu được thiết kế thành bài học cho học viên. |
| DEC-02 | 08/10/2026 | **Giữ** 2 báo cáo Z (ZFIR009A, ZFIR159) trong phạm vi. | Vẫn BLOCKED đến khi có spec. Spec phải do chủ dự án viết lại thành mẫu chung SIMULATED; không dùng layout/số liệu/tên trường nguyên bản của doanh nghiệp cũ (rủi ro bảo mật/hợp đồng). |
