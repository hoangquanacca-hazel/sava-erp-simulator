# Simulator v1 — phiếu review Manufacturing Finance

Ngày: 22/10/2026 (Asia/Saigon). Mốc được người dùng đồng ý: **Simulator v1 đã kiểm thử để dùng học tập**, phạm vi năm workflow. Không thêm report catalogue hay kết nối SAP thật trong mốc này.

## Trạng thái cần phân biệt

- Bản ứng viên: `manufacturing-finance-v1.0.0-rc.1`.
- Chức năng và bằng chứng kỹ thuật: xem `evidence/manufacturing-finance/v1-rc1/`.
- Review nghiệp vụ/học tập: **PENDING_HUMAN_REVIEW**. Phiếu này không tự cấp approval.
- SAP-native **NOT_RUN**, edition/release **UNKNOWN**; không là điều kiện để dùng thử bản mô phỏng có nhãn rõ, cũng không suy thành SAP đã kiểm chứng.
- Giữ công việc song song trong repo; bản ứng viên được định danh bằng file hashes. Chưa deploy, push hoặc merge.

## Mở và chạy bài

Trong `D:\sava-erp-simulator`, chạy `npm run dev`, vào `http://localhost:3000/#/manufacturing-finance`. Bài có sổ riêng; nút xuất của bài nằm ở cuối trang. Header chung vẫn thuộc Cockpit MTO. Có thể đổi SAP Fiori/Classic; khi menu Easy Access mở thì đóng menu để thao tác bài.

1. Thử **Nhận cọc** trước yêu cầu: phải bị chặn. Tạo yêu cầu, nhận 36 triệu, lập invoice 120 triệu.
2. Chạy F150 proposal rồi cấn cọc. Phát hành từ proposal cũ phải bị chặn. Chạy lại proposal và phát hành notice mô phỏng.
3. Chạy bank auto clearing. Item 001 và 002 clearing; item 003 thiếu reference và 004 mơ hồ được giữ lại. Chọn invoice REPAIR-01 12 triệu cho item 003 và xác nhận thủ công.
4. Thử PO 90 triệu: bị chặn. Giữ PO 60 triệu: cảnh báo, được ghi commitment. Ghi invoice sửa khuôn.
5. Ghi thanh toán hộ 60 triệu từ company 1000 cho supplier item của 2000.
6. Xuất JSON và hai TXT FI21/FI22. Chuyển tab rồi quay lại: sổ giữ nguyên. Thay dữ liệu sau xuất: file cũ được cảnh báo cũ. Đặt lại riêng bài: sổ, số tiền nhập và lựa chọn clearing trở về mặc định. Reload: bắt đầu lại vì dữ liệu chỉ ở RAM.

## Bảng kết quả để người review kiểm tra

Đây là expected outcome của **fixture demo**, không phải đáp án được SME độc lập phê duyệt. Người review được yêu cầu phản biện từng dòng.

| Workflow | Kết quả cần thấy | Điểm dễ hiểu nhầm cần bác bỏ |
|---|---|---|
| Special G/L | Request chưa có bút toán; receipt 36 triệu không tạo revenue; invoice 120 triệu; sau cấn AR = 84 triệu, cọc còn treo = 0 | Request không phải tiền về; receipt không phải doanh thu |
| F150 | Invoice chính quá hạn 20 ngày, level 1 theo policy demo; block/not-due loại khỏi notice; proposal không đổi lịch sử, notice mới đổi | Notice chỉ mô phỏng; level không là ECL; ngưỡng demo không là chuẩn mọi SAP |
| Bank clearing | Item 001 thu 84 triệu; item 002 thu 40 triệu phân bổ 15+25 triệu; item 003 thu 12 triệu do chọn thủ công; 004 vẫn AMBIGUOUS | Bank amount chỉ cộng một lần. Cùng số tiền không đủ để tự chọn invoice |
| Internal Order | Budget 100 triệu; actual sau invoice = 80 triệu; commitment còn = 10 triệu; assigned = 90 triệu, available = 10 triệu | Invoice relief commitment; không cộng thêm 60 triệu lần nữa |
| Cross-company | Supplier item được chọn về 0; company 1000 due-from 60 triệu = company 2000 due-to 60 triệu; hai chứng từ cân riêng, chung IC-PAY-01 | Clearing supplier item không xóa mọi AP của nhà máy hoặc tự loại trừ hợp nhất |

Đối chiếu tổng AR sau ba dòng bank clearing: **40 triệu** = dispute 20 triệu + chưa đến hạn 10 triệu + hai invoice mơ hồ 5 triệu mỗi invoice. Tổng bank receipts từ sao kê đã clearing **136 triệu**; item 004 5 triệu vẫn giữ ngoài clearing. Không cộng cọc 36 triệu vào bank statement fixture lần nữa.

## Năm câu xác nhận nghiệp vụ/học tập

Người review trả lời ngắn bằng lập luận của mình; test tự động không thay câu trả lời này.

1. Tại sao yêu cầu cọc chưa làm tăng tiền và khoản cọc đã nhận chưa làm tăng doanh thu?
2. Sau cấn cọc hoặc clearing, tại sao phải xem lại F150 proposal? Dunning level cho biết gì và không cho biết gì?
3. Vì sao item 002 ghép được hai invoice còn item 004 phải giữ lại? Khi nào xác nhận thủ công mới có căn cứ?
4. Vì sao actual tăng từ 20 lên 80 triệu nhưng assigned chỉ ở 90 triệu, thay vì 150 triệu?
5. Sau thanh toán hộ, khoản nào đã hết dư và khoản nào còn phải hoàn trả giữa hai công ty?

## Phiếu kết luận do con người điền

| Trường | Giá trị hiện tại |
|---|---|
| Reviewer / vai trò | Chưa có |
| Ngày review | Chưa có |
| Từng workflow đã kiểm | Chưa xác nhận |
| Câu trả lời / evidence tham chiếu | Chưa có |
| Lỗi hoặc điều kiện sử dụng còn lại | Chưa nhận phản hồi |
| Cho phép dùng học tập với nhãn SIMULATED | **PENDING_HUMAN_REVIEW** |
| Xác nhận tương đương SAP / production | **NOT_RUN / NOT_APPROVED** |

Sau phản hồi: ghi quyết định và lý do, xử lý phát hiện, chạy lại các kiểm tra bị ảnh hưởng rồi mới chốt v1.0.0. Nếu source đổi sau lần đóng hash, bản ứng viên phải được kiểm tra/đóng hash lại; không dùng receipt cũ để duyệt source mới.

## Cách tái lập kiểm thử browser

`npm run test:manufacturing-finance:browser -- --run-id=<tên-mới>` dùng trình duyệt headless/profile tạm riêng và server localhost thuộc test; không dùng phiên đăng nhập của người dùng. Cần `playwright-core` và Edge/Chromium. Mặc định dùng thư viện đã có trong bundled runtime của máy này; có thể chỉ định `SAVA_QA_PLAYWRIGHT_MODULE` và `SAVA_QA_BROWSER_EXE` trên máy khác. Không cài thêm vào package/lockfile của ứng dụng.

Lỗi bootstrap Browser trong app được ghi riêng. Bằng chứng fallback headless chỉ xác nhận trình duyệt/viewport được ghi trong results.json; không phải kiểm thử Safari/iPhone thật, không đo hiệu quả học tập, không phải SME approval.
