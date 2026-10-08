# P0-MFG acceptance M01–M10

Đây là gate mới **P0-MFG-M01…M10**, không phải nhãn M1…M9 của các commit/features cũ. Tất cả hiện **NOT_EXECUTED**. Tác vụ này tạo tài liệu, không tự nghiệm thu phần mềm.

Mọi gate phải có: input hash + expected oracle + actual + difference + tolerance + status + independent reviewer + evidence link. Không có evidence → NOT_EXECUTED/BLOCKED, không PASS. N/A cần scope justification và independent approval; core P0 bridge không được N/A để tuyên bố complete.

| ID | Gate | Pass requirement | Negative evidence bắt buộc | Reviewer role |
|---|---|---|---|---|
| P0-MFG-M01 | Scope và nguồn | Same approved namespace/company/plant/period/cutoff, source_kind và variant; đầy đủ D01–D10/D16/SUP01 hoặc documented applicable subset | Cố trộn client/period/profile phải BLOCK; no invented sample approval | Finance SME |
| P0-MFG-M02 | RAW bất biến | Upload/download SHA-256 giống; tamper denied hoặc detected; bytes/headers/layout nguyên bản; new run không overwrite | Sửa byte/hash mismatch chặn toàn run; hash một mình không đủ proof write-once | QA |
| P0-MFG-M03 | Adapter và DQ | Required fields typed; zero silent row loss; counts conservation; malformed/leading-zero/locale/duplicate corpus có expected outcomes | Missing numeric không biến 0; truncated export, ambiguous header phải block | QA |
| P0-MFG-M04 | COOIS ↔ MB51 consumption | C01 material-doc identity + C02 net 261/262, reservation mapping/cutoff/UoM đúng; ambiguity rõ | Same component lặp, reversal khác kỳ, missing conversion không false-match | Finance SME |
| P0-MFG-M05 | Header ↔ GR | C03 delivered snapshot ↔ cumulative 101/102 with opening and output scope | Partial output/by-product/cross-period không bị cộng sai; unexplained diff chặn | Finance SME |
| P0-MFG-M06 | KOB1 ↔ KKS1 | C04 classified cost bridge cùng currency/target version; all differences explained by source evidence | Không dùng sum KOB1=variance; thiếu WIP/overhead basis phải BLOCKED | Finance SME |
| P0-MFG-M07 | KKS1/settlement ↔ GL | C05 includes SUP01 settlement receiver/reference bridge and GL view mapping; balanced financial basis | Thiếu link hoặc lặp settlement không PASS; production vs sales-order policy tách | Auditor |
| P0-MFG-M08 | CK13N standard-cost drill | C06 header/itemization same estimate/lot/version/currency/cost view; additive leaves only | Zero lot size/mixed versions/parent subtotals đều bắt được | Finance SME |
| P0-MFG-M09 | Variance và commentary | C07 explicit residual; C08 every numeric assertion traceable to approved mart; fact vs hypothesis; AI failure safe | Residual không bằng chứng nguyên nhân; commentary chặn failed inputs | Auditor |
| P0-MFG-M10 | Independent release | No self-approval; reproducible evidence; regression/security/performance/restore + release human signoff | Repeated upload/replay/concurrent run no double count; rollback rehearsal | Human release owner |

## Tolerance policy

Identity, row-count, missing mandatory keys và namespace: exact, tolerance 0. Quantities: theo UoM precision và conversion được duyệt; tiền: theo currency precision và rounding stage, không hardcode toàn cầu ±1 VND hoặc 1%. So sánh cùng amount type/currency. Tolerance lớn hơn quantization chỉ được Finance duyệt theo control/period/reason; không tự mở tolerance cho đủ PASS.

Proposed exact synthetic oracle test: compare integer minor units và rational/decimal quantities. Real export rounding tolerance ở field `tolerance_policy_id`, chưa có policy thì gate BLOCKED. Ghi raw diff và adjusted diff, không ẩn delta dưới formatting.

## Independent acceptance

QA chạy suite trên commit freeze, SME xác minh nghiệp vụ bằng source totals và expected workbook/table độc lập. Auditor xem provenance và approval separation. AI tạo code/tài liệu không được tự gán accepted. Test balance identity của variance chỉ chứng minh cộng đúng, không chứng minh classification đúng.
