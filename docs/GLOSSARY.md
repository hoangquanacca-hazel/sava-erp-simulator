# GLOSSARY — thuật ngữ đã chốt (MTO / TT99)

Chỉ ghi những gì đã thống nhất với chủ dự án. Mục nào chưa chốt nằm ở cuối.

## Chuẩn kế toán
- **TT99**: Thông tư 99/2025/TT-BTC, chuẩn kế toán duy nhất của simulator. **Không** dùng TT200 (chốt tại CLOUD_BRIEF.md; đề bài ghi TT200 là nhầm, xác nhận 13/10/2026).

## Chuyển động kho (Special Stock E, MTO)
- **261E**: xuất NVL từ kho E cho lệnh sản xuất gắn với đơn hàng bán. 261 là xuất tiêu hao cho lệnh sản xuất; chữ E chỉ cho biết kho nguồn là sales order stock, không phải đối tượng nhận.
- **101E**: nhập thành phẩm từ lệnh sản xuất vào kho E.
- **601E**: xuất giao hàng cho khách từ kho E (PGI).
- **Valuated sales order stock**: kho E có định giá; 101E/601E sinh bút toán tài chính.
- **Non-valuated sales order stock**: kho E phi định giá; 101E/601E chỉ ghi số lượng, không sinh bút toán tài chính. Chi phí 621/622/627 tập hợp vào TK 154 gắn với SO (sales order cost collector) cho đến Bước 7, khi KKA2 + VA88 kết chuyển giá vốn Nợ 632 / Có 154 (`PKT-VA88-COGS`).
- **Quyết toán lệnh sản xuất về SO (KO88/CO88)**: **ngoài phạm vi** simulator. Không có bút toán hay bước riêng; `KO88`/`CO88` chỉ là phím tắt dẫn tới Bước 7 (`CommandBar.tsx`). Không dạy học viên như thể bước này được mô phỏng.

## Chiến lược & quy trình
- **MTO**: Make-to-Order, sản xuất theo đơn hàng bán.
- **Strategy 20**: MTO, tồn kho tách riêng theo từng dòng đơn hàng bán (kho E), không có kế hoạch nhu cầu độc lập. **Strategy 25**: MTO có Variant Configuration (Super BOM / Super Routing).
- **ACDOCA**: universal journal của S/4HANA, nguồn đối soát tổng cho mọi báo cáo.

## Kiểm thử
- **Golden set**: bảng đáp án Nợ/Có do chủ dự án duyệt từng dòng, đặt tại `golden/`. Không tham chiếu code hay `a0_oracle.py`.
- **Oracle**: `scripts/a0_oracle.py`, độc lập mã TS nhưng do agent viết; **không** thay thế golden set.
- **Khóa hành vi (regression)**: test so mã hiện tại với golden; lệch thì FAIL và báo cáo, không tự sửa số.
- **Test âm tính**: sửa một số thì test phải FAIL. Cấm script có nhánh fallback tự sinh dữ liệu rồi in PASS.
- **Agent kiểm chứng**: phiên riêng, không phải phiên viết code.

## Ánh xạ tài khoản TT99
Chủ dự án tự điền. Phiên viết code và agent khác không được điền hộ. Cột "Căn cứ" ghi điều khoản TT99 hoặc tài liệu SAP.

| Khái niệm | Tài khoản TT99 | Căn cứ | Ngày duyệt |
|---|---|---|---|
| NVL | | | |
| CP SXKD dở dang | | | |
| Thành phẩm | | | |
| Giá vốn | | | |
| GR/IR | | | |
| Chênh lệch giá | | | |

## Chưa chốt
- Thư mục docs chính thức: `docs/` hay `docs-cloud/` (hiện có cả hai).
- Vị trí `intent.md` / `spec.md` (chưa tồn tại).
- Issue tracker local: `docs/issues/` hay sổ AUD trong `docs-cloud/AUDITOR.md`.
