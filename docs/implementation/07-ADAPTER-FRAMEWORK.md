# Adapter Framework contract v1

`LOAD → DETECT FORMAT → VALIDATE HEADER → PRESERVE RAW → STANDARDIZE → VALIDATE → OUTPUT CLEAN → QUALITY LOG`

LOAD streaming phải spool bytes trong intake write-once ngay khi nhận, tính hash, giới hạn kích thước; PRESERVE RAW xác nhận promote/register original object. Như vậy header lỗi vẫn giữ evidence ở quarantine; không mất file vì thứ tự pipeline. Không parse file không tin cậy trong UI main thread.

| Bước | Input / output | Failure behavior |
|---|---|---|
| LOAD | Upload stream + source declaration → bytes/hash/intake id | Size/permission/file incomplete → event, quarantine theo retention policy |
| DETECT FORMAT | Signature/zip structure/encoding/sheets → format profile candidates | Extension mismatch, ambiguous profile → needs review; không guessed mapping |
| VALIDATE HEADER | Original headings + profile → validated ordered column map | Required column thiếu, duplicate headings ambiguous → block |
| PRESERVE RAW | Hash/bytes → registered object + immutable manifest | Hash mismatch/storage failure → FAILED; không emit CLEAN |
| STANDARDIZE | Parsed rows + deterministic mapping → typed rows + lineage | Locale/UoM/sign unknown → row issue; không impute số |
| VALIDATE | Schema + rules + counts/totals → accepted/quarantine | Key duplicates, required errors → block publication |
| OUTPUT CLEAN | Accepted rows + lineage → atomic versioned dataset | Partial write không visible; retry idempotent |
| QUALITY LOG | Counts/rules/duration/version → signed run artifact | Log persistence failure → run incomplete, không publish |

## Interface đề xuất (triển khai sau)

```typescript
type AdapterContext = { reportId: string; profileId: string; contractVersion: string;
  sourceSystem: string; client: string; selectionHash: string; configHash: string };
type Issue = { ruleId: string; severity: 'BLOCK'|'ERROR'|'WARN';
  sheet?: string; row?: number; column?: string; message: string; rawHash: string };
interface ReportAdapter {
  id: string; version: string;
  detect(signature: unknown, context: AdapterContext): Promise<unknown>;
  validateHeader(headers: unknown, context: AdapterContext): Promise<Issue[]>;
  standardize(rows: AsyncIterable<unknown>, context: AdapterContext): AsyncIterable<unknown>;
  validate(dataset: unknown, context: AdapterContext): Promise<Issue[]>;
}
```

Orchestrator chịu trách nhiệm persistence/state, adapter không có quyền sửa RAW hay approve. Registry resolve chính xác `(report, export_profile, source_release, locale, schema_version)`; ambiguous match trả DETECT_AMBIGUOUS. Header fingerprint có thứ tự và aliases versioned; không dùng fuzzy matching không giải thích để quyết định tài chính.

## Common DQ rule pack

DQ01 required/header/type → BLOCK; DQ02 null/duplicate business key → BLOCK; DQ03 invalid date/period/currency/UoM → ERROR; DQ04 counts conservation/export completeness → BLOCK; DQ05 totals by currency/UoM → BLOCK khi vượt tolerance; DQ06 namespace/selection mismatch → BLOCK; DQ07 orphan reference/cardinality → ERROR; DQ08 reversal linkage/cancellation → ERROR; DQ09 optional unavailable → WARN + KPI eligibility downgrade; DQ10 mixed synthetic/real/approved versions → BLOCK.

Error code stable: FILE_TOO_LARGE, FORMAT_UNSUPPORTED, DETECT_AMBIGUOUS, HEADER_MISMATCH, PARSE_LOCALE, KEY_DUPLICATE, HASH_MISMATCH, SCOPE_MISMATCH, CONTROL_FAILED, STORAGE_RETRYABLE. Trả run_id/rule/coordinate/hành động khắc phục; không trả stack/secrets cho UI. Retry transient network/storage với bounded backoff; không retry semantic error vô hạn.

## ZFIR009A và ZFIR159

Tạo hai adapter descriptors riêng, status BLOCKED_NO_SAMPLE. Chưa biết business purpose, grain, key, fields hay thuật toán; không suy từ tên Z-report. SME cung cấp ABAP functional spec nếu được phép, selection screenshot, full sample + totals, field catalog và mapping standard counterpart. Sau đó mới định nghĩa source-to-canonical contract/version và independent oracle. Không ép Z-report vào FBL1N/GL chỉ vì cùng cột amount.

## Versioning và test

SemVer cho schema/adapter/rule/profile riêng. Thay sign/key/grain/null policy là breaking major; thêm optional field là minor; bugfix cần replay impact dù patch. Fixture corpus: normal, malformed, localized, reversed, duplicated, zero-row, truncated, formula/text cells, leading zeros, multi-sheet, oversized/zip-bomb, repeated headers/totals, cross-period. Golden expected do SME/QA lập độc lập; differential tests so report source totals, không lấy expected bằng chính hàm adapter.
