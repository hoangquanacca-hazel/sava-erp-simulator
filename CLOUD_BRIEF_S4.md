# CLOUD_BRIEF — Session 4 (SAVA ERP MTO Simulator)

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

## Quyết định chủ dự án (ĐÃ CHỐT 10/10/2026)
Số liệu dưới đây do `oracle_costing.py` tính trên `feat` @d4f8a63 (09/10/2026); ΔP đã gồm SXC 8% trên (621 + 622).
Agent S4 phải tự tính lại bằng oracle, không chép số từ đây.

- **Q4 — Màu Strategy 25 (AUD-037), hiện tính 2 lần:** +6.500/kg vào giá nhựa nền (756.860) **và** dòng `ROH-MB-COLOR`
  0,28 kg/1.000 × 325.000 (735.280) — dòng masterbatch được dựng sao cho ≈ phần /kg.
  - (a) Bỏ phụ phí màu khỏi giá nhựa/kg, **giữ dòng masterbatch** — **đề xuất** (SAP: hạt màu là 1 dòng BOM, giá nhựa nền không đổi). Denso ΔP = **−817.409**.
  - (b) Giữ /kg, bỏ dòng masterbatch. Denso ΔP = −794.103 (mất dòng BOM khỏi CS03/MB51/COOIS).
  - (c) Giữ nguyên (cố ý) — ghi lý do nghiệp vụ.
  - **Chốt: (a)** — bỏ `colorResinAddon` khỏi giá nhựa nền; giữ dòng `ROH-MB-COLOR`.
- **Q5 — Texture ESD (AUD-037):** +1.200/kg vào giá nhựa (139.728) và +1.500/cái vào add-on (12.000.000), hai cơ sở khác nhau.
  - (a) Giữ cả hai (cố ý: phụ gia ESD trộn theo kg + công đoạn phủ theo cái), **đổi trình bày**: phần /kg thành dòng
    BOM riêng `ROH-ADD-ESD` (621), phần /cái giữ add-on 627 nhưng gắn tên hoạt động. P không đổi; BOM/MB51/COOIS đổi — **đề xuất**.
  - (b) Bỏ phần /kg (chỉ còn công đoạn phủ). Denso ΔP = −150.906.
  - (c) Bỏ phần /cái (chỉ còn phụ gia). Denso ΔP = −12.000.000.
  - **Chốt: (a)** — giữ cả hai khoản; tách phần /kg thành dòng BOM `ROH-ADD-ESD` (621); P không đổi (± 1 VND làm tròn/dòng).
- **Q6 — Giờ công nhân công chế độ "theo giờ" (AUD-038):** hiện `622 = giờ vận hành máy × đơn giá công`, bỏ qua
  `laborHours` (Samsung nhập 250 h, tính 220,94 h; Denso nhập 320 h, tính 292,61 h). Canon chế độ "tổng" → không ảnh hưởng.
  - (a) `622 = laborHours × đơn giá công`; máy giữ theo giờ máy. Samsung ΔP = **+2.040.012**, Denso ΔP = **+2.011.521**.
  - (b) Giữ công thức (1 thợ/máy, giờ công = giờ máy), sửa UI/`buildBOMTree` hiển thị đúng giờ thực tính; bỏ hoặc khóa ô `laborHours`. P không đổi.
  - (c) Tỷ lệ tổ đội: `622 = giờ vận hành × (laborHours / machineHours) × đơn giá` — giữ setup 1,5 h cho cả thợ.
  - **Chốt: (b)** — KHÔNG đổi số học 622. Chỉ sửa trình bày: mọi nơi hiển thị giờ công ở chế độ "theo giờ" dùng giờ
    vận hành thực tính (`computed.operatingHours`); ô `laborHours` ở chế độ "theo giờ" chuyển chỉ-đọc, hiển thị giá trị
    thực tính kèm chú thích "1 thợ/máy, gồm 1,5 h setup". Không xóa trường `laborHours` khỏi kiểu dữ liệu / preset.

## Nhiệm vụ Session 4 (theo thứ tự)
T0. Bước 0 + chạy toàn bộ `npm run lint lint:eslint:strict test:parity test:s1 test:health test:s2 test:costing test:a0 test:s3 build` trên gốc; ghi kết quả.
T1. **Q4 = (a)**: oracle → log FAIL → sửa `calculator.ts` (giá nhựa nền bỏ `colorResinAddon`; dòng `ROH-MB-COLOR` giữ nguyên)
    → sinh lại đáp án bằng oracle → toàn bộ test PASS. Kỳ vọng chỉ Denso đổi (≈ −817.409).
T2. **Q5 = (a)**: giá nhựa nền bỏ `textureResinAddon`; thêm dòng BOM `ROH-ADD-ESD` (khi texture có phụ phí/kg > 0):
    định mức = định mức nhựa kg/1.000, hao hụt 2,5% (như nhựa nền), đơn giá = phụ phí texture/kg, TK 621/152.
    P không đổi ± 1 VND làm tròn/dòng (vẫn theo quy tắc 10: oracle trước — test FAIL vì có dòng BOM mới).
    Kiểm MB51/COOIS_CMP/CK13N có dòng mới và Σ vẫn = ACDOCA. Phần /cái giữ ở add-on 627, ghi tên hoạt động.
T3. **Q6 = (b) — chỉ trình bày, KHÔNG đổi số:** `BOMVisualizer.tsx:177` (đang hiện "`laborHours` giờ @ …"),
    `buildBOMTree`/bảng định mức `calculator.ts:1509, 1584–1585` (đang dùng `laborHours`), ô nhập `laborHours` ở
    `SetupScreen.tsx` → hiển thị `operatingHours` khi chế độ "theo giờ". Sự kiện `scenarioEvents.ts:143–146` đã dùng
    `operatingHours` → giữ nguyên. Kiểm: `test:costing`, `test:a0`, `test:s3` không đổi một byte đáp án; thêm test: giờ công
    hiển thị × đơn giá = 622 cho 3 preset. Sửa ở `calculator.ts:1509+` là trình bày, không phải số học — vẫn ghi CHANGELOG.
T4. **AUD-040**: đồng bộ `BOMVisualizer.tsx:112–129` và `buildBOMTree` (`calculator.ts:1490+`) với chính sách đã chốt
    (bao bì → 621; màu/texture theo Q4/Q5). Thêm test: tổng bóc tách màn hình = `computeMTO.plannedCost` cho 40 ca `test:costing`.
T5. Bảng trước/sau `docs-cloud/S4_COSTING_BEFORE_AFTER.md`: từng ca a0 (P, CL, 154, 632, 911) + từng ca `test:costing`
    (M, L, O, P), tách cột theo Q4/Q5 (Q6 không đổi số). Cập nhật `GIAODICH_TT99.md` nếu có dòng BOM/tài khoản mới.

## Tiêu chí nghiệm thu (PASS/FAIL)
- PASS-1: CI xanh trên mọi PR S4; log FAIL trước sửa cho từng quyết định có đổi số.
- PASS-2: đối chứng từng byte theo quy tắc 11 cho từng commit sửa số.
- PASS-3: ΔP từng preset khớp số oracle tự tính; nếu Δ Denso Q4(a) lệch −817.409 quá ± 2 VND, Q5(a) làm P Denso đổi
  quá ± 2 VND, hoặc Samsung/Canon đổi bất kỳ số nào → **dừng, báo** (dấu hiệu còn khoản khác).
- PASS-4: Σ 11 báo cáo = Σ ACDOCA trên 54 ca sau sửa; MB51/COOIS_CMP/CK13N có dòng `ROH-ADD-ESD`; giờ công hiển thị × đơn giá = 622.
- PASS-5: không dòng `main` nào bị đổi; không file bị xóa; không `.pyc`/rác trong diff.
- Cuối phiên: báo cáo ≤ 30 dòng (việc xong, số test trích log CI, việc dở, rủi ro).

## Tiết kiệm credit
Thứ tự: T0 (≈ 5%) → T1 (≈ 25%) → T2 (≈ 30%) → T3 (≈ 10%) → T4 (≈ 20%) → T5 (≈ 10%).
Đọc trước: `scripts/oracle_costing.py`, `src/utils/calculator.ts` 68–235, `src/events/scenarioEvents.ts` 120–160, `src/reports/logistics.ts` (COOIS_OPR/CNF).
Dừng và báo nếu một task vượt ~25% dự kiến. PR: (1) T1+T2+T5 đổi số — chờ duyệt bảng; (2) T3+T4 trình bày — không đổi số.
