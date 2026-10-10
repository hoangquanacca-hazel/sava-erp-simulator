# PR-4 — Đo ESLint trên nhánh Codex (đo trước, chưa sửa gì)

Nhánh `cloud/pr4-eslint` (gốc `cloud/s1-report-completion`, đã có #18). Cấu hình `eslint.config.js` và phiên bản (`eslint` 9.39.5, `typescript-eslint` 8.71.1, `eslint-plugin-react-hooks` 5.2.0, `globals` 15.15.0, `@eslint/js` 9.39.5) lấy từ `origin/feat/sim-p0-mfg`; `globals` thêm vì `eslint.config.js` import nó.
Lệnh: `npx eslint . -f json` (= `npm run lint:eslint`), exit 1.

## Số liệu theo thư mục (toàn repo: **263 lỗi, 1 cảnh báo**)

| Thư mục | Lỗi | Cảnh báo | File | Ghi chú |
|---|---:|---:|---:|---|
| src/reports | 0 | 0 | 0 | sạch |
| src/events | 0 | 0 | 0 | sạch |
| src/adapters | 1 | 0 | 1 | `framework.ts:34` prefer-const (`rows`) |
| src/controls | 0 | 0 | 0 | sạch |
| src/mart | 1 | 0 | 1 | `manufacturing.ts:1` no-unused-vars (`CleanDataset`) |
| src/pages | 0 | 0 | 0 | sạch |
| scripts | 51 | 0 | 11 | no-explicit-any 39, no-undef 9 (`.mjs`), prefer-const 1, no-unused-vars 1, no-unused-expressions 1 |
| còn lại | 210 | 1 | 28 | src/components 118, docs-cloud 49 (probe/retest…), src/utils 17, src/App.tsx 11, netlify 7, src/evidence 6, server.ts 2; gồm 4 `rules-of-hooks` |

## Danh sách strict (chặn)

- Giữ từ feat những mục **còn tồn tại** ở nhánh này: `src/reports`, `src/events`, `eslint.config.js`.
- **Bỏ khỏi danh sách** vì file không có ở nhánh này (ESLint báo "no files matching"): `src/pages/ReportsPage.tsx`, `scripts/s3-reports.ts`, `scripts/s1-health.ts` (là file của nhánh feat).
- **Thêm** `src/controls` (0 lỗi).
- **KHÔNG thêm** `src/adapters` (1 lỗi, prefer-const) và `src/mart` (1 lỗi, no-unused-vars): không sạch, và hai file này nằm ngoài danh sách strict nên PR này không sửa (quy tắc: chỉ sửa file đã thuộc strict). Sửa từng lỗi là một dòng; đề xuất đưa vào strict ở PR sau cùng với sửa lỗi.
- Ứng viên sạch ở `scripts/` có thể thêm sau (chưa thêm): `s2-report-pack.ts`, `s3-adapters.ts`, `health-security.ts`.

Kết quả: trong danh sách strict không có lỗi nào nên PR này **không sửa dòng mã nào**.
