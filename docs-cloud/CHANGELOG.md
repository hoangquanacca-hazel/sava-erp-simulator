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

## Session 2 — nhánh `cloud/s2-ci-ui` (gốc `cloud/s1-reports-security`)
- Quyết định chủ dự án: giữ diễn giải SUP01 (AUD-015) — ghi trên nhánh S1.
- S2-1 CI `.github/workflows/ci.yml`: npm ci → tsc → ESLint (strict chặn / toàn repo báo cáo) → parity, s1, health, s2, a0, s3 → build → quét chuỗi dạng khóa trong mã + bundle.
- S2-2 ESLint: `eslint.config.js`, `lint:eslint`, `lint:eslint:strict`; devDeps @eslint/js, eslint, eslint-plugin-react-hooks, globals, typescript-eslint. Nợ tồn đọng: AUD-018.
- S2-3 UI: `src/reports/registry.ts` (`buildAllReports`, `REPORT_IDS`) dùng chung cho UI và `test:s3`; trang mới `src/pages/ReportsPage.tsx` (#/reports, cờ `m9Reports`): 11 tab, xem trước, SHA-256, tải .txt + manifest.json. Sửa nhỏ: `hashRoute.ts`, `flags.ts`, `ModuleNav.tsx`, `App.tsx` (thêm route).
- `test:s3` bổ sung 48 trạng thái giao diện (bảng dở dang bước 1..k, CKMLCP) + kiểm danh mục = registry.
- Không đổi số học (`calculator.ts`, `acdoca.ts`, `materialLedger.ts`), không đổi `a0_expected.json`, không xóa file.
- Ghi chú kỹ thuật: `package.json` dùng CRLF lẫn LF — sửa bằng tay để giữ nguyên; `package-lock.json` được giữ LF như gốc.

## Session 3 — nhánh `cloud/s3-hygiene` (gốc `feat/sim-p0-mfg` @cc527f2)
- Bước 0: PR mở duy nhất là #3; #4, #5, #8 đã merge vào `feat` trước phiên; không có nhánh `cloud/s3-*` khác → không trùng việc.
- T0: #4 kiểm lại `npm start` + `/api/health` OK (AUD-032). #5 quét lại TT200: sửa 5 chuỗi giao diện còn sót (AUD-031). #3: chuyển phát hiện vào sổ (AUD-033…036), comment trỏ sang #6.
- T1: bảng ánh xạ số AUD trong `AUDITOR.md`; mục mới từ AUD-030.
- T3: rà phụ phí màu/texture (AUD-037), phát hiện thêm AUD-038. Chỉ báo cáo.
- T4: `SAPClassicMenu.tsx` đưa `return null` xuống sau hook; bỏ 108 import thừa (18 file, script cơ học chỉ xoá specifier trong câu `import`); `prefer-const` ×4 (`App.tsx`, `scripts/a0-expected.ts`). ESLint toàn repo **158 → 42 lỗi**, `rules-of-hooks` 4 → 0. Kiểm trình duyệt (Playwright, build production): Fiori → Classic (mở cây Easy Access) → Fiori × 3 vòng, 0 lỗi React.
- T5: bỏ theo Q2 = (a); ghi quyết định vào AUD-020.
- Không đổi `calculator.ts`, `acdoca.ts`, `materialLedger.ts`, `a0_expected.json`; không xóa file.
