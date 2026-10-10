# Rủi ro, giả định, exclusions và lợi thế lâu dài

## Findings tổng hợp từ kiểm tra tĩnh

| Risk | Evidence / tác động | Mitigation / contingency | Owner |
|---|---|---|---|
| Nhầm tài sản được nhắc với tài sản đã có | sources rỗng; chat chỉ preview | Source register và gap list; bổ sung có nguồn, không bịa lịch sử | PO |
| Export hiện tại không phải SAP-original report | Excel service GL/TB/P&L và template tham số riêng | Report renderer+approved fixtures riêng; gắn fidelity label | SME/FE |
| Missing/invalid numeric bị default | parseParametersFromExcel dùng `Number(val) || default`; nz converts invalid→0 | Giữ legacy demo tách biệt; ingestion strict null/reject, negative tests | DE |
| ACDOCA-like thiếu identity/scope chuẩn | AcdocaLine simulation ids, VND, timestamp | Domain identity+period+ledger schemas/bridge, không reuse as real ACDOCA | Architect |
| SoD/audit chỉ client simulation | React state/localStorage + feature roles | Server RBAC, immutable audit, independent approval | BE/QA |
| Variance identity là tautology | Vrem = TV − components | Independent classification proof; explicit residual không tự nhận nguyên nhân | SME |
| Close sequence/sales-order settlement tổng quát hóa | hardcoded periodClose; VA88 demo | Profile-specific DAG; production settlement bridge; validation before real use | SME |
| ML demo bị gọi thành actual costing hoàn chỉnh | legal VND; USD display; simplified allocation | Giữ demo label; P2 with actual costing fixtures; chống double allocation | SME/DE |
| Accounting/branding không đồng nhất | README/metadata TT99/SAVA; server TT200/PIC text | Configurable policy/content version; SME legal review before compliance claims | PO/SME |
| Stack/parser/serverless limits bị bỏ qua | browser XLSX parser + Netlify functions | Dependency support/security review khi implementation; stream/batch worker; pinned reproducible deps | Architect |
| Tests cùng một engine có thể cùng sai | parity derives actual/expected from shared functions | Independent golden corpus + fault injection | QA |
| RAW lộ dữ liệu/LLM upload | financial/customer fields | Private access, redaction, no RAW in Git, opt-in LLM, audited downloads | BE |

Đây là risk register từ code inspection, không phải full security audit hay khẳng định lỗi production đã xảy ra. Không thay đổi app để sửa trong tác vụ tài liệu.

## Những giả định phải theo dõi

Manual exports được tổ chức cho phép dùng; representative samples có thể redacted có kiểm soát; nhóm có Finance SME/reviewer; P0 một currency/valuation profile trước khi scale; supported report layout do hệ thống cụ thể cung cấp. Giả định sai → update scope/gate, không impute data để tiến tiếp.

## Cost-benefit và chống lỗi thời

Thêm hàng trăm T-code hoặc prompt tutor dễ sao chép và tăng chi phí bảo trì. Lợi thế bền hơn: case corpus được chuyên gia kiểm chứng, report/adapter contracts versioned theo SAP release, explainable reconciliation, independent evidence, localized learning outcomes. Đo tốc độ chẩn đoán đúng và traceability, không đo tile count.

Không lock business rules vào UI/framework hay LLM provider. Adapter/rule/profile interfaces giúp thay parser/provider mà giữ dataset semantics. Batch-first hợp small team; microservices/streaming/warehouse chỉ khi benchmark và operating cost chứng minh lợi ích. Review dependency support/vulnerabilities và SAP release applicability trước mỗi release; chưa có scan thì không khẳng định version trong package.json an toàn hay lỗi thời theo CVE cụ thể.

## Explicit exclusions

Không kết nối hoặc ghi SAP trực tiếp ở MVP; không certification SAP/legal; không tất cả Fiori release; không tự close/settle tài chính bằng LLM; không thay thế ERP thật; không public hosting dữ liệu SAP. Multi-company/currency/valuation đầy đủ và CFO dashboard controlled thuộc phase sau. Không triển khai runtime mới trong task viết tài liệu này.

## Recovery khi rủi ro xảy ra

Schema drift → quarantine và profile mới; wrong KPI → revoke mart snapshot + replay; lost storage → restore coordinated DB/object backup; reviewer unavailable → hold release; source incomplete → show BLOCKED/UNKNOWN; LLM lỗi → deterministic fact view, không invent commentary. Mỗi incident có owner, thời hạn, evidence và regression case.
