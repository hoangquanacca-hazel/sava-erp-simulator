# Handoff — Copilot PR-5 (panel, chưa LLM) — 23/10/2026

Nhánh `feat/copilot-pr5` (từ `main` @ bc9dade). **Draft PR #35, chưa merge.** Flag `m6Copilot` mặc định TẮT.

## Đã làm
- `src/components/CopilotPanel.tsx`: panel nút công cụ (chạy bước, mở màn hình, kiểm tra đóng kỳ, giải thích chênh lệch, hỏi AI Tutor). Thao tác ghi sổ đi qua thẻ xác nhận. Không có chat tự do.
- `App.tsx`: nút Sava Copilot và panel chỉ mount khi `flags.m6Copilot`. Cổng lead cho bước ≥3 và AI Tutor theo đúng luồng Classic.
- `scripts/copilot-pr5.tsx` (`test:copilot-pr5`): render thật bằng react-dom/server. Cấy 2 lỗi (gating flag, ngưỡng lead) đều bị bắt.

## Kiểm
- Gate: lint, copilot-pr3/pr5/pr12, parity, ui-finance, build đều pass. ESLint 280 = base.
- Deploy Preview `deploy-preview-35--sava-erp-simulator.netlify.app` (bundle index-DEse94i9.js), trình duyệt thật:
  - Flag tắt: không có nút Copilot, không lỗi trang.
  - Flag bật (localStorage): panel mở; kiểm đóng kỳ trả JSON; "Đề xuất chạy" bước 1 hiện thẻ; Hủy không ghi sổ; Xác nhận → "Đã chạy bước 1.", không lỗi trang.

## Việc mở
- Merge PR #35: chờ quyết định của Mr Quân.
- PR-4 (LLM): cần `ANTHROPIC_API_KEY` đặt trên Netlify, scope Deploy Previews. Không dán key vào chat.
- PR-6 golden set: chờ duyệt danh sách prompt.
- Đợt 1 master plan: vẫn chặn Đợt 2 mục 2.1/2.2/2.4.
