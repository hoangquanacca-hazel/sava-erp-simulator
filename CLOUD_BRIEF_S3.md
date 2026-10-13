# CLOUD_BRIEF — Session 3 (SAVA ERP MTO Simulator)

Branch gốc: `feat/sim-p0-mfg` @ `9667e55` (đã gộp S1 #6 + S2 #7, CI xanh). KHÔNG làm trên `main`.
Mở nhánh con `cloud/s3-*`, PR về `feat/sim-p0-mfg`, KHÔNG merge vào main. Chuẩn: **TT99**. Thuần trình duyệt, không backend mới.

## Bước 0 bắt buộc (bài học S1/S2)
Trước khi code: liệt kê mọi PR đang mở + nhánh `cloud/*` + đọc `docs-cloud/AUDITOR.md`, `CHANGELOG.md`.
S1 đã bị làm trùng hai lần (#3 và #6) vì phiên sau không kiểm PR mở. Phát hiện việc trùng → dừng, báo.

## Quy tắc cứng
1–6. Kế thừa nguyên văn `CLOUD_BRIEF.md` (cấm fallback giả PASS; không sửa đáp án cho khớp; không đổi số học
     `calculator.ts`/`acdoca.ts`/`materialLedger.ts` khi chưa có test oracle FAIL chứng minh lỗi; không đụng `netlify.toml`,
     env, lịch sử git, `main`; không xóa file; mock Gemini gắn `[MOCK]`).
7. **CI GitHub Actions phải xanh trên PR.** Kết quả chạy cục bộ không thay được CI. Không tắt/bỏ qua test, không
   `continue-on-error` cho test.
8. **Một sổ AUD duy nhất** = `docs-cloud/AUDITOR.md` trên `feat`. Dải AUD-018…022 đang bị TRÙNG số giữa các nhánh
   (#3/#4/#5 vs S2) → mọi mục mới bắt đầu từ **AUD-030**. Không xóa mục cũ; chỉ thêm bảng ánh xạ.
9. Sửa số học hoặc sinh lại `a0_expected.json` CHỈ khi: (a) chủ dự án đã chốt Q1 bên dưới, (b) có test oracle độc lập
   FAIL trước khi sửa, (c) PR riêng kèm bảng số trước/sau cho từng ca, chủ dự án duyệt bảng đó trước khi merge.

## Quyết định chủ dự án (ĐÃ CHỐT 09/10/2026)
- **Q1 — Bao bì Strategy 25 (đã kiểm chứng tính trùng trên mã, `calculator.ts` dòng 122–133 và 184):**
  Denso: BOM `VERP-PACKAGING` 14.544.000 (8.080 cái × 1.800, gồm 1% hao hụt) **và** `variantAddonTotal` cộng thêm
  8.000 × 1.800 = 14.400.000 → giá thành kế hoạch P = 113.882.210 bị đội ~14,4 tr (~12,6%).
  - (a) Chỉ tính trong BOM (vật tư VERP → 621/152), bỏ khỏi add-on — **đề xuất**, đúng cách SAP coi bao bì là vật tư BOM.
  - (b) Chỉ tính trong add-on (SXC/627), bỏ dòng BOM.
  - (c) Giữ nguyên (cố ý) — ghi lý do nghiệp vụ.
  - **Chốt: (a)** — bao bì chỉ là vật tư VERP trong BOM (621/152); bỏ phần bao bì khỏi `variantAddonTotal`.
    Texture add-on/cái giữ nguyên trừ khi T3 chứng minh trùng.
- **Q2 — Cổng đăng ký bước 3 (AUD-020 bản S2):** chỉ kiểm bằng localStorage, ai cũng bỏ qua được.
  (a) giữ, chấp nhận rủi ro; (b) kiểm phía Netlify Function. **Chốt: (a)** — giữ nguyên, ghi nhận rủi ro trong sổ AUD, không làm T5.
- **Q3 — Golden set:** **chưa có.** S3 không chờ golden set; oracle T2 là chốt kiểm độc lập duy nhất cho giá thành.

## Nhiệm vụ Session 3 (theo thứ tự)
T0. **Dọn PR tồn đọng** (đã kiểm `git merge-tree` với `feat` @9667e55):
  - #4 `fix(server): npm start crash` — 1 file, không xung đột. Chạy lại `NODE_ENV=production node dist/server.cjs`
    + `/api/health`, chờ CI xanh, đổi tham chiếu AUD-019 → số mới theo quy tắc 8, đề xuất merge.
  - #5 `chore(labels): TT200 → TT99` — 13 file, không xung đột. Quét lại nhãn TT200 phát sinh sau S1/S2
    (`docs-cloud/`, `ReportsPage.tsx`), CI xanh, đổi AUD-018 → số mới, đề xuất merge.
  - #3 `Cloud S1` (bản S1 trùng, XUNG ĐỘT 5 file) — KHÔNG merge mã. Chuyển các phát hiện chưa có trên `feat` vào sổ
    AUD (bao bì → Q1; dung sai 1 VND theo thành phần giá vốn; "bộ nhớ quyết định chưa nằm trong repo"; cột "(SIM)"),
    rồi comment trỏ sang #6. Chủ dự án tự đóng #3.
T1. **Hợp nhất sổ AUD**: bảng ánh xạ (nhánh, số cũ) → số mới cho mọi mục của #3/#4/#5; không xóa mục.
T2. **Oracle độc lập cho GIÁ THÀNH KẾ HOẠCH** (điểm mù lớn nhất hiện nay):
  - `a0_oracle.py` đọc M/L/O/Rev từ `/tmp/planned.json` — file KHÔNG có trong repo và sinh từ chính `computeMTO` (TS).
    → Khâu giá thành (CK11N) chưa từng được kiểm độc lập; lỗi bao bì lọt qua vì vậy.
  - Việc: (1) đưa bước sinh đầu vào vào repo, chỉ xuất THAM SỐ preset (không xuất kết quả TS);
    (2) viết `scripts/oracle_costing.py` tính M, L, O, Rev, P từ tham số theo chính sách đã chốt ở Q1;
    (3) test `test:costing` so `computeMTO` trên 3 preset + biến thể Strategy 25. Theo Q1 = (a), test PHẢI FAIL trên Denso
    trước khi sửa (lưu log làm bằng chứng; Samsung/Canon là Strategy 20 nên phải PASS ngay);
    (4) sửa `calculator.ts` (bỏ `packagingUnitAddon` khỏi `variantAddonTotal`) → `test:costing` PASS;
    (5) sinh lại `a0_expected.json` bằng oracle (KHÔNG bằng TS) → `test:a0`, `test:s3` PASS; đề xuất mức kỳ vọng Denso
    P ≈ 99.482.210 (= 113.882.210 − 14.400.000) — con số này phải do oracle tự tính ra, không chép từ đây;
    (6) PR RIÊNG cho (4)(5), kèm bảng trước/sau từng ca (P, Δ, 154, 632, 911) để chủ dự án duyệt trước khi merge.
T3. **Rà các phụ phí biến thể còn lại** (chỉ báo cáo, không sửa): màu (`colorResinAddon` vừa cộng vào giá hạt nhựa/kg vừa
   sinh dòng masterbatch `ROH-MB-COLOR`), texture (cộng vào giá/kg và vào add-on/cái). Kết luận từng khoản: trùng / cố ý / cần hỏi.
T4. **Giảm nợ ESLint (AUD-018 bản S2, 158 lỗi)**: sửa 4 lỗi `react-hooks/rules-of-hooks` ở `SAPClassicMenu.tsx`
   (đưa `return null` xuống sau các hook) + import thừa/`prefer-const` (thay đổi cơ học). KHÔNG sửa trong 3 file số học
   (quy tắc 3) — liệt kê riêng. Kiểm trình duyệt chuyển Fiori ↔ Classic không lỗi.
T5. ~~Kiểm đăng ký phía server~~ — BỎ theo Q2 = (a). Chỉ cập nhật sổ AUD: rủi ro được chấp nhận, ngày, người quyết.

## Tiêu chí nghiệm thu (PASS/FAIL)
- PASS-1: CI xanh trên mọi PR S3; T0 xử lý xong #4, #5 (merge hoặc lý do), #3 có comment chuyển giao.
- PASS-2: Sổ AUD duy nhất, không còn số trùng; mọi mục của #3/#4/#5 có số mới hoặc lý do bỏ.
- PASS-3: Oracle giá thành chạy được từ repo sạch (không phụ thuộc `/tmp`), đầu vào là tham số chứ không phải kết quả TS;
  nếu đã sửa số: có log FAIL trước sửa + bảng chênh lệch từng ca được chủ dự án duyệt.
- PASS-4: 0 lỗi `rules-of-hooks`; tổng lỗi ESLint giảm, số liệu trước/sau ghi trong CHANGELOG.
- PASS-5: Không dòng `main` nào bị đổi; không file bị xóa.
- Cuối phiên: báo cáo ≤ 30 dòng: việc xong, số liệu test thật (trích log CI), việc dở, rủi ro.

## Tiết kiệm credit
Thứ tự rẻ → đắt: T0, T1 (≈ 20%) → T3 (≈ 10%) → T4 (≈ 20%) → T2 (≈ 40–50%, phụ thuộc Q1).
Đọc trước: `docs-cloud/AUDITOR.md`, `scripts/a0_oracle.py`, `src/utils/calculator.ts` dòng 60–200, `scripts/s3-reports.ts`.
Dừng và báo nếu một task vượt ~25% dự kiến, hoặc nếu chênh lệch sau sửa ở Denso KHÁC 14.400.000 ± làm tròn (dấu hiệu còn khoản trùng/thiếu khác).
