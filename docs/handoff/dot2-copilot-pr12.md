# Handoff — Đợt 2 (phần làm được) + Copilot PR-1/PR-2 — 22/10/2026

Nhánh: `feat/copilot-pr1` (gốc `main` @ 8c77967). **Chưa merge, chưa đụng `main`, site live không đổi.**

## Trạng thái Đợt 1 (master plan) — CHƯA XONG
| Mục | Trạng thái | Bằng chứng |
|---|---|---|
| Đ1.1 Bảng TK TT99 đối chiếu PDF | Chưa | Cổng TT99 chưa qua (PDF Công báo thiếu Phụ lục II/IV — TT99_GATE_REPORT); repo chưa có `accounts.tt99.json` |
| Đ1.2 Tỷ trọng 4 khoản tiền máy | Chưa | SXC_QuyetDinh_2026-10-10: tạm 55/20/15/10, "chưa chốt" |
| Đ1.3 Control C02/C04/C05/C07 | Chưa ký | s4: C02/C05 vẫn `BLOCKED_*` chờ SME |
| Đ1.4 Golden G01/G02/G04/G07/G08 | Chưa điền | GoldenSet_Mau_2026-10-10: bảng trống |
| Đ1.5 Thẻ GR/IR | Chưa duyệt | — |

⇒ Đợt 2 mục 2.1, 2.2, 2.4 **bị chặn**. 2.3 (thẻ bài học) cần Đ1.5 + bản preview anh duyệt trước khi vào repo → chưa làm. Làm được: Copilot PR-1/PR-2 + 2.5 (lint file đã đụng).

## Đã làm (commit trên nhánh)
- **PR-1** `src/features/stepGate.ts`: `evaluateStepGate` thuần (khóa kỳ → MDG → SoD), giữ nguyên văn thông báo. `App.runStep` trả `StepResult {ok, stepId, kind?, reason?}`; `presentStepResult` hiển thị Classic y cũ; `executeStepInternal = presentStepResult(runStep())`. Copilot (PR-3) sẽ gọi `runStep` trực tiếp.
- **PR-2** flag `m6Copilot` = false (flag cũ giữ nguyên); `AuditEvent` thêm `channel/prompt/parsedIntent/confirmedBy` (tùy chọn), audit Classic gắn `channel:'classic'`; `src/ledger/journalRepository.ts` (`JournalRepository`, `InMemoryJournalRepository`, `buildAcdocaTable`); `ACDOCA_TABLE` dựng qua repository. Chưa đổi schema dòng sổ (gộp với FullStack P2).
- **Test** `npm run test:copilot-pr12` (đã thêm vào CI): 448 ca cổng so với khối code cũ chép nguyên văn từ main; 54 ca A0 → 1.332 dòng sổ + 594 hash báo cáo khớp giữa có/không repository; chốt cấu trúc App (thứ tự cổng→audit→QM, kênh hiển thị, thứ tự ACDOCA_TABLE). Không có nhánh dữ liệu giả.

## Bằng chứng
- Baseline main: 15/15 cổng xanh. Sau thay đổi: lint, eslint strict, parity, s1–s6, a0, reports, health, security, costing, ui-finance, copilot-pr12, build — **tất cả exit 0**. ESLint các file đã đụng: 0 lỗi (App.tsx 0 trước và sau).
- Cấy lỗi: 7/7 bị test bắt (đổi chữ MDG, bỏ khóa kỳ, bật Copilot mặc định, repo rơi dòng extra, alert khi QM chờ, audit sau QM, App rơi extra).
- Reviewer agent độc lập (không build): PASS, không đổi hành vi; 3 lỗ phủ nó tìm ra đã vá ở commit sau.
- Chưa kiểm: chạy UI Classic trên trình duyệt (nên xem Deploy Preview của PR).

## Việc mở
1. Mr Quân: hoàn thành Đợt 1 (mục trên) — điều kiện mở 2.1/2.2/2.4.
2. Mr Quân: xem Deploy Preview, quyết merge PR này (không đổi hành vi, flag tắt).
3. Kế tiếp: PR-3 (tool registry 5 tool + thẻ xác nhận, chưa LLM) trên nhánh mới từ nhánh này.
4. Ghi chú đặt tên: `m6Copilot` trùng tiền tố số với `m6MaterialLedger` — giữ đúng tên plan; đổi tên (vd. `copilot`) chỉ khi anh muốn, trước khi flag lên UI.
