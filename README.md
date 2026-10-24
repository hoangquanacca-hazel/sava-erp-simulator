# Sava ERP Cockpit

Enterprise simulation of SAVA Precision Technology make-to-order (MTO) flow: SD · MM · PP · QM · FICO, Thông tư 99/2025/TT-BTC, and S/4HANA Universal Journal (`ACDOCA`).

## Run locally

```bash
npm install
npm run dev
```

Dev server: Express + Vite (see `server.ts`). Production:

```bash
npm run build
npm start
```

Parity / acceptance (Valuated + Non-valuated, missing input → 0, 5-type variance identity):

```bash
npm run test:parity
```

Lazy hash modules (feature-flagged): `#/variance` `#/close` `#/wip` `#/mdg` `#/sod` `#/ml` `#/grir` `#/ic`.

Simulation-only screens (always on, no feature flag): `#/manufacturing-finance` (5 FICO practice workflows, evidence in `docs/implementation/evidence/manufacturing-finance/`) and `#/simulated-native` (Phase 3 pilot package served from `public/sap-reporting/simulated-native/`). Status: SIMULATED / PENDING_HUMAN_REVIEW; not SAP-native, business NOT_APPROVED.

## ACDOCA

Postings for steps 3–7 go through `postDocument` into `ACDOCA_TABLE`. Trial Balance and Margin Analysis read selectors. Valuated PGI (601E) splits COGS to management accounts 632110–140. Non-valuated 101E/PGI are logistics-only; 632 posts at VA88 (step 7).

Gemini API key (`GEMINI_API_KEY`) is optional; the tutor falls back to domain explanations if unset.
