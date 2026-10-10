# S6 — hồ sơ P0 và kiểm tra chạy lại

Trạng thái: triển khai kỹ thuật trên dữ liệu mô phỏng; **NOT_APPROVED / NOT_READY_FOR_PILOT**. Tiếp nối S5, không mở P1/P2. Repo `D:\sava-erp-simulator`, branch `cloud/s1-report-completion`, baseline `70556f0`. Không push, merge hoặc deploy.

## Đã bổ sung

- Một file JSON gồm 11 RAW nguyên văn/manifest, CLEAN, CONTROL/nhật ký, MART, facts/C08. Manifest có SHA256/byte count payload; SHA256 toàn file hiển thị cạnh nút tải.
- Trong SAP Reports: tạo snapshot → Data Lab → controls → Manufacturing MART → **Tải một hồ sơ P0 để review**. Chọn file đã lưu ở **Kiểm tra hồ sơ P0 đã lưu** để chạy lại adapter → DQ → controls → MART → C08. Đây chỉ là JSON mô phỏng, không intake SAP thật.
- Verifier sao chép byte trước await, hash byte thực, UTF8 fatal, từ chối BOM và file quá 8 MiB. Nếu có hash tin cậy từ lần xuất, so sánh hash toàn file; manifest nằm trong file không tự xác thực nguồn gốc. Replay kiểm tính nhất quán, không chứng minh xác thực người duyệt hoặc dữ liệu thực tế.
- Strict facts, workflow events/actions/required evidence/prior EXPLAIN và metadata RAW; không nhận approval nhúng thêm hoặc chuyển REVIEW thành phê duyệt. Snapshot cũ bị ẩn khi inputs/control case đổi.
- [6 ca để bạn review](review-cases/README.md), [42 đối chiếu expected/actual/diff và file hash](review-cases/case-index.json). Nguồn kỳ vọng là historical Python technical oracle, chưa phải golden độc lập do SME phê duyệt.

## Bằng chứng và cách kiểm

[Log trước hardening](evidence/results.json), [log sau hardening](evidence/hardened/results.json), [35 probes độc lập sau sửa](independent-review/RETEST.md). Giữ nguyên kết quả lỗi ban đầu. Các regression S3/S4/S5, finance UI, parity/A0/report generation cùng lint/build/start được chạy; đọc exitCode trong log làm nguồn kết luận.

CLI trên file đã lưu:

```powershell
cd D:\sava-erp-simulator
npm run verify:p0-evidence -- "D:\sava-erp-simulator\docs-cloud\s6\review-cases\canon-frame_Non-valuated_-3.5_0.5_P0.json" "5c0fd64b42cb34af01f1b13529950c3900dbbfc9232f65cfeb7973ed4a7cfbf9"
```

Tên file chính xác xem case-index; không dùng placeholder hash để kết luận PASS. `npm run evidence:p0` bảo toàn file tồn tại nếu byte giống; từ chối ghi đè file khác. `npm run test:s6` chạy 54 complete roundtrips và negative/race tests. CLI exit0 technical PASS, exit1 BLOCKED, exit2 thiếu đường dẫn. Mọi kết quả giữ business NOT_APPROVED. Kiểm độc lập đã xác minh một file tổng hợp được script lưu với filesystem SHA256; đây **không phải bằng chứng browser download**.

## Còn thiếu / việc tiếp theo

1. Mr Quân/SME đối chiếu một ca Canon giao 50%, xác nhận số kỳ vọng và căn cứ WIP/settlement; phản hồi theo [mẫu review](../p0-review/REVIEW-RESPONSE.md), không chỉ approve toàn bộ.
2. C02 reservation mapping, C04 CO basis/target version, C05 receiver/run/eligible variance, C07 observed drivers/categories vẫn business BLOCKED; C01/C03/C06 pending SME. Không điền dữ liệu giả để đóng gate.
3. Cần golden độc lập, nguồn TT99 và original SAP exports/approved native variants; thư viện reporting đang nghiên cứu ở phiên khác chưa cung cấp 48 report đã được xác minh. Synthetic layouts không thay evidence SAP.
4. M01–M10 vẫn NOT_ACCEPTED; corpus reversals/cross-period/multi-order/UoM, audit/release/performance còn theo gate. Giới hạn 8 MiB không phải benchmark hiệu năng hoặc chống mọi DoS; không gọi security certification.
5. Xác minh tải thật trong browser và hash byte đã lưu; quyết định pilot/release do người review độc lập. RAM không phải immutable storage bền vững; identities tự khai, không authentication/approval.

## Bảo toàn thay đổi song song

Phiên khác đang sửa .gitignore/README.md/index.html/journal và thêm reporting-library/public/scripts/assets. Không stage hoặc ghi đè các file đó. Build local có thể chứa index/assets chưa commit của phiên đó; kết quả QA local không chứng minh checkout sạch của commit S6. Protected calculator/acdoca/materialLedger/oracle/netlify và ref main giữ nguyên.


Git bảo toàn byte review-cases JSON bằng `.gitattributes -text`; không chuyển LF/CRLF vì hash toàn file cần khớp qua checkout. [Asset build/served provenance](BUILD-PROVENANCE.json) xác minh byte localhost3017 khớp dist; build cuối sau chỉnh câu chữ UI đạt, bundle lớn ~1,54MB vẫn là hạn chế hiệu năng cần theo dõi, chưa benchmark.


## Chốt phiên

Code/evidence commit `cec245a`; [danh sách 62 file tạo/cập nhật](CHANGE-MANIFEST.json), [kiểm hash byte commit/engine/main](COMMIT-VERIFICATION.json). [QA browser độc lập](browser-qa/QA_REPORT.md): Canon11RAW→11CLEAN→7controls→12MART→singlepack/hash khớp ca đã lưu. Actual download và UI file replay UNVERIFIED do công cụ, stale S6 NOTRUN; không suy lỗi app hoặc acceptance. [Root kiểm tab user cuối](browser-qa/ROOT-FOLLOWUP.md): WebinarOFF, leads0.

Nhật ký Obsidian: `D:\Sava_Second Brain\00_Inbox\AI\SAP_Simulator_S6_Evidence_2026-10-08.md`. Mở vault rồi Ctrl+O, gõ `SAP_Simulator_S6_Evidence`; file đã lưu, không sửa bàn giao cũ. Bước tiếp: review một ca Canon Non-valuated giao50% và điền REVIEW-RESPONSE; P0 vẫn chưa đủ điều kiện pilot.
