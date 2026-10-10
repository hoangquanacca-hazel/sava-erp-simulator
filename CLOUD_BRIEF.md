# CLOUD_BRIEF — Session 1 (SAVA ERP MTO Simulator)

Branch gốc: `feat/sim-p0-mfg` (đã gộp origin/main aa2b093). KHÔNG làm trên `main`. Mở nhánh con `cloud/s1-*`, tạo PR về `feat/sim-p0-mfg`, KHÔNG merge vào main.
Chuẩn kế toán: **TT99** (không TT200). Mô phỏng thuần trình duyệt, không SAP thật/DB/backend mới.

## Quy tắc cứng
1. CẤM script test có nhánh fallback tự sinh dữ liệu giả rồi in PASS. Test fail phải exit != 0.
2. Đáp án kỳ vọng nằm ở `scripts/a0_expected.json` (sinh bởi `scripts/a0_oracle.py`, độc lập mã TS) và golden set của chủ dự án (thư mục `golden/`, nếu có). Agent KHÔNG được sửa đáp án để test xanh. Lệch số => báo cáo, không "sửa cho khớp".
3. Không đổi số học ở `src/utils/calculator.ts`, `src/utils/acdoca.ts`, `src/features/materialLedger.ts` trừ khi có test oracle thất bại chứng minh lỗi; mọi thay đổi ghi vào `docs-cloud/CHANGELOG.md`.
4. Không đụng: `netlify.toml`, biến môi trường, `.git` lịch sử, nhánh `main`. Không xóa file.
5. Mọi thiết kế khó đảo ngược / nợ kỹ thuật => 1 mục trong `docs-cloud/AUDITOR.md` (đánh số AUD-013…).
6. Mock Gemini: gắn nhãn `[MOCK]`, không tính vào PASS.

## Nhiệm vụ Session 1 (theo thứ tự)
T0. Chạy `npm ci && npm run lint && npm run test:parity && npm run test:s1 && npm run test:s2 && npm run test:a0 && npm run build`. Ghi kết quả thật. Lint lỗi nào có sẵn => liệt kê (AUD-010), không giấu.
T1. (Bảo mật, chỉ báo cáo + vá an toàn) Xác nhận khóa Gemini chỉ đọc từ env server (`netlify/functions/chat.mts`, `health.mts`, `server.ts`). `/api/health` hiện trả `keyPrefix` (4 ký tự) và `keyLen` => bỏ `keyPrefix`/`keyLen`, chỉ giữ `hasApiKey`. Quét git history + working tree tìm chuỗi dạng khóa (`AIza[0-9A-Za-z_-]{30,}`) và báo kết quả (không in khóa nếu thấy).
T2. Phase A: sinh báo cáo định dạng SAP từ `buildScenarioEvents` + ACDOCA, xác định (không đồng hồ), có manifest + SHA-256: MB51, COOIS (Order Header, Components, Operations, Confirmations, Documented Goods Movements), KOB1, KKS1, CK13N, SUP01. Mỗi báo cáo có script test đối soát tổng với FI (Σ khớp ACDOCA), kèm test âm tính (sửa 1 số => phải FAIL). Theo mẫu `src/reports/fagll03.ts` + `scripts/s2-fagll03.ts`.
T3. Cập nhật `docs-cloud/GIAODICH_TT99.md` (định khoản Nợ/Có từng báo cáo/giao dịch mới).

## Tiêu chí nghiệm thu (PASS/FAIL)
- PASS-1: T0 toàn bộ exit 0 trừ lỗi lint có sẵn đã liệt kê.
- PASS-2: `/api/health` không còn trả bất kỳ ký tự nào của khóa; không có chuỗi khóa trong repo.
- PASS-3: 11 báo cáo có test; test âm tính FAIL khi sửa số; Σ báo cáo = Σ ACDOCA trên 54 ca của `a0_expected.json`.
- PASS-4: không dòng `main` nào bị đổi; không file bị xóa.
- Cuối phiên: báo cáo ≤ 30 dòng: việc xong, số liệu test thật, việc dở, rủi ro.

## Tiết kiệm credit
Model Opus 5.5 (không Fable). Không đọc lại toàn bộ repo; đọc `src/reports/core.ts`, `src/events/scenarioEvents.ts`, `src/reports/fagll03.ts`, `scripts/a0-*.ts` trước. Dừng và báo nếu một task vượt ~25% dự kiến.
