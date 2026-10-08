# CHANGELOG — Cloud Session 1 (nhánh `cloud/s1-reports`, gốc `feat/sim-p0-mfg` @10c6906)

## Số học vùng bảo vệ
- `src/utils/calculator.ts`, `src/utils/acdoca.ts`, `src/features/materialLedger.ts`: **KHÔNG thay đổi**.
- `scripts/a0_expected.json`, `scripts/a0_oracle.py`: **KHÔNG thay đổi**.

## Thay đổi
- T1 `netlify/functions/health.mts`: bỏ `keyLen`, `keyPrefix`, `looksValid`; chỉ trả `hasApiKey` (AUD-013).
- T2 mới `src/reports/`: `util.ts`, `mb51.ts`, `coois.ts` (5 danh sách), `kob1.ts`, `kks1.ts`, `ck13n.ts`, `sup01.ts`.
- T2 mới `scripts/`: `s3-lib.ts`, `s3-mb51.ts`, `s3-coois.ts`, `s3-kob1.ts`, `s3-kks1.ts`, `s3-ck13n.ts`, `s3-sup01.ts`.
- `package.json`: thêm `test:s3`.
- T3 mới `docs-cloud/GIAODICH_TT99.md`, `docs-cloud/AUDITOR.md` (AUD-010, 013–022), file này.

## Kiểm chứng
- Test đột biến (cố tình làm sai mã báo cáo, rồi khôi phục): KOB1 tính cả CO01, MB51 bỏ 601, KKS1 bỏ ghi Có lệnh, COOIS đảo LAB/MOH, CK13N bỏ dòng phụ phí biến thể, SUP01 luôn ghi OK → cả 6 đều làm test thoát mã 1.
- Test âm tính SUP01 lần đầu phát hiện lỗ hổng: sửa CK13N không bị bắt khi hàng không định giá/giao 0% (giá kế hoạch không có bút toán FI) → thêm 2 dòng đối chiếu chéo CK13N ↔ KKS1 PLAN / COOIS PLAN_COST.
