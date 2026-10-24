import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createManufacturingFinance, executeFinance, budgetCheck, bankMatch, financeControls, type FinanceCommand, type FinanceState } from '../src/features/manufacturingFinance';
import { exportFinanceEvidence, FINANCE_EVIDENCE_MAX_BYTES, verifyFinanceEvidence } from '../src/evidence/manufacturingFinance';
import { manufacturingFinanceReports, financeReportText } from '../src/reports/manufacturingFinance';
import contracts from '../src/reports/manufacturingFinance.contracts.json';
import { sha256Hex } from '../src/reports/core';
import { parseHash, ROUTE_HASH } from '../src/features/hashRoute';
import ManufacturingFinancePage from '../src/pages/ManufacturingFinancePage';

let checks = 0;
function test(name: string, check: () => void) { check(); checks++; console.log(`PASS ${name}`); }
const seed = createManufacturingFinance();
let s = seed;
const run = (command: FinanceCommand) => {
  const before = JSON.stringify(s);
  const previous = s;
  const result = executeFinance(s, command);
  assert.equal(JSON.stringify(previous), before, 'never mutate caller state');
  assert.equal(result.status, 'SIMULATED', result.message);
  s = result.state;
  assert.ok(financeControls(s).every(c => c.pass), 'controls at each accepted transition');
  return result;
};
const noWrite = (state: FinanceState, command: FinanceCommand, expected: 'BLOCKED' | 'NO_CHANGE') => {
  const before = JSON.stringify(state);
  const r = executeFinance(state, command);
  assert.equal(r.status, expected); assert.equal(r.state, state); assert.equal(JSON.stringify(state), before);
};
const net = (state: FinanceState, company: string, account: string) => state.documents.filter(d => d.company === company).flatMap(d => d.lines).filter(l => l.account === account).reduce((n, l) => n + l.debit - l.credit, 0);

test('seed is isolated, deterministic, reconciled and namespace-qualified', () => {
  assert.deepEqual(createManufacturingFinance(), seed);
  assert.ok(financeControls(seed).every(c => c.pass));
  assert.equal(new Set(seed.invoices.map(i => i.id)).size, seed.invoices.length);
  assert.ok(seed.invoices.every(i => i.id === `${i.company}/${i.year}/${i.document}/${i.item}`));
  assert.equal(net(seed, '1000', 'AR'), 92_000_000);
});
test('invalid lifecycle commands and unknown action are atomic', () => {
  for (const type of ['RECEIVE_DEPOSIT', 'APPLY_DEPOSIT', 'ISSUE_DUNNING', 'POST_MAINTENANCE'] as const) noWrite(seed, { type }, 'BLOCKED');
  noWrite(seed, { type: 'UNKNOWN' } as unknown as FinanceCommand, 'BLOCKED');
});
test('request is noted-only; receipt does not create revenue; retries do not duplicate', () => {
  const n = s.documents.length, revenue = net(s, '1000', 'REVENUE');
  run({ type: 'REQUEST_DEPOSIT' }); assert.equal(s.documents.length, n);
  noWrite(s, { type: 'REQUEST_DEPOSIT' }, 'NO_CHANGE');
  run({ type: 'RECEIVE_DEPOSIT' }); assert.equal(net(s, '1000', 'REVENUE'), revenue);
  assert.equal(net(s, '1000', 'CUSTOMER_ADVANCE_ALT'), -36_000_000);
  assert.equal(s.documents.at(-1)!.lines[1].specialGL, 'A');
  noWrite(s, { type: 'RECEIVE_DEPOSIT' }, 'NO_CHANGE');
});
test('invoice and deposit clearing leave AR 84m, no second revenue, independent of action order', () => {
  run({ type: 'BILL_ORDER' }); const revenue = net(s, '1000', 'REVENUE');
  run({ type: 'APPLY_DEPOSIT' });
  assert.equal(s.invoices.find(i => i.reference === 'SO-MF-01')!.open, 84_000_000);
  assert.equal(net(s, '1000', 'CUSTOMER_ADVANCE_ALT'), 0); assert.equal(net(s, '1000', 'REVENUE'), revenue);
  noWrite(s, { type: 'BILL_ORDER' }, 'NO_CHANGE'); noWrite(s, { type: 'APPLY_DEPOSIT' }, 'NO_CHANGE');
  let alternate = seed;
  for (const type of ['BILL_ORDER', 'REQUEST_DEPOSIT', 'RECEIVE_DEPOSIT', 'APPLY_DEPOSIT'] as const) alternate = executeFinance(alternate, { type }).state;
  assert.equal(net(alternate, '1000', 'AR'), net(s, '1000', 'AR'));
});
test('dunning proposal retains blocked/not-due rows, does not issue or post, then stale proposal blocks', () => {
  const before = JSON.stringify(s.invoices); const docs = s.documents.length;
  run({ type: 'PROPOSE_DUNNING' });
  assert.equal(JSON.stringify(s.invoices), before); assert.equal(s.documents.length, docs);
  assert.equal(s.dunning!.rows.find(r => r.invoiceId.endsWith('000005/001'))!.status, 'BLOCKED');
  assert.equal(s.dunning!.rows.find(r => r.invoiceId.endsWith('000006/001'))!.status, 'NOT_DUE_OR_GRACE');
  const main = s.dunning!.rows.find(r => r.invoiceId.endsWith('000001/001'))!;
  assert.equal(main.open, 84_000_000); assert.equal(main.overdue, 20); assert.equal(main.level, 1);
  const changed = executeFinance(s, { type: 'PAY_INTERCOMPANY' }).state;
  noWrite(changed, { type: 'ISSUE_DUNNING' }, 'BLOCKED');
  assert.ok(manufacturingFinanceReports(changed)[0].rows.every(r => r[16] === 'STALE_PROPOSAL'));
});
test('issued demo notices update history only; no repeat within interval, blocked items stay untouched', () => {
  const docs = s.documents.length;
  run({ type: 'ISSUE_DUNNING' }); assert.equal(s.documents.length, docs);
  assert.equal(s.invoices.find(i => i.reference === 'SO-MF-01')!.lastDunned, '2026-10-21');
  assert.equal(s.invoices.find(i => i.block)!.level, 0);
  noWrite(s, { type: 'ISSUE_DUNNING' }, 'NO_CHANGE');
  run({ type: 'PROPOSE_DUNNING' }); assert.ok(s.dunning!.rows.some(r => r.status === 'INTERVAL'));
  noWrite(s, { type: 'ISSUE_DUNNING' }, 'BLOCKED');
});
test('dunning boundaries use grace 3d, 30d escalation and 7d interval; cleared excluded', () => {
  for (const [due, lastDunned, open, status, level] of [
    ['2026-10-18', '', 100, 'NOT_DUE_OR_GRACE', 0], ['2026-10-17', '', 100, 'PROPOSED', 1],
    ['2026-09-21', '', 100, 'PROPOSED', 2], ['2026-09-22', '', 100, 'PROPOSED', 1],
    ['2026-10-01', '2026-10-15', 100, 'INTERVAL', 0], ['2026-10-01', '2026-10-14', 100, 'PROPOSED', 1],
    ['2026-10-01', '', 0, 'CLEARED', 0],
  ] as const) {
    const probe = createManufacturingFinance(); Object.assign(probe.invoices[0], { due, lastDunned, open });
    const row = executeFinance(probe, { type: 'PROPOSE_DUNNING' }).state.dunning!.rows[0];
    assert.equal(row.status, status); assert.equal(row.level, level);
  }
});
test('auto bank clearing handles 1:N without duplicating bank amount, leaves unmatched and ambiguous', () => {
  assert.equal(bankMatch(s, s.bank[0]).status, 'MATCHED');
  assert.equal(bankMatch(s, s.bank[1]).invoices.length, 2);
  const balance = net(s, '1000', 'BANK'); run({ type: 'AUTO_BANK' });
  assert.equal(net(s, '1000', 'BANK') - balance, 124_000_000);
  assert.equal(s.bank[1].clearedInvoices.length, 2);
  assert.equal(bankMatch(s, s.bank[2]).status, 'UNMATCHED'); assert.equal(bankMatch(s, s.bank[3]).status, 'AMBIGUOUS');
  noWrite(s, { type: 'AUTO_BANK' }, 'NO_CHANGE');
  assert.equal(s.invoices.find(i => i.reference === 'SO-MF-01')!.open, 0);
});
test('auto-match never falls back to equal amounts, wrong currency/company/rule or empty reference', () => {
  for (const patch of [{ currency: 'USD' }, { company: '2000' }, { rule: 'UNKNOWN' }, { reference: '' }, { amount: NaN }, { amount: -1 }]) {
    const b = { ...seed.bank[1], ...patch }; assert.notEqual(bankMatch(seed, b).status, 'MATCHED');
  }
  const b = { ...seed.bank[1], amount: 15_000_000 }; assert.equal(bankMatch(seed, b).status, 'AMOUNT_DIFFERENCE');
});
test('manual FEBAN confirmation checks scope/amount, preserves original reference and cannot post twice', () => {
  const command = { type: 'REPROCESS_BANK', bankId: s.bank[2].id, invoiceId: '1000/2026/9100000004/001' } as const;
  noWrite(s, { ...command, invoiceId: s.invoices[0].id }, 'BLOCKED');
  noWrite(s, { ...command, bankId: 'unknown' }, 'BLOCKED');
  for (const patch of [{ currency: 'USD' }, { company: '2000' }, { rule: 'UNKNOWN' }]) {
    const probe = structuredClone(s); Object.assign(probe.bank[2], patch); noWrite(probe, command, 'BLOCKED');
  }
  run(command); assert.equal(s.bank[2].reference, 'MISSING-REF'); assert.equal(s.bank[2].clearedInvoices[0], command.invoiceId);
  noWrite(s, command, 'NO_CHANGE');
});
test('AVC rejects invalid/excess/inactive commitments atomically; accepts boundary and warns at 90%', () => {
  for (const amount of [NaN, Infinity, -1, 0, 0.5, Number.MAX_SAFE_INTEGER, 90_000_000]) noWrite(s, { type: 'RESERVE_MAINTENANCE', amount }, 'BLOCKED');
  assert.equal(budgetCheck(seed, 59_999_999).status, 'WITHIN_BUDGET');
  assert.equal(budgetCheck(seed, 60_000_000).status, 'WARNING'); assert.equal(budgetCheck(seed, 70_000_000).status, 'WARNING');
  assert.equal(budgetCheck(seed, 70_000_001).status, 'BLOCKED');
  const inactive = structuredClone(seed); inactive.budget.active = false; noWrite(inactive, { type: 'RESERVE_MAINTENANCE', amount: 1 }, 'BLOCKED');
  const docs = s.documents.length; run({ type: 'RESERVE_MAINTENANCE', amount: 60_000_000 }); assert.equal(s.documents.length, docs);
  assert.equal(s.budget.actual + s.budget.commitment, 90_000_000);
  noWrite(s, { type: 'RESERVE_MAINTENANCE', amount: 60_000_000 }, 'NO_CHANGE');
});
test('actual invoice relieves only new commitment, conserving assigned value and FI balance', () => {
  run({ type: 'POST_MAINTENANCE' });
  assert.equal(s.budget.actual, 80_000_000); assert.equal(s.budget.commitment, 10_000_000);
  assert.equal(net(s, '2000', 'MAINTENANCE'), 80_000_000);
  noWrite(s, { type: 'POST_MAINTENANCE' }, 'NO_CHANGE');
});
test('cross-company payment balances per company, clears supplier not reciprocal IC, and retries are safe', () => {
  const n = s.documents.length;
  run({ type: 'PAY_INTERCOMPANY' }); assert.equal(s.documents.length, n + 2);
  const pair = s.documents.filter(d => d.jointId === 'IC-PAY-01'); assert.equal(pair.length, 2);
  assert.deepEqual(pair.map(d => d.company), ['1000', '2000']);
  assert.ok(pair.every(d => d.lines.reduce((n, l) => n + l.debit - l.credit, 0) === 0));
  assert.equal(net(s, '1000', 'DUE_FROM_2000'), 60_000_000); assert.equal(net(s, '2000', 'DUE_TO_1000'), -60_000_000);
  assert.equal(s.intercompany.supplierOpen, 0); assert.equal(net(s, '2000', 'AP'), -80_000_000); // other AP remains
  noWrite(s, { type: 'PAY_INTERCOMPANY' }, 'NO_CHANGE');
});
test('FI21/FI22 reuse existing practice contract columns and keys exactly; new scope avoids legacy date', () => {
  const source = new URL('../public/sap-reporting/expansion-150.json', import.meta.url);
  // The reporting library is pre-existing untracked work in this checkout. The
  // runtime ships its small contract snapshot and must not require that library.
  const registry = existsSync(source) ? JSON.parse(readFileSync(source, 'utf8')) : null;
  for (const c of contracts.reports) {
    assert.equal(c.columns.length, 18); assert.equal(c.native_export, false);
    if (registry) {
      const original = registry.reports.find((r: { id: string }) => r.id === c.id);
      assert.deepEqual(c.columns, original.columns); assert.deepEqual(c.keys, original.keys);
    }
  }
  if (!registry) console.log('SOURCE REGISTRY NOT PRESENT: using the committed FI21/FI22 practice-contract snapshot.');
  for (const r of manufacturingFinanceReports(s)) {
    assert.ok(r.rows.every(row => row.length === r.columns.length));
    assert.ok(financeReportText(r).includes('2026-10-21')); assert.ok(!financeReportText(r).includes('2026-09-15'));
  }
  const bank = manufacturingFinanceReports(s)[1];
  assert.equal(bank.rows.reduce((n, row) => n + Number(row[9]), 0), 141_000_000);
});
test('route and both theme walkthroughs show all workflows, acceptance labels and current controls', () => {
  assert.equal(parseHash(ROUTE_HASH['manufacturing-finance']), 'manufacturing-finance'); assert.equal(parseHash('#/ic'), 'ic');
  for (const uiMode of ['fiori', 'classic'] as const) {
    const html = renderToStaticMarkup(<ManufacturingFinancePage session={{ state: s, status: 'SIMULATED', message: 'test' }} onCommand={() => {}} onReset={() => {}} uiMode={uiMode} />);
    for (const phrase of ['Special G/L', 'F150', 'FEBAN', 'Internal Order', 'Intercompany clearing', 'NOT_RUN', 'NOT_APPROVED', 'SIMULATED_PASS', 'FI21', 'FI22']) assert.ok(html.includes(phrase), phrase);
    assert.ok(!html.includes('NaN')); assert.ok(!html.includes('undefined'));
  }
});

const evidence = await exportFinanceEvidence(s);
assert.equal((await exportFinanceEvidence(s)).text, evidence.text); checks++;
const parsed = JSON.parse(evidence.text);
assert.equal(parsed.acceptance.sapNative, 'NOT_RUN'); assert.equal(parsed.acceptance.business, 'NOT_APPROVED');
assert.equal(await sha256Hex(new TextEncoder().encode(evidence.text)), evidence.sha256); checks++;
for (const report of parsed.reports) assert.equal(await sha256Hex(new TextEncoder().encode(report.text)), report.sha256);
for (const tamper of [(x: FinanceState) => { x.deposit.received++; }, (x: FinanceState) => { x.history[0].message = 'APPROVED'; }, (x: FinanceState) => { x.documents.pop(); }]) {
  const changed = structuredClone(s); tamper(changed); await assert.rejects(() => exportFinanceEvidence(changed), /replay/); checks++;
}
const encode = (text: string) => new TextEncoder().encode(text);
const verified = await verifyFinanceEvidence(encode(evidence.text), evidence.sha256.toUpperCase());
assert.equal(verified.status, 'VERIFIED_SIMULATION_ONLY'); assert.equal(verified.revision, s.revision);
assert.equal(verified.hashCompared, true); assert.equal(verified.business, 'NOT_APPROVED'); checks++;
assert.equal((await verifyFinanceEvidence(encode((await exportFinanceEvidence(seed)).text))).revision, 0); checks++;
for (const tamper of [
  (x: typeof parsed) => { x.acceptance.business = 'APPROVED'; },
  (x: typeof parsed) => { x.acceptance.sapNative = 'PASS'; },
  (x: typeof parsed) => { x.scope.cutoff = '2026-10-22'; },
  (x: typeof parsed) => { x.state.deposit.received++; },
  (x: typeof parsed) => { x.state.history[0].message = 'APPROVED'; },
  (x: typeof parsed) => { x.state.history[0].command = { type: 'PAY_INTERCOMPANY', extra: 'untrusted' }; },
  (x: typeof parsed) => { x.state.history[0].command = { type: 'RESERVE_MAINTENANCE', amount: '60000000' }; },
  (x: typeof parsed) => { x.state.history[0].command = { type: 'ARBITRARY' }; },
  (x: typeof parsed) => { x.state.history[0].command = { type: 'REPROCESS_BANK', bankId: [], invoiceId: '' }; },
  (x: typeof parsed) => { x.state.documents.pop(); },
  (x: typeof parsed) => { x.reports[0].text += 'APPROVED'; },
  (x: typeof parsed) => { x.reports[0].sha256 = '0'.repeat(64); },
  (x: typeof parsed) => { x.controls[0].pass = false; },
  (x: typeof parsed) => { x.extra = 'forged'; },
  (x: typeof parsed) => { x.state.history = Array(1001).fill(x.state.history[0]); },
]) {
  const altered = structuredClone(parsed); tamper(altered);
  await assert.rejects(() => verifyFinanceEvidence(encode(JSON.stringify(altered, null, 2) + '\n'))); checks++;
}
for (const invalid of ['', '{', '[]', 'null', JSON.stringify(parsed), '\uFEFF' + evidence.text,
  evidence.text.replace('"schema":', '"schema":"duplicate", "schema":')]) {
  await assert.rejects(() => verifyFinanceEvidence(encode(invalid))); checks++;
}
await assert.rejects(() => verifyFinanceEvidence(new Uint8Array([0xff, 0xfe]))); checks++;
await assert.rejects(() => verifyFinanceEvidence(new Uint8Array(FINANCE_EVIDENCE_MAX_BYTES + 1))); checks++;
await assert.rejects(() => verifyFinanceEvidence(encode(evidence.text), '0'.repeat(64)), /không khớp/); checks++;
await assert.rejects(() => verifyFinanceEvidence(encode(evidence.text), 'invalid'), /64/); checks++;
assert.equal((await verifyFinanceEvidence(encode(evidence.text))).hashCompared, false); checks++;
console.log(`PASS ${checks} manufacturing finance checks; deterministic replay and evidence hashes. SAP-native NOT_RUN; business NOT_APPROVED.`);
if (process.argv.includes('--write-evidence')) {
  const dir = new URL('../docs/implementation/evidence/manufacturing-finance/', import.meta.url);
  mkdirSync(dir, { recursive: true }); writeFileSync(new URL(evidence.fileName, dir), evidence.text);
  writeFileSync(new URL('validation.json', dir), JSON.stringify({ date: '2026-10-22', command: 'npm run test:manufacturing-finance -- --write-evidence', checks,
    evidenceFile: evidence.fileName, sha256: evidence.sha256, replay: 'PASS', sapNative: 'NOT_RUN', independentSme: 'PENDING', business: 'NOT_APPROVED' }, null, 2) + '\n');
}
