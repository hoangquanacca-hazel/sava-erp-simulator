# Decision log — giữ lịch sử và ngăn khởi động lại sai hướng

Statuses: USER_CONFIRMED (yêu cầu hiện tại hoặc lời user trong preview); DISCUSSED (đề xuất của trợ lý trong preview, không nâng thành phê duyệt kỹ thuật); OBSERVED (code/Git); PROPOSED (thiết kế lần này); OPEN (thiếu bằng chứng).

| ID | Quyết định / quan sát | Trạng thái / nguồn | Hệ quả |
|---|---|---|---|
| DEC-001 | Làm trên D:\sava-erp-simulator, không tạo repo/project thay thế | USER_CONFIRMED / SRC-REQ-01 | Bảo toàn code và assets; docs additive |
| DEC-002 | Xây Report Master Dictionary | USER_CONFIRMED / SRC-CHAT-01 user đồng ý | Report contract là backbone tiếp theo |
| DEC-003 | Giữ learning/AP Hub/AR/inventory/production/costing/close/management assets | DISCUSSED / preview assistant | Giữ phần tìm thấy; phần chưa có file ghi unverified |
| DEC-004 | Dictionary 18 thuộc tính và metadata mỗi run | DISCUSSED / preview; tiếp tục trong SRC-REQ-01 | Mở rộng bằng approval/version/frequency/lineage |
| DEC-005 | Manufacturing Cost & Variance là slice đầu tiên | USER_CONFIRMED về phạm vi hiện tại / SRC-REQ-01 | Chốt P0 trước AP/AR/ML |
| DEC-006 | MB51 grain material-document item; D02 order; D03 reservation/component | DISCUSSED / preview partial schema | Thêm namespace/snapshot; component không chỉ order+material |
| DEC-007 | Calculated fields không ở RAW | DISCUSSED + USER_CONFIRMED scope immutable RAW | CLEAN/MART chứa derivations |
| DEC-008 | Trì hoãn direct SAP connection và CFO dashboard mới trước controlled data | USER_CONFIRMED / SRC-REQ-01 | Không thêm RFC/OData/API P0; giữ demo hiện có |
| DEC-009 | ZFIR009A/ZFIR159 cần adapter riêng | USER_CONFIRMED scope / SRC-REQ-01 | Không tự đoán fields/meaning |
| DEC-010 | Repo đang React/TS/Express/Netlify, ACDOCA-like VND, local UI state | OBSERVED / source files | Extend interfaces và persistence, không rewrite stack |
| DEC-011 | Demo close order hardcoded MMPV→CKMLCP→KKA2→VA88→OB52 | OBSERVED / periodClose.ts | Không coi là canonical SAP sequence; profile validation cần SME |
| DEC-012 | 5-type variance residual được tính để identity cân | OBSERVED / variance.ts | Cần independent oracle, không dùng identity làm root-cause proof |
| DEC-013 | Immutable object store + DB metadata/control, batch worker | PROPOSED / architecture | ADR trước triển khai, không phải stack đã deploy |
| DEC-014 | Supplemental settlement bridge là dependency P0 | PROPOSED từ control correctness | M07 block nếu không có document links/receiver allocation |
| DEC-015 | Proposed variants chưa approved | OPEN / thiếu SAP samples | Synthetic-only demo có thể tiếp tục, SAP fidelity acceptance chờ evidence |
| DEC-016 | Chat toàn văn chưa truy xuất; sources mirror trống | OBSERVED / tool failures và file inventory | Không claim all-project history; append nguồn sau |
| DEC-017 | Không self-audit acceptance | USER_CONFIRMED / SRC-REQ-01 | Human reviewer độc lập và ký artifact |
| DEC-018 | Bộ tài liệu v1 là baseline review, không thay đổi code runtime | PROPOSED / tác vụ hiện tại | Tiếp theo triển khai theo backlog/gates |

## Các câu hỏi cần human resolve trước gate tương ứng

OPEN-01 (G1/SME): SAP edition/release/client/company/plant/controlling area/fiscal year variant/language?
OPEN-02 (G1/SME): full original exports, selection screenshots, record counts/totals, technical field catalogs cho P0?
OPEN-03 (G1/SME): target cost version, order settlement type/receiver, WIP/scrap/overhead policies và valuation profile?
OPEN-04 (G1/SME): Z-report functional spec và actual column samples?
OPEN-05 (G2/Architect+Owner): hosting worker/storage/DB budget, users/data volume, retention, identity provider?
OPEN-06 (G0/Owner): full chat/archive, Handbook/Workbook/AP Hub và tài liệu đã thảo luận nhưng không nằm repo?
OPEN-07 (G1/Finance): unify accounting-policy profile; README/metadata nhắc TT99 trong khi server prompts còn TT200/PIC. Không khẳng định legal compliance từ nhãn; cần SME xác minh riêng.
OPEN-08 (G5/Owner): reviewer identities/capacity, SLA và scope pilot real-data?

Agent mới không được đổi quyết định user-confirmed vì thích framework khác. Thay đổi bằng ADR có before/after, lý do, alternatives/cost-benefit, risks, migration/regression, owner và evidence. Không sửa đè decision cũ; mark superseded và link bản mới.

## Dataset numbering compatibility

Registry D01–D19 trong bộ v1 này là định danh đề xuất để triển khai. Preview lịch sử chỉ có D01–D03 đầy đủ và phần đầu D04 bị cắt. Không tự nhận mọi ID sau D03 đã được thống nhất trong chat cũ. Khi nhận toàn văn, lập alias/migration table cho ID legacy trước khi có downstream consumer; không đổi payload hoặc lịch sử một cách âm thầm.
