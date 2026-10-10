> **Cập nhật 10/10/2026:** đọc `17-DECISION-LOG-CONSOLIDATED.md` (quyết định hiệu lực) và `18-BRANCH-AND-STATE-MAP.md` (nhánh nào có gì, thứ tự hợp nhất) trước tài liệu này.

# PRODUCT / IMPLEMENTATION MASTER PLAN

## Sản phẩm và giá trị

SAVA SAP S/4HANA Manufacturing Simulator giúp người học và nhóm tài chính đi từ nghiệp vụ sản xuất tới chứng từ, report SAP, dữ liệu kiểm soát và giải thích quản trị. Tài sản cốt lõi là scenario có ground truth, report contract đúng grain, traceability và đối soát độc lập. Số lượng T-code hay dashboard đẹp không đo được độ tin cậy.

Giữ code MTO hiện có. Thêm lớp report/data/control theo lát cắt dọc. Không xây lại app, không tạo repo mới. Lập chỉ mục learning materials khi có artefact; không giả định mọi phần được nhắc trong chat đã tồn tại.

## Persona và đầu ra

| Persona | Việc cần hoàn thành | Bằng chứng thành công |
|---|---|---|
| Finance learner | Theo nghiệp vụ, hiểu bút toán, truy sai lệch | Đi từ scenario tới raw row và giải thích đúng case độc lập |
| Cost accountant / Finance SME | Duyệt semantics và kiểm tra variance | Reconciliation theo order/period/currency, có bridge cho chênh lệch |
| Data operator | Nhận export, chọn variant, chạy adapter | Không sửa Excel bằng tay; mọi row được phân loại và trace |
| Controller / FP&A | Giải thích biến động và hành động | KPI từ MART đã approve, có đối chiếu và residual |
| Auditor / QA | Tái lập và bác bỏ kết quả sai | Independent oracle, replay cùng hash/version, không self-approval |

## Scope và thứ tự

P0: baseline và corpus → contract/export variant → immutable RAW → adapters → DQ → control → Manufacturing mart → variance drill/commentary → independent acceptance. GL và settlement bridge là dependency P0 dù GL còn phục vụ nhiều slice.

P1: Procurement & AP (ME2N, MB51, GR/IR detail, FBL1N, GL), tiếp theo Sales & AR (VF05, FBL5N, GL). Bổ sung Learn/Fiori/Documents theo scenario thật, không mở rộng catalogue trống.

P2: Material Ledger CKM3N/CKMLCP/MB5L sâu hơn, multi-period/valuation, CFO consolidated dashboard khi các data gates đạt. UI ML đang có vẫn giữ ở chế độ học tập, chưa nâng nhãn thành actual costing hoàn chỉnh.

## Chỉ số thành công đề xuất để owner duyệt

- 100% KPI đã publish truy được report run, input hash, clean row, control và người approve.
- 0 dòng biến mất không giải thích; 0 required field thiếu bị tự thay bằng 0.
- 100% M01–M10 có evidence và người nghiệm thu khác người xây; severity critical unresolved = 0.
- 100% case trong corpus P0 (bao gồm reversal/partial/cutoff/malformed) có oracle độc lập.
- Pilot: đo thời gian từ export đến exception list, tỷ lệ cảnh báo hữu ích và số thao tác chỉnh tay; đo baseline trước khi đặt mục tiêu giảm %, không bịa ROI.

## Hoạch định năng lực và chi phí

Nhóm tối thiểu: 1 technical lead kiêm backend, 1 data engineer, 1 frontend/QA engineer (không tự duyệt phần mình), Finance SME 0.3–0.5 FTE, reviewer/auditor độc lập 0.1–0.2 FTE, Product Owner có quyền quyết định phạm vi. Thiếu QA độc lập thì mượn reviewer, không bỏ gate.

Ước lượng P0 8–11 tuần với 2–3 kỹ sư; P1 6–8 tuần; P2 4–6 tuần sau P1. Đây là planning range, không cam kết lịch trước khi có sample. Chi phí = person-days × đơn giá đội + storage/backup + hosting + token budget; ghi actual theo tuần. Không mua warehouse/streaming cluster trước khi batch profile chứng minh cần.

## Definition of Done

Tính năng có workflow hoàn chỉnh, contract version, migration/replay, negative tests, accessibility states, runbook, evidence pack và independent sign-off. “Build xanh”, “TB cân”, “AI review ok” riêng lẻ đều chưa đủ. Mọi phát hành ghi chính xác synthetic-only hay real-export-validated.

## Ngoài phạm vi / trì hoãn có chủ đích

Direct SAP RFC/OData/API; ghi trở lại SAP; sao chép đầy đủ SAP; production accounting/legal certification; all-release compatibility; tự động posting/closing bằng AI; CFO dashboard mới trước controlled data layer; multi-currency/valuation ML thật trước P2. Các mục hoãn chỉ mở qua ADR với cost-benefit, data evidence và human approval.
