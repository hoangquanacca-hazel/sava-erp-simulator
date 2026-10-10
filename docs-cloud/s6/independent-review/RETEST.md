# Independent S6 retest — 2026-10-08

**35/35 independently authored probes met expectations after hardening.** See `retest.ts`, `retest-results.json`, `retest-output.txt`. Historical initial failures remain in `probe-results.json` / `extended-before-fix.json` and are not overwritten.

Resolved findings: strict fact schema rejects additional approval claims; workflow replay rejects unknown actions/control IDs, first-event review without explanation, blank actor/empty references/invalid timestamps and extra approval properties; generated RAW metadata cannot claim approval or another adapter/control scope. Direct verifier rejects forged-but-rehashed APPROVE and REQUEST_REVIEW chains.

Verified: Canon 50% and Samsung 0% valid replay, zero-revenue null margin, immutable input copies before awaits, hash mismatch, malformed shape/version/inventory, changed numeric facts/CLEAN/control snapshot, duplicate reports, stale run/source binding; binary received input, fatal malformed UTF8/BOM rejection, 8MiB limit, Uint8Array mutation after start does not affect private verification snapshot.

CLI received-file check: wrote a synthetic package to this writable QA directory, independently computed filesystem SHA256 using Get-FileHash, then supplied that hash to actual `scripts/verify-p0-evidence.ts`. CLI exit0, technical PASS, businessAcceptance NOT_APPROVED, comparedWithExport true; fileSha256 a56ec63af7229234325d652779166023d82f45cf38645643d47bb8331545ff89, 112499 bytes. See `cli-received-file.json` / `synthetic-evidence.json`. This proves verification of a saved synthetic file, **not browser download completion**.

Review remains technical and scoped: no financial oracle modification, no real SAP data, no authenticated review, no SME/TT99/golden acceptance, no production release. No repository files edited or staged by this independent agent. Parent should preserve unrelated dirty reporting-library work and record actual final commit/check scope separately.
