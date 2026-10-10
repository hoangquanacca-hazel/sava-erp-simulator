# Baseline, nguồn, và mức độ tin cậy

## Repo tại thời điểm bắt đầu

- Đường dẫn: `D:\sava-erp-simulator`; repo Git có sẵn, không tạo project/repo/branch thay thế.
- Branch: `feat/sava-brand-l1`.
- HEAD: `c629d2ad68a0e95130effefd889a315462b32cc4`.
- `git status --porcelain=v1`: rỗng trước khi thêm tài liệu.
- 5 commit gần nhất: `c629d2a` brand L1; `926837a` M4–M9 MDG/SoD/ML/GRIR/IC/Gemini; `c37f529` WIP; `03b0d05` close; `2d1f934` variance.
- Không tìm thấy AGENTS.md trong cây repo hoặc `D:\AGENTS.md` tại lần kiểm tra. Áp dụng chỉ dẫn người dùng trong chat.
- Bản mirror Project SAP Simulator có thư mục `sources/` nhưng **0 file**. Không sửa mirror sources.

## Inventory có bằng chứng code (không đồng nghĩa đã chạy kiểm thử)

| Tài sản | Nguồn trong repo | Kết luận và hướng giữ lại |
|---|---|---|
| React 19 / TS / Vite / Tailwind / Recharts | package.json, src/App.tsx | Giữ frontend và cách chia module; không đổi framework để viết tài liệu |
| Express, AI tutor | server.ts | Server hiện chủ yếu health/chat; chưa thấy ingestion persistence |
| Netlify SPA + functions | netlify.toml, netlify/functions | Hai runtime Express/Functions cần kiểm tra parity khi mở rộng API |
| 7-step MTO, strategy 20/25, Valuated/Non-valuated E | types.ts, calculator.ts | Tài sản học tập; không coi mọi định khoản giản lược là SAP chuẩn |
| Journal / ACDOCA-like / trial balance / margin | utils/acdoca.ts, LedgerPanel.tsx | Giữ engine mô phỏng. AcdocaLine chưa là toàn bộ schema SAP ACDOCA |
| BOM/routing/costing drill | BOMTreeView, BOMVisualizer, calculator.ts | Tái sử dụng UI; gắn cost estimate identity/version |
| Variance / close / WIP / MDG / SoD / ML / GRIR / IC | src/features và src/pages | Có mã nguồn. Các flag mặc định bật; chưa nghiệm thu thực tế |
| Excel input tham số | excelService.ts: parseParametersFromExcel | Template riêng ThamSoDonHang/DinhMucBOM/RoutingDinhMuc; không phải SAP report adapter |
| Excel output | excelService.ts | GL/TB/P&L/Close Pack tự thiết kế; không đủ chứng minh original SAP format |
| Parity suite | scripts/parity.ts | Có assertion nhưng dùng chung engine; không thay thế independent oracle |
| T-code lookup / Classic / Fiori-mode | TCodeLookupModal, SAPClassicMenu, App | Giữ tương tác; Fiori-style UI không phải bằng chứng app SAP thật |
| Handbook/Workbook, AP Hub, AR aging/DSO, COOIS/COGI, Z-report | Chỉ thấy trong preview chat | DISCUSSED_UNVERIFIED; chưa tìm được artefact tương ứng |

## Nguồn hội thoại

SRC-CHAT-01: preview do người dùng cung cấp của “Mô phỏng Tcode SAP S4HANA”, conversation `6ac58cd0-40b8-83ec-ac9c-f95bc5a4dfd8`.
Preview chứa: người dùng đồng ý kiểm tra/xây Report Master Dictionary; trợ lý đề nghị giữ simulator, bổ sung data/reporting; dictionary 18 thuộc tính; người dùng “Đồng ý, tiếp theo”; đề nghị Manufacturing Cost & Variance làm vertical slice đầu tiên; draft D01 MB51, D02 Header, D03 Components; D04 bị cắt; yêu cầu lưu kế hoạch vào D:.

SRC-REQ-01: yêu cầu hiện tại nêu 17 nhóm deliverable và chỉ thị làm ngay trên repo cũ. Đây là nguồn phạm vi có thẩm quyền cao nhất.

`read_thread` (turnLimit=10) và `list_threads` đều trả **Invalid app tool request (-32602)**. Không có cursor hay toàn văn để tiếp tục. Không tự điền phần chat bị cắt, không tuyên bố đã đọc toàn bộ Project. Bổ sung lịch sử/file sau này bằng append-only decision amendments.

## SAP references đối chiếu ngày 07/10/2026

Các nguồn chỉ xác nhận khái niệm/tên app; không chứng nhận layout/field khả dụng tại hệ thống của người dùng. Chưa biết edition/release/client/language/customizing.

- [Material Documents Overview — F1077](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/651d8af3ea974ad1a4d74449122c620e/7cc07e548af58e4ce10000000a4450e5.html): định danh app material documents.
- [F2217 — Display Line Items in General Ledger](https://help.sap.com/docs/r/0fa84c9d9c634132b7c4abb9ffdd8f06/latest/en-US/bd874158706b9144e10000000a4450e5.html): GL view; lưu ledger và selection.
- [F3303 — Monitor GR/IR Account Reconciliation](https://help.sap.com/docs/SAP_S4HANA_CLOUD/0fa84c9d9c634132b7c4abb9ffdd8f06/8700d78b2faf49f6aff17857bd674f27.html): monitor, không mặc nhiên là item-level extract thay thế PO history.
- [Supplier/customer line items](https://help.sap.com/docs/SAP_S4HANA_CLOUD/031c345485b84c8c94265be9ef61d3a8/656fa2cdaaa9480b83d8bda9e9a57fe1.html): F0712 supplier, F0711 customer.
- [Variance calculation](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/5e23dc8fe9be4fd496f8ab556667ea05/c2de385313e57d77e10000000a441470.html): phân tích target/control costs và phân loại chênh lệch.
- [Types of variance calculation](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/5e23dc8fe9be4fd496f8ab556667ea05/259142530fafff4fe10000000a44176d.html): target cost version ảnh hưởng ý nghĩa/settlement relevance.
- [Settlement in Product Cost by Order or Period](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/5e23dc8fe9be4fd496f8ab556667ea05/5c35d85275c8d142e10000000a4450e5.html): cần cầu nối settlement; không suy KKS1 là FI posting.
- [CK13N](https://help.sap.com/docs/SAP_S4HANA_CLOUD/6b39bd1d0e5e4099a5b65d835c29c696/c896d7531a4d414de10000000a174cb4.html): material cost estimate và itemization.
- [CK13N vs preliminary order estimate](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/5e23dc8fe9be4fd496f8ab556667ea05/b8a6d7531a4d414de10000000a174cb4-2667.html): so sánh cần cùng lot size/UoM.
- [COOIS lists](https://help.sap.com/docs/PRODUCT_ID/9905622a5c1f49ba84e9076fc83a9c2c/36e8f911e5b24ce7aafc1b20b59949c8.html): các list độc lập Header/Components/Operations/Confirmations/Documented Goods Movements.
- [Actual costing overview CKM3N/CKMLCP](https://help.sap.com/docs/s4hana-cloud-best-practices/actual-costing-33q-cz/overview-table): tách phân tích giá khỏi execution/run log.
- [Purchasing reports ME2N](https://help.sap.com/docs/PRODUCT_ID/349992fb60854a62a264d716ad5c8f54/a1e5e052427c9d36e10000000a44538d.html).
- [KOB1 actual line items](https://help.sap.com/saphelp_em700_ehp01/helpdata/en/40/f08473b9d74821bf2d187859afa75e/content.htm?no_cache=true).
- [Sales reports VF05](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/25a41481f62e469ba0e61015a0d39d20/32756754e90d8c4ce10000000a4450e5.html).

## Phạm vi kiểm tra lần này

Kiểm tra tĩnh code/tài liệu/Git; tạo và kiểm tra cấu trúc bộ tài liệu. Không chạy app, không kết nối SAP, không chạy npm install, không chứng nhận test runtime. Baseline file hashes và kiểm tra sau ghi bảo vệ nội dung hiện có.
