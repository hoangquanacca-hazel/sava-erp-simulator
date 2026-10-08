# Sửa4lỗi QA giao diện — 08/10/2026

Baseline d5f8a07 (code được QA trước là35a6b8a). Bản sửa chỉ presentation/UI; calculator/acdoca/materialLedger/oracle không đổi.

1. **BOM:** cây và inspector dùng chung computed.bomItemBreakdowns cùng chi phí routing/factory/variant CK11N; loại bỏ phép tính định mức cũ và tên vật tư giả. Tổng các nhóm/children khớp plannedCost.
2. **Kho:** nhãn căn cứ lastExecutedStep thay vì bước đang xem. TK154/155 lấy số dư ACDOCA, kể cả WIP sau giao một phần. MRP được ghi nhãn nhu cầu, không nhầm đã xuất.
3. **Quyết toán:** văn bản bước7 (cả detailedAction/learningPoint và box) nêu phần đã giao, số đã settlement, WIP còn lại; không mặc định154về0. Preview trước posting được suy theo delivery ratio; sau posting dùng154thực tế.
4. **Giá vốn:** lấy ACDOCA, loại documents closing911 để không đếm đôi; revenue/COGS chưa ghi nhận hiển thị0. Kế hoạch so sánh dùng cùng delivery ratio. Bridge planned621/622/627 phần đã giao + delta có dấu khớp COGS; delta không được gọi root-cause. Favorable hiển thị âm, bar dùng độ lớn có màu phù hợp. Các chi phí QM/ML nếu có nằm trong delta tổng, chưa phân tích nguyên nhân.

`src/presentation/finance.ts` chứa projections, không phát sinh posting. `test:ui-finance` đối chiếu54oraclecases(profit/WIP/revenue), kiểm signed bridge/percent100, câyBOM/canonical names, render thật StepCard/SpecialStockPanel/BOMVisualizer. Không sửa đáp án để xanh.

Logs trong retest-evidence. Lint/ui-finance/parity/S1/S2/A0/reports/build/start được chạy; kết quả cuối xem log và bản retest của QA. Test không thay SME/legal acceptance. Browser QA và downloads/content/hash có trạng thái riêng; không suy PASS từ HTTP200.

Giới hạn: tồn kho vật lý và các diễn giải legacy ngoài4lỗi chưa được audit toàn diện; chưa mở rộng event model QM/ML của Phase A. Không merge/push/deploy.
