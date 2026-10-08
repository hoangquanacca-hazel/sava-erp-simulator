# Triển khai tiếp nối — 08/10/2026

**Đọc file này trước bộ kế hoạch 32 file.** Quyết định A/B/C của chủ dự án thay thế các đề xuất hạ tầng trái phạm vi trong `docs/implementation/`.

- Repo duy nhất: `D:\sava-erp-simulator`. Baseline `28dc65561c9360c42d751348bcc9a4b1c4c9b6a5`; nhánh làm việc `cloud/s1-report-completion`.
- Nhánh đã chứa A0/A0.1 của Claude: không viết lại TK 154, calculator, ACDOCA hay Material Ledger. Không sửa oracle `a0_expected.json`.
- A: mọi báo cáo/RAW xử lý trong trình duyệt từ simulator. Không upload SAP thật, DB, worker hay backend lưu dữ liệu mới. Express/Netlify hiện có chỉ phục vụ ứng dụng/AI.
- B: cấu hình chung tại `src/config/simConfig.ts`; ngày 15/09/2026, company1000, plant1100, ledger0L, VND. `SIMULATED` bắt buộc.
- C: TT99 là cấu hình đào tạo. ACCOUNT_MAP vẫn `chua_doi_chieu`; không tự chứng nhận pháp lý. VA88 trong mô hình là settlement đơn bán, không khẳng định tương đương CO88/KO88 ngoài SAP thực.

## Phạm vi hoàn thành kỹ thuật

Phase A theo `CLOUD_BRIEF.md`: 11 báo cáo (CK13N gồm header và item trong một file), xuất RAW/manifest, nút tải trong màn hình mô phỏng sau 7 bước, kiểm thử 54 ca. Bảo toàn snapshot RAW bằng copy-on-read, freeze metadata, hash; không phải WORM hay audit trail chống quản trị viên sửa.

Đọc [hợp đồng báo cáo](REPORT-CONTRACTS.md), [định khoản](GIAODICH_TT99.md), [thay đổi](CHANGELOG.md), [rủi ro và quyết định](AUDITOR.md), [kết quả kiểm thử](VERIFICATION.md).

## Tiếp tục đúng thứ tự

1. Reviewer độc lập kiểm code/diff và bằng chứng; Mr Quân đối chiếu PDF TT99 + golden nghiệp vụ. Bộ test agent viết không thay S6.
2. S3: adapter browser RAW→CLEAN, kiểm hash trước parse, schema/header strict, locale/UoM, quality log và fixture âm tính. Không nhập file SAP thật.
3. S4: Controls C01–C07 và exception workflow, đối chiếu các số từ CLEAN; các validator Phase A hiện tại chưa thay thế workflow này.
4. S5: MART/drill/commentary với dữ liệu đủ căn cứ. Không suy nguyên nhân từ tỷ trọng chi phí. Dashboard CFO sau lớp dữ liệu kiểm soát.
5. Procurement/AP → Sales/AR → ML nâng cao; ZFIR009A/ZFIR159 chờ spec/approved samples, không đoán logic.

Phạm vi 11 báo cáo chỉ kịch bản cơ sở hoàn thành. Chặn QM rework/scrap và bút toán tùy chọn ML/GRIR/IC thay vì xuất bộ số chưa được kiểm chứng. Không merge main hoặc deploy trong phiên này.

## Kiểm thử giao diện độc lập

[Báo cáo QA 08/10/2026](qa/2026-10-08/RESULT.md): 3 ca tạo báo cáo đạt trong chế độ giảng viên;4 lỗi UI kế thừa; download content/hash chưa xác minh. Sửa lỗi và retest trước release.

Cập nhật sau sửa: code71cd3f8 đã sửa4lỗi và regression54ca đạt. [Bản sửa](qa/2026-10-08/UI-FIXES.md); [retestđộc lập](qa/2026-10-08/RETEST.md) BLOCKED bởi kết nối trình duyệt agent, còn chờ UAT/downloads/SME.

## S3 được triển khai kỹ thuật

[S3browserRAW→CLEAN](s3/README.md):11profiles, strictadapter, DQ/lineage/CLEANmanifest vàDataLab. Technicaltests +independentcodeprobes cóbằngchứng; browserUAT/SME vẫnpending. Tiếp S4controls trướcMART. Các dòng S3“chưa làm” trên đây là lịch sử củaSession1, được thay bởi mục cập nhật này.


## Trạng thái mới nhất

S3 đã triển khai (`3eb5bd1`), UI sửa bổ sung (`cbfa51a`); [QA browser cuối](s3/browser-qa-final/QA_REPORT.md) đạt phạm vi Samsung/Canon và Data Lab11/11. [S3 và giới hạn nghiệm thu](s3/README.md) là nguồn trạng thái hiện hành; các dòng BLOCKED/pending browser trước đó là lịch sử. Downloads/SME/P0 gates vẫn chưa nghiệm thu. Tiếp S4 trước MART.
