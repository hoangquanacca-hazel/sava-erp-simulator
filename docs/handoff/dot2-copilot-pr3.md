# Handoff — Copilot PR-3 (tool registry + thẻ xác nhận, chưa LLM) — 22/10/2026

Nhánh: `feat/copilot-pr3` (gốc `feat/copilot-pr1` @ c0bad07; PR #33 vẫn draft). **Draft PR #34, chưa merge.** `main` và site live không đổi. Flag `m6Copilot` mặc định TẮT.

## Đã làm
- `src/features/stepRun.ts` — `planStepRun` (thuần): lõi chạy bước tách từ `App.runStep`. Classic và Copilot dùng chung một đường ghi sổ. Parity Classic: 50.176 tổ hợp khớp bản cũ (oracle ngoài repo, `PARITY OK`).
- `src/copilot/registry.ts` — 5 tool: `run_mto_step` (ghi sổ, cần xác nhận), `navigate`, `check_close_readiness`, `explain_variance`, `ask_knowledge` (chỉ đọc). Schema kiểm tay; `allowedRoles` trước precheck; SoD và cổng engine áp ở precheck; thẻ dùng một lần; xác nhận kiểm lại vai trò và cổng; không chạy lại bước đã chạy.
- `src/components/CopilotConfirmCard.tsx` — chỉ hiển thị, chưa mount (PR-5).
- `scripts/copilot-pr3.ts` — `test:copilot-pr3`, 36 ca, engine thật, không fallback.

## Bằng chứng
- 13 gate CI đều exit 0 (lint, eslint strict, parity, s1–s6, a0, reports, health, security, costing, copilot-pr12, build, verify-reporting, expansion-150, priority-24, test:start, ui-finance).
- ESLint mặc định: 280 lỗi = base (không thêm lỗi).
- Cấy lỗi: 9/9 bị test bắt (bỏ requiresConfirmation; bỏ allowedRoles; bỏ kiểm confirmer; thẻ dùng lại; bỏ cổng engine; bỏ tái kiểm lúc xác nhận; chạy lại bước; schema lọt prototype; QM nhảy bước).
- Reviewer độc lập (agent, không thấy quá trình build): phát hiện 1 lỗ ghi trùng (chạy lại bước) và 2 lỗi cấy lọt — đã sửa cả ba trong commit `0056220`.

## Phát hiện mở
- Lead-registration gate (`App.handleExecuteStep`, bước ≥3 khi chưa đăng ký) chưa có trong Copilot. Copilot chỉ kiểm qua `ctx.registrationBlock`. **Phải truyền đúng từ App khi mount ở PR-5**, nếu không Copilot bỏ qua cổng lead.
- Thứ tự audit trong `planStepRun` trước khi lỗi `generateStepEntries` ném: chưa có ca test; mức thấp.

## Chưa kiểm
- Giao diện Classic trên trình duyệt (xem Deploy Preview của PR #34).
- Đợt 1 master plan vẫn chặn mục 2.1 / 2.2 / 2.4 (xem `dot2-copilot-pr12.md`).

## Việc kế (PR-4)
- Netlify Function `/api/copilot` gọi Claude tool use, `ANTHROPIC_API_KEY` chỉ ở server; giới hạn lượt mỗi phiên; không fallback tự sinh câu trả lời. Cần Mr Quân đặt key trên Netlify (chỉ Deploy Preview).
- Trước PR-4: quyết định cách xử lý `already_executed` (hiện là chặn cứng, như Classic).
