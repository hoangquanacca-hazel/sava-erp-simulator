# CHANGELOG — cloud sessions

## Session 1 — nhánh `cloud/s1-reports-security` (gốc `feat/sim-p0-mfg`)
- **Không đổi số học**: `src/utils/calculator.ts`, `src/utils/acdoca.ts`, `src/features/materialLedger.ts` KHÔNG bị sửa. `scripts/a0_expected.json` KHÔNG bị sửa.
- T1 `netlify/functions/health.mts`: bỏ `keyLen`, `keyPrefix`, `looksValid`; chỉ trả `hasApiKey` (AUD-013). Thêm `scripts/s1-health.ts`, `npm run test:health`.
- T2 `src/reports/core.ts`: thêm (không sửa) `columnIndex`, `sumColumn`, `qty`.
- T2 mới `src/reports/logistics.ts`: MB51, COOIS Order Header / Components / Operations / Confirmations / Documented Goods Movements.
- T2 mới `src/reports/controlling.ts`: KOB1, KKS1, CK13N, SUP01 (AUD-014…016).
- T2 mới `scripts/s3-reports.ts`, `npm run test:s3`: 11 báo cáo (gồm FAGLL03) × 54 ca, đối soát ACDOCA + oracle, tất định, manifest, 594 test âm tính.
- T3 mới `docs-cloud/GIAODICH_TT99.md`.
- Sự cố trong phiên (đã sửa ở mã báo cáo, không ở đáp án): bản đầu KOB1/KKS1 chỉ lấy dòng Có 154 → sai 6 ca chênh lệch thuận lợi (Valuated, giao 100%/50%) (−3,5%) vì VA88 ghi Nợ 154. Test oracle phát hiện; sửa lọc thành "mọi dòng 154 ngoài CO01".
