# SAP Reporting — nhật ký bổ sung150 ngày13/10/2026

Yêu cầu: bổ sung tới150 và giữ template độc lập trên website live. Làm trong checkout sạch của repo cũ, nhánh codex/sap-library-150; checkout gốc fix/tt99-labels và nguồn PDF/ảnh/Obsidian không bị reset/clean.

Đã biên soạn79 hồ sơ/79 biến thể mới,1.437 vị trí trường đề xuất,79 XLSX/158 CSV. Tổng150 profile IDs/204 variants,204 XLSX/408 CSV mẫu; module FI30 CO30 MM30 PP20 SD15 QM10 PM8 AA7. Nguồn official SAP indexed context và quyền LINK_ONLY; không gắn proposed/schema thành native SAP. Native exports0, target releaseUNKNOWN, company full field catalog và SAP/SME acceptance chưa xác minh.

Kiểm tra từng ô XLSX XML/CSV/ZIP, ID/date text, thứ tự trường/keys, duplicate/missing/locale fixtures,11 arithmetic cases độc lập PASS. Bảo toàn411 prior files và71 prior objects. UI localhost:79 mẫu đầy đủ columns/rows/download links, filter PP15/search/no-result, catalog150 và từng module count; compiled11 JS/CSS bytes giống production baseline. Thử bỏ1 build-owned XLSX: guard rejectexit1, khôi phục đúnghash.

Điều chỉnh trong phạm vi: loại candidate recurring template trùngFI17 và thay bằng check register; sửa tênFI17 hiển thị theo name_vi; sửa kind filter cũ và handler JSON để không chặn CSV/XLSX anchors. Ordinal fields bắt đầu1. Không sửa engine/functions/routes/dependencies.

Spreadsheet authoring không renderer exit0. Renderer ghi được previews nhưng crash khi teardown0xC0000409; giữ evidence riêng, không tự đổi process.exitCode để che lỗi. Xác minh exported files độc lập đã PASS. Excel desktop chưa mở thử; runtime/company/IFRS acceptance chưa có.

CI/preview/Git main/production: pending, chỉ ghi thành công sau readback receipt. Thư viện runtime độc lập nhưng dùng chung hosting/lượt phát hành. Gate fail thì deployment live giữ nguyên.

Obsidian: cần nối kết quả và cutoff của lượt này vào vault đã được người dùng chỉ định; ghi receipt readback, không thay kho nguồn.
