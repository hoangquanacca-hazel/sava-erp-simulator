Thư viện hiện có71 hồ sơ, nên catalog chưa đủ phạm vi150 và một số hồ sơ cũ chỉ tra được trong viewer nhóm. Bổ sung79 hồ sơ có mẫu CSV bố cục/CSV phẳng/XLSX và hướng dẫn trường dữ liệu; catalog tra cứu đủ150 IDs. Tổng204 variants/204 XLSX/408 CSV mẫu; không cộng filter/layout vào số profile.

Các layout mới là schema SAVA đề xuất với dữ liệu tổng hợp,1.437 vị trí trường; từng field ghi provenance, technical name chưa xác minh và nguồn ngữ cảnh SAP. Không tuyên bố SAP native/company acceptance. Nguồn/PDF/ảnh riêng tư không đưa lên public.

Template chạy riêng dưới /sap-reporting. App navigation chỉ cập nhật số lượng; không sửa engine, API/functions, routes, dependencies hoặc theme.11 compiled JS/CSS assets có digest giống production baseline. Gate Netlify được giữ, mở rộng kiểm gói mới; CI thêm test từng ô CSV/XLSX bằng Python standard library, giữ nguyên mọi regression hiện có.

Validation:150 unique IDs;79 XLSX/158 CSV/239-entry ZIP all-cell checks;11 arithmetic fixtures độc lập;411 prior files và71 prior profile objects unchanged; browser79 mẫu/filter/toggle/download links và150 catalog/module counts; negative missing-XLSX gate reject và restored hash. Export không renderer exit0; renderer teardown0xC0000409 còn là hạn chế riêng, exported files được kiểm độc lập. Excel desktop/target system/SAP-SME acceptance chưa xác minh.
