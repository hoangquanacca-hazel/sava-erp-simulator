/** Read-only verifier: npx tsx scripts/verify-manufacturing-finance.ts <file.json> [sha256] */
import { readFileSync, statSync } from 'node:fs';
import { FINANCE_EVIDENCE_MAX_BYTES, verifyFinanceEvidence } from '../src/evidence/manufacturingFinance';

try {
  const file = process.argv[2];
  if (!file || statSync(file).size > FINANCE_EVIDENCE_MAX_BYTES) throw new Error('Expected an original simulator JSON file, at most 2 MiB.');
  console.log(JSON.stringify(await verifyFinanceEvidence(new Uint8Array(readFileSync(file)), process.argv[3]), null, 2));
} catch (e) {
  console.error(JSON.stringify({ status: 'BLOCKED', message: e instanceof Error ? e.message : String(e) }));
  process.exitCode = 1;
}
