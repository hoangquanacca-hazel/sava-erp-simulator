# Gói yêu cầu bằng chứng SAP/SME — Manufacturing Finance

Ngày chuẩn bị: 22/10/2026, Asia/Saigon. Đây là checklist để nhận dữ liệu và chạy kiểm chứng, **chưa phải kết quả SAP-native hoặc phê duyệt**. Không kết nối hệ thống production trong tác vụ này.

## Chốt môi trường trước khi chạy

Điền edition (ECC/S/4HANA), release/EHP/FPS/SPS, client, company codes, controlling area, fiscal year/period, ledger nếu áp dụng, currencies, chart/account mapping, loại hệ thống test/sandbox và người phụ trách. Các trường chưa biết giữ UNKNOWN, không tự lấy edition/release từ bài SAP Help.

Người dùng từng xác nhận ECC cho một chủ đề đóng sổ khác trong vault; thông tin đó chưa đủ để tự gán edition/release cho bài này. Trong lượt tiếp nối này, người dùng đã chọn: **“Chưa xác định — tiếp tục simulator và checklist SME”**. Vì vậy tiếp tục phần offline; chưa cần kết nối SAP để hoàn tất phạm vi đang được giao.

Chỉ nhận mẫu đã được phép dùng, loại bỏ thông tin cá nhân/tài khoản ngân hàng thật. Không đưa credentials, token, `.env` hoặc mật khẩu vào gói. Lưu selection, ngày chốt, currency, số dòng và hash file gốc; bản che dữ liệu là file riêng có nguồn gốc rõ.

## Năm bộ kiểm chứng

| Workflow | Cấu hình/căn cứ cần xem | Ca dương | Ca âm và tiêu chí giữ lại |
|---|---|---|---|
| Special G/L customer deposit | Customer normal và alternative reconciliation account; indicator; noted-item setting; tax setup; account/currency/company scope | Yêu cầu cọc không tạo bank/revenue; receipt tạo chứng từ phù hợp; cấn cọc vào invoice và đối chiếu dư cọc/AR | Chưa nhận tiền, sai customer/company/currency, cấn quá dư, retry/reversal. Tài liệu phải phân biệt request, receipt và clearing |
| F150 dunning | Dunning procedure, area, levels, grace/interval, account/item blocks, fees, ngày chạy và run identification | Proposal giữ đúng open amount sau cấn; notice output/log và lịch sử thay đổi phù hợp | Block/not-due/cleared/interval; thay đổi open items giữa proposal và output; rerun. Không coi proposal là notice đã gửi hoặc level là ECL |
| EBS/FEBAN | House bank/account; statement identity; external transaction; posting/processing rule; interpretation algorithm; tolerance và posting area áp dụng | Một bank line khớp một FI item; một bank line khớp nhiều FI items, tổng phân bổ = bank amount | Missing/ambiguous reference, duplicate statement, currency/company mismatch, partial/overpayment, posting area 1 thành công nhưng area 2 lỗi. Worklist phải giữ unmatched và separate posting/clearing statuses |
| Internal Order AVC | Real/statistical order và order type; budget profile; current/original/released/annual/overall budget áp dụng; active status; business-transaction group; tolerance | PO commitment qua AVC; invoice/GR relief đúng commitment; assigned value không tính trùng | Ngưỡng cảnh báo/chặn theo cấu hình thật, AVC inactive, supplement/return, multiple PO/partial invoice, reversal. Không dùng ngưỡng demo 90/100 làm chuẩn SAP |
| Cross-company supplier clearing | Company-pair clearing accounts; selected supplier open item; centralized payment/manual clearing settings; currency/FX | Hai company có chứng từ riêng và joint transaction reference; supplier item clearing; reciprocal IC balance khớp | Thiếu company-pair mapping, currency difference, amount difference, retry/reversal, thiếu một vế. Supplier clearing không tự chứng minh reciprocal IC settlement/consolidation elimination |

Các ca trên là đề xuất review từ scope bài mô phỏng và tài liệu kỹ thuật hiện có. SME phải xác nhận business process áp dụng, transaction/app đúng release, expected outcome và account mapping trước khi chạy. Những tính năng ngoài bài demo là yêu cầu kiểm chứng hoặc gap, không ghi là đã triển khai.

## Hồ sơ mỗi test case

1. Case ID, workflow, operator, thời điểm chạy và môi trường được phép dùng.
2. Input scope/selection và trạng thái ban đầu, document/item keys, currency/signs, số tiền.
3. Expected outcome do SME xác nhận trước khi chạy; không lấy nguyên kết quả simulator làm oracle độc lập.
4. Actual outcome, message/log, native export hoặc ảnh có selection/context, accounting/clearing document keys và linked references.
5. Đối chiếu trước/sau, unmatched/exception, reason/owner và remediation. Không drop dòng lỗi để làm số liệu khớp.
6. Evidence file path + SHA-256, source kind và reviewer. Hash xác nhận bytes; không xác thực thẩm quyền hay kết luận kế toán.

Máy đọc: [native-review-intake.json](evidence/manufacturing-finance/native-review-intake.json). Mỗi workflow bắt đầu `NOT_RUN`, evidence để trống. Không điền giả sample SAP.

## Điều kiện đóng gate

- Environment và scope đầy đủ; native provenance xác định; không dùng synthetic file dưới nhãn native.
- Mapping transaction/app, field labels/order/keys được đối chiếu đúng edition/release; FI21/FI22 hiện vẫn là practice contracts SAVA.
- Ca dương/âm có actual và explanation; gap còn mở có owner và quyết định rõ.
- Người review độc lập ký kết luận, tham chiếu bằng chứng. Operator/tác giả feature không tự cấp business approval.
- Cập nhật acceptance theo từng workflow; không suy từ một case thành toàn bộ năm workflow hoặc production readiness.

Đến khi đủ: SAP-native **NOT_RUN**, release **UNKNOWN**, SME **PENDING**, business **NOT_APPROVED**. Review simulator, UI hay Obsidian rendered note không thay các gate trên.

## Bước có thể làm ngay và bước còn phụ thuộc

Có thể làm ngay: kiểm tra lint/typecheck/regression, lưu chat/manifest vào vault và hiển thị note, lập checklist/test matrix. Browser runtime đang lỗi đường dẫn module cũ; ghi BLOCKED cho tương tác/download thực tế, giữ riêng với SSR và HTTP smoke.

Cần đầu vào bên ngoài khi muốn chuyển sang native review: xác nhận edition/release, hệ thống test được phép dùng, native evidence và SME độc lập. Không tự đăng nhập/kết nối hoặc thực hiện posting thật từ yêu cầu tiếp tục công việc chung.

Chi phí/lợi ích: ưu tiên một bộ native evidence có scope rõ cho từng workflow thay vì mở rộng hàng loạt report/màn hình. Tài sản lâu dài là expected outcomes được review, fixture có provenance và đối soát truy được nguồn.
