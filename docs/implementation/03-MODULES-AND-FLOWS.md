# Modules và workflow

| Module | Khả năng cần triển khai | Tái sử dụng / điểm vào | Tiêu chí chấp nhận |
|---|---|---|---|
| Learn | Handbook/Workbook index, thuật ngữ, bài tập, giải thích bút toán, prerequisite | UserGuideModal, AITutorDrawer, TCodeLookupModal | Mỗi bài nối scenario/report/control; nguồn và phiên bản; chưa có Handbook file thì hiện unavailable |
| Transactions | Selection/input/validation/post/reverse/display theo scenario | StepCard, calculator, CommandBar | Có chứng từ id và log; chặn invalid transition; double-click không ghi đôi |
| Fiori Apps | Catalogue app/version/role, filter, object-page navigation | uiMode=fiori | Gắn version applicability; không gọi mock tile là full SAP app |
| Documents | Document explorer, item detail, linked flow/reversal | LedgerPanel/ACDOCA-like | Từ order thấy material/FI/billing links; orphan flag; không chỉnh posted event |
| SAP Reports | Selection variants, layout/export variants, preview/totals, immutable download | Thêm module | Tất cả requested reports có contract; v1 chỉ enabled report qua fixture approval |
| Data Lab | Upload/source declaration, hash, detect/mapping preview, DQ, quarantine, replay | Thêm module | Không sửa RAW; error theo row/column; dataset state rõ |
| Controls | Reconciliation, exception triage, root-cause tags, independent approval | Tái dùng SoD UI như educational only | Server enforcement, preparer/reviewer separation; N/A khác PASS |
| Management Analytics | Order cost, variance, procurement/AR metrics, drill to raw | VarianceWaterfall/OrderProfit/MarginAnalysis | Approved mart, cutoff/currency/denominator rõ; stale badge |
| Month-End Close | Dependency checklist, run evidence, reopen, lock state | CloseCockpit/WIP | Profile-specific DAG; no unsupported fixed universal close sequence |
| Case Simulation | Seed cases, controlled anomalies, hints, expected evidence, scoring | PRESET_SCENARIOS, SetupScreen | Independent answer key; negative cases; demo data isolated |

## Workflow P0 operator

1. Chọn scenario hoặc SAP export; xem system/release, period, currency và profile.
2. Thực hiện transaction hoặc nhận file được phép dùng; xem documents và selection report.
3. Xuất file theo variant; Data Lab nhận bytes, hash, preview, header status.
4. Chạy adapter; hiển thị accepted/rejected/totals counts và DQ. Header unknown dừng ở quarantine.
5. Chọn bộ snapshot tương thích để đối soát; unmatched/variance có lý do, owner và due date.
6. SME xác nhận nghiệp vụ, QA tái lập, reviewer độc lập duyệt. Không duyệt phần do mình tạo.
7. Publish mart; user drill variance → control → clean → raw coordinate. Commentary nêu facts, hypothesis, action, residual.

## Hành vi UI chung

Empty/loading/processing/failed/quarantined/blocked/stale/approved states; progress có counts; cancel/retry không nhân đôi dữ liệu. Bộ lọc scope luôn thấy; số tiền kèm currency, quantity kèm UoM; không sum mixed units. Bàn phím, focus/error summary, bảng virtualized với tên cột đầy đủ; export có safe spreadsheet-view copy nếu chống formula injection, RAW vẫn nguyên bản.

Không expose hash/version dài ở learning flow; đặt trong Evidence panel. Người duyệt phải thấy evidence id, dataset scope, lỗi chưa đóng và tác giả trước nút approve.
