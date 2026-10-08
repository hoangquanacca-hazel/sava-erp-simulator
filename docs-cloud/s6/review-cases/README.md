# Ca review P0 có evidence chạy lại

6 ca đề xuất, nguồn số kỳ vọng là historical technical oracle, chưa phải golden được người review phê duyệt. Mỗi JSON chứa 11 RAW/manifest/CLEAN + CONTROL + MART/C08; kiểm SHA và chạy lại kỹ thuật đạt. Không dùng PASS thay nghiệm thu SAP/TT99.

| Ca | Hồ sơ | Đối chiếu | Nghiệp vụ |
|---|---|---|---|
| samsung-cover / Valuated / 3.5% / giao 100% | [JSON](samsung-cover_Valuated_3.5_1_P0.json) | 7 chỉ tiêu, diff 0 | Chưa nghiệm thu |
| samsung-cover / Valuated / 0% / giao 0% | [JSON](samsung-cover_Valuated_0_0_P0.json) | 7 chỉ tiêu, diff 0 | Chưa nghiệm thu |
| samsung-cover / Non-valuated / 3.5% / giao 100% | [JSON](samsung-cover_Non-valuated_3.5_1_P0.json) | 7 chỉ tiêu, diff 0 | Chưa nghiệm thu |
| samsung-cover / Non-valuated / 0% / giao 0% | [JSON](samsung-cover_Non-valuated_0_0_P0.json) | 7 chỉ tiêu, diff 0 | Chưa nghiệm thu |
| canon-frame / Valuated / -3.5% / giao 50% | [JSON](canon-frame_Valuated_-3.5_0.5_P0.json) | 7 chỉ tiêu, diff 0 | Chưa nghiệm thu |
| canon-frame / Non-valuated / -3.5% / giao 50% | [JSON](canon-frame_Non-valuated_-3.5_0.5_P0.json) | 7 chỉ tiêu, diff 0 | Chưa nghiệm thu |

[Expected/actual/diff và hash](case-index.json). Trong app: tạo MART → Hồ sơ P0 → chọn file JSON này để chạy lại (nếu app đã xuất file của kịch bản khác, so sánh hash sẽ chặn; tải lại/chọn đúng ca). CLI: npm run verify:p0-evidence -- <absolute-file-path> <SHA256-from-case-index>. Đây là file sinh bởi script review, chưa phải bằng chứng browser download.
