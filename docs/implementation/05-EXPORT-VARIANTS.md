# Approved SAP export variants — quy trình và registry v1

**Hiện chưa có variant nào được phê duyệt trên SAP thật.** Registry cung cấp proposed IDs và approved-target specification. `approval_status=PENDING_SME_APPROVAL`; `approved_by`, `sample_sha256`, `actual_sap_variant_name` là null. Không đổi nhãn sang APPROVED chỉ vì agent viết xong schema.

## Phân biệt ba khái niệm

- Selection variant: company/plant/order/date/status/ledger/valuation/target version; phải lưu cả include/exclude và option operators.
- Layout variant: cột/thứ tự/technical mapping, totals, sorting, language, user-specific/global scope.
- Export profile: XLSX/CSV/tab-text/ALV text, encoding, decimal/date notation, sheet names và header positions. Không coi đuôi `.xls` là đủ xác định format.

Mỗi proposed ID `SAVA_<REPORT_ID>_V1` là ID nội bộ; SAP variant name thực tế do SME cung cấp, có thể bị giới hạn tên theo hệ thống. GUI và Fiori là các profile riêng dù cùng canonical report. Registry không khẳng định app Fiori có mọi trường của GUI.

## Nội dung cần khóa trước APPROVED

1. System, client, edition, release/patch, language và authorization scope; screenshot selection với actual values.
2. Required fields trong dictionary, original headings và technical identifiers đã kiểm tra qua field help/catalog; optional fields có null semantics.
3. Grain/key thật; layout item/header/snapshot; không dùng total-only cho item control. Test duplicate key và export truncation.
4. Cột, thứ tự, datatype display/precision, số âm, decimal/group separator, date format, leading zeros, currency/UoM, sorting, hidden filters.
5. Sample raw bytes SHA-256, report displayed record count/totals theo currency/UoM, timestamp/cutoff; full export không phải visible page.
6. Positive/negative fixtures, adapter mapping version, report owner, reviewer, approval evidence và validity range.

## Bảo toàn nguyên bản

Lưu file nhận được byte-for-byte gồm header, selection text, dòng trống, subtotals, formatting, formula/cached values, workbook sheets, BOM/encoding. Không thêm KPI, không đổi tên cột, không trim, sort, de-duplicate hay save lại RAW bằng thư viện Excel. File download nguyên bản phải có hash bằng upload.

Parser giữ `sheet,row,column` và raw text/cell value. Dòng header/footer/subtotal phân loại trong parse inventory, không âm thầm đưa vào transaction data. Giữ cell format và displayed text khi cần phân biệt mã dạng số với số học. Formula chưa có cached value: quarantine profile chưa duyệt; không chạy macro/formula để “sửa dữ liệu”.

Preview và safe download cho người dùng là derivative có hash riêng, không được gán là RAW. Simulator phải có fixture/template riêng cho mỗi SAP layout đã duyệt; nếu dùng synthetic fixture thì ghi SIMULATED và không công bố fidelity đã validated với SAP.

## Release applicability

MB51↔F1077, FBL1N↔F0712, FBL5N↔F0711, FAGLL03H↔F2217 là nhóm nghiệp vụ, không cam kết same schema. F3303 là monitor, không mặc nhiên cung cấp PO-history line-item grain. ECC FI entry view và S/4 journal ledger view khác line identity; COOIS list type khác grain. MATDOC/ACDOCA concepts không đồng nghĩa tên cột export. Mỗi profile cần sample của đúng release; profile unknown phải fail-closed.
