# Manufacturing Finance — bàn giao kỹ thuật RC2

Ngày 22/10/2026. Yêu cầu tiếp nối: **“Tiếp tục làm hết, phần của tôi làm sau cùng”**. Hoàn tất phần kỹ thuật trong phạm vi năm workflow và chuyển review nghiệp vụ/học tập thành bước cuối. Yêu cầu này không phải xác nhận nghiệm thu.

Ứng viên `manufacturing-finance-v1.0.0-rc.2` thay RC1. Kết quả và SHA-256 ở `evidence/manufacturing-finance/v1-rc2/RELEASE-MANIFEST.json` và `.sha256`; xác minh trước khi dựa vào kết quả. Năm workflow và kế toán không đổi so với RC1. RC2 thêm kiểm tra file bằng chứng đã lưu bằng UI/CLI, chỉ đọc.

## Mở bài

Preview: <http://127.0.0.1:3210/#/manufacturing-finance>. Đây là tiến trình local; cần khởi động lại khi máy/phiên dừng, chưa phải website triển khai.

Tại `D:\sava-erp-simulator` nếu preview chưa chạy:

```powershell
npm ci --ignore-scripts --include=dev --no-audit --no-fund
npm run build
$env:NODE_ENV='production'
$env:HOST='127.0.0.1'
$env:PORT='3210'
$env:GEMINI_API_KEY=''
node dist/server.mjs
```

Không chạy cài/build lại nếu chỉ xem preview đang chạy. Build mới cần đối chiếu manifest trước khi gọi là cùng ứng viên. Không dùng `clean` để dọn repo có công việc song song.

## Dùng và giữ bằng chứng

Walkthrough đủ năm quy trình có trên trang. [Phiếu review](21-SIMULATOR-V1-REVIEW.md) chứa expected outcomes và năm câu lập luận; đây là hướng dẫn kế thừa RC1, dùng **candidate/hash RC2** cho kết luận mới.

1. Cọc: request không hạch toán; nhận 36 triệu không ghi doanh thu; invoice 120 triệu; cấn còn AR 84 triệu.
2. F150: proposal giữ block/chưa đến hạn với lý do; notice mới cập nhật lịch sử. Proposal cũ bị chặn sau khi sổ đổi.
3. FEBAN: 001 thu 84 triệu; 002 phân bổ 40 vào 15+25; 003 chọn REPAIR-01 12 triệu; 004 vẫn mơ hồ. AR cuối 40 triệu, receipts từ sao kê 136 triệu.
4. IO: PO 90 triệu bị chặn; PO 60 triệu được cảnh báo. Invoice relief commitment: actual 80, commitment 10, available 10 triệu.
5. Thanh toán hộ: AP supplier item chọn về 0; due-from/due-to hai company vẫn 60 triệu; mỗi company cân riêng.
6. Tải JSON và FI21/FI22 bằng nút **trong bài**, lưu SHA-256 riêng. Header chung vẫn xuất dữ liệu Cockpit MTO. Reload xóa sổ RAM; xuất trước khi reload.
7. **Mở kiểm tra bằng chứng đã lưu**: nhập hash tùy chọn, chọn JSON gốc. Phát lại lịch sử và đối chiếu toàn bộ bytes, scope, controls, state, reports và acceptance. Đạt hiện `VERIFIED_SIMULATION_ONLY`; không nạp vào sổ hiện tại.

CLI chỉ đọc, nhận cả JSON RC1 nguyên bản:

```powershell
node node_modules/tsx/dist/cli.mjs scripts/verify-manufacturing-finance.ts 'C:\duong-dan\MFG-FIN-20261021_SIMULATED.json' 'SHA256_DA_LUU_RIENG'
```

Có thể bỏ hash: chỉ kiểm tra nhất quán, chưa đối chiếu bản lưu riêng. Exit 0 hợp lệ, 1 bị chặn. Giới hạn JSON UTF-8 gốc 2 MiB/1000 sự kiện. Sửa định dạng hoặc BOM cũng bị từ chối; giữ nguyên bản và phân tích trên bản sao.

## Kiểm tra và khôi phục

```powershell
npm run test:manufacturing-finance
node scripts/finalize-manufacturing-finance.mjs --verify
npm run test:manufacturing-finance:browser -- --candidate=v1-rc2 --run-id=ten-moi
```

Browser runner dùng headless/profile tạm, server localhost thuộc test và chặn truy cập ngoài. Cần `playwright-core` và Edge/Chromium; mặc định dùng runtime có sẵn trên máy này. Máy khác đặt `SAVA_QA_PLAYWRIGHT_MODULE` tới `index.mjs` và `SAVA_QA_BROWSER_EXE` tới executable. Không thêm dependency vào ứng dụng chỉ để QA. Chưa chạy GitHub CI remote; local PASS không phải CI remote đã xanh.

`--verify` kiểm tra source/build/evidence RC2 và snapshot RC1. Source đổi cần ứng viên mới, kiểm thử và đóng hash mới. RC1 giữ manifest/bằng chứng cũ cùng 30 file snapshot hậu tố `.snapshot` để compiler không thực thi. Đây là các file trong manifest cũ, không phải toàn bộ clean checkout/backup repo.

Đặt lại riêng bài reset sổ finance/form; chuyển route giữ sổ; reload bắt đầu lại. Nếu cần hoàn nguyên code, lấy đúng từng file theo diff/snapshot có hash vào checkout riêng rồi kiểm thử; không reset toàn repo hoặc ghi đè công việc song song. Không copy snapshot hàng loạt vào repo đang chạy.

## Ranh giới và rủi ro còn lại

- SAP release **UNKNOWN**, native **NOT_RUN**, SME **PENDING**, nghiệp vụ **NOT_APPROVED**. User đã chọn simulator + checklist SME; không cần kết nối SAP để hoàn tất phần kỹ thuật.
- Replay/hash không xác thực tác giả: người khác có thể tạo lịch sử demo hợp lệ khác. Hash lưu riêng giúp đối chiếu bản gốc; nghiệm thu cần reviewer độc lập. Không dùng đây làm SAP-native evidence.
- Dunning policy, Special G/L mapping, bank clearing một bước, overall budget và IC accounts có giới hạn rõ trên màn hình. Chưa tax/FX, MT940/camt, SAP posting areas, annual/released budgets, scheduler/gửi thư hay consolidation elimination.
- Headless Edge viewport điện thoại không là iPhone/Safari thật. Chưa đo hiệu quả học tập/performance SLA. Main bundle lớn và nhãn số lượng reporting-library cũ là nợ có trước ngoài phạm vi.
- Sổ RAM và vai trò tự khai phù hợp học tập. Đa người dùng/phê duyệt/sổ thật cần yêu cầu xác thực, lưu trữ và audit cụ thể. Thêm backend/AI matching lúc này tăng chi phí mà chưa chứng minh SAP đúng.
- Giá trị bền vững nằm ở fixture, invariant, contract và native evidence được SME kiểm chứng theo release; không gắn nhãn “SAP chuẩn” chỉ dựa giao diện transaction.

## Việc của người dùng — để cuối cùng

Khi thuận tiện, review năm workflow và trả lời năm câu trong phiếu. Ghi reviewer/date, findings, điều kiện dùng học tập vào `v1-rc2/HUMAN-REVIEW.json` hoặc note Obsidian bàn giao. Giữ PENDING khi chưa review. Phản hồi ảnh hưởng code sẽ được xử lý trong ứng viên tiếp theo và kiểm tra phần liên quan. Chưa cần xác nhận SAP-native khi môi trường chưa xác định.
