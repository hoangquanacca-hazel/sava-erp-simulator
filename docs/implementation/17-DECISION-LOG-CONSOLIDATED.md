# 17 — Nhật ký quyết định hợp nhất (10/10/2026)

Mục đích: một danh sách duy nhất các quyết định của chủ dự án (Mr Quân) và quan sát kỹ thuật đã có, để agent sau không khởi động lại hay mâu thuẫn. Bổ sung cho `13-DECISION-LOG.md` (bản 07/10), không thay thế nó.

Nguồn đã đối chiếu: nhánh `cloud/s1-report-completion` (HEAD `6b74901`, "nhánh Codex"), nhánh `origin/feat/sim-p0-mfg` (HEAD `b604094`, "nhánh cloud"), `origin/main` (`aa2b093`), ghi chú Obsidian `00_Inbox/AI/SAP_Simulator_*` và các lời chốt của chủ dự án trong phiên làm việc 07–10/10/2026.
Giới hạn: nội dung nhánh cloud được đọc qua danh sách commit, tiêu đề AUD và danh sách file; chưa chạy lại test của cả hai nhánh trong lần hợp nhất này.

Trạng thái: **HIỆU LỰC** (đang áp dụng) · **BỊ THAY THẾ** · **MỞ** (chưa chốt) · **CHỜ DUYỆT**.

## A. Phạm vi và nguyên tắc nền

| ID | Quyết định | Ngày / người chốt | Trạng thái | Ghi chú |
|---|---|---|---|---|
| CON-01 | Làm trực tiếp trong `D:\sava-erp-simulator`; không tạo repo hoặc project thay thế | 07/10, chủ dự án | HIỆU LỰC | = DEC-001 |
| CON-02 | Đây là **simulator**; không nhập SAP thật, không backend/DB/worker lưu dữ liệu mới. RAW chỉ cho export do simulator sinh, xử lý trong trình duyệt (quyết định A) | 07/10 "Vẫn là mô phỏng…", "Duyệt A.B.C" | HIỆU LỰC | Các đề xuất object store/worker trong `02`, `09` chỉ là dài hạn |
| CON-03 | Cấu hình mô phỏng cố định (quyết định B): company 1000, plant 1100, controlling area 1000, ledger 0L, fiscal year variant K4, cost version 0, VND, ngày hạch toán 15/09/2026 (kỳ 009). Nguồn duy nhất: `src/config/simConfig.ts`. Nhãn `SIMULATED` bắt buộc | 07/10 | HIỆU LỰC | Rủi ro: một công ty/nhà máy/ngày duy nhất (AUD-004 sổ cũ) |
| CON-04 | **TT99 là chuẩn kế toán duy nhất** (quyết định C). Bảng tài khoản vẫn `chua_doi_chieu` với PDF; không tự chứng nhận pháp lý | 07/10 | HIỆU LỰC | |
| CON-05 | Nhãn/tham chiếu TT200, "PIC Vietnam" trong handoff credit 08/10 và UI cũ | 08/10 handoff từ phiên khác | **BỊ THAY THẾ** bởi CON-04 | Cloud đã đổi nhãn TT200→TT99 (AUD-018/031) |
| CON-06 | Báo cáo Z (ZFIR009A, ZFIR159) lấy từ kinh nghiệm của chủ dự án, giả định/SIMULATED; đổi tên đề xuất `ZSAVA_*`; chủ dự án sẽ cấp cột/logic/mẫu | 07/10 | HIỆU LỰC, **CHẶN** chờ spec | Không đoán logic |
| CON-07 | Cách làm việc: làm trọn từng phần rồi báo cáo; chỉ dừng khi chạm `main`/live/Netlify, xóa file, hoặc đổi ý nghĩa nghiệp vụ | 07/10 | HIỆU LỰC | |
| CON-08 | Chỉ merge vào `main`, deploy, push-force, xóa nhánh khi chủ dự án nói rõ. `main` hiện là `aa2b093` (đã nhận nhánh brand L1) | 07/10 | HIỆU LỰC | |
| CON-09 | Không self-audit để nghiệm thu. Cấm test có nhánh fallback tự sinh dữ liệu giả rồi in PASS. Không sửa đáp án để test xanh | 07/10, 08/10 | HIỆU LỰC | = DEC-017 |
| CON-10 | Tài liệu bắt buộc: (a) mô tả giao dịch + định khoản Nợ/Có theo TT99, cập nhật theo tiến độ, lưu ở Obsidian; (b) thiết kế kỹ thuật dễ thành nợ kỹ thuật/không đảo ngược → báo cáo Auditor có đánh số | 07/10 | HIỆU LỰC | Obsidian dừng ở AUD-012; repo (nhánh cloud) đến AUD-044. **Sổ AUD chưa hợp nhất** (xem 18) |
| CON-11 | Mục tiêu gần = **P0 Manufacturing** (nghiệm thu độc lập + duyệt của con người để pilot); P1 (Procurement/AP, Sales/AR) và P2 (Material Ledger nâng cao, CFO dashboard, Z-report) làm sau | 08/10 "Đồng ý chốt mục tiêu gần là P0…" | HIỆU LỰC | Chi tiết `docs-cloud/P0-FOCUS-DECISION.md` (nhánh Codex) |
| CON-12 | Nhánh gốc để đi tiếp = nhánh Codex (`cloud/s1-report-completion`); nhánh cloud (`feat/sim-p0-mfg`) là nguồn bổ sung được đưa sang theo từng PR | 10/10 "lấy từ codex là gốc" | HIỆU LỰC | Xem `18` |
| CON-13 | Dừng mở session cloud mới cho tới khi có bản đồ nhánh (`18`) và nhánh Codex đã được push; mỗi brief cloud phải có mục "Không làm lại" | 10/10 "Đồng ý" | HIỆU LỰC | Credit cloud hết hạn 23:59 PT 04/11/2026; dùng Opus 5.5, không dùng Fable |

## B. Chính sách kế toán lõi (A0 / A0.1)

| ID | Quyết định | Ngày | Trạng thái | Ghi chú |
|---|---|---|---|---|
| CON-14 | Năm mặc định A0: (1) toàn bộ chi phí thực tế phát sinh ở bước sản xuất, tỷ lệ giao hàng chi phối phần GR/COGS, phần còn lại ở WIP; (2) hàng Valuated: GR/PGI theo chuẩn, phần chênh lệch đã giao đưa vào 632 qua VA88; (3) hàng Non-valuated: không ghi 155, phần (kế hoạch+Δ) đã giao vào 632, chỉ chuyển động số lượng; (4) đối ứng đơn giản hóa: vật tư thừa Có 152, nhân công Có 334, máy/OH/add-on Có 214; (5) bảng đáp án độc lập trước khi viết mã | 07/10 "Đồng ý 5 mặc định" | HIỆU LỰC | Oracle `scripts/a0_oracle.py` → `a0_expected.json` (54 ca). Hai nhánh đều có A0/A0.1 |
| CON-15 | Phân bổ chênh lệch thực tế theo tỷ trọng kế hoạch; số dư vào overhead | 07/10 | HIỆU LỰC, giả định | Sổ cũ AUD-001; hay bị hiểu nhầm là chuẩn SAP |
| CON-16 | Số chứng từ ổn định `49` + bước + mã nguồn (0 lõi, 1 ML, 2 GRIR, 3 IC) + số thứ tự 6 chữ số; số dòng từ hậu tố lineId | 07/10 (A0.1) | HIỆU LỰC | txnId gốc vẫn theo thứ tự phát sinh (sổ cũ AUD-003) |
| CON-17 | Material Ledger/CKMLCP chỉ quyết toán phần đã giao của chênh lệch; kho non-valuated: CKMLCP không trả dòng | 07/10 | HIỆU LỰC, **MỞ** | Chủ dự án chưa xác nhận quy tắc non-valued (sổ cũ AUD-011) |
| CON-18 | Nguồn sự kiện logistics duy nhất `src/events/scenarioEvents.ts` + kiểm đối soát với FI; số lượng/giờ là giả định suy ra | 07/10 (A0.1) | HIỆU LỰC | Chỉ 1 công đoạn/1 xác nhận; rework/scrap QM chưa mô hình (sổ cũ AUD-012) |

## C. Đã chốt trong các phiên cloud (nhánh `feat/sim-p0-mfg`) — **chưa có ở nhánh Codex**

| ID | Quyết định | Ngày | Trạng thái | Ghi chú |
|---|---|---|---|---|
| CON-19 | Q1 (S3): bao bì Strategy 25 chỉ tính trong BOM (VERP → 621/152), không cộng thêm add-on | 09/10 | HIỆU LỰC | **Đổi số liệu**; cloud đã sinh lại `a0_expected.json` bằng oracle. Mâu thuẫn quy tắc Codex "không sửa oracle a0_expected.json" → cần chủ dự án quyết cách xử lý (MỞ-02) |
| CON-20 | Q2 (S3): chấp nhận rủi ro cổng đăng ký (lead) chỉ kiểm ở trình duyệt | 09/10 | HIỆU LỰC | AUD-020 (sổ cloud) |
| CON-21 | Diễn giải SUP01 (không phải T-code SAP chuẩn) | 09/10 | HIỆU LỰC | AUD-015 (sổ cloud); nội dung chi tiết xem sổ đó |
| CON-22 | Q4 = (a): bỏ phụ phí màu/kg khỏi giá nhựa nền, giữ dòng `ROH-MB-COLOR` | 10/10 | HIỆU LỰC ở nhánh cloud, **CHỜ DUYỆT bảng trước/sau** | AUD-041 |
| CON-23 | Q5 = (a): phụ gia ESD/kg thành dòng BOM `ROH-ADD-ESD` (621/152) | 10/10 | như trên | AUD-042; P không đổi |
| CON-24 | Q6 = (b): giờ công/giờ máy hiển thị = giờ vận hành thực tính | 10/10 | HIỆU LỰC ở nhánh cloud; chỉ trình bày | AUD-043/044 |
| CON-25 | Giá thành kế hoạch hiện tại (nhánh cloud, sau Q4–Q6): Samsung 48.780.088; Canon 53.086.050; Denso 98.664.801 | 10/10 | Số của **nhánh cloud**, chưa xác minh trên nhánh Codex | |

## D. Phạm vi nhánh Codex (S3–S6 theo cách đánh số của Codex)

| ID | Nội dung | Trạng thái |
|---|---|---|
| CON-26 | Phase A: 11 báo cáo SAP + UI "SAP Reports" + xuất RAW kèm manifest/hash (kịch bản cơ sở); chặn QM rework/scrap và bút toán tùy chọn ML/GRIR/IC khi chưa kiểm chứng | Xong kỹ thuật |
| CON-27 | S3: adapter RAW→CLEAN trong trình duyệt, 11 profile, DQ/lineage/manifest, Data Lab | Xong kỹ thuật; UAT trình duyệt/SME còn chờ |
| CON-28 | S4: Controls C01–C07 + review request audit trail. Khối nghiệp vụ còn mở: C02 (reservation), C04 (cơ sở CO), C05 (receiver/điều kiện), C07 (phân loại nguyên nhân vật lý); C01/C03/C06 chờ SME | Xong kỹ thuật, **chưa nghiệm thu** |
| CON-29 | S5: MART chẩn đoán (12 chỉ số, cầu nối 3 yếu tố giá thành, drill RAW, tóm tắt tự động C08); không suy nguyên nhân từ tỷ trọng chi phí; trạng thái DIAGNOSTIC/PENDING_HUMAN_SME | Xong kỹ thuật |
| CON-30 | S6: QA có phạm vi, gói bằng chứng; M01–M10 chưa chấp nhận; phát hành NOT_READY_FOR_PILOT | Xong phần kỹ thuật, nghiệm thu **chưa đạt** |

> Lưu ý: "S3/S4" của Codex ≠ "S3/S4" của cloud. Xem bảng đối chiếu ở `18`.

## E. Quan sát đã xác minh làm thay đổi hiểu biết cũ

| ID | Quan sát | Hệ quả |
|---|---|---|
| OBS-01 | Handoff credit 08/10 nêu "API key Gemini lộ qua Netlify Functions" (P1). Kiểm mã: khóa chỉ đọc từ biến môi trường phía server; không có chuỗi khóa trong repo hay lịch sử git (chỉ có chú thích). Điểm yếu thật: `/api/health` từng trả ký tự đầu và độ dài khóa — đã bỏ ở cả hai nhánh | Tuyên bố ban đầu **BỊ THAY THẾ**. Xoay khóa vẫn nên làm như biện pháp phòng ngừa (việc của chủ dự án) |
| OBS-02 | Nhánh Codex xuất phát sau A0/A0.1 của phiên Claude đầu; ba commit A0 (`a8a9393`, `7ed5e52`, `a19ad21`) đều nằm trong nhánh Codex | Không viết lại lõi kế toán |
| OBS-03 | Hai dòng việc rẽ từ `10c6906` và chưa gộp: Codex 14 commit/262 file; cloud 32 commit/60 file. Nhánh Codex lúc 10/10 chưa được push | Xem `18` |
| OBS-04 | Cloud S1 (11 báo cáo) và phần trang "Báo cáo SAP" của S2 trùng với Phase A của Codex | Không gộp phần báo cáo của cloud, chỉ dùng để đối chiếu |

## F. Câu hỏi còn mở (cần chủ dự án)

- MỞ-01: Golden set 12–15 ca theo bút toán Nợ/Có kỳ vọng — chưa có trong repo (AUD-035). Hiện 18 ca "Canon DRAFT" chỉ là bản sao oracle Python.
- MỞ-02: Khi đưa Q1/Q4/Q5 sang nhánh Codex, oracle A0 và các chỉ số S5 phải sinh lại. Chủ dự án có đồng ý quy trình "oracle FAIL trước → sửa → sinh lại → bảng trước/sau → duyệt" cho từng quyết định không?
- MỞ-03: Quy tắc non-valued stock cho CKMLCP (CON-17).
- MỞ-04: Đối chiếu bảng tài khoản TT99 với PDF chính thức.
- MỞ-05: SXC máy Có 214 là đơn giản hóa (AUD-036 sổ cloud) — quyết định kế toán trước khi đổi số.
- MỞ-06: Kế hoạch đưa nhánh vào `main` (chưa có quyết định).
- MỞ-07: Spec ZFIR009A/ZFIR159.
- MỞ-08: File SAP xuất gốc (hiện 0 file native; 48 hồ sơ chờ file gốc) và xác minh tải RAW/CLEAN/CONTROL thật.
