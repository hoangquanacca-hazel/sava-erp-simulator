# AUDITOR — Sổ nợ kỹ thuật / thiết kế khó đảo ngược (Session 1 cloud)

> Thư mục `docs-cloud/` chưa tồn tại khi bắt đầu Session 1; AUD-001…012 được tham chiếu trong mã nhưng không có trong repo này.
> Các mục dưới đây bắt đầu từ AUD-010 (theo CLOUD_BRIEF) và AUD-013 trở đi.

## AUD-010 — Lỗi lint có sẵn (T0)
- `npm run lint` (= `tsc --noEmit`) trên `feat/sim-p0-mfg` @ đầu phiên: **0 lỗi, exit 0**. Không có lỗi lint tồn đọng để liệt kê.
- Lưu ý: "lint" của dự án chỉ là kiểm tra kiểu TypeScript, không có ESLint/Prettier. Đề xuất bổ sung ở phiên sau (không làm trong S1).

## AUD-013 — `/api/health` từng lộ thông tin khóa Gemini (T1)
- Trước: `netlify/functions/health.mts` trả `keyLen`, `keyPrefix` (4 ký tự đầu) và `looksValid` (định dạng). Tiền tố + độ dài giúp thu hẹp tấn công và xác nhận loại khóa.
- Sau: chỉ trả `status`, `app`, `hasApiKey`. `looksValid` cũng bị bỏ vì brief yêu cầu "chỉ giữ hasApiKey".
- Test: `npm run test:health` (chạy trên mã cũ → exit 1; mã mới → exit 0).
- Khóa chỉ đọc từ env phía server: `chat.mts`/`health.mts` (`Netlify.env` hoặc `process.env.GEMINI_API_KEY`), `server.ts` (`process.env`). `vite.config.ts` không `define` khóa vào bundle; `src/` không đọc `GEMINI_*`; `dist/` sau build không chứa chuỗi `AIza…`.
- Quét `AIza[0-9A-Za-z_-]{30,}`: working tree 0, `git log --all -p` 0 (25 commit). **Giới hạn**: chỉ quét các ref có trong bản clone (nhánh `feat/sim-p0-mfg`, đã gộp main aa2b093); không quét fork, PR đóng, log Netlify. Nếu khóa từng lộ ở nơi khác → xoay khóa (rotate) là biện pháp duy nhất chắc chắn.

## AUD-014 — KOB1 không lặp bút toán CO01 (T2)
- Mô hình: KOB1 ghi Nợ lệnh = dòng Nợ 621/622/627 (261, CO11N); ghi Có lệnh = dòng 154 ngoài CO01 (101 nhập kho; VA88 kết chuyển, thuận lợi mang dấu +).
- Bút toán CO01 (Nợ 154 / Có 621-622-627) là luồng kết chuyển FI theo TT99, không phải chi phí mới → bỏ khỏi KOB1 để không đếm 2 lần. Σ KOB1 = số dư 154.
- Khác SAP thật: SAP dùng yếu tố chi phí thứ cấp cho nhập kho/kết chuyển (vd 895000, settlement CE); simulator hiển thị số TK 154. Đổi sang CE riêng sẽ phải đổi test.

## AUD-015 — SUP01 không phải T-code SAP chuẩn — ĐÃ CHỐT (09/10/2026)
- Brief liệt kê SUP01 nhưng không định nghĩa; trong repo không có tham chiếu. Diễn giải tạm: **báo cáo tổng hợp lệnh SX ↔ đơn bán MTO** (SL đặt/giao, giá thành KH/TT, dở dang 154, giá vốn kết chuyển 911, doanh thu 511, lãi gộp).
- **Quyết định chủ dự án 09/10/2026: giữ diễn giải trên.** Muốn đổi sau này → thay `buildSup01` và phần SUP01 trong `scripts/s3-reports.ts`.

## AUD-016 — KKS1: định nghĩa chi phí mục tiêu và chênh lệch
- Mục tiêu = round(Kế hoạch × SL giao/SL lệnh); Dở dang = Thực tế − Có nhập kho − Kết chuyển VA88; Chênh lệch = Thực tế − Mục tiêu − Dở dang.
- Hàng có định giá: Chênh lệch = số VA88 kết chuyển. Hàng không định giá: Chênh lệch = round(A·r) − round(P·r), có thể lệch ±1 VND so với round(Δ·r) khi giao một phần (do làm tròn). Test chỉ so oracle Δ·r ở tỷ lệ giao 0%/100%; ca 50% kiểm bằng hằng đẳng thức + số dư 154.
- SAP thật tách chênh lệch theo loại (giá, lượng, năng suất, lô); simulator chỉ có tổng.

## AUD-017 — Báo cáo logistics dùng giả định số lượng của A0.1
- MB51/COOIS kế thừa giả định AUD-001/AUD-012 (lượng thực tế = kế hoạch × hệ số chi phí). Một công đoạn (0010), một xác nhận, một lệnh/kịch bản. Mở rộng nhiều công đoạn/xác nhận cần cập nhật `scenarioEvents.ts` trước.
- `COOIS_GM` bỏ 601 (xuất giao hàng thuộc giao hàng, không thuộc lệnh) — giống SAP.

## AUD-018 — Nợ ESLint tồn đọng (S2)
- ESLint 9 + typescript-eslint + react-hooks (cấu hình `eslint.config.js`). Toàn repo @ S2: **158 lỗi, 1 cảnh báo, 29 file** — 124 `no-unused-vars`, 24 `no-explicit-any`, 5 `prefer-const`, 4 `react-hooks/rules-of-hooks`, 1 `exhaustive-deps`, 1 `prefer-rest-params`. Tất cả có từ trước S1/S2.
- CI: `lint:eslint:strict` (mã báo cáo/đối soát/sự kiện) **chặn**; `lint:eslint` toàn repo **chỉ báo cáo** (`continue-on-error`). Gỡ `continue-on-error` khi nợ về 0.
- **Ưu tiên cao nhất**: `src/components/SAPClassicMenu.tsx:588–682` gọi `useState/useMemo` SAU `if (uiMode !== 'classic') return null`. Hiện không sập vì App chỉ gắn component khi ở chế độ Classic (đã thử chuyển Fiori→Classic trên trình duyệt: không lỗi). Nếu ai đó gắn component vô điều kiện → React crash "Rendered more hooks". Sửa: đưa `return null` xuống sau các hook.
- **S3 (09/10/2026): ĐÃ SỬA** 4 lỗi `rules-of-hooks` + 108 import thừa + 4 `prefer-const` → toàn repo **158 → 42 lỗi** (xem AUD-039). Lưu ý: `App.tsx:1035` gắn `SAPClassicMenu` VÔ ĐIỀU KIỆN (khác mô tả trên); bản cũ build production chuyển Fiori↔Classic 3 vòng vẫn không sập — lỗi là tiềm ẩn, nay đã loại bỏ.

## AUD-019 — Trang "Báo cáo SAP" dựng trên bảng ACDOCA đang chạy (S2)
- `#/reports` (cờ `m9Reports`) dùng `buildAllReports` (src/reports/registry.ts) — CÙNG danh mục mà `test:s3` đối soát. Kiểm chứng trình duyệt: sau 7 bước, SHA-256 FAGLL03 trên UI = hash `test:s2` (cd5ac66eadab…) → file người dùng tải = file đã kiểm.
- Đối soát với oracle KHÔNG chạy trong trình duyệt (oracle chỉ có 54 ca cố định); UI hiển thị hash + manifest, đối soát chạy ở CI. Bảng có bút toán bổ sung (CKMLCP, GR/IR, IC) vẫn dựng được (48 trạng thái kiểm trong `test:s3`) nhưng chưa có oracle cho GR/IR/IC.
- Xem trước tối đa 200 dòng/báo cáo; file tải về đủ dòng.

## AUD-020 — Cổng đăng ký (lead) bước 3 chỉ kiểm ở phía trình duyệt — RỦI RO KINH DOANH
- `App.tsx:407` chặn bước ≥ 3 nếu `localStorage.sava_registered_user` rỗng. Ai cũng tự đặt khóa này (DevTools) để bỏ qua đăng ký; test UI của S2 dùng đúng cách này (KHÔNG gửi form).
- Danh sách lead `sava_captured_leads` cũng chỉ nằm trong localStorage của người truy cập; nguồn thật là Netlify Forms (`fetch('/')`). Nếu mô hình kinh doanh dựa vào cổng này để thu lead → cần kiểm phía server. Không sửa trong S2 (ngoài phạm vi, cần quyết định sản phẩm).
- **QUYẾT ĐỊNH (09/10/2026, chủ dự án, CLOUD_BRIEF_S3 Q2 = a): CHẤP NHẬN RỦI RO** — giữ kiểm phía trình duyệt, không làm kiểm phía Netlify Function (T5 bỏ). Xem lại khi cổng đăng ký trở thành nguồn thu lead chính.

---
# Session 3 — hợp nhất sổ (09/10/2026). Mọi mục mới từ AUD-030 (CLOUD_BRIEF_S3 quy tắc 8)

## Bảng ánh xạ số AUD trùng giữa các nhánh → sổ duy nhất này
Số trên `feat` (AUD-010…020, S1 #6 + S2 #7) GIỮ NGUYÊN. Số của #3 (`cloud/s1-reports`), #4 (`cloud/s1-npmstart`), #5 (`cloud/s1-tt99-labels`) được ánh xạ:

| Nhánh / PR | Số cũ | Chủ đề | Số trong sổ này |
|---|---|---|---|
| #3 | AUD-010 | Lint/build có sẵn | = AUD-010 (cùng chủ đề) |
| #3 | AUD-013 | `/api/health` lộ siêu dữ liệu khóa | = AUD-013 (cùng chủ đề, đã vá ở #6) |
| #3 | AUD-014 | SUP01 hiểu sai | thay bởi AUD-015 (đã chốt diễn giải) |
| #3 | AUD-015 | Cột "(SIM)", VRGNG suy theo T-code, một kỳ | **AUD-033** (phần KOB1 loại CO01 = AUD-014) |
| #3 | AUD-016 | KKS1 chưa tách loại chênh lệch | = AUD-016 |
| #3 | AUD-017 | Tính trùng bao bì Strategy 25 | **AUD-030** |
| #3, #5 | AUD-018 | Nhãn "Thông tư 200" | **AUD-031** (≠ AUD-018 ESLint trên feat) |
| #3, #4 | AUD-019 | `npm start` sập (CJS `import.meta`) | **AUD-032** (≠ AUD-019 trang Báo cáo trên feat) |
| #3 | AUD-020 | Dung sai 1 VND theo thành phần giá vốn | **AUD-034** (≠ AUD-020 cổng lead trên feat) |
| #3 | AUD-021 | Bộ nhớ quyết định/golden chưa trong repo | **AUD-035** |
| #3 | AUD-022 | SXC máy Nợ 627 / Có 214 đơn giản hoá | **AUD-036** |

Tham chiếu "AUD-018" trong commit `0cb7958` (#5) và "AUD-019" trong commit `8d312d0` (#4) đọc là AUD-031 / AUD-032 (không sửa lịch sử git).

## AUD-030 — Bao bì Strategy 25 tính trùng (BOM VERP + add-on) — Q1 ĐÃ CHỐT (a)
- Nguồn: #3 AUD-017. Denso: BOM `VERP-PACKAGING` 14.544.000 **và** `variantAddonTotal` 8.000 × 1.800 = 14.400.000.
- Quyết định 09/10/2026: bao bì chỉ là vật tư VERP trong BOM (621/152). Sửa + oracle giá thành độc lập: PR riêng nhánh `cloud/s3-costing` (T2), chờ chủ dự án duyệt bảng trước/sau.

## AUD-031 — Nhãn "Thông tư 200" (ĐÃ SỬA)
- #5 đổi 13 file. S3 quét lại: còn 5 chỗ ngoài phạm vi #5 → đã đổi: `SetupScreen.tsx:442`, `PDFReportModal.tsx:178, 510`, `StepCard.tsx:185`, `UserGuideModal.tsx:81`. Còn lại 0 chuỗi TT200 (trừ brief/sổ này).
- CẦN HỎI: `PDFReportModal.tsx:175` vẫn ghi "Mẫu số: B01-DN & S03b-DN"; dòng ban hành đã bỏ ngày của TT200 nhưng chưa ghi ngày ban hành TT99 — chủ dự án xác nhận ký hiệu mẫu biểu và ngày theo TT99.

## AUD-032 — `npm start` sập (ĐÃ SỬA ở #4)
- S3 chạy lại trên `feat` @cc527f2: `npm run build` → `NODE_ENV=production node dist/server.cjs` khởi động; `GET /api/health` = `{"status":"ok","hasApiKey":false,"app":"SAP MTO Simulator — PIC Vietnam"}`.

## AUD-033 — Bố cục báo cáo là MÔ PHỎNG (từ #3 AUD-015)
- Cột gắn "(SIM)" (COOIS `PLAN_COST`, `ACT_COST`, `PLAN_VAL`, `ACT_VAL`, `LAB_VAL`, `MOH_VAL`) không phải trường SAP chuẩn. VRGNG suy theo T-code, không có bảng TJ01. Một kỳ hạch toán duy nhất (`SIM_CONFIG.postingDate`), chưa mô phỏng WIP chuyển kỳ.

## AUD-034 — Dung sai 1 VND theo thành phần giá vốn (từ #3 AUD-020)
- CK13N × tỷ lệ giao so với 632110–632140 lệch ≤ 1 VND từng thành phần (phân bổ số dư lớn nhất); tổng phải khớp tuyệt đối. Cần đối chiếu với `scripts/s3-reports.ts` hiện hành nếu siết dung sai.

## AUD-035 — Bộ nhớ quyết định / golden set chưa nằm trong repo (từ #3 AUD-021)
- `golden/` không tồn tại; AUD-001…012 không có trong repo. Q3 (09/10/2026): chưa có golden set — oracle giá thành T2 là chốt kiểm độc lập duy nhất.

## AUD-036 — SXC máy Nợ 627 / Có 214 là đơn giản hoá (từ #3 AUD-022)
- CO11N ghi toàn bộ chi phí máy + SXC thực tế vào Có 214. Thực tế gồm điện, bảo trì, vật tư phụ (Có 331/152/334…). Số dư 214 trên BCTC mô phỏng bị phóng đại. Chưa đổi số học.

## AUD-037 — T3: rà phụ phí biến thể Strategy 25 còn lại (ĐÃ CHỐT 10/10/2026 Q4 = a, Q5 = a → thực hiện ở AUD-041, AUD-042)
Số Denso (8.000 cái, định mức 14,2 kg/1.000 → 113,6 kg; hao hụt nhựa 2,5%):

| Khoản | Cơ chế trong `computeMTO` | Denso (VND) | Kết luận |
|---|---|---|---|
| Màu (c-ylw 6.500/kg) | (1) cộng vào giá hạt nhựa/kg của dòng ROH chính: 113,6 × 1,025 × 6.500 | 756.860 | **TRÙNG** — cần hỏi để chốt |
| | (2) dòng masterbatch `ROH-MB-COLOR`: SL = 2% định mức (0,28 kg/1.000) × đơn giá = 6.500 × 50, hao hụt 1% | 735.280 | |
| | Dòng (2) được dựng sao cho ≈ (1) (0,02 × 50 = 1) → cùng một chi phí màu ghi hai lần. SAP: hạt màu là một dòng BOM riêng; giá nhựa nền không đổi. Đề xuất: bỏ phụ phí màu khỏi giá/kg, giữ dòng masterbatch. | | |
| Texture (t-esd 1.200/kg + 1.500/cái) | (1) +1.200/kg vào giá nhựa: 113,6 × 1,025 × 1.200 | 139.728 | **CẦN HỎI** — hai cơ sở khác nhau (phụ gia trộn theo kg vs. công đoạn phủ theo cái) nên có thể cố ý; nhưng phần /kg nên là dòng BOM phụ gia riêng, phần /cái nên là công đoạn routing (622/627), không phải add-on không tên tài khoản |
| | (2) 8.000 × 1.500 vào `variantAddonTotal` (ghi vào O = 627) | 12.000.000 | |
| t-matte (700/cái) | chỉ add-on/cái | — | Cố ý (ăn mòn khuôn ≈ chi phí gia công) |
| Hệ quả gián tiếp | SXC 8% tính trên (621 + 622) → mọi khoản cộng vào giá nhựa/BOM kéo theo +8% SXC | — | Cần lưu ý khi sửa |

## AUD-038 — Chế độ "theo giờ": nhân công tính theo giờ MÁY, bỏ qua `laborHours` (CẦN HỎI)
- `computeMTO`: `directLaborCost622 = operatingHours × laborRate`, với `operatingHours` suy từ `machineHours` (chu kỳ = machineHours × 3600 / SL, + 1,5 h setup). Tham số `laborHours` (Samsung 250 h, Denso 320 h) không vào giá thành, nhưng `BOMVisualizer.tsx:177` hiển thị "250 giờ @ …/h" và `calculator.ts:1509` dùng `laborHours` cho bảng định mức → hai nơi khác nhau. Không sửa (vùng số học bảo vệ, chưa có quyết định).

## AUD-039 — Nợ ESLint sau S3
- Trước: 158 lỗi / 1 cảnh báo / 29 file. Sau: **42 lỗi / 1 cảnh báo / 18 file** — 24 `no-explicit-any`, 16 `no-unused-vars` (biến/tham số, không phải import), 1 `prefer-const`, 1 `prefer-rest-params`. `rules-of-hooks`: 0.
- Cố ý KHÔNG sửa (quy tắc 3, file số học): `acdoca.ts:214` `netTurnover`, `acdoca.ts:565` `standardCogs`, `acdoca.ts:479` `prefer-const remain`, `calculator.ts:1510, 1515` `laborUnitCost`/`machineUnitCost`.
- Còn lại cần đọc nghiệp vụ trước khi bỏ (có thể là tính năng dở): `App.tsx` `registeredUser`, `footerClicks`; `Header.tsx` `onExportCSV/JSON`; `SetupScreen.tsx` `selectedColor/Texture/Packaging`; `PDFReportModal.tsx` `stockEState`; `SalesOrderCard.tsx` `computed`; `BOMTreeView.tsx`, `BOMVisualizer.tsx`, `parity.ts` `oldTb`.
- CI vẫn để `lint:eslint` toàn repo `continue-on-error` cho tới khi về 0.

## AUD-040 — Màn hình bóc tách giá thành chưa theo Q1 = (a) (CHỈ HIỂN THỊ)
- `BOMVisualizer.tsx:112–129` và `buildBOMTree` (`calculator.ts:1490+`) tự tính lại: bao bì xếp vào SXC (`packagingCost`), màu tính theo /kg trên nhựa. Sau PR #10, bút toán theo BOM (bao bì → 621) nhưng hai màn hình này vẫn hiển thị kiểu cũ. Không ảnh hưởng ACDOCA; sửa sau khi chốt AUD-037.

## AUD-041 — Q4 = (a): bỏ phụ phí màu/kg khỏi giá nhựa nền (ĐÃ SỬA, chờ duyệt bảng)
- `calculator.ts`: `effectiveResinPricePerKg` không còn cộng `colorResinAddon`; dòng `ROH-MB-COLOR` giữ nguyên. Oracle sửa trước (`oracle_costing.py`), log FAIL `docs-cloud/evidence/s4_q4_before_fix.log` (28/40 ca lệch). Denso P 99.482.210 → 98.664.801 (Δ −817.409, đúng số chủ dự án dự kiến); Samsung/Canon không đổi.
- Khó đảo ngược: không (cờ oracle `--off=q4` tái tạo đáp án cũ từng byte). Nợ kỹ thuật: dòng masterbatch vẫn dựng theo công thức "2% định mức nhựa × (màu/kg × 50)" — là heuristic của simulator, chưa phải master data CS03.

## AUD-042 — Q5 = (a): phụ gia ESD/kg thành dòng BOM `ROH-ADD-ESD` (ĐÃ SỬA, P không đổi)
- Dòng mới khi texture có phụ phí/kg > 0 (chỉ Strategy 25): định mức = định mức nhựa, hao hụt 2,5%, đơn giá = phụ phí/kg, TK 621/152. Giá nhựa nền không còn cộng texture/kg. P không đổi (11.201.528 + 139.728 = giá nhựa gộp cũ, 0 VND làm tròn). Phần /cái (12.000.000) vẫn là add-on 627.
- `CK13N`: yếu tố 101 tách theo dòng BOM (Σ = 621); nhãn add-on đổi thành "Công đoạn phủ texture theo cái". `s3-reports.ts` kiểm `ROH-ADD-ESD` có ở MB51/COOIS_CMP/CK13N đúng cho Denso, không có ở Samsung/Canon.
- Nợ: add-on /cái vẫn chưa là công đoạn routing thật (gom vào SXC 632140) — xem AUD-036.

