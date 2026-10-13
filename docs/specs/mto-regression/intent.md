# Intent — MTO regression (a) bảo mật key, (b) regression 261E/101E/601E, (c) thống nhất thuật ngữ

Trạng thái: **bản nháp chờ chủ dự án duyệt.** Các ngưỡng đánh dấu *(đề xuất)* là số do phiên này đặt, chưa được chốt.
Chuẩn kế toán: TT99. Thuật ngữ: `docs/GLOSSARY.md` là nguồn chuẩn. Quy tắc cứng: kế thừa `CLOUD_BRIEF.md` (cấm test fallback tự PASS, không sửa số học để test xanh).

## 1. Mục tiêu
1. Gemini API key không lộ ra client, git hay log, và `/api/chat` không bị dùng hộ gây tốn quota.
2. Logic 261E/101E/601E và hạch toán TT99 của simulator được khóa bằng test đối chiếu với đáp án do chủ dự án duyệt, không phải với chính mã.
3. App, tutor và tài liệu dùng cùng một bộ thuật ngữ đã chốt.

## 2. Nguyên tắc kiểm chứng
- **Nguồn sự thật cho (b)** là `golden/` do chủ dự án duyệt từng dòng. Bản nháp golden do một phiên mới viết, **không đọc code**, mỗi dòng có căn cứ. Dòng không có căn cứ ghi "chưa có căn cứ", không điền.
- Phiên viết code ≠ phiên kiểm chứng. Bằng chứng nằm ở hệ thống Claude tự chạy được (grep, build, DB/API) thì Claude tự kiểm, không nhờ coder chứng minh.
- Mọi test fail phải `exit != 0`. Cấm nhánh fallback sinh dữ liệu giả rồi in PASS. Mock gắn `[MOCK]`, không tính vào PASS.
- Test khóa hành vi hiện tại. Lệch golden thì FAIL và báo cáo, **không tự sửa số**. Sửa số học chỉ khi test oracle chứng minh lỗi, và ghi `docs-cloud/CHANGELOG.md`.

## 3. Phạm vi

### (a) Bảo mật `/api/chat`
Đã xong ở S1, giữ làm kiểm tra thường trực: `/api/health` chỉ trả `hasApiKey`; không có chuỗi `AIza[0-9A-Za-z_-]{30,}` trong working tree, git history, `dist/`.
Làm mới:
- Chặn origin ngoài danh sách cho phép (biến env `ALLOWED_ORIGINS`).
- Giới hạn kích thước body, và độ dài `message` / `context`.
- Giới hạn tần suất theo IP. Function Netlify không giữ trạng thái giữa các instance, nên bộ đếm trong bộ nhớ không đáng tin. Dùng cấu hình rate limit của Netlify, **cần xác minh với tài liệu Netlify trước khi triển khai**.
- Hạn mức chi tiêu trên Google Cloud: ngoài code, chủ dự án tự đặt.
- Hai bản `chat.mts` và `server.ts` phải có cùng giới hạn.

### (b) Regression 261E/101E/601E
- Ma trận: 261E, 101E, 601E × {valuated, non-valuated}, cộng Bước 7 non-valuated (632/154).
- Golden gồm **đầu vào** (số lượng, giá kế hoạch, tỷ lệ giao) và **đáp án** (tài khoản Nợ/Có, vai trò số tiền, số lượng kho E). Test chạy engine với đầu vào đó rồi so với đáp án.
- Non-valuated: kiểm 101E/601E không sinh bút toán tài chính và số lượng kho E đúng.
- Không đổi `calculator.ts`, `acdoca.ts`, `materialLedger.ts` trong phạm vi này.
- Phụ thuộc: bảng "Ánh xạ tài khoản TT99" trong glossary do chủ dự án điền xong.

### (c) Thuật ngữ nhất quán
- Sửa prompt tutor và `TCodeLookupModal.tsx` (và mô tả 261E/101E/601E, Strategy 20, non-valuated ở `AITutorDrawer.tsx`, `StepCard`/`calculator.ts` nếu lệch glossary) theo glossary.
- Gom prompt về **một nguồn** (`systemInstruction` đang nhân bản ở `chat.mts` và `server.ts`), cả hai import từ đó.
- Test đối chiếu thuật ngữ với glossary (kiểm tĩnh trên văn bản, không gọi LLM).
- Quyết toán lệnh sản xuất về SO (KO88/CO88) ngoài phạm vi; không được dạy như thể được mô phỏng.

### Ngoài phạm vi
Sửa số học; Material Ledger; QM; đổi hạ tầng hosting; kiểm tra chất lượng câu trả lời của Gemini (không tất định).

## 4. Ngưỡng PASS/FAIL
**(a)**
- A1: `grep AIza[...]{30,}` trên working tree, `git log --all -G`, `dist/` = 0 kết quả.
- A2: `/api/health` không trả ký tự nào của key (chỉ `hasApiKey`).
- A3: body > 32 KB *(đề xuất)* → 413. `message` > 2000 ký tự *(đề xuất)* → 400.
- A4: origin ngoài danh sách → 403. `ALLOWED_ORIGINS` chưa đặt → từ chối (fail closed) *(đề xuất, cần chủ dự án xác nhận)*.
- A5: vượt 20 req/phút/IP *(đề xuất)* → 429.
- A6: mỗi điều A3–A5 có test âm tính: nới giới hạn thì test phải FAIL.

**(b)**
- B1: 100% dòng golden khớp (tài khoản Nợ, tài khoản Có, vai trò số tiền, số lượng). Một dòng lệch = FAIL, `exit != 0`, in danh sách dòng lệch.
- B2: test âm tính: đổi 1 số hoặc 1 tài khoản trong bản sao golden thì test phải FAIL.
- B3: `golden/` có manifest SHA-256; test FAIL nếu golden đổi mà manifest không đổi theo, hoặc thiếu mốc "đã duyệt" của chủ dự án.
- B4: không script nào có nhánh sinh dữ liệu giả; nếu thiếu golden thì test báo **thiếu golden** và `exit != 0`, không báo PASS.
- B5: số học trong `src/` không đổi (diff rỗng ở ba file trên).

**(c)**
- C1: `systemInstruction` định nghĩa đúng 1 nơi; `chat.mts` và `server.ts` đều import từ đó.
- C2: 0 cụm bị cấm trong mọi văn bản UI/prompt. Bộ khởi đầu: "xuất NVL cho đơn hàng bán" (261E), "không dùng chung vật tư" (Strategy 20), và mô tả KO88/CO88 như bước được mô phỏng.
- C3: mô tả mỗi movement type và Strategy 20/25 khớp định nghĩa trong glossary (kiểm theo từ khóa bắt buộc, ví dụ 261E phải nêu "lệnh sản xuất").
- C4: test âm tính: chèn lại một cụm bị cấm thì test phải FAIL.

## 5. Quy trình và thứ tự
1. Chủ dự án điền "Ánh xạ tài khoản TT99" trong glossary.
2. Phiên mới, không đọc code, viết bản nháp golden với căn cứ; chủ dự án duyệt từng dòng; đưa vào `golden/` kèm manifest.
3. Phiên viết code thực hiện (a), (b), (c) theo thứ tự này, mỗi phần một commit.
4. Phiên kiểm chứng riêng chạy test và báo bằng chứng thật (lệnh và output).
5. Báo cáo cuối ≤ 30 dòng: việc xong, số liệu test thật, việc dở, rủi ro.

## 6. Rủi ro và câu hỏi mở
- Thư mục docs chính thức: `docs/` hay `docs-cloud/`? Hiện có cả hai; `AUDITOR.md` và `CHANGELOG.md` nằm ở `docs-cloud/`.
- Issue tracker local: `docs/issues/` hay sổ AUD?
- Bộ đếm rate limit phụ thuộc tính năng Netlify; nếu không có thì chỉ còn hạn mức chi tiêu phía Google.
- Golden chỉ đúng khi bảng ánh xạ đúng. Sai ở đó thì cả regression khóa nhầm.
- Tutor sinh câu trả lời bằng LLM nên (c) chỉ đảm bảo văn bản tĩnh, không đảm bảo câu trả lời cuối cùng.
