# Independent S4 browser QA

Target http://127.0.0.1:3017/ · 2026-10-08 · code da7bd0b (parent supplied served-asset binding).

**PASS focused UI**, two cases: Samsung Valuated full delivery and Canon Non-valuated −3.5%, 1000/2000 delivered. Both 11/11 RAW→CLEAN and 7/7 technical simulation matches.

- C01/C03/C06 remain PENDING_SME. C02/C04/C05/C07 remain BLOCKED with explicit missing business evidence. No approval buttons.
- RAW source disclosure contains report IDs, 64-character hashes and rawLine4/5/6.
- Synthetic actor QA local saved EXPLAIN then REQUEST_REVIEW on C02. Neither changes business status or technical result. Run button disabled after first run. Journal is visibly session-only.
- Canon actual51228038; settled25614019; WIP25614019; standard53086050; full-order variance−1858012, residual0. Delivered dashboard variance−929006 is a distinct basis.
- Canon Margin Analysis labels full settlement COGS as Giá vốn settlement (632), before-settlement profit label corrected. Gross profit89385981 matches collector.
- Price115000→115001 removes RAW download buttons, DataLab, Controls and local explanation journal. Restored115000, regenerated report/CLEAN/Controls to capture compact final proof.
- Initial WebinarOFF temporarilyON forlocal testing then restoredOFF visibly verified; leads0. No identity registration, provider AI or external messages.

Downloads skipped: completion/filehash UNVERIFIED due previously unsupported browser download protocol. Human SME/SAP/legal/M01–M10 acceptance NOTRUN; these browser checks do not close them. No new defect observed within requested focused S4 scope.

Evidence: qa-results.json, compact controls-viewport.jpg, full Samsung review evidence, Canon snapshot and restored WebinarOFF proof.
