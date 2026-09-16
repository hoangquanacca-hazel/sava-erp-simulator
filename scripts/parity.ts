/**
 * Dual-run parity: old voucher ledger vs ACDOCA Universal Journal.
 * Valuated + Non-valuated, 7-step happy path. Missing input → 0.
 */
import { PRESET_SCENARIOS } from '../src/types.ts';
import { computeMTO, generateStepEntries, computeTrialBalance, computeSalesOrderCostCard } from '../src/utils/calculator.ts';
import {
  selectTrialBalance,
  assertParity,
  nz,
} from '../src/utils/acdoca.ts';

function runScenario(id: string) {
  const preset = PRESET_SCENARIOS.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown scenario ${id}`);
  const params = preset.params;
  const computed = computeMTO(params);
  const allEntries = [];
  const allAcdoca = [];
  for (let step = 1; step <= 7; step++) {
    const posted = generateStepEntries(step, params, computed, 0, 0, null);
    allEntries.push(...posted.entries);
    allAcdoca.push(...posted.acdoca);
  }
  assertParity(allEntries, allAcdoca, id);

  const oldTb = computeTrialBalance(allEntries);
  const newTb = selectTrialBalance(allAcdoca);
  if (!newTb.isBalanced) throw new Error(`${id} ACDOCA trial balance not balanced`);
  if (newTb.totalDebitTurnover !== newTb.totalCreditTurnover) {
    throw new Error(`${id} TB Dr≠Cr`);
  }

  if (params.stockType === 'Non-valuated') {
    const step5_632 = allAcdoca.filter((l) => l.stepId === 5 && l.glAccount.startsWith('632'));
    if (step5_632.length) throw new Error(`${id} Non-valuated must not post 632 at step 5`);
    const step3_155 = allAcdoca.filter((l) => l.stepId === 3 && l.glAccount === '155');
    if (step3_155.length) throw new Error(`${id} Non-valuated must not post 155 at 101E`);
    const step7_632 = allAcdoca.filter((l) => l.stepId === 7 && l.glAccount === '632' && l.drAmount > 0);
    if (!step7_632.length) throw new Error(`${id} Non-valuated must post 632 at step 7`);
    const splitAt5 = allAcdoca.filter((l) => l.stepId === 5 && l.glAccount.startsWith('6321'));
    if (splitAt5.length) throw new Error(`${id} Non-valuated must not split COGS at PGI`);
  }
  if (params.stockType === 'Valuated') {
    const a110 = allAcdoca.filter((l) => l.stepId === 5 && l.glAccount === '632110').reduce((s, l) => s + l.drAmount, 0);
    const a120 = allAcdoca.filter((l) => l.stepId === 5 && l.glAccount === '632120').reduce((s, l) => s + l.drAmount, 0);
    const a130 = allAcdoca.filter((l) => l.stepId === 5 && l.glAccount === '632130').reduce((s, l) => s + l.drAmount, 0);
    const a140 = allAcdoca.filter((l) => l.stepId === 5 && l.glAccount === '632140').reduce((s, l) => s + l.drAmount, 0);
    const cr155 = allAcdoca.filter((l) => l.stepId === 5 && l.glAccount === '155').reduce((s, l) => s + l.crAmount, 0);
    if (a110 + a120 + a130 + a140 !== cr155) {
      throw new Error(`${id} COGS split ${a110 + a120 + a130 + a140} !== Cr155 ${cr155}`);
    }
    if (cr155 !== computed.plannedCost) {
      throw new Error(`${id} Cr155 ${cr155} !== plannedCost ${computed.plannedCost}`);
    }
  }

  const card = computeSalesOrderCostCard(7, params, computed, 0, 0);
  console.log(
    `PASS ${id} (${params.stockType}) acdoca=${allAcdoca.length} TB Dr=${newTb.totalDebitTurnover} (old grid ${oldTb.totalDebitTurnover}) GP=${card.actualGrossProfit}`
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
