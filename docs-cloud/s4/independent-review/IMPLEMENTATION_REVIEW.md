# S4 independent implementation review — 2026-10-08

Final focused result: **22/22 technical probes PASS** on the current uncommitted S4 source after parent fixes. This is independent agent technical review, not human finance/SME acceptance or approval of P0-MFG M01–M10.

## Findings corrected before final retest

1. **Async audit snapshot isolation**: early draft took a private snapshot before hashing but returned caller-owned run/events after awaiting. Parent now returns deeply frozen private copies; mutation during hashing is rejected or isolated.
2. **Non-valuated settlement transaction**: initial C05 accepted only `VA88`, but valid simulator settlement rows carry `VA88 / KKA2`. Both baseline and partial favorable Non-valuated cases incorrectly failed. Parent added an explicit SIM transaction whitelist for dimension validation and completeness checks, and excludes those settlement adjustments from C04 accumulated production debits.
3. **Audit-chain verification**: parent added verification of each prior event's sequence, previous hash and hash against the entire control-run snapshot before append/export. Tampering with an earlier explanation is rejected on both paths.
4. **Quality and derived signs**: parent bound accepted/source row counts to CLEAN rows and validates signed quantity/amount against unsigned values plus S/H. This prevents numeric tieouts from concealing independently corrupted derived signs.

## Executed probe coverage

Conforming Non-valuated baseline; Non-valuated −3.5% / 50% delivery; missing/duplicate report; mixed source snapshot; mismatched row lineage; duplicate natural key; NaN monetary amount; wrong currency; unmatched movement document; UoM mismatch; signed quantity mutation; KOB1-to-GL amount mutation; missing settlement GL key; CK13N header amount mutation; KKS1 residual mutation; duplicate same-material reservation ambiguity; review request without explanation; review request preserving failed control status; append isolation during await; tampered prior event rejection on append and export. Export SHA-256 is recomputed independently and matches manifest.

Probe source: `probe.ts`; results: `probe-results.json`. `baseline-details.json` and `settlement-details.json` are generated synthetic diagnostic records, rewritten for the final successful state. Initial loader issues (CJS top-level await / Windows absolute import URL) were probe-harness issues, resolved with local ESM package configuration and file URLs.

## Explicit limits

- No real SAP data imports, original SAP namespace/client proof, cross-period/reversal/cancellation acceptance or receiver/eligible variance schema was tested; current policy excludes them.
- C02, C04, C05 and C07 still carry blocked business prerequisites. C01/C03/C06 remain pending SME. Technical PASS does not change those states.
- Same-source report views test consistency, not independent financial truth; simulator A0 posting fixtures provide separate test coverage in the parent task.
- Audit hashes detect accidental or unrehashable edits in the local workflow; there is no authenticated identity, signature, independent storage or WORM guarantee. A malicious party who rewrites the run and every hash can recompute a synthetic chain.
- This review does not verify browser interaction, download files, screenshot rendering, human review, or production deployment. Browser QA is a separate agent's scope.
- No repository source or oracle edits, no service starts, no network/AI calls were performed by this reviewer.
