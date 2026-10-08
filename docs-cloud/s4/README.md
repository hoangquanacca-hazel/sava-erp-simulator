# S4 — CLEAN manufacturing controls / local exception workflow

Triển khai trực tiếp `D:\sava-erp-simulator`, branch `cloud/s1-report-completion`, baseline `0ec2f65`. Phạm vi A/B/C: generated simulator data, browser RAM, không backend/storage/real SAP upload. Source: `src/controls/{policy.v1.json,reconcile.ts,workflow.ts}`, UI `src/components/ControlsPanel.tsx`; kiểm thử `scripts/s4-controls.ts`.

## Cách dùng

Mở http://127.0.0.1:3017/ và tải lại trang → hoàn thành7 bước cơ sở → SAP Reports tạo11RAW → Data Lab chuẩn hóa → **Chạy đối soát CLEAN**. Mỗi control hiển thị kết quả kỹ thuật, trạng thái nghiệp vụ, chênh lệch và nguồn RAW hash/dòng. Có metrics/bridge, không dùng số lại từ calculator để quyết định kết quả.

Chọn control → tên người giải trình tự khai → ghi giải trình + bằng chứng mỗi dòng → Lưu giải trình → Yêu cầu review → Tải hồ sơ CONTROL và manifest. Yêu cầu review không phê duyệt, không biến FAIL thành PASS. Không có nút tự nghiệm thu. Control run đã tạo không bị chạy đè trong cùng phiên. Đổi scenario/params/ledger hoặc chạy lại chuẩn hóa làm artefacts hết hiệu lực; tải hồ sơ trước khi reload/đổi. Không có tự lưu server hoặc Obsidian từ app.

## Bảy phép đối chiếu và giới hạn

| ID | Phép kiểm kỹ thuật mô phỏng | Điều kiện nghiệp vụ chưa đáp ứng |
|---|---|---|
| C01 | MB51↔COOIS GM theo year/document/item; all sides retained; so material/order/UoM/signed qty/amount/FI refs | Pending SME; không có SAP namespace/client thật; không UNION cộng đôi |
| C02 | Unique order/material/UoM aggregate components withdrawn/value↔261 | **BLOCKED_RESERVATION_MAPPING**: không có RSNUM/RSPOS ở MB51; cùng material nhiều reservation bị ambiguity; aggregate không phải row-level matching |
| C03 | Header delivered↔101, đúng output material/order/UoM, opening0 | Pending SME; chỉ one-order, cùng cutoff, không by-products/opening/reversals |
| C04 | KOB1 accumulated production debits154↔GL exact doc/line↔KKS actual, retain unclassified costs | **BLOCKED_CO_COST_BASIS**: thiếu CO area/target version/approved adjustments; favorable settlement Dr154 không tính lại là production cost |
| C05 | SUP01 signed settlements↔exact GL key/account/transaction; all settlement154 GL covered; KKS settled/WIP↔SUP/GL | **BLOCKED_RECEIVER_ELIGIBLE_VARIANCE**: thiếu receiver/settlement run/eligible variance. Non-valuated chuyển full cost, Valuated chuyển variance theo giao; không đồng nhất KKS variance với settled cost |
| C06 | CK13N1HEADER/3additive ITEM, cùng estimate/material/lot/currency; total/unit×lot↔header/order | Pending SME; profile không có realSAP estimate version/costview/subtotal hierarchy |
| C07 | Full-order actual vs CK target, material/labor/overhead deltas + explicit residual; confirmation↔operation hours/yield | **BLOCKED_SAP_VARIANCE_CATEGORIES**: đây là delta yếu tố chi phí, không price/usage/root cause hay SAP variance categories; full-order basis khác dashboard delivered COGS |

Business blocks giữ nguyên kể cả7 phép mô phỏng khớp. S4 kỹ thuật không đóng G4/M01–M10 hoặc cho phép công bố MART được phê duyệt. Dictionary/contract draft07/10 giữ nguyên để tránh ghi đè ý nghĩa gốc; policy SIM v1 bên cạnh chỉ mô tả phạm vi đã thực hiện.

## Data / audit contract

- Chỉ nhận11 S3 AdapterResult PASS; kiểm versions, same runId/sourceHash, full registry inventory, duplicates, rows/quality counts, required typed fields, scope fixed1000/1100/0L/VND/order1000001/cutoff2026-09-15, lineage rawHash/rawLine, signed-derived values. Thiếu/khác generation/qualityblocked →7controls BLOCKED, không sum null thành0.
- Qty/hour arithmetic tolerance1e-7; VND amounts tolerance0; lot×unit floating identity dùng1e-7. Đây là chính sách mô phỏng, không phải tolerance đã SME phê duyệt. Không tự đổi UoM/currency hoặc fuzzyjoin amount/date.
- Result giữ evidence của all participating rows, every orphan/diff còn refs; output và private run snapshots frozen. CLEAN/RAW không sửa. SHA256 của CONTROL export gắn sourceHash, ruleversion; file name `{runId}_CONTROL_v1.json` cùng manifest.
- Workflow EXPLAIN→REQUEST_REVIEW; actor/note/evidence bắt buộc, length limits, tốiđa1000events/case. Hash chain sequence/previousHash gắn toàn bộ control-run digest; xác minh trước append/export; clone trước await và deepfreeze trả về. Hash không phải authentication/signature/WORM, người có quyền viết toàn package có thể rehash.
- Evidence người dùng nhập chỉ là reference tự khai; nguồn RAW kỹ thuật được giữ riêng. Không có authenticated reviewer roles, independent signed approval hoặc persistent case store. Ngoài scope SIM phải tiếp tụcBLOCKED cho đến có schema/evidence đúng.
- Export luôn `approval=NOT_APPROVED`, `businessAcceptance=PENDING_HUMAN_SME`, `identity=SELF_DECLARED_NOT_AUTHENTICATED`, `persistence=BROWSER_RAM_ONLY`. CLEAN manifests S3 vẫn `PENDING_S4`: giữ nguyên original CLEAN artefact, CONTROL package là lớp bổ sung, không sửa manifest cũ thành approved.

## Kiểm chứng

54×7=378 control checks đạt trên54 A0 cases, unchanged WIP oracle; mutations missing/duplicate report, orphan movement/cost/settlement, mixed snapshot, UoM/currency, sign/lineage/count, quantities/amounts/hours/target/residual, null/NaN, duplicate material ambiguity. Workflow checks review-before-explanation, mandatory evidence, await isolation, tampered chain rejection, no approval/difference override, CONTROL export SHA256. Logs9checks `evidence/results.json`: lint/S4/S3/UI-finance/parity/A0/reports/build/start exit0. S3 covers594 conversions; UI-finance54cases.

[Review độc lập](independent-review/IMPLEMENTATION_REVIEW.md):22/22focused probes đạt; nguyên bản retained, không sửa oracle. Browser QA được bổ sung riêng sau khi hoàn tất; không suy TypeScript/build PASS thành tương tác UI PASS. Download completion/content/hash và human/SME/legal/TT99/golden chưa nghiệm thu. Warning bundle~1,5MB vẫn backlog, không gọi service health là UI/business acceptance.

## Sửa thêm / bước tiếp

Margin Analysis phân biệt “Giá vốn settlement (632)” khi không có giá vốn định mức đã ghi với “Chênh lệch settlement (632)” khi có; không gọi toàn bộ Non-valuated COGS là variance. Không đổi posting arithmetic. Legacy export descriptions và giả định GR/yield=delivered vẫn cần SME xem xét.

Tiếp theo ưu tiên bổ sung bằng chứng/contract cho4business blocks và kiểm tải thực; rồi S5 mart/commentary chỉ đọc CONTROL đủ điều kiện, phân biệt facts/hypotheses, không dựng root cause từ arithmetic deltas. Real SAP API, database/storage, multi-period/UoM conversions, CFO expansion và ZFIR009A/ZFIR159 chưa cósamples tiếp tục deferred. Không push/merge/deploy.
