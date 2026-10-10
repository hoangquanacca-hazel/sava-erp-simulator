# Quy trình triển khai, RACI và release gates

## Quy trình một increment

Inspect current branch/HEAD/status → đọc decision log → chọn backlog → khóa source/fixtures → design/ADR → human semantic review → implement small PR → automated checks → independent QA → finance review → auditor/release owner approve → staged deploy → verify/rollback readiness → publish evidence → nhật ký.

Không reset/clean repo để “làm cho sạch”; giữ uncommitted work. Production deploy, migration dữ liệu, mở quyền truy cập cần owner duyệt concrete diff/evidence. Agent được đề xuất và chuẩn bị thay đổi, không tự ký nghiệp vụ hay tự nâng PENDING thành APPROVED.

| Gate | Điều kiện vào / ra | Bằng chứng | Người có quyền chốt |
|---|---|---|---|
| G0 Baseline | Repo và scope được xác định; sources/gaps ghi rõ | HEAD/status/hashes/inventory, scope approval | Product Owner + Architect |
| G1 Contract | Export profile/grain/key/sign/cutoff và oracle approved | Samples/hash/header catalog/selection/oracle/variant form | Finance SME, reviewer khác tác giả |
| G2 Foundation | RAW write-once/hash/security/state/replay thiết kế và test | Tamper/retry/permission/backup checks | Architect + independent QA |
| G3 Data | Adapters/DQ đạt corpus, row counts và source totals giải thích được | Test logs/golden differences/lineage/DQ results | QA độc lập + SME |
| G4 Control/MART | Control bridge và exceptions reviewed; no blockers | C01–C08, mart publication approval, drill-through | Finance reviewer + Auditor |
| G5 Release | M01–M10 đạt; regression/performance/security/restore acceptable | Frozen commit, evidence manifest, release note, rollback rehearsal | Human release owner |

## RACI

R = thực hiện; A = một accountable cuối cùng mỗi dòng; C = tham vấn; I = được biết. PO là Product Owner/business sponsor. “Auditor” có thể là peer Finance/QA độc lập trong đội nhỏ, không hàm ý kiểm toán pháp định.

| Work package | PO | Architect | Finance SME | Data Engineer | Frontend | Backend | QA | Auditor | AI agents |
|---|---|---|---|---|---|---|---|---|---|
| Scope và roadmap | A | R | C | C | C | C | C | I | C |
| Business semantics / report profile | I | C | A/R | R | I | C | C | C | C |
| Architecture/security/data model | I | A | C | R | C | R | C | C | C |
| Adapter/DQ | I | A | C | R | I | R | C | I | R (draft only) |
| UI/report explorer | I | A | C | C | R | C | C | I | R (draft only) |
| Controls / independent oracle | I | C | A | R | I | R | R | C | C |
| Independent test execution | I | C | C | C | C | C | A/R | C | R (assistance) |
| Approval/evidence audit | I | C | C | I | I | I | R | A | I |
| Release and rollback decision | A | R | C | C | I | R | C | C | I |

## Đội nhỏ và không tự kiểm toán

Một người có thể kiêm Architect+Backend hoặc Frontend+QA, nhưng QA phần mình viết phải chuyển peer. Người lập oracle không lấy expected từ code do chính mình đang nghiệm thu. Người sửa rule/variant không approve bản đó. Nếu chỉ có một human, thêm reviewer bên ngoài trước production acceptance; không dùng hai AI cùng agent session giả lập độc lập. AI review là hỗ trợ, human A vẫn ký.

## Evidence pack tối thiểu

Commit/branch/dirty status; scope and source manifest hashes; fixture hashes + expected values và người lập; command/environment/results; DQ/counts/totals; exception dispositions; control rule versions; screenshots supporting selection/UI (không thay machine logs); approver identity/time/artifact hash; release deployment id/rollback target. Tham khảo template.

## Release criteria

Không còn blocker/critical; mọi P0 gate PASS có sign-off hoặc release rõ non-accepted demo; không dùng waiver để bỏ tamper/lineage/SoD requirement. Minor issue có owner/due date và risk acceptance. `test:parity`, typecheck/build và new suites đều qua; versioned migration có rollback/forward fix; staging smoke; backup/restore verified; production monitor owner có lịch trực.

## Deployment/runbook

Giữ Netlify static+functions đang cấu hình; ingestion worker/storage/DB chọn bằng ADR trước mở upload lớn. Express local và functions share contracts; không assume local filesystem bền trên Netlify. Dev/staging synthetic data; prod private bucket/secrets. Release feature flags bắt đầu off cho new controlled modules; pilot read-only; enable qua gate.

Nếu integrity/incorrect KPI: freeze publication pointer, mark affected snapshots revoked/stale, disable new ingestion if needed, giữ RAW; revert app release hoặc replay previous approved adapter to new dataset; re-run affected controls; reviewer duyệt mới. Ghi incident causes/blast radius/fix/regression. Không xóa input lỗi để làm score xanh.
