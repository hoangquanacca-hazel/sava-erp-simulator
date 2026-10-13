# GLOSSARY — thuật ngữ đã chốt (MTO / TT99)

Chỉ ghi những gì đã thống nhất với chủ dự án. Mục nào chưa chốt nằm ở cuối.

## Chuẩn kế toán
- **TT99**: Thông tư 99/2025/TT-BTC, chuẩn kế toán duy nhất của simulator. **Không** dùng TT200 (chốt tại CLOUD_BRIEF.md; đề bài ghi TT200 là nhầm, xác nhận 13/10/2026).

## Chuyển động kho (Special Stock E, MTO)
- **261E**: xuất NVL cho đơn hàng bán (goods issue to order, stock E).
- **101E**: nhập thành phẩm từ lệnh sản xuất vào kho E.
- **601E**: xuất giao hàng cho khách từ kho E (PGI).
- **Valuated sales order stock**: kho E có định giá; 101E/601E sinh bút toán tài chính.
- **Non-valuated sales order stock**: kho E phi định giá; 101E/601E chỉ ghi số lượng, chi phí treo trên sales order cho đến bước kết chuyển.

## Chiến lược & quy trình
- **MTO**: Make-to-Order, sản xuất theo đơn hàng bán.
- **Strategy 20**: MTO thuần, không dùng chung vật tư. **Strategy 25**: MTO có Variant Configuration (Super BOM / Super Routing).
- **ACDOCA**: universal journal của S/4HANA, nguồn đối soát tổng cho mọi báo cáo.

## Kiểm thử
- **Golden set**: bảng đáp án Nợ/Có do chủ dự án duyệt từng dòng, đặt tại `golden/`. Không tham chiếu code hay `a0_oracle.py`.
- **Oracle**: `scripts/a0_oracle.py`, độc lập mã TS nhưng do agent viết; **không** thay thế golden set.
- **Khóa hành vi (regression)**: test so mã hiện tại với golden; lệch thì FAIL và báo cáo, không tự sửa số.
- **Test âm tính**: sửa một số thì test phải FAIL. Cấm script có nhánh fallback tự sinh dữ liệu rồi in PASS.
- **Agent kiểm chứng**: phiên riêng, không phải phiên viết code.

## Chưa chốt
- Thư mục docs chính thức: `docs/` hay `docs-cloud/` (hiện có cả hai).
- Vị trí `intent.md` / `spec.md` (chưa tồn tại).
- Issue tracker local: `docs/issues/` hay sổ AUD trong `docs-cloud/AUDITOR.md`.
