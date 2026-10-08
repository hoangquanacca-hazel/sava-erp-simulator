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


## Bổ sung UAT bởi agent độc lập — 08/10/2026

Theo yêu cầu Mr Quân, một agent khác tác giả đã thao tác trình duyệt trên commit `35a6b8a`, URL `http://127.0.0.1:3017/`. [Báo cáo gốc](qa/2026-10-08/RESULT.md) và [quan sát máy đọc](qa/2026-10-08/observations.json) được giữ nguyên nội dung của QA.

3 ca tạo đủ11 báo cáo: Samsung/Valuated/giao đủ; Canon/Non-valuated/giao đủ; Canon/Non-valuated/-3,5%/giao50%. Danh sách xuất cũ bị xóa khi đổi kịch bản/tham số. Luồng mặc định bị registration gate tại bước3; QA dùng chức năng giảng viên có sẵn qua ADMIN, khôi phụcOFF, không nhập lead/cá nhân hay gọiAI.

Nút tải4 file đã được bấm, nhưng completion/content/hash chưa xác minh do API download timeout. Phân loại UNVERIFIED, không kết luận download PASS hoặc FAIL. Chưa kiểm QM/ML unsupported gating, browser khác, hoặc golden/SME.

QA ghi nhận4 vấn đề giao diện kế thừa: BOM visualization lệch chi phí; inventory trình bày xuất kho trước execution; diễn giải settlement giao một phần nói154về0; breakdownCOGS giao một phần cộng207,2% và favorable variance hiển thị dương. Chưa sửa trong đợt QA này. Đây là lý do tiếp tục sửa UI trước release; kết quả3ca không chứng nhận toànP0/M01–M10.


## Bản sửa4lỗi — commit71cd3f8

Đã sửa trong source/build và chạy lại lint, UI-finance54/54oracle + HTMLrender, parity,S1,S2,A0,reports594,build,start; tất cảexit0. Logs tại qa/2026-10-08/retest-evidence. Calculator/acdoca/materialLedger/oracle không thay đổi.

Bản sửa: BOM dùng canonicalcomputed; kho dùng bước đã thực thi + balance154/155; settlement nêu phần đã giao/WIP; COGS loại closing911, bridge theo deliveryshare và delta có dấu. Xem [UI-FIXES](qa/2026-10-08/UI-FIXES.md).

**Independent browser retest BLOCKED:** agent QA mất provider/browser, reset/directURL cũng không khôi phục; root đọc được tab người dùng nhưng chưa thay thế QA độc lập. [RETEST](qa/2026-10-08/RETEST.md) và JSON ghi4live checks NOTRUN. Không kết luận ứng dụngFAIL từ lỗi công cụ; không nâng regression thành independentPASS. File download completion/hash cònUNVERIFIED. SME/legal/P0gates chưa nghiệm thu.

Server đang phục vụ bảnbuildmới ở http://127.0.0.1:3017/; tab mở trướcbuild có thể vẫn giữ bundlecũ, cần tải lại để dùng bản sửa. Codecommit71cd3f8, các commit ghiQA sau đó chỉ tài liệu.
