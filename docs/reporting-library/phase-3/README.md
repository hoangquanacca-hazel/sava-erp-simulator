# Giai đoạn 3 — hợp đồng vào pilot (2026-10-24)

Giai đoạn 3 đã bắt đầu ở mức thiết kế có kiểm soát: 12 hồ sơ hiện có được chọn làm pilot cho lineage/reconciliation/analytics adapters. Chưa có tuyên bố Power BI, Fiori hoặc simulator runtime đã tích hợp production.

`entry-contract.json` ghi lại module, grain, keys, columns và `join_matrix` của từng pilot. Các quan hệ trực tiếp bị chặn mặc định; quan hệ còn lại chỉ là `CANDIDATE_RECONCILIATION_BRIDGE` với field cầu nối, rủi ro và điều kiện cần trước khi dùng.

## Pilot

- **FI01** — GL entry and ledger bridge; `PILOT_CANDIDATE_PENDING_NATIVE_INPUT`.
- **FI02** — GL ledger view; `PILOT_CANDIDATE_PENDING_NATIVE_INPUT`.
- **FI06** — Supplier line items; `PILOT_CANDIDATE_PENDING_NATIVE_INPUT`.
- **FI15** — GR/IR reconciliation monitor; `PILOT_CANDIDATE_PENDING_NATIVE_INPUT`.
- **CO01** — Actual cost center detail; `PILOT_CANDIDATE_PENDING_NATIVE_INPUT`.
- **CO15** — CO-PA actual line items; `PILOT_CANDIDATE_PENDING_NATIVE_INPUT`.
- **MM01** — Material document items; `PILOT_CANDIDATE_PENDING_NATIVE_INPUT`.
- **MM08** — Purchase order history; `PILOT_CANDIDATE_PENDING_NATIVE_INPUT`.
- **PP01** — Production order views; `PILOT_CANDIDATE_PENDING_NATIVE_INPUT`.
- **SD01** — Sales order/delivery chain; `PILOT_CANDIDATE_PENDING_NATIVE_INPUT`.
- **QM01** — Inspection lot/worklist; `PILOT_CANDIDATE_PENDING_NATIVE_INPUT`.
- **PM01** — Maintenance order list; `PILOT_CANDIDATE_PENDING_NATIVE_INPUT`.

## Điều kiện mở rộng

Chỉ tạo profile mới khi có business question khác, owner, nguồn được phép dùng và grain không trùng. Mốc 200–250 là ngân sách planning; không dùng để thay thế native export, đối soát hoặc SME acceptance. Xem `entry-contract.json`.
