# Sava SAP MTO Cockpit

Enterprise simulation of SAVA Precision Technology make-to-order (MTO) flow: SD · MM · PP · QM · FICO, Thông tư 200/2014/TT-BTC, and S/4HANA Universal Journal (`ACDOCA`).

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

Lazy modules (hash routes, feature-flagged): `#/variance` Waterfall 5-type (CO-PA display). FI 632 net at VA88 unchanged.

## ACDOCA

Postings for steps 3–7 go through `postDocument` into `ACDOCA_TABLE`. Trial Balance and Margin Analysis read selectors. Valuated PGI (601E) splits COGS to management accounts 632110–140. Non-valuated 101E/PGI are logistics-only; 632 posts at VA88 (step 7).

Gemini API key (`GEMINI_API_KEY`) is optional; the tutor falls back to domain explanations if unset.
