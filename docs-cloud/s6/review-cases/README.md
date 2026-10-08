# Ca review P0 có evidence chạy lại

6ca đề xuất, nguồn số kỳ vọng là historicaltechnicaloracle, khônghumanapprovedgolden. MỗiJSON chứa11RAW/manifest/CLEAN +CONTROL +MART/C08; kiểm SHA vàreplaykỹthuậtđạt. Không dùng PASS thaynghiệmthuSAP/TT99.

| Ca | Hồsơ | Đốichiếu | Nghiệpvụ |
|---|---|---|---|
| samsung-cover / Valuated / 3.5% / giao100% | [JSON](samsung-cover_Valuated_3.5_1_P0.json) | 7 chỉ tiêu, diff0 | Chưa nghiệm thu |
| samsung-cover / Valuated / 0% / giao0% | [JSON](samsung-cover_Valuated_0_0_P0.json) | 7 chỉ tiêu, diff0 | Chưa nghiệm thu |
| samsung-cover / Non-valuated / 3.5% / giao100% | [JSON](samsung-cover_Non-valuated_3.5_1_P0.json) | 7 chỉ tiêu, diff0 | Chưa nghiệm thu |
| samsung-cover / Non-valuated / 0% / giao0% | [JSON](samsung-cover_Non-valuated_0_0_P0.json) | 7 chỉ tiêu, diff0 | Chưa nghiệm thu |
| canon-frame / Valuated / -3.5% / giao50% | [JSON](canon-frame_Valuated_-3.5_0.5_P0.json) | 7 chỉ tiêu, diff0 | Chưa nghiệm thu |
| canon-frame / Non-valuated / -3.5% / giao50% | [JSON](canon-frame_Non-valuated_-3.5_0.5_P0.json) | 7 chỉ tiêu, diff0 | Chưa nghiệm thu |

[Expected/actual/diff vàhash](case-index.json). Trongapp: tạoMART→HồsơP0→chọnfileJSONnày đểreplay (nếuappđãxuấtfilecủakịchbảnkhác, hashcomparison chặn; tải lại/chọn đúngca). CLI: npm run verify:p0-evidence -- <absolute-file-path> <SHA256-from-case-index>. Không gọiđây làbằngchứngbrowserdownload; đây làfilesinhbởiscriptreview.
