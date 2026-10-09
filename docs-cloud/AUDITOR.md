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

## AUD-015 — SUP01 không phải T-code SAP chuẩn — CẦN CHỦ DỰ ÁN XÁC NHẬN
- Brief liệt kê SUP01 nhưng không định nghĩa; trong repo không có tham chiếu. Diễn giải tạm: **báo cáo tổng hợp lệnh SX ↔ đơn bán MTO** (SL đặt/giao, giá thành KH/TT, dở dang 154, giá vốn kết chuyển 911, doanh thu 511, lãi gộp).
- Nếu ý định khác (vd báo cáo nhà cung cấp, báo cáo bổ sung) → thay `buildSup01` và phần SUP01 trong `scripts/s3-reports.ts`.

## AUD-016 — KKS1: định nghĩa chi phí mục tiêu và chênh lệch
- Mục tiêu = round(Kế hoạch × SL giao/SL lệnh); Dở dang = Thực tế − Có nhập kho − Kết chuyển VA88; Chênh lệch = Thực tế − Mục tiêu − Dở dang.
- Hàng có định giá: Chênh lệch = số VA88 kết chuyển. Hàng không định giá: Chênh lệch = round(A·r) − round(P·r), có thể lệch ±1 VND so với round(Δ·r) khi giao một phần (do làm tròn). Test chỉ so oracle Δ·r ở tỷ lệ giao 0%/100%; ca 50% kiểm bằng hằng đẳng thức + số dư 154.
- SAP thật tách chênh lệch theo loại (giá, lượng, năng suất, lô); simulator chỉ có tổng.

## AUD-017 — Báo cáo logistics dùng giả định số lượng của A0.1
- MB51/COOIS kế thừa giả định AUD-001/AUD-012 (lượng thực tế = kế hoạch × hệ số chi phí). Một công đoạn (0010), một xác nhận, một lệnh/kịch bản. Mở rộng nhiều công đoạn/xác nhận cần cập nhật `scenarioEvents.ts` trước.
- `COOIS_GM` bỏ 601 (xuất giao hàng thuộc giao hàng, không thuộc lệnh) — giống SAP.
