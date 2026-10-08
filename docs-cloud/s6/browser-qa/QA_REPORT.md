# Independent S6 browser QA — 2026-10-08

Target: http://127.0.0.1:3017/ only. Used documented CUA browser API; no shell browser automation, no repository edits, no leads created, no external links/AI calls.

## Verified in browser

- Canon Non-valuated, variance -3.5%, delivered 1,000/2,000; ran all seven steps.
- Generated 11 SAP simulated RAW reports; CLEAN pipeline passed 11/11 (controls enabled after adaptation).
- Controls passed 7/7 technically; C02/C04/C05/C07 retained business BLOCKED states and C01/C03/C06 remained PENDING_SME.
- MART showed 12 metrics and C08 numeric traceability matched, with business approval pending. Full-order cost 51,228,038 VND, planned 53,086,050 VND, variance -1,858,012 VND; settlement and WIP both 25,614,019 VND; posted revenue 115,000,000 VND, COGS 25,614,019 VND, gross profit 89,385,981 VND.
- Single evidence button generated SIM-0ca91a3854067d51_P0_EVIDENCE_v1.json, 112162 bytes. UI SHA256: 5c0fd64b42cb34af01f1b13529950c3900dbbfc9232f65cfeb7973ed4a7cfbf9.
- UI explicitly states the pack is not business approval and a download click/RAM generation does not prove saved browser bytes. No approve action observed in the tested controls/MART/evidence flow.
- Browser error log query returned an empty array after generation.
- Initial admin view showed webinar OFF and zero leads. Temporarily enabled webinar through the UI to run the scenario.

## Unverified / tool limitations

- Actual browser save: documented download-event wait timed out after 12 seconds. The displayed filename/hash prove generation only, not disk persistence.
- File replay: documented filechooser flow was attempted with the existing synthetic Canon review-case file. The tool hung and was aborted; no replay outcome was observed.
- Stale-parameter hiding: not completed because browser tool became unavailable after the aborted chooser.
- Final webinar OFF / leads zero restoration: UNVERIFIED. Restoration was attempted once using supported footer controls; browser binding 2 reported unavailable before clicks. The last observed initial lead count was zero; no QA action created leads. Root should restore OFF in the user browser before concluding.
- Screenshots: no saved screenshot available; interrupted browser session prevented capture. Do not present this QA as visual screenshot or saved-file proof.

This is scoped technical UI evidence, not P0 acceptance or human SME approval. The browser tested the build reported ready by root before subsequent text polishing; no final polish visual verification is claimed.
