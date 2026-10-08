# SAVA SAP S/4HANA Manufacturing Simulator — Implementation Pack v1.0

Ngày tổng hợp: **07/10/2026 (Asia/Saigon)**. Làm trực tiếp trên repo `D:\sava-erp-simulator`.
Trạng thái: **planning baseline / đề xuất kỹ thuật để review**, không phải chứng nhận triển khai hay nghiệm thu SAP.

## Đọc theo thứ tự

1. [Phạm vi nguồn và baseline repo](00-BASELINE-AND-SOURCES.md)
2. [PRODUCT / IMPLEMENTATION MASTER PLAN](01-MASTER-PLAN.md)
3. [Kiến trúc và mô hình dữ liệu](02-ARCHITECTURE.md)
4. [Module và hành trình người dùng](03-MODULES-AND-FLOWS.md)
5. [Report Master Dictionary v1](04-REPORT-MASTER-DICTIONARY.md)
6. [Export variants và bảo toàn định dạng SAP](05-EXPORT-VARIANTS.md)
7. [RAW / CLEAN / CONTROL / MART](06-DATA-GOVERNANCE.md)
8. [Adapter Framework](07-ADAPTER-FRAMEWORK.md)
9. [P0 Manufacturing và các slice tiếp theo](08-VERTICAL-SLICES.md)
10. [Yêu cầu kỹ thuật](09-TECHNICAL-REQUIREMENTS.md)
11. [Backlog / dependency / roadmap](10-BACKLOG-ROADMAP.md)
12. [Quy trình, RACI, bằng chứng, release](11-DELIVERY-RACI-GATES.md)
13. [Acceptance P0-MFG M01–M10](12-ACCEPTANCE-M01-M10.md)
14. [Decision log và vấn đề cần chốt](13-DECISION-LOG.md)
15. [Rủi ro, giới hạn, lợi thế dài hạn](14-RISKS-ASSUMPTIONS.md)
16. [Hướng dẫn cho agent tiếp nối](15-AGENT-HANDOFF.md)
17. [Nhật ký 07/10/2026](journal/2026-10-07.md)

## Hợp đồng máy đọc và bằng chứng

- [Report contracts JSON](contracts/report-contracts.v1.json): trường, grain, key, selection, DQ, joins và đích đối soát; Z-report có trạng thái BLOCKED.
- [Export variant registry](contracts/export-variants.v1.json): tất cả hiện PENDING_SME_APPROVAL, không có variant SAP thật được tự phê duyệt.
- [Manifest JSON Schema](contracts/run-manifest.schema.json), [manifest minh họa](contracts/run-manifest.example.json).
- [Control rules](contracts/control-rules.v1.json), [acceptance gates](contracts/acceptance-gates.v1.json).
- [Chứng cứ cần bàn giao](templates/EVIDENCE-PACK.md), [phiếu phê duyệt variant](templates/VARIANT-APPROVAL.md).
- [Baseline file hashes](evidence/baseline-files.json), [kiểm tra bộ tài liệu](evidence/document-validation.json), [danh mục file tạo mới](evidence/created-files.json).
- [Đối chiếu 17 yêu cầu](16-REQUIREMENTS-COVERAGE.md).

## Điều kiện sử dụng

Giữ simulator hiện có. Giữ mọi dữ liệu nguồn. RAW là bytes nguyên bản; mapping ở lớp CLEAN. Dashboard quản trị mới chỉ đọc MART đã được kiểm soát. UI demo hiện có vẫn được giữ nhưng phải tách trạng thái demo khỏi dữ liệu được phê duyệt.

Không gọi tài liệu này là “toàn bộ lịch sử Project đã truy xuất”: thư mục sources hiện trống, công cụ đọc chat không trả được lịch sử đầy đủ. Những phần đã biết, suy luận từ code và đề xuất mới được ghi riêng. Các tài liệu Handbook/Workbook/AP Hub từng được nhắc đến chưa có file để xác minh.
