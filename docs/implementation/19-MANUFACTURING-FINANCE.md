# Manufacturing Finance — năm quy trình FICO

Ngày thực hiện: 22/10/2026, Asia/Saigon. Theo năm chủ đề người dùng nêu cho infographic cập nhật 21/10/2026. **Ảnh gốc chưa có trong đầu vào được truy cập; chưa đối chiếu bố cục/nội dung chi tiết của ảnh.**

Mở simulator → **Manufacturing Finance · 5 FICO**, hoặc `#/manufacturing-finance`. Không cần thực hiện Cockpit trước. Đây là bài luyện tập có hành vi và worklist, không phải kết nối SAP.

## Kiểm tra hiện trạng và quyết định phạm vi

| Thành phần đã đọc | Hiện trạng | Quyết định |
|---|---|---|
| `src/App.tsx`, `src/utils/calculator.ts`, `src/utils/acdoca.ts`, `src/events/scenarioEvents.ts` | Cockpit 7 bước, ACDOCA mô phỏng, MTO sản xuất; chưa có lifecycle cọc, subledger dunning/bank clearing hay Internal Order AVC | Thêm sổ luyện tập riêng; không sửa calculator, posting engine hoặc accounting configuration |
| `src/features/intercompany.ts`, `src/pages/IntercompanyPage.tsx` | Intercompany TP mô phỏng hóa đơn/markup/loại trừ trên sổ hiện có; UI đã nói không phải sổ đa pháp nhân | Giữ nguyên; bài mới mô phỏng thanh toán hộ với hai company, hai chứng từ và joint ID |
| `src/controls/reconcile.ts`, `src/controls/workflow.ts`, `src/controls/policy.v1.json` | C01–C08 có namespace/kỳ/ngày chốt riêng; review request không phải approval | Không đưa bài mới vào các kiểm soát P0; MF01–MF06 là kiểm tra riêng của bài, không đổi gate hiện có |
| `src/reports/core.ts`, `src/reports/snapshot.ts`, `src/adapters/contracts.v1.json` | 11 báo cáo Phase A, exporter dùng ngày chốt/cấu hình MTO 15/09/2026 | Tái dùng `ReportOutput` và hàm SHA-256; exporter mới ghi đúng scope/ngày 21/10/2026, không gọi exporter có banner MTO |
| `docs/implementation/04-REPORT-MASTER-DICTIONARY.md`, `contracts/report-contracts.v1.json` | D14/D15 giữ normal/Special G/L riêng, grain entry-view; D16 là GL view, không tự đồng nhất BUZEI/DOCLN | Invoice ID của bài gồm company/year/document/item; không tuyên bố là native ACDOCA hoặc adapter SAP |
| `scripts/sap-expansion-150-data.mjs`, `public/sap-reporting/expansion-150.json` | FI21/F150 và FI22/FEB_BSPROC/FEBAN có practice worklist, chưa có workflow runtime; native_export=false | Tái dùng đúng thứ tự 18 cột và keys qua `src/reports/manufacturingFinance.contracts.json`; test so với registry khi registry có mặt |

Thư viện báo cáo hiện là công việc có sẵn chưa tracked trong working tree. Snapshot FI21/FI22 mới nhỏ và tự chứa để trang chạy độc lập; không đưa toàn bộ thư viện vào thay đổi này. Không tăng số profile, không tái sinh XLSX/CSV hay sửa public library. Không deploy, commit hoặc thay đổi originals.

## Kịch bản và walkthrough

Scope cố định `MFG-FIN-20261021`, VND, ngày chốt 21/10/2026. Company 1000 bán hàng, company 2000 là nhà máy; Internal Order `IO-MOULD-01`. Số tiền và ngày đến hạn là fixture hồi cứu, mọi training posting mang ngày chốt. Tài khoản trong bài là tên logic demo, không phải mapping tài khoản doanh nghiệp hay kết luận pháp lý. Bài giả định không thuế và không FX.

1. **Special G/L customer down payment**: tạo yêu cầu cọc F-37 demo 36 triệu, chưa có bút toán; nhận cọc F-29 demo ghi BANK/CUSTOMER_ADVANCE_ALT với indicator A demo; lập hóa đơn SO-MF-01 120 triệu; F-39 demo cấn 36 triệu, AR còn 84 triệu. Chưa nhận cọc/chưa có hóa đơn thì cấn bị chặn. Cọc không tạo doanh thu. Không mô phỏng lifecycle supplier down payment/security deposit.
2. **F150 automated eligibility + notice simulation**: chạy đề xuất, xem FI21; phát hành thông báo mô phỏng. Chính sách địa phương: grace 3 ngày; mức 1 từ ngày 4, mức 2 từ ngày 30; interval 7 ngày; phí 0. Chưa đến hạn, bị block, đã clearing và còn trong interval được giữ với trạng thái loại. Đề xuất không đổi last dunning date; phát hành mới cập nhật. Mọi lệnh làm thay đổi revision sau đề xuất đều yêu cầu chạy lại trước phát hành, kể cả thay đổi ngoài AR. Đây là lựa chọn bảo thủ. Không scheduler/email/print job thật; dunning level không phải ECL.
3. **Electronic bank statement clearing/FEBAN**: sau cấn cọc, bấm đối chiếu tự động. Item 001 thu 84 triệu clearing SO-MF-01; item 002 thu 40 triệu clearing hai invoice 15 + 25 triệu cùng customer/reference. Bank amount được ghi một lần, invoice links ở Assignment và evidence. Item 003 thiếu reference: người dùng chọn invoice REPAIR-01 12 triệu và xác nhận thủ công; reference ngân hàng gốc vẫn giữ. Item 004 có hai customer dùng cùng reference, tiếp tục AMBIGUOUS. Tự động không chọn bằng amount-only, không thử subset tùy ý. Scope/currency/rule sai hoặc lệch tiền bị giữ lại. Không tự write-off.
4. **Internal Order budget control**: ngân sách tổng 100 triệu; actual đầu kỳ 20 triệu, commitment cũ 10 triệu. Thử PO 90 triệu → assigned 120 triệu, BLOCKED, không đổi trạng thái. PO 60 triệu → assigned 90 triệu, WARNING, được ghi commitment. Ghi invoice PO mới → actual 80 triệu, commitment còn 10 triệu, assigned vẫn 90 triệu. Không cộng hai lần PO và invoice. AVC phải active; ngưỡng demo cảnh báo >=90%, chặn >100%, không phải cấu hình chuẩn áp dụng cho mọi SAP.
5. **Cross-company clearing**: 1000 trả hộ nhà cung cấp của 2000 số tiền 60 triệu. Chứng từ 1000: Dr DUE_FROM_2000/Cr BANK; chứng từ 2000: Dr AP/Cr DUE_TO_1000. Cùng `IC-PAY-01`; mỗi company cân riêng. Supplier item được chọn hết dư; reciprocal balances giữa 1000/2000 vẫn mở 60 triệu cho đến hoàn trả. Đây không phải loại trừ hợp nhất, không thay module Intercompany TP.

Các thao tác đã ghi có guard chống lặp; lệnh bị chặn trả nguyên trạng thái, lệnh thành công clone và ghi nhật ký. Sổ được giữ ở App khi đổi tab nội bộ. Reload trình duyệt mất dữ liệu; nút “Đặt lại riêng bài tài chính” chỉ đặt lại bài này. Nút Reset/preset/export/AI ở Header vẫn thuộc Cockpit MTO. Export của bài nằm trong phần bằng chứng riêng; vai trò SoD chung không có tác dụng authorization trong bài.

## Report contracts và bằng chứng

FI21 giữ company/run/customer/document/item; export còn có Fiscal Year. Chỉ dùng trong namespace một năm của fixture; không suy key tổng quát nhiều năm từ practice keys cũ. FI22 giữ company/house bank/bank account/statement/item. Một dòng bank có thể liên kết nhiều FI items, không nhân amount qua join. Cột/nhãn là **SAVA_PROPOSED**, chưa xác minh field catalog hay layout SAP của công ty.

FI21 có thể là preview, proposal hoặc snapshot thông báo đã phát hành; open amount của snapshot là tại lúc đề xuất. AR hiện tại luôn xem ở bảng AR. Proposal chưa phát hành và khác revision được gắn STALE_PROPOSAL; không xuất dấu hiệu thành công giả.

MF01: balance mỗi chứng từ/company; MF02: Special G/L còn treo; MF03: GL AR so với open items; MF04: actual + commitment so với budget; MF05: reciprocal IC balances; MF06: số tiền bank so với chứng từ clearing. Các trạng thái `SIMULATED_PASS` chỉ kiểm tra consistency nội bộ, không phải SAP/SME acceptance.

Nút tải JSON capture trạng thái, command history, replay tất định, control results, FI21/FI22 và SHA-256 của worklist. Trước export, hệ thống replay command từ fixture và so toàn bộ trạng thái; dữ liệu/log sửa trực tiếp bị từ chối. SHA-256 của cả file được hiển thị ngoài file. Hai nút TXT tải worklist tab-delimited, UTF-8, LF, ghi đúng scope của bài.

Reproduce:

```text
npm run test:manufacturing-finance -- --write-evidence
npm run lint
npm run test:parity
npm run test:a0
npm run test:reports
npm run test:ui-finance
npm run test:s3
npm run test:s4
npm run test:s5
npm run test:s6
npm run build
```

Saved sample: [MFG-FIN-20261021_SIMULATED.json](evidence/manufacturing-finance/MFG-FIN-20261021_SIMULATED.json). Hash/check count: [validation.json](evidence/manufacturing-finance/validation.json). Đây là CLI-generated evidence, không phải bằng chứng browser đã lưu file. Nhật ký kiểm thử nằm cùng thư mục.

[Review status](evidence/manufacturing-finance/review-status.json) ghi 12 command kỹ thuật đã qua, hash log và source files. Build PASS; production smoke PASS khi chạy lại ngoài sandbox. Hai lần smoke trong sandbox gặp localhost `EACCES` rồi readiness timeout; giữ nguyên log thất bại, không diễn giải là lỗi accounting hay che kết quả. Smoke chỉ kiểm startup/health/index/built JS qua HTTP, không thực thi UI trong browser. Build vẫn có cảnh báo bundle chính >500 kB; bài mới được lazy-load. Không mở rộng tác vụ thành tái cấu trúc bundle toàn app.

## Giới hạn acceptance và rủi ro còn lại

| Lớp bằng chứng | Trạng thái / điều kiện |
|---|---|
| Local workflow/replay/negative cases và SSR hai theme | Kết quả trong validation/test logs; không gọi là independent review |
| Browser interaction/download/render trực quan | Bootstrap Browser trong app vẫn lỗi version path. RC1 đã có kiểm thử browser thực qua Edge headless/profile tạm riêng trên localhost; results/ảnh/downloads ở `evidence/manufacturing-finance/v1-rc1/`. Không coi kiểm thử Edge/viewport mobile là Safari/iPhone thật hoặc SME acceptance |
| ESLint | Lượt triển khai đầu NOT_RUN vì thiếu local dependency. Lượt tiếp nối 22/10: đã cài dev dependencies đã khai báo và chạy strict + feature-scoped ESLint PASS; xem `evidence/manufacturing-finance/followup-2026-10-22/`. Không đổi package.json/lockfile |
| SAP edition/release/field catalog | UNKNOWN; cần xác định edition/release trước khi chốt transaction/app equivalence |
| SAP-native execution/export | NOT_RUN; chưa có SAP connection/native samples |
| Independent Finance SME, nghiệp vụ, pháp lý | PENDING / NOT_APPROVED |

Cần SAP/SME kiểm chứng tối thiểu: alternative reconciliation account/indicator và clearing down payment; dunning procedure/blocks/interval/run log/notice output; bank posting/processing rules, interpretation algorithms và posting area 1/2; order type/budget profile/AVC activation, tolerance và commitment relief; company-pair clearing accounts và hai linked clearing documents. Làm với fixture/expected outcome được reviewer độc lập duyệt, không dùng test của chính feature làm chứng nhận SAP.

Chi phí/lợi ích: engine tất định và contract projection nhỏ phù hợp bài học này; chưa có lý do xây backend, batch scheduler, AI matching hay integration thật. Rủi ro lớn là tạo cảm giác “giống SAP = đã được SAP nghiệm thu”. Giảm bằng nhãn trạng thái trong UI/export, scope riêng, exception giữ lại và gate SME. GUI T-code/Fiori app phụ thuộc edition/release; để bền vững, giữ hành vi/contract độc lập và thay mapping giao diện sau khi có metadata/native evidence. Lợi thế dài hạn nằm ở fixture nghiệp vụ, negative cases và traceable reconciliation đã được SME xác minh, không nằm ở việc sao chép màn hình SAP.

Nguồn chính thức đã đọc ngày 22/10/2026, chỉ xác nhận khái niệm, không chứng minh cấu hình của công ty:

- [SAP: Basic Principles of Special G/L Transactions](https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/3cb1182b4a184bdd93f8d62e3f1f0741/6a4fd1538cdf4608e10000000a174cb4.html?locale=en-US) — alternative reconciliation account; nguồn S/4HANA 2025 FPS01.
- [SAP: Periodic Vendor Dunning](https://help.sap.com/docs/SUPPORT_CONTENT/fiaccounting/3361880943.html) — F150 parameters/proposal/notice; nguồn support, không coi vendor example là cấu hình AR của doanh nghiệp.
- [SAP: Overview on Automatic Bank Statement Processing](https://help.sap.com/docs/SAP_S4HANA_CLOUD/918bca53037f408f91a2295d04ac16bc/9929e3049c88402a8d56e437a3967e38.html) — rules và reprocessing; nguồn Public Cloud, không chứng nhận parity với FEBAN ECC.
- [SAP: Budget and Availability Control](https://help.sap.com/docs/SUPPORT_CONTENT/ficontrolling/3361878635.html?locale=en-US) — budget profile, assigned value actual + commitments và configurable tolerances.
- [SAP ERP: Cross-Company Code Clearing](https://help.sap.com/docs/SAP_ERP/72b431fb78a649da9c8b46951e64fb88/d7e9d353ca9f4408e10000000a174cb4.html) — separate clearing documents và joint transaction number.

Obsidian: lượt tiếp nối theo yêu cầu người dùng chuẩn bị gói riêng `00_Inbox/AI/2026-10-22_Manufacturing_Finance` trong vault `D:\Sava_Second Brain`. Trạng thái ghi/readback thực tế xem `docs/implementation/obsidian-export/2026-10-22_Manufacturing_Finance/VAULT_RECEIPT.json`; UI proof được ghi riêng sau khi mở note. Không suy từ tài liệu chuẩn bị thành đã lưu hoặc nghiệm thu.

## Mốc Simulator v1 được đồng ý

Người dùng đồng ý ưu tiên đóng bản học tập cho năm workflow. [Phiếu review RC1](21-SIMULATOR-V1-REVIEW.md) tách kiểm chứng kỹ thuật khỏi quyết định dùng học tập. RC1 bổ sung browser QA/tải file thật, sửa giới hạn chiều ngang toolbar/form và reset dữ liệu nhập của bài; header cuộn tự nhiên trên màn hình nhỏ để không che nội dung. Giữ nguyên engine kế toán và labels SIMULATED/SAP-native NOT_RUN.
