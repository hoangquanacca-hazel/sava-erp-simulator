# Independent S3 review — initial uncommitted implementation

Reviewed read-only: src/adapters/framework.ts, exports.ts, contracts.v1.json, src/components/SapReportsPanel.tsx; independent synthetic probe saved beside this file. No repo/oracle/browser mutations. Lines reflect initial version before author repairs.

## Actionable findings

1. **P1 — fail-closed quarantine bypass through inherited registry property.** framework.ts51 `contracts[reportId]` accepts inherited `__proto__` as truthy contract. With valid profile/version/hash/config and reportId `__proto__`, requiredTotals accesses undefined fields and throws TypeError, instead of returning BLOCKED with retainedRAW/qualitylog. Probe reproduced. Use own-property membership and guard contract shape; malformed input must return quarantine evidence.

2. **P1 — manifest snapshot captured after first await.** framework.ts29 hashes bytes asynchronously; manifest is cloned only44. Calling adaptRaw(validBytes,validManifest) then immediately changing manifest.config.companyCode makes result BLOCKED/SCOPE_MISMATCH even though input at call time was valid. Probe reproduced. Clone both bytes and manifest before the first await (clone failure recorded and returned after hashing). Also test inverse invalid→valid mutation must stayBLOCKED.

3. **P1 — source selection is incompletely validated.** framework.ts57 validates only postingDate/stockType. SyntheticCOOIS_HEADER has materialA/delivery50 but selectionmaterialOTHER/delivery999 → PASS; deleting material/deliveredQuantity → PASS. Probe reproduced. Require selection metadata fields with correct types/ranges and match material/delivery on reports that expose them. MB51 contains componentmaterial plus finishedmaterial; use movement-aware checks and keep cross-report accounting reconciliationS4 separate.

## Other review observations

- RetainedRAW uses private copiedbytes and copy-on-read getter; finish returns immutable result, including ordinary validationfailure. Numericrequired empty cells become null plusBLOCK; optional stringempty staysnull. Strictheader order/UTF8LF/schema/generator checks present.
- Registry money/signed_money totals are required. Numericalprecision/dates/duplicatekeys/currency/fiscal scope and sign checks present. CK13N count/sum/unit checks present. These are implementation observations, not independently accepted54case outcomes.
- Metadata sourceLineCount, adapterVersion=null, selection.scope and filenameprofile are not validated in initial code; decide and document requiredsource metadata instead of implying allprovenance checked. Filehash verifies content against manifest, not authenticity of a recomputedmanifest; label this honestly.
- UI hides outputs when params/table snapshotkey differs and resetsquality ongenerate. Standardize awaits results/files and publishes onlyPASS CLEAN. No live browser state acceptance because independent browser capability is unavailable. Snapshotkey omitscomputed, but normalcomputed derivesparams; only flag if independentcomputed updates are supported.
- CLEAN JSON retains lineage and adapter/schema/rawHash/sourceHash and pendingS4/SME status. NoDB/network/upload introduced. Cross-reportcontrols remainS4.

## Probe evidence

`s3-independent-probe.ts` ran via existingrepo tsx executable, with synthetic minimalCOOIS_HEADER only; no authorfixtures. Result: wrongselectionPASS[], missingselectionPASS[], manifestRaceBLOCKED(SCOPE_MISMATCH), prototypeReportthrowsTypeError readingfilter. Probeexit0 represents completed diagnostics, **not PASS of allnegativecases**. Author should add regression expectations and fix; independent review must rerun before closing findings.
