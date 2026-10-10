# Independent final S3 UI retest

Target: http://127.0.0.1:3017/ · 2026-10-08 · parent-supplied commit cbfa51a. Browser-only QA, independent of implementation.

One Canon financial case plus Samsung UI checks; not 54-case or business/legal acceptance.

- **PASS** Samsung editor/material canonical match: One fallback material row, 621 8302500; canonical tree 621 8302500; root 48780088
- **PASS** Samsung tree percentages: 100.0%,17.0%,29.4%,53.5% in canonical tree; summary cards show 17% without .0
- **PASS** Samsung navigate B3 after execute B1+B2: Đã tạo nhu cầu MRP (PR/PO), Đã dự trù theo MRP (MD02); not already issued
- **PASS** Canon recognized financial collector: {"revenue":115000000,"cogs":25614019,"grossProfit":89385981}
- **PASS** Canon margin cross-panel: 89385981 ✓ khớp; no ✗ lệch
- **PASS** Canon billing and partial settlement: VF01 narrative 1.000 cái; settled 25.614.019; WIP154 25.614.019
- **PASS** Canon negative variance dashboard: -929006, -3.6%; percentages 32.3+24.6+46.7-3.6=100.0
- **PASS** Eleven report generation: FAGLL03 22; MB51 3; COOIS_HEADER 1; COMPONENTS 1; OPERATIONS 1; CONFIRMATIONS 1; GOODS_MOVEMENTS 3; KOB1 3; KKS1 1; CK13N 4; SUP01 1
- **PASS** DataLab: 11/11 Đạt; CLEAN preview numeric amount_lc 15974369/-15974369/12159000, preserves line_item 000001, RAW hash/line lineage
- **PASS** Parameter invalidation: Price 115000→115001 removes all RAW and CLEAN controls/Data Lab; restored 115000
- **UNVERIFIED** Downloads: Skipped as requested because previously unsupported download protocol
- **NOTRUN** 54-case and independent business acceptance: ""

Webinar mode initial OFF → enabled for local test → restored OFF verified. Leads remain 0. Canon price restored 115000.

## Observations requiring follow-up

- Commit identity supplied by parent; browser proof covers served UI only.
- Nonvaluated Margin Analysis presents entire 25,614,019 COGS as Variance VA88 and zero standard cost accounts; equality is proven, semantic correctness is not accepted.
- Partial case stock TP panel displays 0 cái after PGI despite 1000/2000 delivery; outside requested gate, requires review before business acceptance.
- Old posted ledger remains after price change while report artifacts invalidate; no rerun performed for altered price.

Evidence: qa-results.json contains UI snapshots; datalab-clean.jpg and webinar-restored-off.jpg.
