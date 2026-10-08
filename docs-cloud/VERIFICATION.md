# Bằng chứng kỹ thuật — 08/10/2026

Baseline: `28dc65561c9360c42d751348bcc9a4b1c4c9b6a5`. Nhánh `cloud/s1-report-completion`.
Node v24.14.0, Windows. `npm ci --ignore-scripts --no-audit --no-fund` cài263 packages từ lock. Không thay package-lock.

| Kiểm tra | Kết quả thật |
|---|---|
| Baseline T0 lint, parity, S1, S2, A0, build | tất cả exit0; build cảnh báo import.meta/CJS |
| Final lint | exit0 |
| Final parity, S1, S2, A0 | exit0; A0 54/54 oracle, CKMLCP36 ca và identity/events54 ca |
| Phase A reports | 54×11=594 reports;594 mutations bị từ chối; missing report bị từ chối; RAW hash và byte isolation; caller sửa trong lúc await không làm lẫn snapshot |
| Oracle độc lập | WIP154 và material value của report đối chiếu a0_expected.json; không sửa oracle |
| Negative CLI | `npm run test:reports -- --tamper` exit1, MB51 lệch1 VND; lỗi thực không chuyển thành PASS |
| Health | exit0: chỉ status/app/hasApiKey, có/không key; không gọi Gemini |
| Secret scan | exit0;136 working files và26 commits tại lần scan; không phát hiện regex khóa Gemini trong tracked/unignored files và lịch sử local refs. Không đọc ignored .env, không tuyên bố audit toàn bộ secret/provider |
| Build | exit0; ESM; vẫn cảnh báo JS chunk ~1.48MB (~439KB gzip) |
| Production startup | exit0; process con bind127.0.0.1, health/index/local JS HTTP200; đóng process sau test |
| Phạm vi Git | main vẫn926837af5edd922b7c4889ebacbb0bdec113098d; không xóa file; calculator/acdoca/materialLedger/oracle/netlify.toml không đổi |

Logs nguyên bản trong `evidence/`, máy đọc `evidence/test-results.json`. Snapshot hash các file thay đổi trong `evidence/changed-files.json`; không hash chính manifest.

## Các lỗi gặp và sửa trong phiên

- TypeScript báo kiểu unknown khi Object.values(stepStates): đổi sang index bước có kiểu.
- Scanner ban đầu coi `.env.example` là file môi trường thật: cho phép file mẫu, vẫn scan nội dung bằng regex và giữ cấm file môi trường thật tracked/unignored.
- Smoke ban đầu chọn script thương hiệu bên ngoài: đổi sang `/assets/*.js` của build. Không gọi host thương hiệu trong phép smoke đã đạt.
- Chuẩn hóa LF để hết lỗi git diff --check. Không sửa Git config/historical commits.

## Chưa nghiệm thu

Chưa chạy browser UAT tương tác/download, AI provider live, Netlify deploy/preview, kiểm tải đa browser, golden của Mr Quân hoặc đối chiếu PDF TT99. HTTP200 không chứng minh UI/business readiness. P0-MFG M01–M10 chưa được tự đánh dấu đạt. Reviewer độc lập cần kiểm lại code và bằng chứng; chưa merge/deploy/push.

S3 RAW→CLEAN adapters, S4 exception workflow, S5 MART/root-cause/commentary, S6 SME/auditor chưa hoàn thành. Current controls chỉ là validator Phase A trước xuất, không có claim workflow signoff.
