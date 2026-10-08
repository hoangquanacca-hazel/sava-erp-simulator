# AUDITOR — sổ rủi ro / nợ kỹ thuật (Cloud Session 1)

AUD-001…AUD-009, AUD-011, AUD-012 được tham chiếu trong mã (`scenarioEvents.ts`, `core.ts`, `a0-ckmlcp.ts`) nhưng nội dung chưa có trong repo — cần chủ dự án bổ sung (xem AUD-021).

## AUD-010 — Lint/build có sẵn (T0, 08/10/2026, nhánh `feat/sim-p0-mfg` @10c6906)
- `npm ci` 0 · `lint` (tsc --noEmit) 0 · `test:parity` 0 · `test:s1` 0 · `test:s2` 0 · `test:a0` 0 · `build` 0.
- Lỗi lint có sẵn: **không có** (0 lỗi tsc).
- Cảnh báo build có sẵn (không chặn exit): (1) chunk JS > 500 kB của Vite; (2) esbuild `empty-import-meta` ở `server.ts:10` → xem AUD-019.

## AUD-013 — `/api/health` lộ siêu dữ liệu khóa Gemini (ĐÃ VÁ)
- Trước: `netlify/functions/health.mts` trả `keyLen`, `keyPrefix` (4 ký tự đầu) và `looksValid`. Tiền tố + độ dài giúp đoán/định danh khóa.
- Sau: chỉ còn `status`, `app`, `hasApiKey`. `server.ts` vốn chỉ trả `hasApiKey`.
- Khóa chỉ được đọc từ env phía server: `chat.mts`/`health.mts` (Netlify.env → process.env), `server.ts` (process.env). Không có `VITE_*`/`import.meta.env`/`define` đưa khóa vào bundle client; `dist/` không chứa chuỗi khóa.
- Quét `AIza[0-9A-Za-z_-]{30,}`: working tree (trừ node_modules) 0; `dist/` 0; toàn bộ lịch sử git mọi ref (25 commit, không shallow; diff + message) 0. Chỉ có chuỗi `AIza` trơn trong regex/ghi chú.
- Rủi ro còn lại: không kiểm được khóa đã từng lộ qua kênh khác (log Netlify, ảnh chụp). Nếu từng chia sẻ URL `/api/health` kèm `keyPrefix`, cân nhắc xoay khóa.

## AUD-014 — "SUP01" không phải T-code SAP chuẩn — DIỄN GIẢI TẠM, CẦN CHỦ DỰ ÁN XÁC NHẬN
- Đã hiện thực SUP01 = *Supporting reconciliation* của simulator: mỗi dòng so tổng 1 báo cáo logistics/CO với tổng ACDOCA theo TK + mã giao dịch, có DIFF/STATUS.
- Nếu SUP01 trong golden set mang nghĩa khác (vd. danh sách NCC, báo cáo Z nội bộ), cần đổi; lõi đối soát vẫn tái dùng được.
- PASS-3 ghi "11 báo cáo": phiên này giao 10 báo cáo mới (MB51, COOIS×5, KOB1, KKS1, CK13N, SUP01) + FAGLL03 đã có = 11.

## AUD-015 — Bố cục báo cáo là MÔ PHỎNG; cột "(SIM)" không phải trường SAP chuẩn
- COOIS chuẩn không có cột giá trị; đã thêm `PLAN_COST`, `ACT_COST`, `PLAN_VAL`, `ACT_VAL`, `LAB_VAL`, `MOH_VAL` (gắn "(SIM)") để đối soát FI.
- KOB1 loại bút toán kết chuyển `CO01` (Nợ 154 / Có 621-622-627) vì trong SAP lệnh sản xuất chính là đối tượng tập hợp (≈154); nếu đưa vào sẽ đếm chi phí 2 lần. Hệ quả: Σ KOB1 = số dư 154 cuối kỳ.
- VRGNG suy theo T-code (RMWA/RKL/RMWE/KOAO) — gần đúng, không phải bảng TJ01 thật.
- Ngày hạch toán/kỳ dùng chung `SIM_CONFIG.postingDate` (một kỳ duy nhất) — chưa mô phỏng nhiều kỳ / WIP chuyển kỳ.

## AUD-016 — KKS1 chưa tách loại chênh lệch; WIP và TARGET được phân bổ
- Chỉ có tổng chênh lệch theo yếu tố 621/622/627; chưa tách giá/lượng/năng suất/remaining (SAP: PRV, QTV, RUV, RSV…). Sự kiện hiện tại suy lượng/giờ thực tế = kế hoạch × hệ số (AUD-001/012) nên tách giá–lượng sẽ là số giả định.
- WIP tổng = ACTUAL(sự kiện) − ghi Có lệnh trên FI (101E + quyết toán); chia theo tỷ trọng ACTUAL. TARGET tổng = PLAN × SL giao/SL lệnh; chia theo PLAN (số dư lớn nhất). Tổng khớp tuyệt đối; từng yếu tố là phân bổ.
- Hàng không định giá: FI không ghi Có lệnh khi nhập kho, VARIANCE = quyết toán − TARGET (chỉ tiêu phân tích, không có bút toán riêng).

## AUD-017 — Nghi tính trùng bao bì ở Strategy 25 (Denso) — CHƯA SỬA (quy tắc 3)
- `computeMTO`: khi Strategy 25 và không có `bomItems`, BOM tự sinh dòng `VERP-PACKAGING` (đơn giá = phụ phí bao bì) **và** `variantAddonTotal` cũng cộng `orderQuantity × packagingUnitAddon`.
- Denso: BOM VERP 14.544.000 + phần bao bì trong addon 14.400.000 (8.000 × 1.800) → giá thành kế hoạch có thể bị đội ~14,4 tr (~12,6% của P = 113.882.210).
- Oracle `a0_oracle.py` dùng cùng P nên test xanh — **test xanh không chứng minh nghiệp vụ đúng**. Cần chủ dự án quyết định ý đồ nghiệp vụ trước khi sửa cả TS lẫn oracle.

## AUD-018 — Nhãn "Thông tư 200" còn trong văn bản giao diện
- `calculator.ts` (mô tả bước 3/6, khoảng dòng 320, 344, 865) còn chữ "Thông tư 200" trong khi chuẩn dự án là TT99. Không phải số học; không sửa trong phiên này vì file thuộc vùng bảo vệ — đề xuất 1 PR riêng chỉ đổi chuỗi.

## AUD-019 — `npm start` (dist/server.cjs) sập khi khởi động
- esbuild xuất CJS → `import.meta.url` rỗng → `fileURLToPath(undefined)` ném `ERR_INVALID_ARG_TYPE` (đã chạy thử xác nhận).
- Netlify chỉ dùng `vite build` + Functions nên production không bị ảnh hưởng; chỉ đường chạy Node tự host. Không sửa (ngoài phạm vi). Gợi ý: build `--format=esm` hoặc dùng `__dirname` của CJS.

## AUD-020 — Dung sai 1 VND theo thành phần giá vốn
- CK13N × tỷ lệ giao so với 632110–632140 (601E) được phép lệch ≤ 1 VND **từng thành phần** do phân bổ số dư lớn nhất; **tổng** phải khớp tuyệt đối (đã test).

## AUD-021 — Bộ nhớ quyết định chưa nằm trong repo
- Thư mục `golden/` không tồn tại; nội dung AUD-001…012 không có trong repo. Đáp án duy nhất dùng được trong phiên: `scripts/a0_expected.json`. Khi có golden set, cần chạy lại `test:s3` với golden.

## AUD-022 — Bút toán SXC máy Nợ 627 / Có 214 là đơn giản hoá
- CO11N ghi toàn bộ chi phí máy + SXC thực tế vào Có 214 (hao mòn). Thực tế chi phí giờ máy gồm điện, bảo trì, vật tư phụ (Có 331/152/334…). Ảnh hưởng: số dư 214 bị phóng đại trên BCTC mô phỏng. Không đổi số học trong phiên này.
