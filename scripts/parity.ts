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
  selectMarginAnalysis,
} from '../src/utils/acdoca.ts';
import { computeFiveTypeVariance, assertFiveTypeVariance } from '../src/features/variance.ts';
import { canRunCloseStep, EMPTY_CLOSE } from '../src/features/periodClose.ts';
import { wipStatusOf } from '../src/features/wip.ts';

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
  const ma = selectMarginAnalysis(allAcdoca, card.actualGrossProfit);
  if (!ma.matchesOrderCard) {
    throw new Error(
      `${id} margin GP ${ma.actualGrossProfit} ≠ order card ${card.actualGrossProfit} (rev=${ma.revenue511} split=${ma.cogsSplitTotal} var=${ma.settledVariance})`
    );
  }

  const five = computeFiveTypeVariance(params, computed);
  assertFiveTypeVariance(five);
  if (five.Vp + five.Vq + five.Vr + five.Vs + five.Vrem !== five.TV) {
    throw new Error(`${id} 5-type identity fail`);
  }

  console.log(
    `PASS ${id} (${params.stockType}) acdoca=${allAcdoca.length} TB Dr=${newTb.totalDebitTurnover} GP=${card.actualGrossProfit} margin%=${ma.actualMarginPercent}`
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
  const five = computeFiveTypeVariance(
    { ...preset.params, variancePmPercent: undefined, varianceQmPercent: undefined, scrapUnits: undefined },
    computed
  );
  if (five.Vp !== 0 || five.Vq !== 0 || five.Vs !== 0) throw new Error('missing 5-type drivers must be 0');
  assertFiveTypeVariance(five);
  console.log('PASS missing-input → 0');
}

runScenario('samsung-cover');
runScenario('canon-frame');
runScenario('denso-sensor');
missingInputIsZero();

{
  const preset = PRESET_SCENARIOS.find((p) => p.id === 'denso-sensor')!;
  const params = {
    ...preset.params,
    variancePmPercent: 2,
    varianceQmPercent: 1,
    varianceRePercent: 0.5,
    scrapUnits: 3,
  };
  const computed = computeMTO(params);
  const five = computeFiveTypeVariance(params, computed);
  assertFiveTypeVariance(five);
  if (five.TV !== computed.actualCostVariance) {
    throw new Error(`TV ${five.TV} !== actualCostVariance ${computed.actualCostVariance}`);
  }
  console.log(
    `PASS 5-type drivers denso Vp=${five.Vp} Vq=${five.Vq} Vr=${five.Vr} Vs=${five.Vs} Vrem=${five.Vrem} TV=${five.TV}`
  );
}

{
  const locked = canRunCloseStep(EMPTY_CLOSE, 'VA88');
  if (locked.ok) throw new Error('VA88 must not run before MMPV');
  const afterMmpv = canRunCloseStep({ ...EMPTY_CLOSE, MMPV: true, mmPeriodLocked: true }, 'CKMLCP');
  if (!afterMmpv.ok) throw new Error('CKMLCP should run after MMPV');
  const skip = canRunCloseStep({ ...EMPTY_CLOSE, MMPV: true, mmPeriodLocked: true }, 'KKA2');
  if (skip.ok) throw new Error('KKA2 must not skip CKMLCP');
  console.log('PASS close checklist order MMPV→CKMLCP→KKA2');
}

{
  const preset = PRESET_SCENARIOS.find((p) => p.id === 'canon-frame')!;
  const params = { ...preset.params, deliveredQuantity: 1000 };
  const wip = wipStatusOf(params);
  if (wip.teco) throw new Error('half delivery must not be TECO');
  const computed = computeMTO(params);
  const allAcdoca = [];
  for (let step = 1; step <= 7; step++) {
    allAcdoca.push(...generateStepEntries(step, params, computed, 0, 0, null).acdoca);
  }
  const tb = selectTrialBalance(allAcdoca);
  if (!tb.isBalanced) throw new Error('partial NV TB not balanced');
  const step5_632 = allAcdoca.filter((l) => l.stepId === 5 && l.glAccount.startsWith('632'));
  if (step5_632.length) throw new Error('partial NV 632 at step 5');
  const settle632 = allAcdoca
    .filter((l) => l.stepId === 7 && l.glAccount === '632' && l.drAmount > 0)
    .reduce((s, l) => s + l.drAmount, 0);
  const fullActual = computed.plannedCost + computed.actualCostVariance;
  const expected = Math.round(fullActual * 0.5);
  if (settle632 !== expected) throw new Error(`partial NV settle ${settle632} !== ${expected}`);
  const acc154 = tb.items.find((i) => i.accountNumber === '154');
  if (!acc154 || acc154.closingDebit <= 0) throw new Error('partial NV must keep WIP on 154');
  console.log(`PASS M3 WIP NV delivered 1000/2000 settle632=${settle632} wip154=${acc154.closingDebit}`);
}

{
  const preset = PRESET_SCENARIOS.find((p) => p.id === 'samsung-cover')!;
  const computed = computeMTO(preset.params);
  const allAcdoca = [];
  for (let step = 1; step <= 7; step++) {
    allAcdoca.push(...generateStepEntries(step, preset.params, computed, 0, 0, null).acdoca);
  }
  const tb = selectTrialBalance(allAcdoca);
  if (!tb.isBalanced) throw new Error('full valuated after WIP patch TB fail');
  console.log('PASS M3 TECO default still balances');
}

console.log('ALL PARITY CHECKS PASSED');
