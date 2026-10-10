# Vertical slices và reconciliation design

## P0 Manufacturing Cost & Variance

Scope đề xuất: một company/plant/currency/profile được duyệt, nhiều order có normal/reversal/partial/period-crossing. Bao gồm cả Valuated/Non-valuated để bảo vệ tài sản cũ, nhưng semantic policy tách production order khỏi sales order settlement. Không dùng VA88 như universal production settlement.

Inputs: D01 MB51; D02–D06 COOIS Header/Components/Operations/Confirmations/Documented GM; D07 KOB1; D08 KKS1; D09–D10 CK13N; D16 GL; SUP01 settlement evidence. Cost/quantity/UoM/period/target-version snapshots phải đồng bộ.

| Control | Logic / grain | Join và ngoại lệ |
|---|---|---|
| C01 COOIS GM ↔ MB51 | So key material doc year/document/item và signed qty theo cùng selection | 1:1 expected subset; COOIS và MB51 là hai report views, **không UNION cộng đôi**; missing-only/out-of-scope tách riêng |
| C02 Components ↔ GI | Withdrawn snapshot = cumulative net 261−262 theo order/reservation/item/UoM | MB51 thiếu reservation cần bổ sung mapping có evidence; join chỉ order+material là aggregate có ambiguity, không khẳng định row match |
| C03 Header ↔ GR | Delivered qty theo cutoff ↔ cumulative net 101−102 cho output order item/material | Header snapshot không so trực tiếp với movement một tháng nếu có opening; co/by-products không cộng vào main output tùy policy |
| C04 KOB1 ↔ KKS1 | Aggregate classified debits/credits + approved adjustments = KKS1 control-cost basis | Match order/controlling area/period/currency/target version; tách overhead, activity, WIP/scrap basis; không net mọi KOB1 rồi gọi variance |
| C05 KKS1 → settlement → GL | Variance eligible amount → settlement lines/receiver/period → GL reference allocation | KKS1 calculation không phải FI posting; không có SUP01 thì BLOCKED, không fuzzy join amount/date |
| C06 CK13N drill | Cost estimate header total ↔ itemization cùng estimate/version/lot/currency/cost view | Phân cấp có subtotals: chỉ cộng additive leaves cho view; lot_size > 0; rounding tolerance approved |
| C07 variance bridge | actual cost − aligned target cost = categorized variance + explicit residual | Five-type demo identity không chứng minh SAP categories đúng; remaining không được gắn root cause giả |
| C08 commentary | Facts và controls trong approved snapshot → explanation/action | Mỗi amount link evidence; hypothesis label; không publish khi blocking DQ hoặc critical control |

### Công thức quantity và cost

`GI_net = sum(issue_quantity) - sum(reversal_issue_quantity)` sau kiểm chứng sign profile. `GR_net = sum(receipt_quantity) - sum(reversal_receipt_quantity)`. Movement type `261` và special stock `E` là hai attributes; string `261E` chỉ display shortcut trong simulator.

Components: `usage_variance_qty = net_consumption - allowed_quantity_for_output`; quantity required của full order không mặc nhiên là allowed quantity cho actual output. Phải chốt BOM base, yield/scrap allowance, component substitutions và effective version. Missing issue chỉ xác định khi order stage/status đáng lẽ cần issue; planned order chưa chạy không là lỗi tự động.

Giải thích quản trị đơn giản, nếu có dữ liệu chứng minh: price variance = `(actual_price-standard_price)*actual_qty`; quantity variance = `(actual_qty-allowed_qty)*standard_price`; activity variance = actual activity cost − allowed activity cost; scrap riêng chỉ khi policy không double-count trong quantity. Đây là management decomposition, không tự gán SAP KKS1 category. `residual = total_variance - explained_components`; xuất ratio explained khi denominator khác 0.

### Corpus P0 tối thiểu

Normal valued; normal nonvalued; partial delivery/WIP; 261 reversal 262; GR reversal 102; cross-period reversal; backflush issue failed (COGI evidence nếu có); multiple same-material components; split order outputs; canceled/reversed confirmation; negative/favorable variance; mixed UoM/missing conversion; missing settlement link; duplicate doc number different year/client; malformed/truncated export. SME viết expected outcomes riêng từng case.

## P1 Procurement & AP

PO ME2N → goods receipt MB51 → invoice/PO history support → GR/IR detail → supplier items FBL1N/F0712 → GL. ME2N PO item snapshot không thay PO history; invoice receipt detail/credit memo/GR-based IV có thể cần supporting export chưa nằm danh sách chính, ghi dependency mở. F3303 monitor aggregate không đủ để phân bổ từng receipt.

Controls: ordered/received/invoiced by PO item/UoM; receipts−invoices−approved adjustments = GRIR balance ở cùng currency/cutoff; supplier open items ↔ recon accounts với special G/L policy; duplicate invoice rules; due date/aging completeness. Outputs: blocked invoices, unmatched receipts, aging, DPO; DPO = average eligible AP / period credit purchases × days, denominator chưa có thì N/A, không dùng net revenue.

## P1 Sales & AR

Order/delivery support → VF05 billing items (cancellation/credit memo) → accounting link → FBL5N/F0711 → GL. Billing net sales khác gross receivable; tax, FX, rounding và split accounting phải có bridge. Cleared-after-key-date logic cần historical clearing evidence; current open list không tái dựng được lịch sử đầy đủ một mình.

Outputs: AR aging, overdue share, DSO = average eligible AR / credit sales × days; cutoff, tax basis và exclusions rõ. Invoice-level collections drill; doanh thu bằng 0 → N/A có reason. So sánh cùng ngày dùng cùng FX/policy; không sum currency tùy tiện.

## P2 Material Ledger

CKM3N material-period/currency/valuation analysis + CKMLCP run/status + inventory MB5L + GL/settlement bridge. Verify actual costing activation/price determination/currency/valuation trước test. Chuỗi close thực tế do SME xác nhận theo release, không lấy hardcoded demo làm chuẩn.

Controls: beginning + receipts − consumption ± adjustments = ending qty/value; price differences phân bổ stock/consumption theo policy; run completeness/status, repeated settlement idempotency; GL tie-out. Không tính lại purchase/production variance đã settlement hai lần. Outputs: PUP bridge, standard→actual margin, DIO = average eligible inventory / aligned COGS × days; CCC = DSO + DIO − DPO khi cùng time window/basis. UI USD quy đổi hiện có không chứng minh parallel valuation.
