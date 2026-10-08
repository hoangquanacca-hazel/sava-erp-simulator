# Hồ sơ review P0 cho Mr Quân / SME

**DRAFT — CHƯA PHÊ DUYỆT.** Mr Quân xác nhận08/10 chưa có bộ chuẩn và yêu cầu chuẩn bị hồ sơ review. Việc yêu cầu soạn hồ sơ không phải phê duyệt số liệu, giả định, gate hoặc TT99.

## Review theo thứ tự

1. [Ca số kỳ vọng đề xuất](golden-candidates.json): chọn Canon Valuated/Non-valuated, variance0/±3,5%, giao0/50%/100%. Dữ liệu copy từ technical oracle Python của phiên trước, chưa phải golden do SME soạn. Cần kiểm mô hình và tự đối chiếu kỳ vọng; không dùng cùng generator để tự chứng minh nghiệp vụ.
2. [Gap register](business-gap-register.json): field/evidence còn thiếu cho C02/C04/C05/C07; chưa điền giá trị giả hoặc approve. Chốt meaning trước triển khai supporting datasets; không thêm khóa giả vào RAW để làm gate PASS.
3. [Mẫu phản hồi](REVIEW-RESPONSE.md): ghi từng quyết định, expected numbers, evidence và người review. Cần source commit và input hashes, không chỉ nói “đồng ý tất cả”.
4. [Gate M01–M10](../../docs/implementation/12-ACCEPTANCE-M01-M10.md): reviewer ghi evidence/actual/diff/tolerance/status cho từng gate. Các tests synthetic hiện có không thay corpus reversal/cross-period/multi-order/UoM conversion; không gán N/A để tự đóngP0.

## Worked example để bắt đầu kiểm

Canon Non-valuated, variance−3,5%, giao1.000/2.000, giá115.000: proposed full-order planned53.086.050, actual51.228.038, variance−1.858.012. Proposed settlement25.614.019/WIP25.614.019; posted revenue115.000.000, COGS25.614.019, gross profit89.385.981. These values are candidate expectations, not approved facts about SAP/TT99. Reviewer phải xác nhận nguyên tắc: chi phí full-order đã phát sinh nhưng GR/yield chỉ bằng giao theo mô hình; qty/giờ thực tế hiện suy từ tỷ lệ cost chứ không có quan sát giá/tiêu hao độc lập.

Giữ2cơ sở: full-order production variance−1.858.012 và delivered variance−929.006 là khác nhau. Non-valuated settlement là phần actualcost, không phải variance. Cần kiểm cảValuated counterpart theo golden-candidates. Zero-delivery: revenue/COGS0, margin N/A có reason, chi phí cònWIP theo giả định hiện tại.

## Dữ liệu/approval cần từ người review

- C02: mapping reservation↔material-doc có evidence; cùng material nhiều reservation không tự phân bổ.
- C04: CO cost basis/target version/adjustments; phân biệt ledger154 SIM với KKS SAP.
- C05: sender/receiver/settlement run/rule/eligible variance; Valuated vàNon-valuated chính sách riêng.
- C07: physical driver observations, rates, allowed quantities/yield/scrap, category map. Nếu chưa có thì chỉ trình bày cầu nối yếu tố chi phí, giữ businessBLOCKED.
- TT99: original authoritative text/PDF và danh mục tài khoản áp dụng. Chưa có tài liệu được cung cấp và chưa có review pháp lý; không xác nhận tuân thủ.
- Phạm vi pilot: one-order/single-cutoff/no-reversal có được chấp nhận cho demo hay không? Đây chưa phải quyết định waiverM01–M10; nếu cần pilot hẹp, chủ dự án/reviewer phải chốt phạm vi rõ và không gọi đủP0 accepted.

## Kiểm tải file thực

Agent đã bấmRAW/CLEAN/CONTROL và wait download trướcclick; cả3timeout10s, không trảdownloadpath. [Bằng chứng](downloads/QA_REPORT.md). Trạng thái UNVERIFIED, không kết luận lỗi app. Cần người dùng/reviewer lưu file thật, đối chiếu byte/SHA256 với manifest và xác nhận file mở được; output JSONunit-test hashes không thay proofbrowserdownload. Chưa thay bằng CDP/Playwright/shell automation ngoài công cụ được phép.

## S5 đang thực hiện trong khi chờ review

MART chỉ DIAGNOSTIC_ONLY, technicalFAIL/BLOCKED hoặccontrolsnapshot bịsửa sẽ chặn tạo. C08 chỉ chứng minh numeric claims/text từ exact metric trong snapshot, không giải thíchrootcause/không approveMART. Không gửi AI nội dung hồ sơ hay gọi mạng. S6 evidence pack có thể chuẩn bị kỹ thuật nhưnghuman gates giữpending.


## Trạng thái review hiện hành

[Sẵn sàng M01–M10](acceptance-readiness.json): tất cảNOT_ACCEPTED, có evidence kỹthuật vàgap cho từnggate; releaseEligibilityNOT_READY_FOR_PILOT. [Nguồn TT99/chưa đối chiếu](TT99-SOURCE-REVIEW.md); originalVBPL403, chưaPDFreview. [S5](../s5/README.md) diagnosticđã kiểm kỹthuật vàfocusedbrowser; khôngthayhumanapproval.
