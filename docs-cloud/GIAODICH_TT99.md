# GIAO DỊCH & ĐỊNH KHOẢN TT99 — báo cáo logistics/CO (Cloud Session 1)

Chuẩn: **TT99** (không TT200). Mã TK theo `ACCOUNT_MAP` (`src/config/simConfig.ts`) — trạng thái đối chiếu PDF Công báo: **chưa đối chiếu** (Mr Quân thực hiện). 632110–632140 là TK chi tiết quản trị, không phải TK cấp 2 của TT99.
Mọi số liệu là MÔ PHỎNG (`SIMULATED`), BUKRS 1000, WERKS 1100, lệnh `1000001`, ngày hạch toán 2026-09-15.
Ví dụ số: **samsung-cover / Valuated / chênh lệch +3,5% / giao 50%** (P = 48.780.088; thực tế = 50.487.391).

## 1. Bảng định khoản theo giao dịch và báo cáo đọc nó

| # | Giao dịch (T-code / BWART) | Nợ | Có | Số ví dụ | Hàng không định giá | Báo cáo hiển thị / đối soát |
|---|---|---|---|---|---|---|
| 1 | MIGO 261E — xuất NVL cho lệnh | 621 | 152 | 8.593.087 | như định giá | MB51 (261), COOIS Components, COOIS Goods Mvt (261), KOB1 (621, RMWA) |
| 2 | CO11N — xác nhận: nhân công | 622 | 334 | 14.863.738 | như định giá | COOIS Confirmations `LAB_VAL`, COOIS Operations, KOB1 (622, RKL) |
| 3 | CO11N — xác nhận: máy + SXC | 627 | 214 | 27.030.566 | như định giá | COOIS Confirmations `MOH_VAL`, COOIS Operations, KOB1 (627, RKL) — xem AUD-022 |
| 4 | CO01 — kết chuyển chi phí vào lệnh | 154 | 621 / 622 / 627 | 50.487.391 | như định giá | COOIS Header `ACT_COST`, KKS1 `ACTUAL`; **không** vào KOB1 (AUD-015) |
| 5 | MIGO 101E — nhập kho thành phẩm (giá kế hoạch × SL giao) | 155 | 154 | 24.390.044 | **Không bút toán** (chỉ số lượng, `DMBTR` = 0) | MB51 (101), COOIS Goods Mvt (101), KOB1 (154, RMWE, âm), KKS1 `TARGET`, CK13N × tỷ lệ giao |
| 6 | VL01N / MIGO 601E — xuất giao (giá vốn tách theo CK11N) | 632110 / 632120 / 632130 / 632140 | 155 | 4.151.250 / 7.180.550 / 12.151.700 / 906.544 | **Không bút toán** | MB51 (601), CK13N theo thành phần MAT/LAB/MACH/OVH |
| 7 | VF01 — doanh thu | 131 | 511 | 105.000.000 | như định giá | (chỉ FAGLL03) |
| 8 | VF01 — thuế GTGT đầu ra | 131 | 3331 | 10.500.000 | như định giá | (chỉ FAGLL03) |
| 9a | VA88 — chênh lệch bất lợi của phần đã giao | 632 | 154 | 853.652 | — | KOB1 (154, KOAO), KKS1 `VARIANCE` |
| 9b | VA88 — chênh lệch có lợi | 154 | 632 | (ca −3,5%) | — | KOB1 (154, KOAO, dương), KKS1 `VARIANCE` âm |
| 9c | VA88 / KKA2 — quyết toán giá vốn hàng không định giá (thực tế × tỷ lệ giao) | 632 | 154 | (canon NV giao 100%: 51.228.038) | **chỉ có ở NV** | KOB1 (154, KOAO), KKS1 (`VARIANCE` = quyết toán − `TARGET`) |
| 10 | VA88 — kết chuyển doanh thu | 511 | 911 | 105.000.000 | như định giá | (FAGLL03) |
| 11 | VA88 — kết chuyển giá vốn | 911 | 632110–632140, 632 | 25.243.696 | NV: Có 632 | (FAGLL03) |

Kết quả ví dụ: số dư Nợ 154 = 50.487.391 − 24.390.044 − 853.652 = **25.243.695** (= oracle `wip154_dr_minus_cr`, = Σ KOB1, = Σ WIP KKS1).

## 2. Công thức đối soát từng báo cáo (test `npm run test:s3`, 54 ca của `a0_expected.json`)

| Báo cáo | Tổng trên báo cáo | = Tổng ACDOCA | = Oracle |
|---|---|---|---|
| MB51 | Σ DMBTR BWART 261 | Có 152 (261E) | `cr152` |
| MB51 | Σ DMBTR 101 / 601 | Nợ 155 (101E) / Có 155 (601E) — NV: 0 | — |
| COOIS Header | ACT_COST; PLAN_COST | Nợ 154 (CO01) | `actual`; `P` |
| COOIS Components | Σ ACT_VAL; Σ ACT_VAL − Σ PLAN_VAL | Có 152 (261E) | `cr152`; `dM` |
| COOIS Operations | Σ ACT_COST | Nợ 622 + Nợ 627 (CO11N) | `cr334 + cr214` |
| COOIS Confirmations | Σ LAB_VAL; Σ MOH_VAL | Nợ 622; Nợ 627 (CO11N) | `cr334`; `cr214` |
| COOIS Goods Mvt | Σ DMBTR 261; 101 | Có 152 (261E); Nợ 155 (101E) | `cr152` |
| KOB1 | Σ WKGBTR; Σ KSTAR 621/622/627 | Số dư Nợ 154; Nợ 621+622+627 (trừ CO01) | `wip154_dr_minus_cr`; `actual` |
| KKS1 | Σ ACTUAL; Σ WIP; ORDER_VAR theo yếu tố | Nợ 154 (CO01); số dư 154 | `actual`; `wip154`; `dM`/`dL`/`dO`/`delta` |
| KKS1 (định giá) | Σ TARGET; Σ VARIANCE | Nợ 155 (101E); ròng Có 154 bước 7 | — |
| CK13N | Σ WERT | (định giá, giao > 0) round(Σ WERT × tỷ lệ) = Nợ 155 (101E) = Σ Nợ 632110–140 (601E) | `P` |
| SUP01 | DIFF = REPORT_VAL − FI_VAL = 0 mọi dòng; STATUS khớp DIFF | các quy tắc trên | `cr152`,`cr334`,`cr214`,`actual`,`wip154`,`P` |

Âm tính: mỗi báo cáo sửa 1 ô số +1 ở 54 ca → đối soát phải FAIL và SHA-256 phải đổi; SUP01 thêm 9 báo cáo nguồn × 54 ca = 486 lần sửa, đều phải hiện `LECH`.

## 3. Lưu ý nghiệp vụ
- Hàng **không định giá** (tồn kho đặc biệt E không định giá): 101E/601E chỉ ghi số lượng; giá vốn đi thẳng 154 → 632 ở bước 7 (dòng 9c).
- Giao một phần: nhập kho/doanh thu/giá vốn theo tỷ lệ giao; phần còn lại nằm ở 154 (WIP), chưa mô phỏng kỳ sau.
- KOB1 không gồm bút toán CO01 vì 154 chính là lệnh (AUD-015). KKS1 chưa tách loại chênh lệch (AUD-016).
- Các mã TK cần đối chiếu PDF Công báo TT99 trước khi dùng cho học viên CPA.
