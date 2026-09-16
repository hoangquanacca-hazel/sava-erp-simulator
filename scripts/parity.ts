/**
 * Dual-run parity: old voucher ledger vs ACDOCA Universal Journal.
 * Valuated + Non-valuated, 7-step happy path. Missing input → 0.
 */
import { PRESET_SCENARIOS } from '../src/types.ts';
import { computeMTO, generateStepEntries, computeTrialBalance, computeSalesOrderCostCard } from '../src/utils/calculator.ts';
import {
  rebuildAcdocaFromJournal,
  selectTrialBalance,
  assertParity,
  nz,
} from '../src/utils/acdoca.ts';

function runScenario(id: string) {
  const preset = PRESET_SCENARIOS.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown scenario ${id}`);
  const params = preset.params;
  const computed = computeMTO(params);
  const all = [];
  for (let step = 1; step <= 7; step++) {
    all.push(...generateStepEntries(step, params, computed, 0, 0, null));
  }
  const table = rebuildAcdocaFromJournal(all, params);
  assertParity(all, table, id);

  const oldTb = computeTrialBalance(all);
  const newTb = selectTrialBalance(table);
  if (oldTb.totalDebitTurnover !== newTb.totalDebitTurnover || oldTb.totalCreditTurnover !== newTb.totalCreditTurnover) {
    throw new Error(
      `${id} TB turnover mismatch old ${oldTb.totalDebitTurnover}/${oldTb.totalCreditTurnover} acdoca ${newTb.totalDebitTurnover}/${newTb.totalCreditTurnover}`
    );
  }
  if (!newTb.isBalanced) throw new Error(`${id} ACDOCA trial balance not balanced`);

  const has632 = table.some((l) => l.glAccount.startsWith('632'));
  if (params.stockType === 'Non-valuated') {
    const step5_632 = table.filter((l) => l.stepId === 5 && l.glAccount.startsWith('632'));
    if (step5_632.length) throw new Error(`${id} Non-valuated must not post 632 at step 5`);
    const step3_155 = table.filter((l) => l.stepId === 3 && l.glAccount === '155');
    if (step3_155.length) throw new Error(`${id} Non-valuated must not post 155 at 101E`);
    const step7_632 = table.filter((l) => l.stepId === 7 && l.glAccount === '632' && l.drAmount > 0);
    if (!step7_632.length) throw new Error(`${id} Non-valuated must post 632 at step 7`);
  }
  if (params.stockType === 'Valuated') {
    const step5 = table.filter((l) => l.stepId === 5 && (l.glAccount === '632' || l.glAccount.startsWith('6321')));
    if (!step5.length) throw new Error(`${id} Valuated must post COGS at step 5`);
  }

  const card = computeSalesOrderCostCard(7, params, computed, 0, 0);
  console.log(
    `PASS ${id} (${params.stockType}) docs=${table.length} lines, TB Dr=${newTb.totalDebitTurnover} GP=${card.actualGrossProfit} 632=${has632}`
  );
}

function missingInputIsZero() {
  const preset = PRESET_SCENARIOS[0];
  const computed = computeMTO({
    ...preset.params,
    orderQuantity: Number.NaN,
    sellingPrice: undefined as unknown as number,
    materialNormKgPer1000: null as unknown as number,
  });
  if (nz(computed.totalRevenue) !== 0) throw new Error('missing selling/qty must yield revenue 0');
  if (!Number.isFinite(computed.plannedCost)) throw new Error('plannedCost must be finite');
  console.log('PASS missing-input → 0');
}

runScenario('samsung-cover');
runScenario('canon-frame');
runScenario('denso-sensor');
missingInputIsZero();
console.log('ALL PARITY CHECKS PASSED');
