# CLOUD_BRIEF — Session 4 (SAVA ERP MTO Simulator) — BẢN NHÁP, CHỜ CHỐT Q4–Q6

Branch gốc: `feat/sim-p0-mfg` @ `d4f8a63` (đã gộp S3 #9 + #10). KHÔNG làm trên `main`. Thuần trình duyệt, chuẩn **TT99**.
Mở nhánh con `cloud/s4-*`, PR về `feat/sim-p0-mfg`, KHÔNG merge vào main.
Phạm vi: **AUD-037** (phụ phí màu/texture Strategy 25) và **AUD-038** (giờ công nhân công). AUD-040 (màn hình bóc tách) làm kèm nếu Q4 chốt.

## Bước 0 bắt buộc
1. Liệt kê PR đang mở + nhánh `cloud/*`; đọc `docs-cloud/AUDITOR.md` (AUD-030…040), `CHANGELOG.md`, `S3_COSTING_BEFORE_AFTER.md`.
2. Nếu PR #11 (`cloud/s3-pycache`) chưa merge: rebase nhánh S4 lên `feat` sau khi merge, hoặc chạy test xong `git checkout -- scripts/__pycache__/`.
3. Phát hiện việc trùng → dừng, báo.

## Quy tắc cứng
1–9. Kế thừa nguyên văn `CLOUD_BRIEF.md` (1–6) và `CLOUD_BRIEF_S3.md` (7–9): cấm fallback giả PASS; không sửa đáp án
     cho khớp; không đổi `calculator.ts`/`acdoca.ts`/`materialLedger.ts` khi chưa có test oracle FAIL; không đụng
     `netlify.toml`, env, lịch sử git, `main`; không xóa file; CI xanh trên PR; một sổ AUD; sửa số học chỉ khi đã chốt +
     oracle FAIL trước + PR riêng kèm bảng trước/sau được duyệt.
10. **Thứ tự sửa: oracle trước, TS sau.** Sửa `scripts/oracle_costing.py` theo chính sách đã chốt → `test:costing` PHẢI
    FAIL (lưu log `docs-cloud/evidence/s4_*_before_fix.log`) → mới sửa `calculator.ts`. Đáp án `costing_expected.json`,
    `a0_expected.json` CHỈ sinh bằng `python3 scripts/oracle_costing.py` / `a0_oracle.py`.
11. **Đối chứng tách bạch:** mỗi quyết định (Q4, Q5, Q6) một commit riêng; với mỗi commit, oracle mới + tắt đúng quyết
    định đó phải tái tạo đáp án commit trước (từng byte) → chứng minh chỉ thay đổi đúng điều đã quyết.
12. `git add` từng file cụ thể — **cấm `git add -A` / `git add .`** (bài học S3: `.pyc` lọt vào `feat`).
13. Mục AUD mới từ **AUD-041**.

## Quyết định chủ dự án (CHƯA CHỐT — điền trước khi chạy phiên)
Số liệu dưới đây do `oracle_costing.py` tính trên `feat` @d4f8a63 (09/10/2026); ΔP đã gồm SXC 8% trên (621 + 622).
Agent S4 phải tự tính lại bằng oracle, không chép số từ đây.

- **Q4 — Màu Strategy 25 (AUD-037), hiện tính 2 lần:** +6.500/kg vào giá nhựa nền (756.860) **và** dòng `ROH-MB-COLOR`
  0,28 kg/1.000 × 325.000 (735.280) — dòng masterbatch được dựng sao cho ≈ phần /kg.
  - (a) Bỏ phụ phí màu khỏi giá nhựa/kg, **giữ dòng masterbatch** — **đề xuất** (SAP: hạt màu là 1 dòng BOM, giá nhựa nền không đổi). Denso ΔP = **−817.409**.
  - (b) Giữ /kg, bỏ dòng masterbatch. Denso ΔP = −794.103 (mất dòng BOM khỏi CS03/MB51/COOIS).
  - (c) Giữ nguyên (cố ý) — ghi lý do nghiệp vụ.
  - **Chốt: ___**
- **Q5 — Texture ESD (AUD-037):** +1.200/kg vào giá nhựa (139.728) và +1.500/cái vào add-on (12.000.000), hai cơ sở khác nhau.
  - (a) Giữ cả hai (cố ý: phụ gia ESD trộn theo kg + công đoạn phủ theo cái), **đổi trình bày**: phần /kg thành dòng
    BOM riêng `ROH-ADD-ESD` (621), phần /cái giữ add-on 627 nhưng gắn tên hoạt động. P không đổi; BOM/MB51/COOIS đổi — **đề xuất**.
  - (b) Bỏ phần /kg (chỉ còn công đoạn phủ). Denso ΔP = −150.906.
  - (c) Bỏ phần /cái (chỉ còn phụ gia). Denso ΔP = −12.000.000.
  - **Chốt: ___**
- **Q6 — Giờ công nhân công chế độ "theo giờ" (AUD-038):** hiện `622 = giờ vận hành máy × đơn giá công`, bỏ qua
  `laborHours` (Samsung nhập 250 h, tính 220,94 h; Denso nhập 320 h, tính 292,61 h). Canon chế độ "tổng" → không ảnh hưởng.
  - (a) `622 = laborHours × đơn giá công`; máy giữ theo giờ máy. Samsung ΔP = **+2.040.012**, Denso ΔP = **+2.011.521**.
  - (b) Giữ công thức (1 thợ/máy, giờ công = giờ máy), sửa UI/`buildBOMTree` hiển thị đúng giờ thực tính; bỏ hoặc khóa ô `laborHours`. P không đổi.
  - (c) Tỷ lệ tổ đội: `622 = giờ vận hành × (laborHours / machineHours) × đơn giá` — giữ setup 1,5 h cho cả thợ.
  - **Chốt: ___**  ⚠ Q6 (a)/(c) đổi số cả **Samsung (Strategy 20)** → 36/54 ca a0 đổi, không chỉ Denso.

## Nhiệm vụ Session 4 (theo thứ tự)
T0. Bước 0 + chạy toàn bộ `npm run lint lint:eslint:strict test:parity test:s1 test:health test:s2 test:costing test:a0 test:s3 build` trên gốc; ghi kết quả.
T1. **Q4** (nếu ≠ c): oracle → log FAIL → sửa `calculator.ts` (dòng nhựa nền bỏ `colorResinAddon`) → sinh lại đáp án → toàn bộ test PASS.
T2. **Q5** (nếu ≠ giữ nguyên): như T1. Nếu (a): thêm dòng BOM `ROH-ADD-ESD` (định mức = định mức nhựa × hao hụt nhựa,
    đơn giá = phụ phí/kg) sao cho P không đổi ± 1 VND/dòng; kiểm MB51/COOIS_CMP/CK13N có dòng mới và Σ vẫn = ACDOCA.
T3. **Q6** (nếu ≠ b): như T1, **đồng thời** sửa `src/events/scenarioEvents.ts:143–146` — hiện `plannedLaborHours =
    operatingHours`; phải tách giờ công / giờ máy để CO11N, COOIS_OPR/CNF, KOB1 hiển thị đúng giờ công. Thêm kiểm trong
    `test:s3`: Σ giờ công × đơn giá = 622 trên COOIS_CNF. Nếu (b): chỉ sửa UI, không đụng số học.
T4. **AUD-040**: đồng bộ `BOMVisualizer.tsx:112–129` và `buildBOMTree` (`calculator.ts:1490+`) với chính sách đã chốt
    (bao bì → 621; màu/texture theo Q4/Q5). Thêm test: tổng bóc tách màn hình = `computeMTO.plannedCost` cho 40 ca `test:costing`.
T5. Bảng trước/sau `docs-cloud/S4_COSTING_BEFORE_AFTER.md`: từng ca a0 (P, CL, 154, 632, 911) + từng ca `test:costing`
    (M, L, O, P), tách cột theo Q4/Q5/Q6. Cập nhật `GIAODICH_TT99.md` nếu có dòng BOM/tài khoản mới.

## Tiêu chí nghiệm thu (PASS/FAIL)
- PASS-1: CI xanh trên mọi PR S4; log FAIL trước sửa cho từng quyết định có đổi số.
- PASS-2: đối chứng từng byte theo quy tắc 11 cho từng commit sửa số.
- PASS-3: ΔP từng preset khớp số oracle tự tính; nếu Δ Denso Q4(a) lệch −817.409 quá ± 2 VND hoặc Q6(a) Samsung lệch
  +2.040.012 quá ± 2 VND → **dừng, báo** (dấu hiệu còn khoản khác).
- PASS-4: Σ 11 báo cáo = Σ ACDOCA trên 54 ca sau sửa; giờ công COOIS khớp 622 (nếu Q6 ≠ b).
- PASS-5: không dòng `main` nào bị đổi; không file bị xóa; không `.pyc`/rác trong diff.
- Cuối phiên: báo cáo ≤ 30 dòng (việc xong, số test trích log CI, việc dở, rủi ro).

## Tiết kiệm credit
Thứ tự: T0 (≈ 5%) → T1 (≈ 20%) → T2 (≈ 20%) → T3 (≈ 35%, đụng sự kiện + báo cáo) → T4 (≈ 15%) → T5 (≈ 5%).
Đọc trước: `scripts/oracle_costing.py`, `src/utils/calculator.ts` 68–235, `src/events/scenarioEvents.ts` 120–160, `src/reports/logistics.ts` (COOIS_OPR/CNF).
Dừng và báo nếu một task vượt ~25% dự kiến. Nếu Q6 = (a)/(c) mà T3 vượt ngân sách → tách PR riêng, làm T1/T2/T4 trước.
