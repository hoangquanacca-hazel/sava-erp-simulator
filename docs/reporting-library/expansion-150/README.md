# 150 hồ sơ nghiên cứu có mẫu — 13/10/2026

Bổ sung79 hồ sơ vào71 hồ sơ cũ. Tổng150 profile IDs và204 biến thể mẫu,204 XLSX/408 CSV mẫu, thêm1 CSV header tham chiếu. FI30/CO30/MM30/PP20/SD15/QM10/PM8/FI-AA7. Hồ sơ bao gồm reports, master/display screens, worklists, execution evidence và SAVA derived analysis; không phải150 T-code độc lập hoặc150 báo cáo SAP native.

79 mẫu mới khai báo1.437 vị trí trường,17–25 trường/hồ sơ. Toàn bộ fields/order là SAVA_PROPOSED, technical_name=null; không có screenshot/output được đọc để chứng nhận layout mới. Tài liệu SAP chỉ xác minh feature/module context theo nguồn, không phải target availability hoặc1:1 Fiori mapping. Một số identity còn MODULE_CONTEXT_IDENTITY_PENDING; luôn xem source_evidence.scope/limits của từng hồ sơ. Year installation2022 không xác định release. MD05/MRP Live, VKM1/FSCM và QI03 deprecated được đánh dấu riêng.

Nguồn và quyền: source-catalog/research-pages là registry URL/phiên bản/ngày khảo sát; indexed extract được phân biệt với full-page. Thử mở một số SAP Help pages trả content rỗng; không nâng thành FULL_PAGE_READ. Không tái phân phối PDF/ảnh/giao dịch nguồn. IFRS interpretation là nội dung SAVA để điều tra và đối chiếu, chưa company policy hoặc SME acceptance.

Mỗi hồ sơ có purpose, selection, grain/keys, field meanings/types/cleaning, reconciliation, controls, IFRS interpretation, lineage, source scope, rights và limitations. Giao diện expansion-150.html chạy hoàn toàn static dưới sap-reporting; không gọi AI/API/SAP/database. Catalog hiện tra cứu đủ150 IDs, bổ sung23 hồ sơ cũ trước đây chỉ hiện ở viewer nhóm.

CSV layout giữ title/context/header/detail; CSV flat chỉ có4 detail rows. XLSX có Layout/Flat input/Fields, không có công thức trong RAW. Các ID/date/decimal giữ chuỗi để luyện cleaning. Dòng1 là mini-case giả định; dòng2 thiếu numeric field; dòng3 có locale châu Âu và có thể cần reconciliation; dòng4 cố ý trùng keys dòng1. Không union các mini-cases thành bộ sổ doanh nghiệp.11 baseline equations được test độc lập; không tự coi mọi thuộc tính dummy là quan hệ đã được nghiệm thu.

Builder dùng bundled artifact-tool, không cài/thay dependency app. Export không renderer exit0. Renderer tạo đủ ảnh nhưng native teardown crash0xC0000409; giữ lỗi renderer trong nhật ký, không gọi exit code renderer làPASS. Tests độc lập đọc XML/XLSX, CSV và ZIP so từng ô/IDs/order/text type, bảo toàn411 prior files và71 prior profile objects. Không thay Excel desktop acceptance bằng render/DOM tests.

Thư viện độc lập runtime nhưng chung Netlify hosting/main release. Release guard vẫn chặn publish nếu inventory/digest/download sai. App compiled assets, engine/functions/routes/credentials không đổi. Mỗi release cần CI đầy đủ, preview UI, file hashes và production receipt trước claim live.

Tái tạo: builder scripts/build-sap-expansion-150.mjs chạy từ thư mục tạm nối bundled node_modules; đọc scripts/sap-expansion-150-data.mjs. Export --skip-previews; render --render-only theo module. Integrate bằng scripts/integrate-sap-expansion-150.py, kiểm scripts/test-sap-expansion-150.py rồi build và verify-reporting-release.mjs. Manifest chỉ cập nhật sau khi nội dung/source được kiểm, không sửa để bỏ qua lỗi.
