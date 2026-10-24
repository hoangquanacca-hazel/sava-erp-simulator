# Đóng dự án Copilot — trạng thái cuối (24/10/2026)

## Đã merge vào main (đang ở flag tắt)
- PR #33 (PR-1/2), PR #34 (PR-3), PR #35 (PR-5). Site live khớp build bc9dade+; `m6Copilot` mặc định tắt.

## Đang mở
- PR #36 (PR-4), draft, nhánh `feat/copilot-pr4` (HEAD daddbed). **Chưa merge.**
  - Golden Tầng B: Sonnet 5.5 = 57/63 (90,5%). Ngưỡng 95% chưa đạt.
  - Chờ anh duyệt: sửa 5 nhãn mâu thuẫn/mơ hồ + quy tắc prompt "run_mto_step cần stepId" (chi tiết trong docs/golden/last-run.json).
  - Không có thay đổi nhãn nào được thực hiện.

## Việc cần làm khi đóng
- [ ] Netlify: đặt `COPILOT_ENABLED` về tắt (hoặc xóa) ở scope Deploy Previews để chặn chi phí model trên URL preview công khai.
- [ ] Quyết định PR #36: đóng (close) hoặc giữ draft.
- [ ] Khi bật lại trong tương lai: production vẫn để tắt; xem hạn mức `COPILOT_DAILY_CAP`.

## Lưu ý phối hợp
- Codex làm các nhánh `codex/sap-*` (SAP library), không chạm nhánh Copilot. Không có xung đột file.
