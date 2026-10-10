# 18 — Bản đồ nhánh và trạng thái (10/10/2026)

> **CẬP NHẬT 10/10/2026 (sau PR #23):** `main` = `30494b8` đã chứa nhánh Codex + toàn bộ Q1/Q4/Q5, CI, ESLint, oracle giá thành. Các mô tả "main = aa2b093", "chưa đưa sang" bên dưới là lịch sử, KHÔNG còn đúng. Nhánh cần giữ: `main`, `feat/sim-p0-mfg` (tham chiếu), `cloud/s1-report-completion`. Xem DEC-021…027 trong `docs-cloud/DECISIONS.md`.


Mục đích: cho biết **cái gì nằm ở nhánh nào**, hai dòng việc song song khác nhau ra sao, và **thứ tự đưa phần hữu ích của nhánh cloud sang nhánh gốc** mà không làm lệch số liệu. Đọc cùng `17-DECISION-LOG-CONSOLIDATED.md`.

Cơ sở: `git` ngày 10/10/2026 (số liệu đếm file/commit/thư mục); nội dung cloud S1–S4 đọc qua commit message, tiêu đề AUD và danh sách file. Chưa chạy lại test của hai nhánh khi lập bản đồ này.

## 1. Cây phả hệ

```
926837a  (main cũ, 07/10)
  └─ A0, A0.1 (Claude, nhánh feat/sim-p0-mfg)  a8a9393 · 7ed5e52 · a19ad21
       └─ 10c6906  (brief cloud S1)  ◄── ĐIỂM RẼ
            ├─ NHÁNH CODEX  cloud/s1-report-completion   HEAD 6b74901
            │     14 commit riêng · 262 file đổi · CHƯA push GitHub (lúc lập bản đồ)
            │     11 báo cáo → Data Lab (RAW→CLEAN) → Controls → MART → QA
            └─ NHÁNH CLOUD  origin/feat/sim-p0-mfg       HEAD b604094
                  32 commit · 60 file đổi · đã trên GitHub (PR #3…#15)
                  bảo mật, CI, giá thành Q1/Q4/Q5/Q6, sổ AUD hợp nhất

main (origin) = aa2b093   đã nhận nhánh brand L1 (c629d2a); KHÔNG nhận gì từ hai nhánh trên
docs/implementation-pack = 28dc655 (32 file kế hoạch, tổ tiên của nhánh Codex)
```

Nhánh phụ còn trên remote: `cloud/s1-reports`, `cloud/s1-reports-security`, `cloud/s2-ci-ui`, `cloud/s3-brief`, `cloud/s3-hygiene`, `cloud/s4-brief`, `cloud/s4-present`, `cloud/s4-q4q5`, `cloud/s4-report`, `feat/acdoca-core`, `feat/sava-brand-l1`, `docs/implementation-pack`. Dọn sau, **chỉ khi chủ dự án nói** (CON-08).

## 2. Bảng "ở đâu có gì"

| Năng lực | Nhánh Codex | Nhánh cloud | Ghi chú |
|---|---|---|---|
| Lõi A0/A0.1 (154, parity, CKMLCP, số chứng từ, nguồn sự kiện) | Có | Có | Giống nhau, đừng viết lại |
| 11 báo cáo SAP (FAGLL03, MB51, 5 COOIS, KOB1, KKS1, CK13N, SUP01) | Có | Có (bản độc lập) | **Trùng**; lấy Codex làm gốc, cloud dùng đối chiếu |
| Trang UI "SAP Reports"/xuất RAW kèm hash | Có | Có (S2) | Trùng |
| Adapter RAW→CLEAN, Data Lab, DQ/lineage | Có (`src/adapters`) | Không | Chỉ Codex |
| Controls C01–C07 + review audit trail | Có (`src/controls`) | Không | Chỉ Codex |
| MART chẩn đoán + tóm tắt C08 | Có (`src/mart`) | Không | Chỉ Codex |
| Bộ test | 13 script (parity, s1, s2, a0, reports, health, security, start, ui-finance, s3–s6) | 8 script (parity, s1–s4, a0, health, costing) | Khác tập |
| CI GitHub Actions | **Không** | Có (`.github/workflows/ci.yml`) | Chỉ cloud — nên đưa sang |
| ESLint (cấu hình + giảm nợ 158→42, strict cho mã báo cáo) | Chưa xác minh | Có (S2/S3); còn nợ 40 lỗi (AUD-039) | |
| Oracle giá thành độc lập `oracle_costing.py` + `test:costing` | Không | Có (S3) | Chỉ cloud |
| Q1: bao bì Strategy 25 chỉ trong BOM | **Không** | Có (đổi số) | Xem MỞ-02 |
| Q4/Q5/Q6 (màu, ESD, giờ hiển thị) | **Không** | Có (đổi số/hiển thị) | Chờ duyệt bảng |
| `/api/health` không lộ khóa | Có | Có | Giống nhau |
| `npm start` ESM sửa | Có | Có (AUD-019/032) | Trùng |
| Nhãn TT200 → TT99 | Giữ TT99 (từ main sau brand L1) | Có (AUD-018/031) | Trùng ý |
| Sổ quyết định/audit | `docs-cloud/` 187 file; sổ ngắn "Quyết định cần reviewer độc lập" | `docs-cloud/AUDITOR.md` AUD-010…044 | **Hai sổ khác nhau, chưa hợp nhất** |
| Nghiệm thu P0 (M01–M10, review pack, golden candidates) | Có (NOT_ACCEPTED) | Không | Chỉ Codex |
| Gói kế hoạch `docs/implementation` (00–18) | Có | Không | |

## 3. Cloud S1–S4: trùng hay mới?

| Phiên cloud | Việc chính | Đánh giá |
|---|---|---|
| S1 | Vá `/api/health`; 10 báo cáo mới + đối soát 54 ca; đổi nhãn TT200→TT99; sửa `npm start` | **Phần lớn trùng** Codex (báo cáo, ESM). Còn lại trùng ý |
| S2 | CI GitHub Actions; ESLint; trang "Báo cáo SAP" 11 báo cáo | **Nửa trùng** (trang báo cáo); CI/ESLint là **mới** |
| S3 | Dọn PR tồn; hợp nhất sổ AUD; oracle giá thành độc lập; Q1 (đổi số); gỡ `__pycache__` | **Mới** (Q1 làm đổi số) |
| S4 | Q4/Q5/Q6; đồng bộ màn bóc tách; báo cáo cuối | **Mới** (đổi số/hiển thị) |

Hai bảng đánh số "S" khác nhau: S3/S4/S5/S6 của Codex = adapter / controls / MART / QA; S3/S4 của cloud = giá thành. Khi ghi nhật ký luôn kèm tên nhánh.

## 4. Các file hai bên cùng sửa (điểm xung đột khi gộp)

`package.json`, `server.ts`, `netlify/functions/chat.mts`, `netlify/functions/health.mts`, `src/reports/core.ts`, `src/App.tsx`, `src/components/{BOMVisualizer,LedgerPanel,OrderProfitDashboard,SetupScreen,SpecialStockPanel,StepCard}.tsx`.
(Danh sách tính từ điểm rẽ `10c6906`; sẽ tính lại ngay trước mỗi PR.)

## 5. Thứ tự đưa phần cloud sang nhánh Codex (đề xuất, chờ chủ dự án duyệt)

Nguyên tắc: mỗi bước một PR riêng nhắm vào nhánh gốc, không vào `main`; chạy toàn bộ test; thay đổi đổi số phải có "oracle FAIL trước" và bảng trước/sau do chủ dự án duyệt.

0. **Điều kiện:** push nhánh Codex lên GitHub (CON-13). Tạo nhánh tích hợp từ nhánh Codex.
1. **PR-1 CI** — đưa `.github/workflows/ci.yml`, điều chỉnh để chạy các script test của nhánh Codex. Không đổi số.
2. **PR-2 Oracle giá thành (chỉ đo)** — thêm `oracle_costing.py`, `costing_inputs/expected`, `test:costing`; chạy trên mã Codex để xem lệch ở đâu. Chưa sửa mã tính.
3. **PR-3 Q1 (bao bì S25 chỉ trong BOM)** — đổi số. Sinh lại `a0_expected.json`, sau đó các báo cáo 54×11 và chỉ số MART phải khớp lại. Cần MỞ-02.
4. **PR-4 Q4 + Q5** — đổi số/BOM; bảng trước/sau.
5. **PR-5 Q6 + đồng bộ màn bóc tách** — chỉ trình bày; hợp nhất với UI Codex (xung đột 12 file mục 4).
6. **PR-6 ESLint** — cấu hình + giảm nợ; bật chế độ nghiêm sau khi xong (AUD-039).
7. **Hợp nhất sổ AUD** — đánh số lại thống nhất; không đè sổ nào.
8. **Dọn nhánh** — chỉ theo lệnh chủ dự án.

Mỗi PR dừng lại để chủ dự án/reviewer độc lập duyệt trước PR kế tiếp.

## 6. Việc không đưa sang

- Báo cáo/UI báo cáo của nhánh cloud (trùng).
- Bất kỳ thay đổi nào chạm `calculator.ts`, `acdoca.ts`, `materialLedger.ts` mà chưa có test oracle FAIL (CON-09, quy tắc nhánh cloud).

## 7. Rủi ro đã biết

1. Nhánh Codex chỉ có một bản sao cho tới khi push.
2. Q1/Q4/Q5 đổi số → các chỉ số S5 (648 bản ghi), oracle 54 ca, ca golden DRAFT phải sinh lại; nếu bỏ qua sẽ có hai bộ số kế hoạch khác nhau.
3. Hai sổ AUD đánh số trùng/khác tiêu chí (Obsidian 001–012; repo cloud 010–044; Codex dùng định dạng riêng).
4. "Reviewer độc lập" của cả hai nhánh chủ yếu là agent; nghiệm thu thật cần golden set của chủ dự án và đối chiếu TT99/PDF.
