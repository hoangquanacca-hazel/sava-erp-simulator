# Handoff cho agent / kỹ sư tiếp theo

1. Làm tại `D:\sava-erp-simulator`. Đọc README pack, baseline, decision log và backlog. Kiểm tra AGENTS.md, branch/HEAD/status mới; baseline hôm nay không bảo đảm repo vẫn sạch ngày mai.
2. Không tạo simulator/repo/project thay thế, không sửa/xóa synced `sources/`, không ghi đè artefact có ích, không reset Git. Source changes cần scoped diff và regression.
3. Bắt đầu P0-01/02: resolve missing history/export samples/owners. Nếu chỉ synthetic thì ghi rõ synthetic-only, không tự tick real-SAP validation.
4. Tách key/currency/period/selection trước viết joins. Không copy assumptions từ prompt cũ khi chưa có evidence. Không dùng `nz`/Excel defaults cho imported financial facts.
5. Contracts ở docs là draft. Production adoption qua reviewed change; không coi pending profiles là approved. Z-report descriptors intentionally blocked.
6. Với M07 cần settlement support, M08 cần costing identity/lot. Nếu source thiếu thì block control, không match theo số tiền gần nhau.
7. AI có thể draft adapters/test cases/UI; human SME/QA/reviewer chốt. Không nhận agent tự viết “audit passed” làm acceptance.
8. Sau mỗi ngày append journal: completed/evidence/decisions/open blockers/next step; không bịa thời gian hay milestone pass.
9. Nhắc chủ dự án kết nối **Obsidian** để lưu cuộc chat/chủ đề và link decision log; chưa biết vault nên không tự ghi sang vault khác.

Bộ tài liệu này không cấp quyền deploy/public sharing/SAP connection. Khi scope được user cho phép ở lượt tiếp theo, làm mọi phần chuẩn bị reviewable rồi xin các human gate thực sự cần.
