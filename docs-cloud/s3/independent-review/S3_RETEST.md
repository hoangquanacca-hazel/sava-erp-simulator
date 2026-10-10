# Independent S3 code-probe retest

Read-only retest of current framework after author hardening. No author fixtures/oracle changed; no repo mutation. Browser remains unavailable and was not retried.

All three reported findings RESOLVED in focused independent probes:

1. Prototype report IDs __proto__/toString return BLOCKED/REPORT_UNSUPPORTED, cleannull, retainedRAW214bytes; no exception.
2. Validmanifest mutated immediately aftercall staysPASS; invalidmanifest repaired immediately aftercall staysBLOCKED. Input-at-call snapshot retained.
3. Wrongmaterial BLOCKED/SCOPE_MISMATCH; delivery999 vs row50 BLOCKED/SELECTION_DELIVERY_MISMATCH; missingselection fields BLOCKED. ValidbaselinePASS1row.

Fixture was updated only to conform new declaredprofile: sourceLineCount1 and fixedproductionOrder1000001. First rerun's blanketsourceCount0/orderPRD-01 failures were diagnostic masking, not proof of regression; preserved intermediateoutput makes this transparent. With conformingfixture, no new blocking regression observed in this narrowprobe.

Evidence: s3-independent-retest.ts; s3-independent-retest-final-output.json. Intermediate s3-independent-retest-output.json retained. EachBLOCKEDresult retains214RAWbytes and returnsnoclean. This covers8specific cases (baseline,material,delivery,missing,2races,2prototypeIDs), not594roundtrips or browser/businessacceptance. S4cross-report controls and SME gates remain separate.
