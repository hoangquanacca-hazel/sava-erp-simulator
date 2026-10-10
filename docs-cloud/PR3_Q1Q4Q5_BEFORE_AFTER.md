# PR-3 — Q1 + Q4 + Q5 trên nhánh `cloud/pr3-costing`: bảng trước/sau

Chủ dự án duyệt Q1, Q4, Q5 (10/10/2026). Gốc: `cloud/pr2-costing-oracle` (xếp chồng, mang theo commit PR-2). Mỗi quyết định một commit; đáp án chỉ sinh bằng script, không sửa tay.

## Lệnh đã chạy

```
git show 900465b -- scripts/a0_oracle.py | git apply        # a0_oracle.py đọc oracle_costing.py, thêm --check
git show c5a9936 -- src/utils/calculator.ts | git apply     # Q4
git show 87366d6 -- src/utils/calculator.ts | git apply     # Q5 (chỉ calculator.ts; controlling.ts của S4 không có ở nhánh này)
git show 39b6563 -- src/utils/calculator.ts | git apply     # Q1
python3 scripts/a0_oracle.py                                # sinh lại scripts/a0_expected.json (54 ca)
python3 scripts/oracle_costing.py --check ; python3 scripts/a0_oracle.py --check
npm run lint test:parity test:s1 test:s2 test:a0 test:reports test:health test:security test:s3 test:s4 test:s5 test:s6 test:costing build test:start test:ui-finance
```

Báo cáo SAP (594 kiểm tra), snapshot S5, gói S6: không có file đáp án riêng cần sinh — các test `test:reports`, `test:s3`…`test:s6` dựng lại từ `a0_expected.json` mới và đều exit 0. `a0_expected.json`: **18/54 ca đổi, toàn bộ là Denso**; Samsung, Canon 36/36 ca không đổi.

Commit 5 (`src/presentation/finance.ts`, `displayedBomInputs`) là sửa ngoài 3 commit đã duyệt, được chủ dự án cho phép: lưới BOM dựng theo itemCode từ `bomItemBreakdowns` thay vì theo vị trí dòng (xem lý do trong commit).

## 1. Giá thành kế hoạch (VND)

| Preset | P trước (Codex) | P sau | Δ |
|---|---:|---:|---:|
| samsung-cover | 48.780.088 | 48.780.088 | 0 |
| canon-frame | 53.086.050 | 53.086.050 | 0 |
| denso-sensor | 113.882.210 | 98.664.801 | -15.217.409 |

Denso sau = **98.664.801** (khớp oracle).

## 2. Số dư sau đóng sổ và lãi gộp — ca Valuated, giao 100%

154 = dư Nợ − Có của 154; 155 = số dư 155 sau PGI; 632 = dư Nợ − Có 632 sau kết chuyển; lãi gộp = dư Có 911 (doanh thu − giá vốn đã ghi nhận).

### Biến động thực tế 0%

| Preset | P trước → sau | 154 trước → sau | 155 trước → sau | 632 trước → sau | Lãi gộp (911) trước → sau |
|---|---|---|---|---|---|
| samsung-cover | 48.780.088 → 48.780.088 | 0 → 0 | 0 → 0 | 0 → 0 | 161.219.912 → 161.219.912 |
| canon-frame | 53.086.050 → 53.086.050 | 0 → 0 | 0 → 0 | 0 → 0 | 176.913.950 → 176.913.950 |
| denso-sensor | 113.882.210 → 98.664.801 | 0 → 0 | 0 → 0 | 0 → 0 | 114.117.790 → 129.335.199 |

### Biến động thực tế 3.5%

| Preset | P trước → sau | 154 trước → sau | 155 trước → sau | 632 trước → sau | Lãi gộp (911) trước → sau |
|---|---|---|---|---|---|
| samsung-cover | 48.780.088 → 48.780.088 | 0 → 0 | 0 → 0 | 0 → 0 | 159.512.609 → 159.512.609 |
| canon-frame | 53.086.050 → 53.086.050 | 0 → 0 | 0 → 0 | 0 → 0 | 175.055.938 → 175.055.938 |
| denso-sensor | 113.882.210 → 98.664.801 | 0 → 0 | 0 → 0 | 0 → 0 | 110.131.913 → 125.881.931 |

## 3. Denso — 18 ca đổi (Valuated + Non-valuated × 3 mức biến động × 3 mức giao)

| Kho | Biến động % | Giao | P trước → sau | Lãi gộp 911 trước → sau | 154 trước → sau |
|---|---:|---:|---|---|---|
| Valuated | 3.5 | 1.0 | 113.882.210 → 98.664.801 | 110.131.913 → 125.881.931 | 0 → 0 |
| Valuated | 3.5 | 0.5 | 113.882.210 → 98.664.801 | 55.065.956 → 62.940.965 | 58.934.043 → 51.059.034 |
| Valuated | 3.5 | 0.0 | 113.882.210 → 98.664.801 | 0 → 0 | 117.868.087 → 102.118.069 |
| Valuated | 0 | 1.0 | 113.882.210 → 98.664.801 | 114.117.790 → 129.335.199 | 0 → 0 |
| Valuated | 0 | 0.5 | 113.882.210 → 98.664.801 | 57.058.895 → 64.667.599 | 56.941.105 → 49.332.400 |
| Valuated | 0 | 0.0 | 113.882.210 → 98.664.801 | 0 → 0 | 113.882.210 → 98.664.801 |
| Valuated | -3.5 | 1.0 | 113.882.210 → 98.664.801 | 118.103.667 → 132.788.467 | 0 → 0 |
| Valuated | -3.5 | 0.5 | 113.882.210 → 98.664.801 | 59.051.833 → 66.394.233 | 54.948.166 → 47.605.766 |
| Valuated | -3.5 | 0.0 | 113.882.210 → 98.664.801 | 0 → 0 | 109.896.333 → 95.211.533 |
| Non-valuated | 3.5 | 1.0 | 113.882.210 → 98.664.801 | 110.131.913 → 125.881.931 | 0 → 0 |
| Non-valuated | 3.5 | 0.5 | 113.882.210 → 98.664.801 | 55.065.956 → 62.940.965 | 58.934.043 → 51.059.034 |
| Non-valuated | 3.5 | 0.0 | 113.882.210 → 98.664.801 | 0 → 0 | 117.868.087 → 102.118.069 |
| Non-valuated | 0 | 1.0 | 113.882.210 → 98.664.801 | 114.117.790 → 129.335.199 | 0 → 0 |
| Non-valuated | 0 | 0.5 | 113.882.210 → 98.664.801 | 57.058.895 → 64.667.599 | 56.941.105 → 49.332.400 |
| Non-valuated | 0 | 0.0 | 113.882.210 → 98.664.801 | 0 → 0 | 113.882.210 → 98.664.801 |
| Non-valuated | -3.5 | 1.0 | 113.882.210 → 98.664.801 | 118.103.667 → 132.788.467 | 0 → 0 |
| Non-valuated | -3.5 | 0.5 | 113.882.210 → 98.664.801 | 59.051.833 → 66.394.233 | 54.948.166 → 47.605.766 |
| Non-valuated | -3.5 | 0.0 | 113.882.210 → 98.664.801 | 0 → 0 | 109.896.333 → 95.211.533 |

Phân rã Denso (+15.217.409 trước → 0): Q1 −14.400.000 (bao bì tính trùng), Q4 −817.409, Q5 0 ròng (xem `PR2_MEASURE.md`).

## 4. Hiển thị dòng `ROH-ADD-ESD` (kiểm tra, KHÔNG sửa ở PR này)
Đo trên Denso bằng `buildManufacturingReports` (Valuated, giao 100%):
- **MB51**: có dòng BWART 261, MATNR `ROH-ADD-ESD`, 116,44 KG, DMBTR **139.728**, SHKZG H (xuất kho, Có 152); Σ 261 vẫn khớp FI nên bút toán 621/152 đã gồm khoản này. MB51 không có cột tài khoản — Nợ 621/Có 152 chỉ thấy ở FAGLL03/ACDOCA (tổng).
- **COOIS Components**: có dòng RSPOS 0003, `ROH-ADD-ESD`, kế hoạch = thực tế = 139.728. **COOIS Goods Movements**: có.
- **CK13N: THIẾU.** Chỉ có HEADER + 3 ITEM gộp (621/622/627); không có dòng theo BOM nên không thấy 139.728. `validateReportPack` còn khẳng định cứng `items.length === 3`.
- File cần thêm nếu muốn CK13N tách 621 theo dòng BOM (S4 làm ở `src/reports/controlling.ts`, không có ở nhánh này): `src/reports/manufacturing.ts` (builder + `validateReportPack`), `src/adapters/framework.ts` và `src/adapters/contracts.v1.json` (profile CK13N), `src/controls/reconcile.ts`, `src/mart/manufacturing.ts`, `src/reports/snapshot.ts`, kèm sửa kỳ vọng ở các test s2/s3/s4/s5/s6 và cập nhật đáp án liên quan. Chờ chủ dự án quyết; chưa mang code S4 sang.
