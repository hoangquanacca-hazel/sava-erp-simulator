# Independent S6 evidence review — 2026-10-08

Scope: read-only inspection and independently authored adversarial probes of `src/evidence/pack.ts`, evidence panel, CLI, existing workflow/MART/facts replay. No repository edits, oracle changes, service starts, network or AI calls. Evidence is synthetic Canon 50% and Samsung 0% delivery. No human business/legal approval.

Initial outcome: **16/19 probes met expectations; three semantic acceptance defects found.** Initial results are preserved in `probe-results.json` and code in `probe.ts`.

1. Rehashed fact containing extra `approval: APPROVED` was accepted. Fact validator checks known properties but ignores extra properties.
2. Rehashed event with action `APPROVE`, rebuilt MART and facts, was accepted. Chain validity is not event-action validity.
3. Rehashed first event `REQUEST_REVIEW` without any preceding explanation was accepted. Replay validates hash sequence but does not enforce workflow ordering.

The result still states NOT_APPROVED, so these do not authenticate approval. They do permit a semantically invalid package to be labelled technically PASS, which conflicts with the evidence verifier's purpose.

Expected fixes: enforce closed fact/case/event schemas, allowed actions, control identity, explanation/review order and the same value/length/date limits as appendEvent, while keeping all business acceptance pending.

Baseline, expected-file-hash mismatch, malformed JSON shape, manifest version/extra field, top approval, rehashed numeric fact/CLEAN modifications, inventory/run/control mutation, unrehashed event mutation, duplicate report, async snapshot isolation and zero-delivery nullable margin behaved as expected.

Panel/CLI inspection: generation packages captured snapshots and displays file SHA256; importer replays local JSON and optionally compares expected hash. This is not proof that browser actually saved a download; no live browser download was tested in this review. CLI byte-preservation and received-file verification remain for parent to test with actual saved files.

Open scope limitations: no manual 54-case browser matrix, real SAP import, authenticated approval, persistence or independent golden/TT99 acceptance. Existing dirty reporting-library changes must be preserved separately.
