# Quyết định cần reviewer độc lập

Không coi kiểm thử của tác giả là nghiệm thu. Các AUD dưới đây nối số từ brief; không thay đổi note Auditor trong Obsidian.

- **AUD-013 — Phạm vi Phase A:** giới hạn scenario cơ sở, đủ7 bước; chặn QM/ML/GRIR/IC. Chi phí thấp, tránh invent event; cần thêm fixtures/event model trước mở rộng.
- **AUD-014 — RAW:** copy-on-read + freeze bảo vệ trong RAM. Hash không phải WORM; download vẫn sửa được. S3 phải verify hash trước adapter; không tạo backend storage trái quyết định A.
- **AUD-015 — Semantic fidelity:** KOB1 là cost collector154 projection; KKS1 là derived simulation; CK13N header/item chung file. ZSIM ghi rõ trường mô phỏng. Approved SAP variants, Fiori parity và multi-order còn pending.
- **AUD-016 — Test acceptance:** 54 oracle do người triển khai trước viết bằng Python; giữ nguyên. Reconciliation test mới chứng minh dữ liệu không lệch nguồn, không chứng minh luật kế toán/SAP thực. S6/golden Mr Quân vẫn pending.
- **AUD-017 — Baseline và legacy:** baseline T0 hiện tại lint exit0 (khác audit cũ). Vẫn sửa các tham chiếu field cũ gây undefined trên UI; không kể thành test fail hiện tại. Build baseline có cảnh báo import.meta/CJS; đổi ESM và kiểm actual startup.
- **AUD-018 — AI/legal:** sửa prompt server hai đường sang TT99 có nhãn chưa đối chiếu; không tuyên bố hoàn tất dọn mọi nội dung TT200 legacy. Không thay máy tính kế toán. Cần review riêng toàn bộ nội dung học/AI trước claim tuân thủ.
- **AUD-019 — Provenance:** content runId loại bỏ timestamp máy để tái lập; cùng payload nhưng object key order khác có thể hash khác. Chưa là RFC8785 canonical JSON; không dùng sourceHash để xác nhận hai payload nghiệp vụ tương đương.
- **AUD-020 — UI và hiệu năng:** bảng download gọn, không auto-download11 file. Bundle cũ lớn; tối ưu tách chunk là backlog, tránh rewrite toàn UI. Manual browser UAT và kiểm nhiều browser cần ghi riêng trạng thái thật.

- **AUD-021 — S3simprofile:** chỉ11generatedTSVlayouts. Strictversion/header/locale;1MiB/5000rows; RAM/privatebytes phù hợpdatasets nhỏ. Không WORM/realSAPintake/crossreportreconciliation. Unparsedcount=null. CLEANJSON giữleadingzeros; S4pending.
- **AUD-022 — Independent review:** 3manifest/inputbugs được probe và sửa;8focusedindependentcases xác nhận. BrowserUAT cònblocked; khôngselfapproveSME/gates. Hash củamanifest không có signature/authenticity.

- **AUD-023 — Final focused browser QA:** phiên mới kiểm cbfa51a đạt Samsung/Canon và DataLab11/11; thay BLOCKED lịch sử trong phạm vi đã chạy. Downloads UNVERIFIED; chưa human/SME acceptance. Margin VA88 label, production/delivery assumptions và legacy descriptions cần rà soát S4. Xem s3/browser-qa-final/QA_REPORT.md và diễn giải tác giả tại s3/README.md; giữ riêng quan sát QA với giả định mô hình.

- **AUD-024 — S4 SIM basis:** fixed single-scenario namespace/cutoff/opening0; quantity1e-7/VND0 tolerance chỉ mô phỏng. Technical tieouts không thay C02 reservation match/C04 CO basis/C05 eligible variance receiver/C07 SAP categories. Business blocks retained; không sửa draft contract để hạ gate.
- **AUD-025 — Local workflow:** self-declared actor/evidence, EXPLAIN/REQUEST_REVIEW, hashchain bound entire run verified before append/export, clone-before-await. No authenticated reviewer/approval/storage/WORM. Explanation never overrides control status; MANIFEST always pendinghuman.
