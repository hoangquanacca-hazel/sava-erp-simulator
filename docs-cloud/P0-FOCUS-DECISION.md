# Quyết định phạm vi — ưu tiên P0 Manufacturing

Ngày: 08/10/2026. Người quyết định: Mr Quân. Chỉ thị: “Đồng ý chốt mục tiêu gần là P0, p1 và 2 thì triển khai sau.”

Mục tiêu gần: hoàn tất P0 Manufacturing trong repo hiện có, có bằng chứng nghiệm thu độc lập và quyết định của con người để chạy pilot. P1 Procurement/AP, Sales/AR và P2 Material Ledger/CFO/Z-report chỉ triển khai sau, không đưa vào backlog thực thi hiện tại. Giữ tài liệu và tài sản đã có; không xóa tính năng kế thừa. Quyết định này thay đổi thứ tự ưu tiên, không tự hạ tiêu chí nghiệm thu hoặc bổ sung quyền deploy/push/merge.

## Trạng thái lúc chốt

Branch cloud/s1-report-completion, baseline e97d587; S3 và S4 hoàn thành kỹ thuật trong phạm vi mô phỏng. C02/C04/C05/C07 còn business blocks; C01/C03/C06 pendingSME. M01–M10 chưa chốt nghiệm thu. P0 không được coi hoàn thành chỉ vì7/7 simulation controls PASS.

## Thứ tự phần còn lại của P0

1. Rà soát và giải quyết căn cứ nghiệp vụ của S4: reservation mapping C02, CO cost basis/target version C04, eligible variance/receiver/settlement C05, phân loại variance và nguồn chứng minh C07. Thiếu căn cứ phải giữ BLOCKED. SME duyệt fixture/schema/bộ kết quả chuẩn; không tự tạo sự phê duyệt.
2. Xác minh RAW/CLEAN/CONTROL downloads thực, bảo toàn byte/hash, tái lập và vô hiệu hóa snapshot. Đối chiếu nội dung TT99 và golden của Mr Quân, phân biệt giả định mô phỏng với hành vi SAP thực.
3. S5 Manufacturing MART, drill-through, variance bridge và management commentary có lineage. Có thể phát triển phần kỹ thuật trên synthetic data trong khi chờ review, nhưng không gắn approved hoặc dùng delta làm root cause khi chưa có bằng chứng. C08 kiểm mọi numeric claim từ mart và controls.
4. S6: QA độc lập trên commit đóng băng, kiểm negative/regression/security/performance/replay phù hợp kiến trúc browser; human SME/Auditor/release owner xác nhận M01–M10. Tính năng chưa được chấp nhận không tự gán N/A để đóngP0; thay đổi gate cần chủ dự án và reviewer duyệt rõ.
5. Chuẩn bị hướng dẫn pilot và evidence pack; pilot/release khi có quyết định nghiệm thu của con người. Không tự deploy/merge/push.

## Giới hạn tiếp tục áp dụng

Browser-only, generated simulator data; không mở intake SAP thật, RFC/OData/API, DB/object storage/worker mới, không tự chứng nhận ECC/Fiori/TT99. Approved SAP variants và missing namespace/costview phải được xử lý bằng bằng chứng hoặc quyết định phạm vi được duyệt, không đổi nhãn SIM thành SAP certified. Bộ dữ liệu hiện tại chưa có reversals/cross-period/multi-order/UoM conversions theo gate dài hạn: giữ gap register và yêu cầu quyết định rõ trước acceptance.

Backlog07/10 vẫn là kế hoạch dài hạn. Quyết định A/B/C và file này là nguồn ưu tiên hiện hành. Không tạo repo hoặc project thay thế. Nguồn trạng thái: [README](README.md), [S4](s4/README.md), [M01–M10](../docs/implementation/12-ACCEPTANCE-M01-M10.md).
