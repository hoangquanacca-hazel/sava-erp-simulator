# S5 Manufacturing MART / C08 — diagnostic implementation

Baseline3812179; browser-only generateddata. Humanapproval remainspending. Mr Quân requested a review packet because no independentgolden/TT99corpus was supplied; [packet](../p0-review/README.md) retains businessgaps and candidateexpectations.

Source `src/mart/manufacturing.ts`, `commentary.ts`, `src/components/ManufacturingMartPanel.tsx`; `npm run test:s5`.

## Data contract and gating

One production-order snapshot, sameS3sourceHash/runId and11CLEAN datasets. RecomputeC01–C07from private CLEAN copies and exactcompare supplied controlrun; reject any technicalFAIL/BLOCKED, edited status/evidence/metrics orstalesnapshot. Verify audit hashchain beforebuild. Clonebeforefirstawait, frozenoutput, source RAWhash/cleanhash/count +controlcaseSHA256 +snapshotSHA256. No regeneratedledger/oracle math.

12metrics: full-order standard/actual/variance; signedcollector settlement; residual154WIP; posted revenue/COGS/GP/margin; planned/deliveredquantity; explicitvarianceresidual. Basis/units/formula/sourceRefs/controlIDs attached toeach. GL sums exclude everydocument containing911; don't countclosing again. Zero revenue→margin=null withreason, numeric0 normalized positive0. 3cost-elementbridge rows621/622/627 useplannedCKleaves andactualcomponent/confirmation values. This is arithmeticdecomposition, not observedprice/usage/rootcause.

Everyexport stays SIMULATED/DIAGNOSTIC_ONLY/PENDING_HUMAN_SME. All7businessstatuses retained; C02/C04/C05/C07 stillblocked. NoapprovedMART, noofficialFP&A/CFOclaim, noDSO/DPO/DIO/CCC orP1/P2 expansion. CLEAN/RAW manifests aren'toverwritten.

## C08 facts

Deterministic fact permetric; noAI/providercall oruntrustednotes included. Exactmetric/value/unit/basis/snapshotHash/refs/text matchrequired; rejectunknown/duplicate/missingfacts andfabricatedexplanations. ValidatenumerictraceabilityPASS doesnotapproveMART; businessstatus PENDING_APPROVED_MART. Thisvalidator checks itsboundedtemplate facts, not arbitraryLLMprose entailment. Snapshotandmanifesthash protectaccidentalmutations, nottrustedidentity/signature/WORM.

## UI

After7base steps →SAPReports→DataLab→Controls→ **Tạo phân tích từ CLEAN đã đối soát**. Shows12metrics, basis/drillRAWcoordinates, costelementtable, deterministiccomments andpendingbusinessgapdisclosure. Updatingcontrolcase notes hidesoldMART; scenario/parameter/ledgerchangesinvalidateRAW/CLEAN/CONTROL/MART via parentgating. DownloadsMARTJSONandmanifest; sessionRAMonly. Can'tgenerateiftechnicalcontrolsblock, can'tapprovebytypingactor/note.

## Evidence and limits

54unchangedA0oracle snapshots /648metric records; standard/actual/variance, GP/COGS/revenue/WIP andcostelementdeltas asserted; zerooutputmarginN/A; stale/forgedwork/quality/input/audit chain failure, awaitisolation, C08 wrongvalue/unit/basis/text/refs/hash/inventory, immutability andexporthash tested. Independentagent24probesPASS [review](independent-review/REVIEW.md); reviewerdoesnotclaimhumanacceptance. Finalchecklogs evidence/results.json; browserQA recordedseparately afterbuild.

DownloadsRAW/CLEAN/CONTROL attemptedagain, tooltimeouts/noverifiedpath →UNVERIFIED. Humanlegal/SME/originalSAPformatapproval andM01–M10 unfinished. Substantialcoveragegaps: reversals/openings/multi-order/crossperiod/currencyUoMconversions, receivereligibility/targetversion/physicaldrivers. S5technicalcompletiondoesnotunlockS6humanacceptance. Bundlewarningremains~1.5MBbacklog. NoOracle/calculator/acdoca/materialLedger/netlifychanges, no deployment/push/merge.
