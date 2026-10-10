# Detailed technical requirements

Các yêu cầu dưới đây là target để triển khai trên stack hiện tại; chưa được coi đã có trong code. Không nâng dependency chỉ để viết kế hoạch.

| ID | Yêu cầu / cách triển khai | Verification |
|---|---|---|
| FE01 | Giữ React/TS/Vite; modular routes; report selection builder typed; Data Lab async jobs | UI states + keyboard + drill path E2E |
| FE02 | Number/currency/UoM format explicit; virtualized tables, bounded paging, no full 1M rows in browser | Performance profile và mismatched units case |
| FE03 | Existing demo analytics badge; new managed mart read-only; show cutoff/approval/staleness | Không hiển thị failed snapshot thành approved |
| BE01 | Ingestion API + background worker; server validation/RBAC; API version /v1 | Integration auth/negative/scope tests |
| BE02 | Transactional run state machine; idempotency; immutable run history | concurrent/retry/crash tests |
| BE03 | Shared domain services giữa Express và Netlify endpoints hoặc documented API service boundary | Contract parity test cả deployment modes |
| DM01 | Namespace+business keys; order child relations; ledger-aware GL; immutable snapshots | Duplicate/cross-client/cross-ledger fixtures |
| DM02 | Decimal amounts and quantities; currency/UoM/version dimensions; explicit null | Precision, locale, overflow, zero-denominator tests |
| ST01 | Private object storage RAW/versioning; DB metadata/control; Parquet optional for batch scale | Hash/retention/permission/restore evidence |
| ST02 | Atomic staging→commit dataset; immutable publication pointer history | Interrupted output không visible |
| CFG01 | Schema/variant/rules config separate, validated and versioned; env-specific secrets external | Startup rejects incomplete config |
| VER01 | App commit + schema/adapter/rules/profile versions in every run; lockfile and migration checks | Replay deterministic excluding run timestamp |
| SEC01 | Project-scoped identity; roles viewer/operator/SME/reviewer/admin; backend authorization | Direct API bypass/IDOR/tenant isolation tests |
| SEC02 | AI receives allowlisted/redacted context; file text is untrusted data; no tool execution from exports | Prompt injection case; provider failure fallback |
| SEC03 | File content sniffing/size/archive expansion limits; macro never execute; parser dependency review | Malicious workbook, CSV formula, traversal fixtures |
| AUD01 | Append-only audit actor/action/time/object/hash/prior state/reason; author!=reviewer | Approval bypass/revocation/replay test |
| OBS01 | Structured logs run_id/report/profile; counts/duration/failed-stage metrics; PII excluded | Trace one failed run end-to-end |
| ERR01 | Stable typed errors; semantic block vs transient retry; user remediation; no secret leakage | API error matrix and alert routing |
| DEP01 | Dev/test/staging/prod separated; synthetic-only preview; release approvals/backup/rollback | Restore+rollback rehearsal before pilot |

## API shape đề xuất

`POST /v1/uploads` → upload_id/scoped URL; `POST /v1/report-runs` → 202 + run_id (idempotency key); `GET /v1/report-runs/:id` → state/counts/issues; `POST /v1/report-runs/:id/reprocess` → new run id; `POST /v1/reconciliations` → scoped input dataset ids/rule version; `POST /v1/approvals` → artifact hash/reason (role separation); `POST /v1/mart-publications` → approved snapshot; `GET /v1/lineage/:id` → authorized graph. Download original chỉ qua scoped permission.

State: RECEIVED → QUARANTINED hoặc RAW_REGISTERED → PROCESSING → CLEAN_READY → CONTROL_PENDING → CONTROL_FAILED hoặc REVIEW_PENDING → APPROVED → PUBLISHED. Transitions backed by DB compare-and-set; rejection/revocation tạo event và invalidates downstream. Reprocess không sửa run gốc.

## Configuration và scripts cần bổ sung ở PR sau

Config: report registry, profile headers/locale, namespace policy, movement signs, currency types, UoM conversion, GL/cost-category map, fiscal calendar, cutoff, tolerances, RBAC, storage endpoint, batch limits, LLM opt-in/budget. Effective date và reviewer bắt buộc cho nghiệp vụ.

Scripts targets đề xuất: validate-contracts, import-report, replay-run, run-controls, build-mart, verify-lineage, seed-cases, verify-evidence, migrate, backup, restore-check. Không tuyên bố scripts này đã tồn tại; hiện chỉ có `test:parity`, `lint`, `build` theo package.json. Dùng đường dẫn cross-platform, tránh lệnh xóa không kiểm soát trong workflow Windows.

## Performance / resilience target để benchmark

Reference workload đề xuất: 100k rows / 50 MB compressed input mỗi job, 5 concurrent users; worker 4 vCPU/8 GB; ingestion+DQ p95 <120s, memory <1 GB/job; report page p95 <2s với server paging; control 100k-order-item rows p95 <60s. Các số này là budget cần đo ở gate G3, không tuyên bố benchmark đã đạt.

Hard initial limits: 50 MB uploaded object; decompressed 250 MB; 1M cells parsed per sheet hoặc profile override sau test; nếu vượt trả limit error kèm split guidance. Có tension giữa row/cell limits: report 100k×30 cột cần profile override 3M cells và memory benchmark trước acceptance. Chọn parser streaming/batch khi scale; không load workbook lớn bằng cùng đường browser hiện tại.

Target pilot RPO ≤24h và RTO ≤4h trên backup restore đã thử; owner ký budget. Worker lease/timeouts/cancellation; dead-letter run có remediation; no silent success. Alert hash mismatch ngay cho operator/security owner; DQ/control failures cho data owner; queue latency/resource alarms cho technical lead. Log retention theo policy.

## Test strategy

Contract/schema tests; fixture golden do SME/QA độc lập; unit domain arithmetic; integration storage/state/permissions; reconciliation positive/negative; UI E2E happy+blocked; mutation tests đảo dấu/bỏ row để chứng minh controls bắt lỗi; load/restore/rollback. Regression giữ parity của MTO valued/nonvalued, QM branches, WIP, COGS split, GRIR, IC, AI fallback và existing routes. `npm run test:parity`, `npm run lint`, `npm run build` phải chạy ở implementing PR; tài liệu lần này không tự báo đã pass chúng.

Không dùng test so hai hàm cùng sai làm chứng cứ nghiệp vụ. Missing→0 của demo engine không được mang vào ingestion. Legacy snapshot regression được giữ nhưng sai nghiệp vụ xác nhận phải sửa qua ADR + new oracle, không “freeze bug” vì test cũ pass.

## Acceptance dữ liệu với schema

JSON Schema kiểm cấu trúc, không đủ để chứng minh hash tồn tại, count conservation, approval identity độc lập hay retention. Backend phải chạy semantic invariants và verify object/evidence thật sau schema validation. Manifest example là QUARANTINED, hash empty bytes minh họa và URI `example://`; không phải evidence của report thực tế. Không import example vào production runs.
