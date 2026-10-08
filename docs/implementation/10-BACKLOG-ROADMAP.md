# Backlog và roadmap có dependency

Ước lượng là person-days, chưa gồm chờ SME/sample/access. Không cộng tuần và person-days như cùng đơn vị. Dùng capacity thực của đội để chốt sprint; mỗi tuần review actual, blockers, evidence và scope trade-off.

| ID | Priority | Deliverable | Responsible | Depends on | Gate | Person-days |
|---|---|---|---|---|---|---|
| P0-01 | P0 | Baseline, history gap register, artefact inventory | Architect | none | G0 | 2–3 |
| P0-02 | P0 | SAP sample corpus, layout/selection/profile approval | Finance SME | P0-01 | G1 | 4–7 |
| P0-03 | P0 | Contract/key/period/sign design and independent oracle | Data Engineer | P0-02 | G1 | 4–6 |
| P0-04 | P0 | Namespace, private RAW storage, manifest, hash, state/RBAC | Backend | P0-03 | G2 | 6–9 |
| P0-05 | P0 | MB51 + five COOIS adapters and DQ | Data Engineer | P0-04 | G3 | 8–12 |
| P0-06 | P0 | KOB1/KKS1/CK13N/GL/settlement adapters | Data Engineer | P0-04 | G3 | 8–12 |
| P0-07 | P0 | Data Lab, report selection, raw evidence UI | Frontend | P0-03 | G3 | 6–9 |
| P0-08 | P0 | C01–C07 controls and exception/reviewer workflow | Backend | P0-05,P0-06 | G4 | 7–10 |
| P0-09 | P0 | Manufacturing MART + variance drill/commentary | Frontend | P0-07,P0-08 | G4 | 5–8 |
| P0-10 | P0 | M01–M10 independent QA, security, replay, release | QA | P0-09 | G5 | 6–10 |
| P1-01 | P1 | Procurement/AP samples and PO-history dependency | Finance SME | P0-10 | G1 | 4–6 |
| P1-02 | P1 | ME2N/GRIR/AP adapters, controls, aging/DPO | Data Engineer | P1-01 | G4 | 10–15 |
| P1-03 | P1 | Sales/AR billing-document bridge and fixtures | Finance SME | P0-10 | G1 | 4–6 |
| P1-04 | P1 | VF05/AR/GL controls, aging/DSO | Data Engineer | P1-03 | G4 | 10–15 |
| P1-05 | P1 | Learning cases, close dependencies, independent acceptance | QA | P1-02,P1-04 | G5 | 6–9 |
| P2-01 | P2 | ML valuation/profile/spec and sample approval | Finance SME | P1-05 | G1 | 4–7 |
| P2-02 | P2 | CKM3N/CKMLCP/MB5L controls and standard→actual bridge | Data Engineer | P2-01 | G4 | 10–16 |
| P2-03 | P2 | CFO/CCC dashboard after MART approval | Frontend | P2-02,P1-05 | G5 | 5–9 |
| P2-04 | P2 | ZFIR009A/ZFIR159 adapters when specs arrive | Data Engineer | P0-04 + custom spec approval | G3 | TBD after samples |

## Milestones tính từ T0 = có người chịu trách nhiệm và quyền dùng dữ liệu

- W1–2: G0/G1 baseline + profiles + corpus + human sign-off. Không có SAP samples: tiếp tục synthetic track nhưng real-SAP fidelity gate vẫn BLOCKED.
- W3–4: G2 immutable intake/storage/manifest/replay; deploy staging private; Data Lab skeleton trên app hiện có.
- W5–7: G3 P0 adapters/DQ và C01–C06; UI report/drill; test negative; giữ schema ổn định.
- W8–9: G4 manufacturing mart/root-cause/commentary; independent validation C07/C08.
- W10–11 contingency: G5 M01–M10, performance/restore/security, pilot feedback và release decision.
- Sau P0 6–8 tuần: Procurement/AP rồi Sales/AR, có thể làm UI song song nếu schema/QA capacity cho phép.
- Sau P1 4–6 tuần: ML và CFO analytics theo dữ liệu kiểm soát, không “bật dashboard” để coi hoàn thành.

Critical path: sample→contract→RAW→adapters→reconciliation→independent sign-off→mart publication. Frontend skeleton và synthetic oracle có thể làm song song bởi người khác, nhưng không dùng chúng để vượt gate sample.

## Scope controls

Mỗi item phải có input/output, acceptance IDs, owner, dependencies, estimate, actual và evidence URL. Phát hiện thêm report/support dataset: ghi change request về cost/impact, owner quyết định. Ưu tiên fixing control semantics hơn thêm tile/T-code. Không release P0 từng phần dưới tên P0 accepted; có thể demo clearly synthetic/incomplete.
