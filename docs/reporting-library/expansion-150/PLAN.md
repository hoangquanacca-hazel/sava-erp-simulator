# Mở rộng thư viện lên 150 hồ sơ — 13/10/2026

## Khảo sát và yêu cầu

Baseline main 43e4fb6: 71 hồ sơ /125 biến thể. Không đổi code engine, React, APIs, dependencies, routes, Netlify functions hoặc simulator source. Checkout gốc fix/tt99-labels và nguồn riêng tư được giữ nguyên. Người dùng cho phép bổ sung các hồ sơ còn thiếu tới150 và phát hành cùng thư viện độc lập trên website.

## Thiết kế

Thêm một gói static expansion-150 trong public/sap-reporting, xem mẫu không cần upload. Giao diện/dữ liệu/download nằm hoàn toàn dưới đường dẫn thư viện. Thêm79 hồ sơ có mục đích và grain riêng: FI13, CO14, MM13, PP15, SD12, QM7, PM5. Không cộng các filter/layout hoặc transaction change/display của cùng dữ liệu. Hồ sơ có form/master/worklist/run evidence được phân loại riêng khỏi báo cáo actual accounting.

Nguồn SAP chỉ xác minh tên/phạm vi hoặc mô tả tính năng theo edition nguồn. Tất cả layout mới là SAVA đề xuất, chưa đọc full company layout; từng trường có nhãn SAVA_PROPOSED, tên kỹ thuật null, native_export false. Không gắn proposed thành SAP original. Tách target release UNKNOWN, mapping CANDIDATE/CONTEXT và quyền dùng LINK_ONLY. Dữ liệu mini-case giả định, raw strings để thực hành làm sạch, không phải dữ liệu công ty. Tất cả hồ sơ có dictionary tiếng Việt, grain/keys, hướng dẫn chạy chỉ đọc, reconciliation, control, IFRS interpretation, lineage và CSV/XLSX.

## Backlog

1. Chốt79 tên/keys/mục đích không trùng71 cũ và tìm nguồn SAP chính thức.
2. Tạo khai báo dữ liệu và builder tái lập,79 mẫu với CSV bố cục, CSV phẳng, XLSX Layout/Flat input/Fields. Giữ bytes các mẫu cũ.
3. Tạo viewer tìm kiếm theo module/T-code, chọn báo cáo, xem toàn bộ cột, field dictionary, tải mẫu.
4. Hợp nhất150 IDs trong master/progress/catalog; cập nhật release manifest có chủ đích.
5. Kiểm JSON/download/all-cell/raw-ID/counts/link/order/provenance; render workbook và browser QA.
6. Build thông thường + gate; so sánh assets/functions với production baseline. CI cũ chạy nguyên vẹn, preview trước merge, Git production verification sau merge.

## Release và ứng phó rủi ro

Chỉ phát hành khi CI và hosting gate pass; nếu fail, deployment hiện tại giữ nguyên. Nếu app assets thay đổi ngoài phạm vi thì dừng merge, không sửa engine để đi vòng. Nếu runtime regression xuất hiện thì restore deploy đã kiểm chứng, giữ chứng cứ rồi sửa scoped increment. Thư viện độc lập runtime nhưng vẫn dùng chung hosting/lượt phát hành.

150 là số hồ sơ nghiên cứu có mẫu, không phải150 original exports hoặc nghiệm thu SAP/IFRS. Số lượng đạt không khắc phục thiếu company layout/release/SME policy. Báo cáo lỗi thời/legacy chỉ giữ để học ECC và ghi rõ hạn chế S/4HANA. Nâng chất lượng bằng company exports và mapping được duyệt có giá trị hơn tiếp tục tăng variants.

Nhật ký ngày13/10 và gói Obsidian được cập nhật với kết quả thật, cutoff và trạng thái deploy.
