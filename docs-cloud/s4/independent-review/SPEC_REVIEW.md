# S4 independent specification review — 2026-10-08

Scope: review of current simulation contracts and requested C01–C07 implementation. No repository edits, no posting-oracle changes, no service starts, no network/AI calls. This is technical review, not human SME acceptance.

## Schema limitations

- C02: MB51 has no reservation number/item; Components contains reservation item but no reservation number. Order/material/UoM aggregate tieout is only a simulation diagnostic. Reservation-level business reconciliation remains BLOCKED. Duplicate same-material components cannot be allocated safely.
- C05: KKS1 settled cost and SUP01 represent full TK154 cost settlement, not eligible variance. SUP01 has document/line/source reference but no receiver/allocation/run. Technical SIM settlement-to-GL/WIP tieout may run; original eligible-variance-to-receiver gate remains BLOCKED.
- C04: KOB1 is the simulator's TK154 production-cost debit view; no independent real CO target version, controlling area, overhead/activity classification exists. SIM collector cost identity does not establish the SAP variance control-cost basis.
- C07: component actual quantities are calculated from the actual-cost ratio. They are not independent evidence supporting price versus usage causes. Allowed output quantities, actual prices, SAP categories and approved target version are absent. Report cost-element deltas with explicit residual; do not assign real root causes.
- C06: one HEADER plus three additive ITEM records supports a SIM estimate identity. Real SAP additive leaf, costing version, currency view and full estimate identity remain deferred.
- C03: current events equate produced/received quantities with delivered quantities at one fixed cutoff; no opening balance or cross-period support. Full-order target costs remain the KKS1 variance basis even for partial delivery.
- All CLEAN datasets carry sourceHash/runId/rawHash/lineage but not actual SAP namespace/client/scope. Same run IDs must be checked, with a named fixed simulation policy, rather than fabricating SAP namespace.

## Agreed parent implementation boundary

Seven controls separate technicalStatus PASS/FAIL/BLOCKED for explicitly named simulation diagnostics from businessStatus BLOCKED/PENDING_SME. C02 and C05 always preserve their specific blocked business prerequisites, even when numeric tieouts pass. C04 and C07 remain blocked for SAP cost basis/categories. Technical pass must not close P0-MFG human acceptance gates.

## Planned adversarial probes

Conforming baseline and partial favorable scenario; missing/blocked report; mismatched run/hash; duplicate report/row; unmatched goods movement; inconsistent UoM/currency; mutated signed quantity and cost amount; missing settlement line/wrong GL key/receiver absence; nonadditive CK records; component duplicate ambiguity; nonfinite input; local exception transitions without bypassing failing controls.
