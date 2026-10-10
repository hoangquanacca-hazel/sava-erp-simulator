# Report Master Dictionary v1.0

**Planning contracts, chưa là certified SAP field catalog.** D01–D19 bao phủ 19 dataset chuẩn; hai Z descriptors là BLOCKED; SUP01 bổ sung cầu nối settlement. Tổng 22 descriptors. Không ép CKMLCP execution log, CKM3N hierarchy, KKS1 result hay F3303 aggregate thành cùng grain.

Nguồn máy đọc: [report-contracts.v1.json](contracts/report-contracts.v1.json). Các canonical field bên dưới là yêu cầu target; technical fields/headings là **candidate** nếu có, không khẳng định tất cả sẵn trong ALV/Fiori. Cột chưa có sample ghi null/TBD. Không dùng candidate như alias tự động trong production. Mỗi required field không có trong layout phải xin layout/supporting extract hoặc sửa contract qua review, không điền số giả.

## Quy ước chung

- Business key prefix `source_system, client`; snapshot storage thêm `dataset_id` để lưu lịch sử, không che duplicate trong cùng snapshot.
- Data types: IDs/string giữ số 0 đầu; date ISO YYYY-MM-DD theo locale đã duyệt; decimals chính xác `(24,6)` là đề xuất storage cần overflow/precision review; flags boolean từ mapping; timestamp UTC. Tiền kèm currency và currency_type, lượng kèm UoM.
- Required raw fields là field cần lấy từ file/layout để report contract hoạt động; namespace/selection/cutoff lấy từ manifest. Optional field có thể trở thành mandatory để enable một control cụ thể.
- Raw bytes giữ nguyên, cleaned/derived fields tách biệt. DQ01–DQ10, row conservation và manifest áp dụng cho mọi report.
- Mỗi join giới hạn source scope/snapshot/currency/UoM/time basis. Aggregate child trước khi join header; kiểm tra multiplicity/unmatched records.
- Actual SAP variant names, technical identifiers và sample hashes phải được SME duyệt theo từng release. Proposed profile ID không có nghĩa đã tồn tại trong SAP.

## Danh mục

| ID | Report | Grain | Frequency | Status |
|---|---|---|---|---|
| D01 | Material Document Items | 1 material document item; không cộng các report view trùng nguồn | Daily + period close | PROPOSED_PENDING_SME_SAMPLE |
| D02 | COOIS Order Header | 1 production order per as-of snapshot; output item detail separate if multiple outputs | Daily snapshot + close freeze | PROPOSED_PENDING_SME_SAMPLE |
| D03 | COOIS Components | 1 reservation component item, not 1 unique material per order | Daily + close | PROPOSED_PENDING_SME_SAMPLE |
| D04 | COOIS Operations | 1 order operation/suboperation identified by routing internal identity | Daily + close | PROPOSED_PENDING_SME_SAMPLE |
| D05 | COOIS Confirmations | 1 confirmation counter record; activity slots stay wide in raw and optional child table in clean | Daily + close | PROPOSED_PENDING_SME_SAMPLE |
| D06 | COOIS Documented Goods Movements | 1 documented material document item linked to production order | Daily + close | PROPOSED_PENDING_SME_SAMPLE |
| D07 | Order Actual Cost Line Items | 1 actual CO document line in declared controlling-area/year view | Daily/weekly + close freeze | PROPOSED_PENDING_SME_SAMPLE |
| D08 | Variance Calculation Detail | 1 order/period/target-cost-version/variance-category/cost-element/origin/currency result row | At variance runs/period close | PROPOSED_PENDING_SME_SAMPLE |
| D09 | Standard Cost Estimate Header | 1 cost estimate/version/valuation-view/currency; as-of selection chooses a specific estimate | On cost release/change + period snapshot | PROPOSED_PENDING_SME_SAMPLE |
| D10 | Standard Cost Estimate Itemization | 1 estimate itemization line at selected cost view; hierarchy subtotal lines classified separately | With D09 | PROPOSED_PENDING_SME_SAMPLE |
| D11 | Material Price Analysis | 1 material/valuation area/type/period/currency/view/category/node price-analysis record | Period close after relevant run stages | PROPOSED_PENDING_SME_SAMPLE |
| D12 | Actual Costing Run Status | 1 costing run/material/valuation area/step/attempt status record | Each costing run/attempt | PROPOSED_PENDING_SME_SAMPLE |
| D13 | Purchasing Documents by Number | 1 PO item snapshot in chosen item layout; schedules/account assignments need separate child contracts | Daily + close snapshot | PROPOSED_PENDING_SME_SAMPLE |
| D14 | Supplier Line Items | 1 FI entry-view partner line item at selected status/key-date snapshot | Daily snapshot + close freeze | PROPOSED_PENDING_SME_SAMPLE |
| D15 | Customer Line Items | 1 FI entry-view partner line item at selected status/key-date snapshot | Daily snapshot + close freeze | PROPOSED_PENDING_SME_SAMPLE |
| D16 | General Ledger Line Items | 1 general-ledger-view journal line per ledger (not FI entry-view BUZEI) | Daily + period close freeze | PROPOSED_PENDING_SME_SAMPLE |
| D17 | Billing Document Items | 1 billing document item in verified item layout; header-only variant requires separate grain | Daily + close | PROPOSED_PENDING_SME_SAMPLE |
| D18 | GR/IR Reconciliation Detail | proposed PO-item/currency/key-date balance; if F3303 only aggregate, separate aggregate profile required | Daily + close | PROPOSED_PENDING_SME_SAMPLE |
| D19 | Stock Value Balance | 1 material/valuation area/type/valuation class/account/currency stock-value snapshot at selected period | Period close + controlled snapshot | PROPOSED_PENDING_SME_SAMPLE |
| SUP01 | Settlement Evidence / Document Bridge | 1 settlement run/sender/receiver-allocation/source-result line to accounting line link | Each settlement / close | PROPOSED_PENDING_SME_SAMPLE |
| ZFIR009A | ZFIR009A custom report | UNKNOWN | UNKNOWN | BLOCKED_NO_SAMPLE |
| ZFIR159 | ZFIR159 custom report | UNKNOWN | UNKNOWN | BLOCKED_NO_SAMPLE |

## D01 — Material Document Items

- **Module:** MM
- **Transaction:** MB51
- **Fiori / applicability:** F1077
- **Business purpose:** Net issues/receipts ↔ COOIS components/header/documented movements; value bridge to GL only with accounting references
- **Grain:** 1 material document item; không cộng các report view trùng nguồn
- **Primary key:** source_system; client; fiscal_year; material_document; material_document_item
- **Selection criteria:** plant/company scope; posting date from/to + fiscal year; full history through cutoff for cumulative controls; movement types 261/262/101/102 for MFG plus separately approved others; orders/materials, stock and reversal scope
- **Approved-target variant:** SAVA_D01_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily + period close
- **Cleaning:** Derive signed_quantity from approved movement/debit-credit profile, never double-negate; movement_type and special_stock separate; Cumulative and period datasets tagged; no cross-snapshot sums
- **Validation / DQ:** DQ01–DQ10; Material doc item unique; GI/GR semantics and reversal references valid; amount_lc/local_currency mandatory if value controls enabled; production_order mandatory for P0 MFG subset; reservation keys required for exact component match
- **Joins / cardinality:** D06 1:1 on year/doc/item within namespace, compare not union; D02 N:1 production_order; D03 via order/reservation/item when present, otherwise aggregate flagged ambiguous; D13 PO/item N:1 after item projection
- **Reconciliation target:** Net issues/receipts ↔ COOIS components/header/documented movements; value bridge to GL only with accounting references
- **KPI / management outputs:** consumption/yield; reversal volume; missing issue/receipt; stock movement drill
- **ECC ↔ S/4HANA/Fiori notes:** ECC material-document concepts and S/4 exports have different catalogues; F1077 mapping requires separate release fixture. Non-valuated movement amount may legitimately be absent/zero; never infer FI posting from quantity.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| fiscal_year | string | Yes | Fiscal Year | GJAHR/MJAHR depending report |
| material_document | string | Yes | Material Document | MBLNR |
| material_document_item | string | Yes | Material Document Item | ZEILE |
| posting_date | date | Yes | Posting Date | BUDAT |
| document_date | date | Yes | Document Date | BLDAT |
| material | string | Yes | Material | MATNR |
| plant | string | Yes | Plant | WERKS |
| movement_type | string | Yes | Movement Type | BWART |
| quantity | decimal(24,6) | Yes | Quantity | MENGE/view-specific |
| base_uom | string | Yes | Base Unit of Measure | MEINS |
| debit_credit_indicator | string | Yes | Debit/Credit Indicator | SHKZG/DRCRK depending view |
| material_description | string | Conditional/optional | Material Description | MAKTX |
| storage_location | string | Conditional/optional | Storage Location | LGORT |
| batch | string | Conditional/optional | Batch | CHARG |
| amount_lc | decimal(24,6) | Conditional/optional | Amount in Local Currency | DMBTR/HSL depending view |
| local_currency | string | Conditional/optional | Local Currency | WAERS/RHCUR depending view |
| production_order | string | Conditional/optional | Order | AUFNR |
| reservation | string | Conditional/optional | Reservation | RSNUM |
| reservation_item | string | Conditional/optional | Reservation Item | RSPOS |
| purchase_order | string | Conditional/optional | Purchasing Document | EBELN |
| purchase_order_item | string | Conditional/optional | Item | EBELP |
| cost_center | string | Conditional/optional | Cost Center | KOSTL |
| gl_account | string | Conditional/optional | G/L Account | HKONT/RACCT depending view |
| vendor | string | Conditional/optional | Supplier/Vendor | LIFNR |
| customer | string | Conditional/optional | Customer | KUNNR |
| reference | string | Conditional/optional | Reference | XBLNR |
| document_header_text | string | Conditional/optional | Document Header Text | BKTXT |
| user_name | string | Conditional/optional | User Name | USNAM |
| special_stock | string | Conditional/optional | Special Stock | SOBKZ |
| sales_order | string | Conditional/optional | Sales Order | KDAUF/VBELN depending view |
| sales_order_item | string | Conditional/optional | Sales Order Item | KDPOS/POSNR depending view |
| reversal_document | string | Conditional/optional | TBD: cần field catalog | TBD |
| reversal_year | string | Conditional/optional | TBD: cần field catalog | TBD |
| reversal_item | string | Conditional/optional | TBD: cần field catalog | TBD |

## D02 — COOIS Order Header

- **Module:** PP
- **Transaction:** COOIS
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Delivered header quantity ↔ cumulative net GR, with opening and output-scope bridge
- **Grain:** 1 production order per as-of snapshot; output item detail separate if multiple outputs
- **Primary key:** source_system; client; production_order
- **Selection criteria:** list type Order Headers; plant/order/type/material ranges; status selection including DLV/TECO policy; snapshot cutoff timestamp
- **Approved-target variant:** SAVA_D02_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily snapshot + close freeze
- **Cleaning:** Status text → versioned set preserving original; Keep delivered vs planned quantities separate; Snapshot key includes dataset_id physically
- **Validation / DQ:** Unique order in selected header view; Dates chronological or exception; planned/delivered quantities units present; No future snapshot used for prior cutoff
- **Joins / cardinality:** D03/D04/D05/D06 1:N by production_order, aggregate before joining; D01 cumulative 101/102 by order and output material; D09 selected by material/plant/costing validity; never nearest date guess
- **Reconciliation target:** Delivered header quantity ↔ cumulative net GR, with opening and output-scope bridge
- **KPI / management outputs:** completion %; late orders; order cost/yield drill
- **ECC ↔ S/4HANA/Fiori notes:** COOIS list selection mandatory. Main header material not enough for co-products; require item support or explicit scope exclusion approved.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| production_order | string | Yes | Order | AUFNR |
| order_type | string | Yes | Order Type | AUART |
| material | string | Yes | Material | MATNR |
| plant | string | Yes | Plant | WERKS |
| planned_quantity | decimal(24,6) | Yes | Order Quantity | GAMNG/header-view-specific |
| delivered_quantity | decimal(24,6) | Yes | Delivered Quantity | WEMNG/item-view-specific |
| base_uom | string | Yes | Base Unit of Measure | MEINS |
| system_status | string | Yes | TBD: cần field catalog | TBD |
| material_description | string | Conditional/optional | Material Description | MAKTX |
| basic_start_date | date | Conditional/optional | Basic Start Date | GSTRP |
| basic_finish_date | date | Conditional/optional | Basic Finish Date | GLTRP |
| actual_start_date | date | Conditional/optional | Actual Start Date | GSTRI |
| actual_finish_date | date | Conditional/optional | Actual Finish Date | GLTRI |
| production_version | string | Conditional/optional | Production Version | VERID |
| mrp_controller | string | Conditional/optional | MRP Controller | DISPO |
| scheduler | string | Conditional/optional | Production Supervisor | FEVOR |
| sales_order | string | Conditional/optional | Sales Order | KDAUF/VBELN depending view |
| sales_order_item | string | Conditional/optional | Sales Order Item | KDPOS/POSNR depending view |

## D03 — COOIS Components

- **Module:** PP
- **Transaction:** COOIS
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Withdrawn snapshot ↔ cumulative net 261/262; allowed consumption ↔ actual output basis
- **Grain:** 1 reservation component item, not 1 unique material per order
- **Primary key:** source_system; client; production_order; reservation; reservation_item
- **Selection criteria:** list type Components; same order population and snapshot cutoff as D02; include deleted/final-issued policy explicit
- **Approved-target variant:** SAVA_D03_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily + close
- **Cleaning:** Normalize flags to boolean with profile dictionary; usage_variance_qty/usage_variance_pct/missing_issue_flag/over_issue_flag derived only in CLEAN with output-adjustment policy; zero required quantity → percentage null + reason
- **Validation / DQ:** No merging same material multiple reservation items; withdrawn vs issue comparison needs same time basis; Component substitutes/backflush errors must be visible exceptions
- **Joins / cardinality:** D02 N:1 by order; D01 aggregated order/reservation/item; fallback material aggregation not exact; D04 via order+operation only when operation identity is sufficient
- **Reconciliation target:** Withdrawn snapshot ↔ cumulative net 261/262; allowed consumption ↔ actual output basis
- **KPI / management outputs:** usage variance quantity/value; missing/over issue; component root cause
- **ECC ↔ S/4HANA/Fiori notes:** Component grain in early preview refined to reservation/item. Some layout fields may need enabling. COGI exceptions are supporting evidence, not silently successful withdrawals.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| production_order | string | Yes | Order | AUFNR |
| reservation | string | Yes | Reservation | RSNUM |
| reservation_item | string | Yes | Reservation Item | RSPOS |
| component_material | string | Yes | Component | MATNR in component structure |
| required_quantity | decimal(24,6) | Yes | Requirements Quantity | BDMNG |
| withdrawn_quantity | decimal(24,6) | Yes | Quantity Withdrawn | ENMNG |
| base_uom | string | Yes | Base Unit of Measure | MEINS |
| plant | string | Yes | Plant | WERKS |
| component_description | string | Conditional/optional | TBD: cần field catalog | TBD |
| storage_location | string | Conditional/optional | Storage Location | LGORT |
| batch | string | Conditional/optional | Batch | CHARG |
| operation | string | Conditional/optional | Operation | VORNR |
| backflush_flag | boolean | Conditional/optional | Backflush | RGEKZ |
| final_issue_flag | boolean | Conditional/optional | Final Issue | KZEAR |
| requirement_date | date | Conditional/optional | TBD: cần field catalog | TBD |
| deletion_flag | boolean | Conditional/optional | Deletion Indicator | LOEKZ |

## D04 — COOIS Operations

- **Module:** PP
- **Transaction:** COOIS
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Planned operations/resources ↔ confirmations and activity-cost basis
- **Grain:** 1 order operation/suboperation identified by routing internal identity
- **Primary key:** source_system; client; production_order; routing_number; operation_counter
- **Selection criteria:** list type Operations; same order population; operation/control-key scope; as-of cutoff
- **Approved-target variant:** SAVA_D04_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily + close
- **Cleaning:** Keep VORNR display separate from internal operation key; Standard value slots retain activity/unit mapping; never assume slot1=labor; No H/MIN conversion without explicit factor
- **Validation / DQ:** Unique routing/internal operation key; Positive base quantity when normalizing; Units for every standard-value slot; Parallel sequences/suboperations not collapsed
- **Joins / cardinality:** D02 N:1 order; D05 1:N internal operation reference; require mapping if only display operation exported
- **Reconciliation target:** Planned operations/resources ↔ confirmations and activity-cost basis
- **KPI / management outputs:** operation completion; resource efficiency; routing bottlenecks
- **ECC ↔ S/4HANA/Fiori notes:** Operation number alone not a stable unique key across sequences/suboperations. Layout lacking internal keys requires revised verified compound key/profile, not arbitrary dedupe.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| production_order | string | Yes | Order | AUFNR |
| routing_number | string | Yes | Routing Number of Operations | AUFPL |
| operation_counter | string | Yes | Internal Counter | APLZL |
| operation | string | Yes | Operation | VORNR |
| work_center | string | Yes | TBD: cần field catalog | TBD |
| plant | string | Yes | Plant | WERKS |
| control_key | string | Yes | Control Key | STEUS |
| operation_quantity | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| operation_uom | string | Yes | TBD: cần field catalog | TBD |
| sequence | string | Conditional/optional | TBD: cần field catalog | TBD |
| suboperation | string | Conditional/optional | TBD: cần field catalog | TBD |
| operation_description | string | Conditional/optional | TBD: cần field catalog | TBD |
| standard_value_1 | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| standard_unit_1 | string | Conditional/optional | TBD: cần field catalog | TBD |
| standard_value_2 | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| standard_unit_2 | string | Conditional/optional | TBD: cần field catalog | TBD |
| standard_value_3 | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| standard_unit_3 | string | Conditional/optional | TBD: cần field catalog | TBD |
| base_quantity | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| scheduled_start | date | Conditional/optional | TBD: cần field catalog | TBD |
| scheduled_finish | date | Conditional/optional | TBD: cần field catalog | TBD |
| confirmed_yield | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| confirmed_scrap | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |

## D05 — COOIS Confirmations

- **Module:** PP
- **Transaction:** COOIS
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Confirmed yield/scrap/time ↔ operation plan and controlled cost drivers
- **Grain:** 1 confirmation counter record; activity slots stay wide in raw and optional child table in clean
- **Primary key:** source_system; client; confirmation_number; confirmation_counter
- **Selection criteria:** list type Confirmations; order set and posting dates; include cancellations and reversals; historical scope when needed
- **Approved-target variant:** SAVA_D05_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily + close
- **Cleaning:** Cancellation semantics from profile; retain original and reversing records; Unpivot activities only to child grain confirmation+counter+activity_slot with lineage; Do not infer final confirmation from quantity
- **Validation / DQ:** Counter unique; Cancel link valid; Yield/scrap/rework units explicit; Activity units/slots mapped to work center rules
- **Joins / cardinality:** D02 N:1 order; D04 N:1 verified internal operation mapping; D07 activity costs via document/reference bridge, not hours×assumed rate
- **Reconciliation target:** Confirmed yield/scrap/time ↔ operation plan and controlled cost drivers
- **KPI / management outputs:** scrap rate; labor/machine efficiency; unconfirmed operations
- **ECC ↔ S/4HANA/Fiori notes:** COOIS display text and cancellation flags vary; correct reversal handling must be demonstrated with source fixture. Personnel data restricted.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| confirmation_number | string | Yes | Confirmation | RUECK |
| confirmation_counter | string | Yes | Confirmation Counter | RMZHL |
| production_order | string | Yes | Order | AUFNR |
| operation | string | Yes | Operation | VORNR |
| posting_date | date | Yes | Posting Date | BUDAT |
| yield_quantity | decimal(24,6) | Yes | Yield | LMNGA |
| scrap_quantity | decimal(24,6) | Yes | Scrap | XMNGA |
| confirmation_uom | string | Yes | TBD: cần field catalog | TBD |
| cancellation_flag | boolean | Yes | TBD: cần field catalog | TBD |
| routing_number | string | Conditional/optional | Routing Number of Operations | AUFPL |
| operation_counter | string | Conditional/optional | Internal Counter | APLZL |
| rework_quantity | decimal(24,6) | Conditional/optional | Rework | RMNGA |
| activity_1 | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| activity_unit_1 | string | Conditional/optional | TBD: cần field catalog | TBD |
| activity_2 | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| activity_unit_2 | string | Conditional/optional | TBD: cần field catalog | TBD |
| activity_3 | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| activity_unit_3 | string | Conditional/optional | TBD: cần field catalog | TBD |
| final_confirmation_flag | boolean | Conditional/optional | TBD: cần field catalog | TBD |
| reversal_confirmation | string | Conditional/optional | TBD: cần field catalog | TBD |
| reversal_counter | string | Conditional/optional | TBD: cần field catalog | TBD |
| personnel_number | string | Conditional/optional | TBD: cần field catalog | TBD |

## D06 — COOIS Documented Goods Movements

- **Module:** PP/MM
- **Transaction:** COOIS
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** COOIS documented movement view ↔ MB51 same source events
- **Grain:** 1 documented material document item linked to production order
- **Primary key:** source_system; client; fiscal_year; material_document; material_document_item
- **Selection criteria:** list type Documented Goods Movements; same order/date/type filter as MB51 comparison; do not substitute Automatic Goods Movements or Goods Movements with Errors
- **Approved-target variant:** SAVA_D06_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily + close
- **Cleaning:** Same sign normalization profile as D01 but separate raw source; Mark report_view=COOIS_GM; not extra movements to union into MB51 fact
- **Validation / DQ:** D01 key coverage match in scoped subset; Quantity/currency values agree after documented layout differences
- **Joins / cardinality:** D01 1:1 by year/doc/item; D02 N:1 order
- **Reconciliation target:** COOIS documented movement view ↔ MB51 same source events
- **KPI / management outputs:** missing movement links; order movement trace
- **ECC ↔ S/4HANA/Fiori notes:** Five COOIS datasets remain separate exports; automatic/error lists not interchangeable with posted documents.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| production_order | string | Yes | Order | AUFNR |
| fiscal_year | string | Yes | Fiscal Year | GJAHR/MJAHR depending report |
| material_document | string | Yes | Material Document | MBLNR |
| material_document_item | string | Yes | Material Document Item | ZEILE |
| posting_date | date | Yes | Posting Date | BUDAT |
| material | string | Yes | Material | MATNR |
| plant | string | Yes | Plant | WERKS |
| movement_type | string | Yes | Movement Type | BWART |
| quantity | decimal(24,6) | Yes | Quantity | MENGE/view-specific |
| base_uom | string | Yes | Base Unit of Measure | MEINS |
| debit_credit_indicator | string | Yes | Debit/Credit Indicator | SHKZG/DRCRK depending view |
| storage_location | string | Conditional/optional | Storage Location | LGORT |
| batch | string | Conditional/optional | Batch | CHARG |
| special_stock | string | Conditional/optional | Special Stock | SOBKZ |
| reservation | string | Conditional/optional | Reservation | RSNUM |
| reservation_item | string | Conditional/optional | Reservation Item | RSPOS |
| amount_lc | decimal(24,6) | Conditional/optional | Amount in Local Currency | DMBTR/HSL depending view |
| local_currency | string | Conditional/optional | Local Currency | WAERS/RHCUR depending view |
| reversal_document | string | Conditional/optional | TBD: cần field catalog | TBD |
| reversal_year | string | Conditional/optional | TBD: cần field catalog | TBD |
| reversal_item | string | Conditional/optional | TBD: cần field catalog | TBD |

## D07 — Order Actual Cost Line Items

- **Module:** CO
- **Transaction:** KOB1
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Classified actual costs ↔ KKS1 control-cost basis, with WIP/credits/adjustments bridge
- **Grain:** 1 actual CO document line in declared controlling-area/year view
- **Primary key:** source_system; client; controlling_area; fiscal_year; co_document; co_document_item
- **Selection criteria:** controlling area/orders; fiscal year/period or posting date; actual value type; currency view/cost element/business transaction; settlement/reversal inclusion explicit
- **Approved-target variant:** SAVA_D07_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily/weekly + close freeze
- **Cleaning:** Keep CO/object/transaction/local amounts as distinct typed measures; Classify debit/credit, settlement, activity, material, overhead using reviewed mapping; Never aggregate mixed currency types
- **Validation / DQ:** Line identity stable for actual export view; Order and cost-element mapping coverage; Sign and period scope; Unclassified business transaction blocks C04 if financially material
- **Joins / cardinality:** D02 order N:1; D08 aggregated by order/period/currency/version bridge; D16 via verified CO→FI reference allocation; cannot assume line-id equality
- **Reconciliation target:** Classified actual costs ↔ KKS1 control-cost basis, with WIP/credits/adjustments bridge
- **KPI / management outputs:** actual cost by order/element; material/activity/overhead drivers
- **ECC ↔ S/4HANA/Fiori notes:** ECC CO and S/4 universal-journal-related reporting differ. Treat KOB1 export key as profile-validated; object currency not synonymous with local currency.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| controlling_area | string | Yes | Controlling Area | KOKRS |
| fiscal_year | string | Yes | Fiscal Year | GJAHR/MJAHR depending report |
| co_document | string | Yes | CO Document Number | BELNR in CO context |
| co_document_item | string | Yes | CO Document Line Item | BUZEI in CO context |
| production_order | string | Yes | Order | AUFNR |
| posting_date | date | Yes | Posting Date | BUDAT |
| fiscal_period | string | Yes | TBD: cần field catalog | TBD |
| cost_element | string | Yes | Cost Element | KSTAR/RACCT depending view |
| business_transaction | string | Yes | Business Transaction | VRGNG/view-specific |
| value_type | string | Yes | Value Type | WRTTP |
| amount_co | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| co_currency | string | Yes | TBD: cần field catalog | TBD |
| company_code | string | Conditional/optional | Company Code | BUKRS/RBUKRS depending view |
| object_number | string | Conditional/optional | TBD: cần field catalog | TBD |
| amount_lc | decimal(24,6) | Conditional/optional | Amount in Local Currency | DMBTR/HSL depending view |
| local_currency | string | Conditional/optional | Local Currency | WAERS/RHCUR depending view |
| amount_tc | decimal(24,6) | Conditional/optional | Amount in Document Currency | WRBTR/WSL depending view |
| transaction_currency | string | Conditional/optional | TBD: cần field catalog | TBD |
| quantity | decimal(24,6) | Conditional/optional | Quantity | MENGE/view-specific |
| base_uom | string | Conditional/optional | Base Unit of Measure | MEINS |
| partner_object | string | Conditional/optional | TBD: cần field catalog | TBD |
| reference_document | string | Conditional/optional | TBD: cần field catalog | TBD |
| reference_year | string | Conditional/optional | TBD: cần field catalog | TBD |
| reference_item | string | Conditional/optional | TBD: cần field catalog | TBD |
| fi_document | string | Conditional/optional | Accounting Document | BELNR |
| fi_document_item | string | Conditional/optional | Line Item | BUZEI |
| ledger | string | Conditional/optional | Ledger | RLDNR |
| debit_credit_indicator | string | Conditional/optional | Debit/Credit Indicator | SHKZG/DRCRK depending view |

## D08 — Variance Calculation Detail

- **Module:** CO-PC
- **Transaction:** KKS1
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Variance calculation result ↔ classified costs; settlement-relevant variance ↔ settlement evidence
- **Grain:** 1 order/period/target-cost-version/variance-category/cost-element/origin/currency result row
- **Primary key:** source_system; client; controlling_area; fiscal_year; fiscal_period; production_order; target_cost_version; variance_category; cost_element; origin_group; currency_type; currency
- **Selection criteria:** KKS1 run: orders/plant/controlling area; year/period/target cost version; test/update run and detail-list selection; currency/type and eligible order statuses
- **Approved-target variant:** SAVA_D08_V1 (PENDING_SME_APPROVAL)
- **Frequency:** At variance runs/period close
- **Cleaning:** Use explicit NOT_APPLICABLE member for unused category dimensions only when aggregate profile approved; Separate totals/detail rows; normalize categories through mapping; No invented details if export provides summary only
- **Validation / DQ:** Variance category sum ↔ declared total at same basis; Calculation status success and eligible scope; target_cost/control_cost required for C04 unless separate approved supporting extract provides them; No dedupe summary vs detail by amount
- **Joins / cardinality:** D07 classified order/period costs via C04 bridge; SUP01 eligible variance by order/period/receiver; target-version relevance verified
- **Reconciliation target:** Variance calculation result ↔ classified costs; settlement-relevant variance ↔ settlement evidence
- **KPI / management outputs:** variance categories; unexplained residual; cost root causes
- **ECC ↔ S/4HANA/Fiori notes:** KKS1 is calculation transaction, not FI posting. Detail availability and shape depend run/list settings; unsupported granular fields require revised contract, never fabricated zeros. Target versions differ in settlement relevance.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| controlling_area | string | Yes | Controlling Area | KOKRS |
| fiscal_year | string | Yes | Fiscal Year | GJAHR/MJAHR depending report |
| fiscal_period | string | Yes | TBD: cần field catalog | TBD |
| production_order | string | Yes | Order | AUFNR |
| target_cost_version | string | Yes | TBD: cần field catalog | TBD |
| variance_category | string | Yes | TBD: cần field catalog | TBD |
| cost_element | string | Yes | Cost Element | KSTAR/RACCT depending view |
| origin_group | string | Yes | TBD: cần field catalog | TBD |
| currency_type | string | Yes | TBD: cần field catalog | TBD |
| currency | string | Yes | TBD: cần field catalog | TBD |
| variance_amount | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| target_cost | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| control_cost | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| actual_cost | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| output_quantity | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| base_uom | string | Conditional/optional | Base Unit of Measure | MEINS |
| run_status | string | Conditional/optional | TBD: cần field catalog | TBD |
| variance_key | string | Conditional/optional | TBD: cần field catalog | TBD |

## D09 — Standard Cost Estimate Header

- **Module:** CO-PC
- **Transaction:** CK13N
- **Fiori / applicability:** CK13N (release-dependent launch)
- **Business purpose:** Standard estimate header ↔ itemization; standard-cost baseline for management variance
- **Grain:** 1 cost estimate/version/valuation-view/currency; as-of selection chooses a specific estimate
- **Primary key:** source_system; client; cost_estimate_number; costing_type; costing_date; costing_version; valuation_variant; valuation_view; currency_type; currency
- **Selection criteria:** material/plant; costing variant/version/date; current/future/released selection; valuation/currency/cost-component view
- **Approved-target variant:** SAVA_D09_V1 (PENDING_SME_APPROVAL)
- **Frequency:** On cost release/change + period snapshot
- **Cleaning:** total_cost is for stated lot; unit_cost=total_cost/lot only when >0; Do not use current estimate to explain past order without validity bridge
- **Validation / DQ:** Estimate key stable; Positive lot and valid date interval; Selected valuation view inventory relevant vs full cost explicit; D10 total leaves reconcile with rounding policy
- **Joins / cardinality:** D10 1:N on full cost estimate key; D02 via material/plant+validity+approved selection; multiple estimates ambiguous
- **Reconciliation target:** Standard estimate header ↔ itemization; standard-cost baseline for management variance
- **KPI / management outputs:** unit standard cost; BOM/routing contribution; standard-cost change
- **ECC ↔ S/4HANA/Fiori notes:** CK13N material estimate differs from sales-order/order preliminary cost estimate. Do not equate CK11N/CK51N simulator calculation with verified released CK13N.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| cost_estimate_number | string | Yes | Cost Estimate Number | KALNR |
| material | string | Yes | Material | MATNR |
| plant | string | Yes | Plant | WERKS |
| costing_variant | string | Yes | TBD: cần field catalog | TBD |
| costing_type | string | Yes | Costing Type | KALKA |
| costing_date | date | Yes | Costing Date | KADKY/view-specific |
| costing_version | string | Yes | Costing Version | TVERS |
| valuation_variant | string | Yes | Valuation Variant | BWVAR |
| valuation_view | string | Yes | TBD: cần field catalog | TBD |
| currency_type | string | Yes | TBD: cần field catalog | TBD |
| currency | string | Yes | TBD: cần field catalog | TBD |
| costing_lot_size | decimal(24,6) | Yes | Costing Lot Size | LOSGR |
| base_uom | string | Yes | Base Unit of Measure | MEINS |
| total_cost | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| validity_from | date | Yes | TBD: cần field catalog | TBD |
| validity_to | date | Yes | TBD: cần field catalog | TBD |
| costing_status | string | Conditional/optional | TBD: cần field catalog | TBD |
| price_unit | decimal(24,6) | Conditional/optional | Price Unit | PEINH |
| standard_price | decimal(24,6) | Conditional/optional | Standard Price | STPRS |
| cost_component_structure | string | Conditional/optional | TBD: cần field catalog | TBD |

## D10 — Standard Cost Estimate Itemization

- **Module:** CO-PC
- **Transaction:** CK13N
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Itemization leaves ↔ header for same estimate/lot/view
- **Grain:** 1 estimate itemization line at selected cost view; hierarchy subtotal lines classified separately
- **Primary key:** source_system; client; cost_estimate_number; costing_type; costing_date; costing_version; valuation_variant; valuation_view; currency_type; currency; itemization_item
- **Selection criteria:** same full estimate selection as D09; itemization view vs multilevel BOM/cost component split must be declared
- **Approved-target variant:** SAVA_D10_V1 (PENDING_SME_APPROVAL)
- **Frequency:** With D09
- **Cleaning:** Keep raw row types; use additive leaf policy for selected view; Activity/material/overhead item categories normalized; Do not sum rolled-up parent and leaf costs together
- **Validation / DQ:** Unique estimate+line; Parent references valid if hierarchy profile; Costs and units/price unit consistent; Known rounding and excluded cost component bridge only
- **Joins / cardinality:** D09 N:1 full estimate key; component material/work center reference dimensions; no direct quantity-only order match
- **Reconciliation target:** Itemization leaves ↔ header for same estimate/lot/view
- **KPI / management outputs:** standard material/activity/overhead drill; cost component mix
- **ECC ↔ S/4HANA/Fiori notes:** Itemization and cost component split can differ by view/rounding; profile must select one additive basis and document bridge.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| cost_estimate_number | string | Yes | Cost Estimate Number | KALNR |
| costing_type | string | Yes | Costing Type | KALKA |
| costing_date | date | Yes | Costing Date | KADKY/view-specific |
| costing_version | string | Yes | Costing Version | TVERS |
| valuation_variant | string | Yes | Valuation Variant | BWVAR |
| valuation_view | string | Yes | TBD: cần field catalog | TBD |
| currency_type | string | Yes | TBD: cần field catalog | TBD |
| currency | string | Yes | TBD: cần field catalog | TBD |
| itemization_item | string | Yes | Itemization Item | POSNR in costing context |
| item_category | string | Yes | Item Category | TYPPS |
| item_cost | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| cost_element | string | Yes | Cost Element | KSTAR/RACCT depending view |
| component_material | string | Conditional/optional | Component | MATNR in component structure |
| activity_type | string | Conditional/optional | TBD: cần field catalog | TBD |
| cost_center | string | Conditional/optional | Cost Center | KOSTL |
| work_center | string | Conditional/optional | TBD: cần field catalog | TBD |
| quantity | decimal(24,6) | Conditional/optional | Quantity | MENGE/view-specific |
| base_uom | string | Conditional/optional | Base Unit of Measure | MEINS |
| price | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| price_unit | decimal(24,6) | Conditional/optional | Price Unit | PEINH |
| cost_component | string | Conditional/optional | TBD: cần field catalog | TBD |
| hierarchy_level | string | Conditional/optional | TBD: cần field catalog | TBD |
| parent_item | string | Conditional/optional | TBD: cần field catalog | TBD |
| is_total | boolean | Conditional/optional | TBD: cần field catalog | TBD |

## D11 — Material Price Analysis

- **Module:** CO-PC-ML
- **Transaction:** CKM3N
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Material period value flow and price differences ↔ ML results/inventory/GL
- **Grain:** 1 material/valuation area/type/period/currency/view/category/node price-analysis record
- **Primary key:** source_system; client; material; valuation_area; valuation_type; fiscal_year; fiscal_period; currency_type; valuation_view; category; node_id
- **Selection criteria:** material/valuation area/type; year/period; currency/valuation view; category/detail expansion and actual-cost status
- **Approved-target variant:** SAVA_D11_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Period close after relevant run stages
- **Cleaning:** Preserve tree topology and subtotal flag via profile; Keep prices per price_unit; no conversion without unit basis
- **Validation / DQ:** Node key and hierarchy valid; Do not double count parent totals; Beginning/receipt/consumption/ending bridge by view
- **Joins / cardinality:** D12 run scope by material/valuation area/period with status; D19 stock value by compatible scope; D16 via posting reference bridge not material-only join
- **Reconciliation target:** Material period value flow and price differences ↔ ML results/inventory/GL
- **KPI / management outputs:** PUP bridge; inventory/consumption revaluation; actual vs standard cost
- **ECC ↔ S/4HANA/Fiori notes:** CKM3N hierarchical view not flat additive transaction list; valuation_type blank is valid only for nonsplit valuation profile. UI USD demo is not ML currency type.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| material | string | Yes | Material | MATNR |
| valuation_area | string | Yes | Valuation Area | BWKEY |
| valuation_type | string | Yes | Valuation Type | BWTAR |
| fiscal_year | string | Yes | Fiscal Year | GJAHR/MJAHR depending report |
| fiscal_period | string | Yes | TBD: cần field catalog | TBD |
| currency_type | string | Yes | TBD: cần field catalog | TBD |
| valuation_view | string | Yes | TBD: cần field catalog | TBD |
| currency | string | Yes | TBD: cần field catalog | TBD |
| category | string | Yes | TBD: cần field catalog | TBD |
| node_id | string | Yes | TBD: cần field catalog | TBD |
| quantity | decimal(24,6) | Yes | Quantity | MENGE/view-specific |
| base_uom | string | Yes | Base Unit of Measure | MEINS |
| value | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| price_difference | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| price_unit | decimal(24,6) | Conditional/optional | Price Unit | PEINH |
| standard_price | decimal(24,6) | Conditional/optional | Standard Price | STPRS |
| periodic_unit_price | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| parent_node_id | string | Conditional/optional | TBD: cần field catalog | TBD |
| procurement_alternative | string | Conditional/optional | TBD: cần field catalog | TBD |
| process_category | string | Conditional/optional | TBD: cần field catalog | TBD |

## D12 — Actual Costing Run Status

- **Module:** CO-PC-ML
- **Transaction:** CKMLCP
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Run completeness/status ↔ resulting ML price-analysis and posting evidence
- **Grain:** 1 costing run/material/valuation area/step/attempt status record
- **Primary key:** source_system; client; costing_run_id; fiscal_year; fiscal_period; material; valuation_area; run_step; attempt_id
- **Selection criteria:** costing run ID/year/period; plants/valuation areas/material population; step and processing attempt; actual costing activation profile
- **Approved-target variant:** SAVA_D12_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Each costing run/attempt
- **Cleaning:** Map step/status codes per release; Retain all attempts; latest eligible view derived separately; No monetary facts fabricated from status log
- **Validation / DQ:** Run population completeness; Prerequisite steps and error statuses; Retry not counted as additional valuation
- **Joins / cardinality:** D11 material/valuation area/period related result snapshot; SUP01 or posting evidence via settlement document
- **Reconciliation target:** Run completeness/status ↔ resulting ML price-analysis and posting evidence
- **KPI / management outputs:** close progress; failed materials; processing duration
- **ECC ↔ S/4HANA/Fiori notes:** CKMLCP executes actual-cost process; separate run log from CKM3N monetary detail. Process steps differ by release; SME-approved dependency graph required.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| costing_run_id | string | Yes | TBD: cần field catalog | TBD |
| fiscal_year | string | Yes | Fiscal Year | GJAHR/MJAHR depending report |
| fiscal_period | string | Yes | TBD: cần field catalog | TBD |
| material | string | Yes | Material | MATNR |
| valuation_area | string | Yes | Valuation Area | BWKEY |
| run_step | string | Yes | TBD: cần field catalog | TBD |
| attempt_id | string | Yes | TBD: cần field catalog | TBD |
| run_status | string | Yes | TBD: cần field catalog | TBD |
| started_at | timestamp_utc | Conditional/optional | TBD: cần field catalog | TBD |
| completed_at | timestamp_utc | Conditional/optional | TBD: cần field catalog | TBD |
| message_id | string | Conditional/optional | TBD: cần field catalog | TBD |
| message_text | string | Conditional/optional | TBD: cần field catalog | TBD |
| settlement_document | string | Conditional/optional | TBD: cần field catalog | TBD |
| valuation_view | string | Conditional/optional | TBD: cần field catalog | TBD |
| currency_type | string | Conditional/optional | TBD: cần field catalog | TBD |

## D13 — Purchasing Documents by Number

- **Module:** MM
- **Transaction:** ME2N
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Ordered vs received/invoiced quantities with supporting PO history
- **Grain:** 1 PO item snapshot in chosen item layout; schedules/account assignments need separate child contracts
- **Primary key:** source_system; client; purchase_order; purchase_order_item
- **Selection criteria:** purchasing org/company/plant/PO/vendor; selection parameter e.g. open/all explicitly recorded; scope and snapshot cutoff; item layout without schedule/account-assignment duplication
- **Approved-target variant:** SAVA_D13_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily + close snapshot
- **Cleaning:** Keep unit price per price unit; Open/closed/deleted flags explicit; Do not infer full receipt/invoice history from snapshot totals
- **Validation / DQ:** Unique PO/item for approved layout; Positive price_unit; Date/filter consistency; Missing history fields block matching controls needing them
- **Joins / cardinality:** D01 N:1 PO/item after receipt aggregation; D18 PO/item scope; D14 accounting bridge via PO-history/invoice support
- **Reconciliation target:** Ordered vs received/invoiced quantities with supporting PO history
- **KPI / management outputs:** open PO; delivery variance; procurement spend
- **ECC ↔ S/4HANA/Fiori notes:** ECC/S4 reports can expand schedules/account assignments. If layout is expanded, upgrade grain with child keys; never de-duplicate item lines arbitrarily.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| purchase_order | string | Yes | Purchasing Document | EBELN |
| purchase_order_item | string | Yes | Item | EBELP |
| company_code | string | Yes | Company Code | BUKRS/RBUKRS depending view |
| vendor | string | Yes | Supplier/Vendor | LIFNR |
| material | string | Yes | Material | MATNR |
| plant | string | Yes | Plant | WERKS |
| order_quantity | decimal(24,6) | Yes | Order Quantity | MENGE |
| order_uom | string | Yes | Order Unit | MEINS |
| net_price | decimal(24,6) | Yes | Net Price | NETPR |
| price_unit | decimal(24,6) | Yes | Price Unit | PEINH |
| document_currency | string | Yes | TBD: cần field catalog | TBD |
| deletion_flag | boolean | Yes | Deletion Indicator | LOEKZ |
| delivery_complete_flag | boolean | Yes | Delivery Completed | ELIKZ |
| purchasing_org | string | Conditional/optional | Purchasing Organization | EKORG |
| purchasing_group | string | Conditional/optional | Purchasing Group | EKGRP |
| document_date | date | Conditional/optional | Document Date | BLDAT |
| delivery_date | date | Conditional/optional | TBD: cần field catalog | TBD |
| net_value | decimal(24,6) | Conditional/optional | Net Value | NETWR |
| received_quantity | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| invoiced_quantity | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| account_assignment_category | string | Conditional/optional | TBD: cần field catalog | TBD |

## D14 — Supplier Line Items

- **Module:** FI
- **Transaction:** FBL1N
- **Fiori / applicability:** F0712
- **Business purpose:** Partner balances ↔ eligible reconciliation GL accounts at same cutoff/ledger bridge
- **Grain:** 1 FI entry-view partner line item at selected status/key-date snapshot
- **Primary key:** source_system; client; company_code; fiscal_year; fi_document; fi_document_item
- **Selection criteria:** company/partner; open on key date / cleared / all must be explicit; posting dates and clearing dates/status; special G/L, noted items and normal items scope
- **Approved-target variant:** SAVA_D14_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily snapshot + close freeze
- **Cleaning:** Signed balance by debit-credit; keep transaction/local currencies distinct; Due date from exported due date or verified terms calendar; do not assume baseline+30; Aging computed at key date; cleared-after-date reconstruction only with sufficient history
- **Validation / DQ:** Entry-view key uniqueness; Due date and terms completeness for aging; No current status substituted for historical status; Normal/special GL separated
- **Joins / cardinality:** D16 via entry-to-ledger bridge; splitting can be 1:N; D13/D17 via explicit purchasing/billing/accounting references
- **Reconciliation target:** Partner balances ↔ eligible reconciliation GL accounts at same cutoff/ledger bridge
- **KPI / management outputs:** AP aging; overdue AP; DPO with approved purchases denominator
- **ECC ↔ S/4HANA/Fiori notes:** Fiori and GUI profile mappings separate. FBL1N/FBL5N BUZEI entry-view item is not automatically ACDOCA DOCLN. Missing due-date basis makes aging unavailable, not zero overdue.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| company_code | string | Yes | Company Code | BUKRS/RBUKRS depending view |
| fiscal_year | string | Yes | Fiscal Year | GJAHR/MJAHR depending report |
| fi_document | string | Yes | Accounting Document | BELNR |
| fi_document_item | string | Yes | Line Item | BUZEI |
| vendor | string | Yes | Supplier/Vendor | LIFNR |
| posting_date | date | Yes | Posting Date | BUDAT |
| document_date | date | Yes | Document Date | BLDAT |
| document_type | string | Yes | Document Type | BLART |
| amount_lc | decimal(24,6) | Yes | Amount in Local Currency | DMBTR/HSL depending view |
| local_currency | string | Yes | Local Currency | WAERS/RHCUR depending view |
| amount_tc | decimal(24,6) | Yes | Amount in Document Currency | WRBTR/WSL depending view |
| transaction_currency | string | Yes | TBD: cần field catalog | TBD |
| debit_credit_indicator | string | Yes | Debit/Credit Indicator | SHKZG/DRCRK depending view |
| baseline_date | date | Yes | Baseline Payment Date | ZFBDT |
| payment_terms | string | Yes | Terms of Payment | ZTERM |
| special_gl_indicator | string | Yes | Special G/L Indicator | UMSKZ |
| due_date | date | Conditional/optional | TBD: cần field catalog | TBD |
| clearing_document | string | Conditional/optional | Clearing Document | AUGBL |
| clearing_date | date | Conditional/optional | Clearing Date | AUGDT |
| assignment | string | Conditional/optional | Assignment | ZUONR |
| reference | string | Conditional/optional | Reference | XBLNR |
| gl_account | string | Conditional/optional | G/L Account | HKONT/RACCT depending view |
| payment_block | string | Conditional/optional | TBD: cần field catalog | TBD |
| purchase_order | string | Conditional/optional | Purchasing Document | EBELN |
| purchase_order_item | string | Conditional/optional | Item | EBELP |
| billing_document | string | Conditional/optional | Billing Document | VBELN |

## D15 — Customer Line Items

- **Module:** FI
- **Transaction:** FBL5N
- **Fiori / applicability:** F0711
- **Business purpose:** Partner balances ↔ eligible reconciliation GL accounts at same cutoff/ledger bridge
- **Grain:** 1 FI entry-view partner line item at selected status/key-date snapshot
- **Primary key:** source_system; client; company_code; fiscal_year; fi_document; fi_document_item
- **Selection criteria:** company/partner; open on key date / cleared / all must be explicit; posting dates and clearing dates/status; special G/L, noted items and normal items scope
- **Approved-target variant:** SAVA_D15_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily snapshot + close freeze
- **Cleaning:** Signed balance by debit-credit; keep transaction/local currencies distinct; Due date from exported due date or verified terms calendar; do not assume baseline+30; Aging computed at key date; cleared-after-date reconstruction only with sufficient history
- **Validation / DQ:** Entry-view key uniqueness; Due date and terms completeness for aging; No current status substituted for historical status; Normal/special GL separated
- **Joins / cardinality:** D16 via entry-to-ledger bridge; splitting can be 1:N; D13/D17 via explicit purchasing/billing/accounting references
- **Reconciliation target:** Partner balances ↔ eligible reconciliation GL accounts at same cutoff/ledger bridge
- **KPI / management outputs:** AR aging; overdue AR; DSO with approved credit-sales denominator
- **ECC ↔ S/4HANA/Fiori notes:** Fiori and GUI profile mappings separate. FBL1N/FBL5N BUZEI entry-view item is not automatically ACDOCA DOCLN. Missing due-date basis makes aging unavailable, not zero overdue.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| company_code | string | Yes | Company Code | BUKRS/RBUKRS depending view |
| fiscal_year | string | Yes | Fiscal Year | GJAHR/MJAHR depending report |
| fi_document | string | Yes | Accounting Document | BELNR |
| fi_document_item | string | Yes | Line Item | BUZEI |
| customer | string | Yes | Customer | KUNNR |
| posting_date | date | Yes | Posting Date | BUDAT |
| document_date | date | Yes | Document Date | BLDAT |
| document_type | string | Yes | Document Type | BLART |
| amount_lc | decimal(24,6) | Yes | Amount in Local Currency | DMBTR/HSL depending view |
| local_currency | string | Yes | Local Currency | WAERS/RHCUR depending view |
| amount_tc | decimal(24,6) | Yes | Amount in Document Currency | WRBTR/WSL depending view |
| transaction_currency | string | Yes | TBD: cần field catalog | TBD |
| debit_credit_indicator | string | Yes | Debit/Credit Indicator | SHKZG/DRCRK depending view |
| baseline_date | date | Yes | Baseline Payment Date | ZFBDT |
| payment_terms | string | Yes | Terms of Payment | ZTERM |
| special_gl_indicator | string | Yes | Special G/L Indicator | UMSKZ |
| due_date | date | Conditional/optional | TBD: cần field catalog | TBD |
| clearing_document | string | Conditional/optional | Clearing Document | AUGBL |
| clearing_date | date | Conditional/optional | Clearing Date | AUGDT |
| assignment | string | Conditional/optional | Assignment | ZUONR |
| reference | string | Conditional/optional | Reference | XBLNR |
| gl_account | string | Conditional/optional | G/L Account | HKONT/RACCT depending view |
| payment_block | string | Conditional/optional | TBD: cần field catalog | TBD |
| purchase_order | string | Conditional/optional | Purchasing Document | EBELN |
| purchase_order_item | string | Conditional/optional | Item | EBELP |
| billing_document | string | Conditional/optional | Billing Document | VBELN |

## D16 — General Ledger Line Items

- **Module:** FI
- **Transaction:** FAGLL03H
- **Fiori / applicability:** F2217
- **Business purpose:** Settlement/partner/inventory controls ↔ GL and trial balance on matched scope
- **Grain:** 1 general-ledger-view journal line per ledger (not FI entry-view BUZEI)
- **Primary key:** source_system; client; ledger; company_code; fiscal_year; fi_document; gl_document_line
- **Selection criteria:** ledger/company/GL range; posting date or open/cleared/key date status; currency view and fiscal year/period; full scoped population including adjustment/settlement documents
- **Approved-target variant:** SAVA_D16_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily + period close freeze
- **Cleaning:** Preserve ledger-view identity and entry-view bridge separately; Net debit positive/credit negative only after source sign check; Do not add document/local/global currency measures together
- **Validation / DQ:** Ledger+company+year+doc+line unique; Dr=Cr only when complete balanced document population selected; filtered account exports not necessarily balanced; Scope/totals tie to source GL; Posting period not inferred solely from calendar month
- **Joins / cardinality:** SUP01 to GL via explicit document/reference/receiver allocation; D14/D15 FI entry→ledger bridge; D07 CO→FI bridge where available
- **Reconciliation target:** Settlement/partner/inventory controls ↔ GL and trial balance on matched scope
- **KPI / management outputs:** cost/revenue/working-capital facts; GL exception drill
- **ECC ↔ S/4HANA/Fiori notes:** FAGLL03H/F2217 GL view differs from F2218 entry view; ACDOCA DOCLN/BELNR etc are technical hints pending export verification. Ledger filters and extension ledgers need explicit profile.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| ledger | string | Yes | Ledger | RLDNR |
| company_code | string | Yes | Company Code | BUKRS/RBUKRS depending view |
| fiscal_year | string | Yes | Fiscal Year | GJAHR/MJAHR depending report |
| fi_document | string | Yes | Accounting Document | BELNR |
| gl_document_line | string | Yes | Ledger Line Item | DOCLN in ACDOCA; verify view |
| fiscal_period | string | Yes | TBD: cần field catalog | TBD |
| posting_date | date | Yes | Posting Date | BUDAT |
| gl_account | string | Yes | G/L Account | HKONT/RACCT depending view |
| debit_credit_indicator | string | Yes | Debit/Credit Indicator | SHKZG/DRCRK depending view |
| amount_lc | decimal(24,6) | Yes | Amount in Local Currency | DMBTR/HSL depending view |
| local_currency | string | Yes | Local Currency | WAERS/RHCUR depending view |
| document_date | date | Conditional/optional | Document Date | BLDAT |
| document_type | string | Conditional/optional | Document Type | BLART |
| amount_tc | decimal(24,6) | Conditional/optional | Amount in Document Currency | WRBTR/WSL depending view |
| transaction_currency | string | Conditional/optional | TBD: cần field catalog | TBD |
| global_amount | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| global_currency | string | Conditional/optional | TBD: cần field catalog | TBD |
| production_order | string | Conditional/optional | Order | AUFNR |
| cost_center | string | Conditional/optional | Cost Center | KOSTL |
| profit_center | string | Conditional/optional | Profit Center | PRCTR |
| material | string | Conditional/optional | Material | MATNR |
| plant | string | Conditional/optional | Plant | WERKS |
| vendor | string | Conditional/optional | Supplier/Vendor | LIFNR |
| customer | string | Conditional/optional | Customer | KUNNR |
| reference_document | string | Conditional/optional | TBD: cần field catalog | TBD |
| reference_year | string | Conditional/optional | TBD: cần field catalog | TBD |
| reference_item | string | Conditional/optional | TBD: cần field catalog | TBD |
| business_transaction | string | Conditional/optional | Business Transaction | VRGNG/view-specific |
| entry_view_item | string | Conditional/optional | Entry View Item | BUZEI |

## D17 — Billing Document Items

- **Module:** SD
- **Transaction:** VF05
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Net billing + tax/adjustment bridge ↔ AR accounting documents and revenue GL
- **Grain:** 1 billing document item in verified item layout; header-only variant requires separate grain
- **Primary key:** source_system; client; billing_document; billing_item
- **Selection criteria:** billing date/type/sales org/payer; include cancellations/credit memos and accounting status; item-level variant selection
- **Approved-target variant:** SAVA_D17_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily + close
- **Cleaning:** Normalize billing/cancellation sign by category, not only positive displayed amount; Net/tax/gross separate; no sum repeated header tax per item
- **Validation / DQ:** Doc/item unique; Cancellation pair and billing status; Accounting reference completeness for FI bridge; Currency and unit preservation
- **Joins / cardinality:** D15 via billing→FI document bridge, not billing number=FI number; D16 accounting bridge aggregation including tax/FX/rounding
- **Reconciliation target:** Net billing + tax/adjustment bridge ↔ AR accounting documents and revenue GL
- **KPI / management outputs:** net sales; credit/cancel ratio; billing-to-cash exceptions
- **ECC ↔ S/4HANA/Fiori notes:** VF05 header/item layouts differ; confirmed profile required. Billing cancellation and FI reversal are related but distinct events.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| billing_document | string | Yes | Billing Document | VBELN |
| billing_item | string | Yes | Billing Item | POSNR |
| billing_type | string | Yes | Billing Type | FKART |
| billing_date | date | Yes | Billing Date | FKDAT |
| sales_org | string | Yes | Sales Organization | VKORG |
| payer | string | Yes | Payer | KUNRG |
| material | string | Yes | Material | MATNR |
| billed_quantity | decimal(24,6) | Yes | Billed Quantity | FKIMG |
| billing_uom | string | Yes | Sales Unit | VRKME |
| net_value | decimal(24,6) | Yes | Net Value | NETWR |
| document_currency | string | Yes | TBD: cần field catalog | TBD |
| cancellation_flag | boolean | Yes | TBD: cần field catalog | TBD |
| sold_to | string | Conditional/optional | TBD: cần field catalog | TBD |
| plant | string | Conditional/optional | Plant | WERKS |
| tax_amount | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| reference_document | string | Conditional/optional | TBD: cần field catalog | TBD |
| sales_order | string | Conditional/optional | Sales Order | KDAUF/VBELN depending view |
| sales_order_item | string | Conditional/optional | Sales Order Item | KDPOS/POSNR depending view |
| fi_document | string | Conditional/optional | Accounting Document | BELNR |
| company_code | string | Conditional/optional | Company Code | BUKRS/RBUKRS depending view |
| fiscal_year | string | Conditional/optional | Fiscal Year | GJAHR/MJAHR depending report |
| cancelled_document | string | Conditional/optional | TBD: cần field catalog | TBD |

## D18 — GR/IR Reconciliation Detail

- **Module:** MM/FI
- **Transaction:** GR/IR approved detail export
- **Fiori / applicability:** F3303 (monitor; detail equivalence unverified)
- **Business purpose:** GR/IR balances ↔ receipt/invoice history and clearing GL including MR11 adjustments
- **Grain:** proposed PO-item/currency/key-date balance; if F3303 only aggregate, separate aggregate profile required
- **Primary key:** source_system; client; company_code; purchase_order; purchase_order_item; currency_type; currency
- **Selection criteria:** company/clearing account/PO scope; key date, currency/valuation and status; source detail vs F3303 aggregate explicitly declared
- **Approved-target variant:** SAVA_D18_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Daily + close
- **Cleaning:** Keep receipt/invoice signs and adjustment classes; PO history detail maintained as support dataset, never expand summary into imaginary items
- **Validation / DQ:** Unique selected balance grain; gr-ir-adjustments bridge; Scope completeness and source-level totals; Need source aging date for aging KPI; no synthetic date
- **Joins / cardinality:** D13 PO/item; D01 receipt events plus invoice/PO-history support; D16 GRIR-account balance via matching company/currency/cutoff
- **Reconciliation target:** GR/IR balances ↔ receipt/invoice history and clearing GL including MR11 adjustments
- **KPI / management outputs:** unmatched GR/IR; aging exceptions; close remediation
- **ECC ↔ S/4HANA/Fiori notes:** F3303 is Monitor GR/IR Account Reconciliation, not guaranteed source of the proposed detail grain. Must obtain approved detail export or mark detail control blocked; 3388 demo account is not universal SAP account.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| company_code | string | Yes | Company Code | BUKRS/RBUKRS depending view |
| purchase_order | string | Yes | Purchasing Document | EBELN |
| purchase_order_item | string | Yes | Item | EBELP |
| currency_type | string | Yes | TBD: cần field catalog | TBD |
| currency | string | Yes | TBD: cần field catalog | TBD |
| gr_value | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| ir_value | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| grir_balance | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| material | string | Conditional/optional | Material | MATNR |
| plant | string | Conditional/optional | Plant | WERKS |
| vendor | string | Conditional/optional | Supplier/Vendor | LIFNR |
| gr_quantity | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| ir_quantity | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |
| base_uom | string | Conditional/optional | Base Unit of Measure | MEINS |
| gl_account | string | Conditional/optional | G/L Account | HKONT/RACCT depending view |
| status | string | Conditional/optional | TBD: cần field catalog | TBD |
| aging_date | date | Conditional/optional | TBD: cần field catalog | TBD |
| assignment | string | Conditional/optional | Assignment | ZUONR |

## D19 — Stock Value Balance

- **Module:** MM/FI
- **Transaction:** MB5L
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Inventory valuation ↔ GL balances with documented excluded categories
- **Grain:** 1 material/valuation area/type/valuation class/account/currency stock-value snapshot at selected period
- **Primary key:** source_system; client; material; valuation_area; valuation_type; valuation_class; gl_account; currency_type; currency
- **Selection criteria:** valuation area/company/material/class/account; current/previous period as supported by actual report, exact scope saved; currency and included stock categories
- **Approved-target variant:** SAVA_D19_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Period close + controlled snapshot
- **Cleaning:** Material-detail and account-summary rows typed separately; Do not add repeated gl_balance on each material; Nonvaluated/special stock scope explicit
- **Validation / DQ:** Key for selected detail layout; Material valuation totals ↔ GL account totals after stock/category/cutoff bridge; No arbitrary historical key-date claim if source cannot produce it
- **Joins / cardinality:** D11 valuation area/material/type/period/currency view; D16 matching stock GL account snapshot incl opening balances
- **Reconciliation target:** Inventory valuation ↔ GL balances with documented excluded categories
- **KPI / management outputs:** inventory value; stock-to-GL differences; DIO with valid COGS basis
- **ECC ↔ S/4HANA/Fiori notes:** MB5L layout/date support must be confirmed in target system; do not use period-only GL movements as ending balance. Proposed detail schema pending sample approval.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| material | string | Yes | Material | MATNR |
| valuation_area | string | Yes | Valuation Area | BWKEY |
| valuation_type | string | Yes | Valuation Type | BWTAR |
| valuation_class | string | Yes | Valuation Class | BKLAS |
| gl_account | string | Yes | G/L Account | HKONT/RACCT depending view |
| currency_type | string | Yes | TBD: cần field catalog | TBD |
| currency | string | Yes | TBD: cần field catalog | TBD |
| stock_quantity | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| base_uom | string | Yes | Base Unit of Measure | MEINS |
| stock_value | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| company_code | string | Conditional/optional | Company Code | BUKRS/RBUKRS depending view |
| price_control | string | Conditional/optional | Price Control | VPRSV |
| price_unit | decimal(24,6) | Conditional/optional | Price Unit | PEINH |
| standard_price | decimal(24,6) | Conditional/optional | Standard Price | STPRS |
| moving_average_price | decimal(24,6) | Conditional/optional | Moving Average Price | VERPR |
| gl_balance | decimal(24,6) | Conditional/optional | TBD: cần field catalog | TBD |

## SUP01 — Settlement Evidence / Document Bridge

- **Module:** CO/FI
- **Transaction:** Approved settlement result and document detail
- **Fiori / applicability:** Chưa xác nhận app thay thế; không invent Fiori ID
- **Business purpose:** Trace KKS1 eligible variance through settlement to actual accounting lines
- **Grain:** 1 settlement run/sender/receiver-allocation/source-result line to accounting line link
- **Primary key:** source_system; client; settlement_run_id; sender_object; receiver_object; allocation_line; ledger; company_code; fiscal_year; fi_document; gl_document_line
- **Selection criteria:** same order population/year/period as D08; settlement receiver/type and run/reversal scope; ledger/currency
- **Approved-target variant:** SAVA_SUP01_V1 (PENDING_SME_APPROVAL)
- **Frequency:** Each settlement / close
- **Cleaning:** Keep production-order and sales-order settlement policies distinct; Allocated bridge amount, not full amount repeated for every GL link
- **Validation / DQ:** Allocation totals conserve source settlement; Reference coverage and GL posting existence; Reversal/repeated run handled with unique run identity
- **Joins / cardinality:** D08 via eligible order/period/version variance; D16 exact ledger/company/year/document/line; D02 sender mapping
- **Reconciliation target:** Trace KKS1 eligible variance through settlement to actual accounting lines
- **KPI / management outputs:** settled/unsettled variance; posting traceability
- **ECC ↔ S/4HANA/Fiori notes:** Supplemental dependency added for P0 correctness. Actual export/trans code depends cost object/process; production order settlement often KO88/CO88, sales order VA88 needs SME confirmation. No assumption that KKS1 directly posts GL.

| Canonical field | Type | Required | Original label candidate | Technical hint (chưa duyệt) |
|---|---|---|---|---|
| settlement_run_id | string | Yes | TBD: cần field catalog | TBD |
| sender_object | string | Yes | TBD: cần field catalog | TBD |
| receiver_object | string | Yes | TBD: cần field catalog | TBD |
| allocation_line | string | Yes | TBD: cần field catalog | TBD |
| settlement_type | string | Yes | TBD: cần field catalog | TBD |
| fiscal_year | string | Yes | Fiscal Year | GJAHR/MJAHR depending report |
| fiscal_period | string | Yes | TBD: cần field catalog | TBD |
| ledger | string | Yes | Ledger | RLDNR |
| company_code | string | Yes | Company Code | BUKRS/RBUKRS depending view |
| fi_document | string | Yes | Accounting Document | BELNR |
| gl_document_line | string | Yes | Ledger Line Item | DOCLN in ACDOCA; verify view |
| settlement_amount | decimal(24,6) | Yes | TBD: cần field catalog | TBD |
| currency | string | Yes | TBD: cần field catalog | TBD |
| production_order | string | Conditional/optional | Order | AUFNR |
| sales_order | string | Conditional/optional | Sales Order | KDAUF/VBELN depending view |
| sales_order_item | string | Conditional/optional | Sales Order Item | KDPOS/POSNR depending view |
| source_variance_version | string | Conditional/optional | TBD: cần field catalog | TBD |
| reversal_document | string | Conditional/optional | TBD: cần field catalog | TBD |
| business_transaction | string | Conditional/optional | Business Transaction | VRGNG/view-specific |

## ZFIR009A — ZFIR009A custom report

Schema/grain/key/business purpose chưa có nguồn; không tự suy luận. Cần: functional purpose, selection screenshot, original export, field catalog, grain and key, control totals, standard counterpart, owner and approvals.

## ZFIR159 — ZFIR159 custom report

Schema/grain/key/business purpose chưa có nguồn; không tự suy luận. Cần: functional purpose, selection screenshot, original export, field catalog, grain and key, control totals, standard counterpart, owner and approvals.
