# GIAO DỊCH ↔ ĐỊNH KHOẢN TT99 ↔ BÁO CÁO (MÔ PHỎNG)

> Tạo mới ở Session 1 (file chưa tồn tại). Chuẩn: **TT99**. Số liệu: VND nguyên, ngày hạch toán duy nhất `SIM_CONFIG.postingDate`.
> 632110–632140 là TK chi tiết quản trị (không phải mã luật TT99). Hàng **không định giá**: 101/601 chỉ có chứng từ vật tư, không có bút toán FI.

| Bước | Giao dịch SAP | Nợ | Có | Điều kiện | Báo cáo phản ánh |
|---|---|---|---|---|---|
| 3 | MIGO 261E — xuất NVL cho lệnh | 621 | 152 | mọi ca | FAGLL03, MB51 (261), COOIS Components, COOIS GM, KOB1 (Nợ lệnh) |
| 3 | CO11N — xác nhận nhân công | 622 | 334 | mọi ca | FAGLL03, COOIS Operations, COOIS Confirmations, KOB1 |
| 3 | CO11N — xác nhận máy/SXC | 627 | 214 | mọi ca | FAGLL03, COOIS Operations, COOIS Confirmations, KOB1 |
| 3 | CO01 — kết chuyển CP vào dở dang | 154 | 621 / 622 / 627 | mọi ca | FAGLL03; KOB1 **không** lặp lại (AUD-014); test dùng Σ Nợ 154 CO01 = Σ CP ban đầu KOB1 |
| 3 | MIGO 101E — nhập kho TP (tồn E) | 155 | 154 | Valuated, giao > 0 | FAGLL03, MB51 (101), COOIS GM, KOB1 (Có lệnh), KKS1 `GR_CREDIT` |
| 5 | VL01N / MIGO 601E — xuất giao (PGI) | 632110 / 632120 / 632130 / 632140 | 155 | Valuated, giao > 0 | FAGLL03, MB51 (601), CK13N (thành phần 101→632110, 102→632120, 103→632130, 104→632140) |
| 6 | VF01 — hóa đơn | 131 | 511 | giao > 0 | FAGLL03, SUP01 `REVENUE` |
| 6 | VF01 — thuế GTGT đầu ra | 131 | 3331 | giao > 0 | FAGLL03 |
| 7 | VA88 — kết chuyển chênh lệch (bất lợi) | 632 | 154 | Valuated, Δ > 0 | FAGLL03, KOB1, KKS1 `SETTLED` (+) |
| 7 | VA88 — kết chuyển chênh lệch (thuận lợi) | 154 | 632 | Valuated, Δ < 0 | FAGLL03, KOB1 (dòng dương), KKS1 `SETTLED` (−) |
| 7 | VA88 / KKA2 — giá vốn từ dở dang | 632 | 154 | Non-valuated, giao > 0 | FAGLL03, KOB1, KKS1 `SETTLED` |
| 7 | VA88 — kết chuyển doanh thu | 511 | 911 | giao > 0 | FAGLL03, SUP01 `GROSS_PROFIT` |
| 7 | VA88 — kết chuyển giá vốn | 911 | 632xxx / 632 | giao > 0 | FAGLL03, SUP01 `COGS`, `GROSS_PROFIT` |

## Báo cáo mới (T2) — công thức đối soát (scripts/s3-reports.ts)
| Báo cáo | Nguồn | Đối soát FI (ACDOCA) | Đối soát oracle a0_expected.json |
|---|---|---|---|
| MB51 | sự kiện | Σ261 = Có 152; Σ101 = Nợ 155 (101E); Σ601 = Có 155 (601E); BELNR tồn tại trong ACDOCA | Σ261 = `cr152` |
| COOIS Order Header | sự kiện | ACT_COST = Nợ 621+622+627 | ACT_COST = `actual`; PLAN = `P` |
| COOIS Components | sự kiện | Σ ACT_VAL = Có 152 | = `cr152`; Σ PLAN_VAL = `cr152 − dM` |
| COOIS Operations / Confirmations | sự kiện | NC = Có 334; Máy/SXC = Có 214 | = `cr334`, `cr214` |
| COOIS Documented GM | sự kiện | như MB51, không có 601 | Σ261 = `cr152` |
| KOB1 | ACDOCA | Σ CP ban đầu = Nợ 154 (CO01); Σ = số dư 154 | Σ CP ban đầu = `actual`; Σ = `wip154_dr_minus_cr` |
| KKS1 | sự kiện + ACDOCA | WIP = số dư 154; GR = Có 154 (101E) | ACT = `actual`; WIP = `wip154…`; VARIANCE = `delta × ratio` (r = 0/1) |
| CK13N | computeMTO | Σ = Nợ 621+622+627 − Δ; Valuated r=1: từng thành phần = Nợ 6321x0 (601E) | Σ = `P`; 621/622/627 = `cr152−dM` / `cr334−dL` / `cr214−dO` |
| SUP01 | sự kiện + ACDOCA | REVENUE = Có 511 (VF01); GP = Có − Nợ 911 | REVENUE = `revenue_recognized`; GP = `gp911_credit`; WIP = `wip154…` |
| FAGLL03 | ACDOCA | Σ Nợ / Σ Có = ACDOCA; Σ HSL = 0 | — |
