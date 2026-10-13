# Duy trì thư viện template SAP trong các lần phát hành app

Thư viện tĩnh nằm ở `public/sap-reporting/`. Vite tự sao chép thư mục public vào dist trong build thông thường; không cần overlay thủ công sau deploy. Trang chính có block điều hướng độc lập, không thay đổi React engine hoặc API. Netlify tiếp tục sử dụng cấu hình static + functions hiện có.

`src/index.css` loại thư mục template và tài liệu reporting khỏi quá trình Tailwind dò tên class để các nhãn SAP/dữ liệu CSV/nội dung tài liệu không làm phát sinh CSS của simulator. Các viewer có CSS riêng. Đây là giới hạn phạm vi scan theo [tài liệu Tailwind](https://tailwindcss.com/docs/detecting-classes-in-source-files#ignoring-specific-paths), không thay thiết kế hoặc rule tính toán của app.

Baseline thư viện: 71 hồ sơ /125 biến thể, 125 XLSX, 250 CSV mẫu, một CSV header tham chiếu, 7 ZIP và các viewer/JSON. Số hồ sơ khác số biến thể. Nội dung là mẫu dựng lại/dữ liệu tổng hợp SAVA; không phải export SAP nguyên bản hoặc nghiệm thu IFRS/SAP/SME.

## Kiểm tra bắt buộc khi build

Sau `npm run build`, chạy `node scripts/verify-reporting-release.mjs`. CI chạy phép kiểm này sau bước Build, bên cạnh toàn bộ regression hiện có. Nó kiểm tra inventory, từng SHA256 trong source và dist, toàn bộ download của 125 biến thể, liên kết tài nguyên, metadata tổng hợp và nút truy cập trong HTML build. Missing files hoặc đổi bytes không được bỏ qua.

`.gitattributes` giữ nguyên byte các export SAP thực hành trên Windows/Linux; CSV không bị Git tự đổi line endings. Manifest ở `scripts/reporting-library-release-manifest.json` phải cập nhật có chủ đích sau khi tác giả đã xác minh bộ mẫu mới; không sửa digest chỉ để làm CI xanh. Kiểm tra trường/nguồn/grain và quyền sử dụng trước khi tăng số mẫu.

## Phạm vi và nguồn riêng tư

Không đặt PDF/ảnh nguồn, file SAP công ty, token, .env, chat archive hoặc vault Obsidian vào public. Viewer liên kết đến tài liệu công khai và nêu mức bằng chứng. Nguồn tham khảo được đọc không có nghĩa có quyền phân phối lại nguyên bản.

Không đổi code costing, contracts, adapters, controls, functions hoặc dependencies chỉ để gắn thư viện. Khi cập nhật simulator, giữ thư mục public, block điều hướng, manifest và CI guard. Build/CI và HTTP checks là kiểm chứng kỹ thuật, không tự nâng trạng thái nghiệm thu nghiệp vụ.

## Sau merge và deploy

Kiểm tra deployment Netlify xuất phát main commit mới; mở `/sap-reporting/#catalog` và viewer, kiểm tra CSV/XLSX đúng loại và hash, `/api/health` còn hoạt động và chat GET vẫn405. Ghi rõ commit/deploy/live statuses, nhật ký và Obsidian. Nếu có regression, restore deployment đã kiểm chứng trước đó và giữ bằng chứng; sau đó sửa hoặc revert đúng increment, không reset/clean repo làm mất công việc khác.
