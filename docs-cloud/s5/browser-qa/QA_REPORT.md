# S5 independent browser QA — 2026-10-08

Code under test: 1556e48445eb86b365e25de770da71bfd9f8ed7a.

Result: **PASS for focused UI scope**, not business acceptance.

Fresh IAB session at http://127.0.0.1:3017/. Canon Non-valuated, variance −3.5%, delivery 1,000/2,000, selling price 115,000. Executed seven steps; 11 RAW reports, CLEAN 11/11, Controls 7/7. All 12 MART metrics and three full-order cost bridge rows matched expected task values (qa-results.json). C08 labels traceability matched and business approval pending. Commentary distinguishes FULL_ORDER from POSTED_DELIVERED and declines unsupported root-cause claims.

CK13N drill shows full SHA256 and source lines 4–7. Saving synthetic C02 EXPLAIN removed old MART and enabled regeneration. Regeneration succeeded. Price 115000→115001 removed RAW/CLEAN/CONTROL/MART; restored 115000 afterward. Snapshot invalidation does not imply reposting existing accounting entries.

Webinar OFF at start, temporarily ON for QA, restored OFF; leads remained zero. No AI calls, lead creation, repo edits, posting oracle changes or real SAP data.

Downloads UNVERIFIED, skipped due prior download-event failures. One manual scenario tested; no human/SME/golden/legal acceptance implied. No new defect within this scope.

Evidence: mart-snapshot.txt, invalidation-snapshot.txt, mart-viewport.jpg, webinar-restored-off.jpg.
