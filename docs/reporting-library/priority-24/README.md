# 24 nhu cầu ưu tiên — bổ sung thư viện SAP

Thư viện có 160 hồ sơ nghiệp vụ và 227 biến thể mẫu. Đợt này thêm 10 hồ sơ, 23 biến thể, 23 XLSX và 46 CSV, phục vụ 24 nhu cầu trong bảng người dùng gửi. F1780 dùng lại CO11-02; không tạo bản xuất trùng. Số lượng hồ sơ không chứng nhận chất lượng native SAP hoặc hoàn thành ba giai đoạn.

Viewer độc lập: `/sap-reporting/priority-24.html`. Mỗi view có bố cục, bảng phẳng, từ điển trường, nguồn/phiên bản, cách chạy/đọc, đối chiếu, kiểm soát, IFRS draft và lineage. AP F1733 chỉ mô phỏng dữ liệu chart By Supplier: 5 tham số và 3 trường dữ liệu; không ghép tất cả chart/card thành một ALV. Các view F0960 theo product/customer là đầu vào amounts theo account, chưa phải lợi nhuận đã nghiệm thu. KE30 là form SAVA minh họa vì form công ty chưa biết.

Các điểm truy cập chính: S_ALR_87012078, F1733, S_ALR_87012168, card AR Aging của F3242, F1741, W0081, KE5Z, W0079, F0959, F1780, KE30, F0960, ME2L, ME2M, F0905, F0859/F1060A, F1250, F1249, IW39, MCI8, AFAB/F1914, F1617 và F1615. Đây là các điểm truy cập theo bằng chứng có giới hạn; không tuyên bố tương đương 1:1 hoặc sẵn có trên hệ triển khai khoảng năm 2022.

## Ranh giới bằng chứng

Nguồn chính thức được dẫn bằng URL và ghi phạm vi/release. Có 413 vị trí trường trong 23 view, gồm tham số và dữ liệu; các semantics đọc từ tài liệu được tách khỏi trường đề xuất. Chưa có nhãn cột export native được kiểm chứng trong đợt này; thứ tự bố cục và technical field names chưa xác minh. Dữ liệu hoàn toàn tổng hợp SAVA. Public không chứa PDF/ảnh gốc, file doanh nghiệp hoặc thông tin đăng nhập. Bảng đối chiếu giữ mã người dùng gửi riêng với điểm truy cập đã rà soát.

XLSX có Layout, Flat input và Fields. CSV bố cục giữ phần đầu/tham số/header/detail; CSV phẳng giữ mọi trường theo vị trí. RAW giữ chuỗi, số 0 đầu và ngày dạng chuỗi để thử làm sạch. UTF-8 BOM, dấu phẩy và CRLF là lựa chọn SAVA, chưa chứng nhận encoding/delimiter SAP công ty. Có các ca thiếu số, locale châu Âu và trùng cố ý; không cộng tất cả dòng như dữ liệu kế toán.

## Kiểm tra

`validation.json`: kiểm từng ô của 23 XLSX/46 CSV, vị trí trường, chuỗi RAW, ca lỗi, ZIP CRC/hashes và 19 quan hệ số liệu độc lập. Bảo toàn 150 đối tượng hồ sơ và 651 tệp cũ byte-for-byte; index/master/progress là ba tệp thay có chủ đích. Các download cũ không đổi.

`browser-validation.json`: kiểm 24 lựa chọn, AP 8 trường ở bảng phẳng/3 cột dữ liệu ở bố cục, 5 tham số, F1780 9 cột, bộ lọc FI-AA, tìm kiếm rỗng và ME2M 27 cột. Bản build giữ nguyên 11 gói JS/CSS của ứng dụng chính so với live baseline. Không sửa engine, API, functions, routes, dependencies hoặc theme; chỉ số lượng của liên kết thư viện trên app được cập nhật.

69 ảnh sheet được render từ XLSX đã lưu. Đã xem sáu contact sheet để kiểm bố cục toàn bộ, nhưng ảnh thu nhỏ không chứng nhận mọi nội dung đọc rõ. Renderer thoát mã 1 sau khi tạo ảnh và có thể hiển thị mất số 0 đầu dù XML lưu đúng chuỗi; giữ giới hạn này mở. Excel desktop, release mục tiêu, field catalog toàn bộ và SAP SME/IFRS business acceptance: chưa kiểm chứng.

## Tái tạo và phát hành

Chuẩn bị registry/baseline, chạy builder bằng bundled artifact-tool, rồi `finalize-sap-priority-viewer.py`, `integrate-sap-priority-24.py`, `test-sap-priority-24.py`, kiểm historical expansion150 và bản build/release guard. Không tái tạo tệp cũ. Renderer tách khỏi authoring; không che exit code.

Release chỉ sau CI và preview đạt; xác minh HTTP/hash các tệp mới/thay đổi và mẫu cũ đại diện, cùng asset ứng dụng và API health/chat GET. JSON/CSV/XLSX/ZIP phải giữ nguyên byte. Netlify có thể đổi liên kết HTML nội bộ thành pretty URLs và serialize dấu nháy/thứ tự thuộc tính: phép đối chiếu so đúng nội dung và giá trị thuộc tính, từ chối đổi nội dung/script/route/host. Chỉ trên preview, bỏ đúng footer Drawer có site/deploy ID khớp API và script `/.netlify/scripts/cdp`; không bỏ script tùy ý. Không đổi cấu hình hosting toàn website để ép HTML giữ hash. Runtime template tĩnh độc lập nhưng cùng hosting và quy trình phát hành với app. Chưa hoàn tất Giai đoạn 1 về độ sâu/nghiệm thu, Giai đoạn 2 về bao phủ nghiệp vụ/bố cục nguồn, hoặc Giai đoạn 3 về 200–250 hồ sơ và kết nối.
