# Immutable RAW / CLEAN / CONTROL / MART

| Lớp | Nội dung | Ghi / sửa / đọc |
|---|---|---|
| RAW | Original bytes + immutable manifest + ingestion events | Write-once object/version; ingestion service ghi mới; không overwrite/delete qua app |
| CLEAN | Typed rows, normalized keys, lineage, DQ dispositions | Dataset mới cho mỗi replay; chỉ accepted rows theo contract; quarantine giữ ngoài mart |
| CONTROL | Input dataset set, scopes, rule results, exceptions, approvals | Append-only runs/decisions; reason codes; reviewer ký artifact hash |
| MART | Approved facts/dimensions/KPI snapshots | Publish atomic theo approved snapshot; rollback pointer; không edit giá trị bằng UI |

## Bất biến thực sự

SHA-256 phát hiện thay đổi bytes, **không tự ngăn xóa/sửa**. Production cần object versioning + retention/object-lock hoặc cơ chế write-once tương đương, service account tối thiểu quyền, immutable audit copy và restore test. Local filesystem chỉ development durability, không tuyên bố tamper-proof. Retention period do data owner ký theo chính sách dữ liệu; không tự đặt số năm như yêu cầu pháp lý.

## Manifest bắt buộc

`run_id`, `report_id`, `source_kind`, `source_system`, `client`, `sap_edition`, `sap_release`, `company_codes`, `plants`, `selection` (ranges/exclusions/key date/status), `fiscal_year_variant`, `period`, `timezone`, `cutoff_at`, `extracted_at`, `ingested_at`, `operator_id`, `selection_variant`, `layout_variant`, `export_profile_id`, `original_filename`, `mime`, `encoding`, `size_bytes`, `sha256`, `raw_object_uri`, `schema_version`, `adapter_id`, `adapter_version`, `code_commit`, `config_hash`, `parent_run_id`, `row_counts`, `control_totals`, `state`.

Null unknown metadata có issue rõ; không giả định company code/client từ filename. Manifest phải schema-validate; extraction/run time lưu ISO UTC với timezone nguồn để diễn giải business date. `SAP_EXPORT` cần release thực; `SIMULATED` cần scenario_id/ruleset_version/seed.

## Naming và idempotency

Logical filename đề xuất: `<source>_<client>_<report>_<scope>_<period>_<UTCtimestamp>_<run-id>.<ext>`; tên original luôn lưu nguyên. Storage key: `raw/<namespace>/<report>/<yyyy>/<mm>/<full-sha256>/<original-name-sanitized>`; không dùng prefix hash ngắn làm unique key. Validate path và tên, chống traversal/collision.

Content object dedup theo sha256 trong namespace; ingestion event vẫn ghi cho từng lần nhận. Processing idempotency key = hash(input sha256 + selection/config hash + adapter version + contract version + namespace). Cùng bytes khác metadata chưa chắc cùng report run; phải giữ provenance và flag conflict. Snapshot không cộng dồn với snapshot cũ. Overlapping periods kiểm tra business key/window, không `drop_duplicates` toàn cục.

## Count và totals

`physical_rows = data_rows + header_rows + footer_rows + subtotal_rows + blank_rows` trong parse scope (workbook ghi theo từng sheet); `data_rows = accepted_rows + rejected_rows + duplicate_rows`. Duplicate rows được quarantine và lưu lineage riêng. Với one-to-many normalization có `emitted_clean_rows` và parent allocation; không dùng nó thay accepted_rows. Byte size không thay record count.

Lưu displayed_report_count, parsed counts và totals theo `(currency, amount_type)` / `(uom, quantity_type)`; không cộng mixed currencies. Export bị pagination/truncated không được publish. Chỉ duyệt zero-row export khi selection/evidence chứng minh không có dữ liệu, không tự PASS.

## Chuẩn hóa

Identifiers là string, giữ leading zeros; trim/padding chỉ qua profile có raw-to-clean mapping. Date parsing dựa explicit locale; `01/02/2026` unknown locale là lỗi, không đoán. Decimal dùng decimal/fixed precision; sign dựa field semantics + debit/credit/reversal mapping; không đảo dấu hai lần. Currency có currency type; UoM conversion theo material và effective date; không đổi KG↔PC khi thiếu factor.

Blank ≠ zero ≠ unavailable. Required missing → reject/quarantine; optional null ghi reason. Calculated usage variance/aging/signed quantities ở CLEAN/MART, không thêm vào RAW. Dữ liệu mã hóa/ẩn danh phục vụ demo là derivative dataset với lineage, không sửa original object.

## Sửa sai và publication

Sửa mapping → version mới → replay → DQ/control mới → reviewer mới → mart snapshot mới. Không sửa CLEAN thủ công rồi giữ approval cũ. Correction business data → export nguồn mới có link supersedes. Closed period cần reopen event được owner duyệt; impact analysis mọi downstream snapshot; stale flag và thu hồi publication khi cần.

Security: private buckets, encrypted transit/at-rest, per-project/tenant access, scoped download URLs, sanitized operational logs; raw partner names và document text không gửi LLM mặc định. Backup metadata + objects đồng bộ; restore rehearsal trước pilot.
