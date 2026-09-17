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
import { mdgGateOpen } from '../src/features/mdg.ts';
import { canRoleRunStep } from '../src/features/sod.ts';
import { postCkmlcp, usdOf } from '../src/features/materialLedger.ts';
import { grirAmounts, hanging3388, postGr, postMiro, postMr11 } from '../src/features/grir.ts';
import { postIntercompany, icAmounts } from '../src/features/intercompany.ts';

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

{
  const blocked = mdgGateOpen({ ...PRESET_SCENARIOS[0].params, mdgMaterialApproved: false });
  if (blocked.ok) throw new Error('MDG must block when material unapproved');
  const open = mdgGateOpen(PRESET_SCENARIOS[0].params);
  if (!open.ok) throw new Error('preset MDG should be approved');
  console.log('PASS M4 MDG gate');
}

{
  if (canRoleRunStep('Sales', 7).ok) throw new Error('Sales must not VA88');
  if (!canRoleRunStep('Kế toán trưởng', 7).ok) throw new Error('Controller must VA88');
  if (canRoleRunStep('Kho', 1).ok) throw new Error('Kho must not VA01');
  console.log('PASS M5 SoD roles');
}

{
  const preset = PRESET_SCENARIOS.find((p) => p.id === 'denso-sensor')!;
  const computed = computeMTO(preset.params);
  const allAcdoca = [];
  for (let s = 1; s <= 5; s++) {
    allAcdoca.push(...generateStepEntries(s, preset.params, computed, 0, 0, null).acdoca);
  }
  const before = allAcdoca.length;
  postCkmlcp(allAcdoca, preset.params, computed, 0);
  const tb = selectTrialBalance(allAcdoca);
  if (!tb.isBalanced) throw new Error('CKMLCP TB not balanced');
  if (usdOf(100000, 0) !== 0) throw new Error('missing FX rate must display 0');
  if (computed.actualCostVariance === 0) throw new Error('denso must have production variance');
  console.log(`PASS M6 CKMLCP after PGI lines ${before}->${allAcdoca.length} TB Dr=${tb.totalDebitTurnover}`);
}

{
  const preset = PRESET_SCENARIOS.find((p) => p.id === 'samsung-cover')!;
  const params = { ...preset.params, grQtyKg: 10, grPricePerKg: 1000, miroQtyKg: 10, miroPricePerKg: 900 };
  const amts = grirAmounts(params);
  if (amts.hanging3388 !== 1000) throw new Error(`expected hang 1000 got ${amts.hanging3388}`);
  const table = [];
  postGr(table, params);
  postMiro(table, params);
  if (hanging3388(table) !== 1000) throw new Error('3388 hang after GR/MIRO');
  postMr11(table, params, '632');
  if (hanging3388(table) !== 0) throw new Error('MR11 must clear 3388');
  const tb = selectTrialBalance(table);
  if (!tb.isBalanced) throw new Error('GR/IR TB not balanced');
  const zero = grirAmounts({ ...preset.params });
  if (zero.grAmt !== 0 || zero.miroAmt !== 0) throw new Error('missing GR/IR inputs must be 0');
  console.log('PASS M7 GR/IR MR11');
}

{
  const preset = PRESET_SCENARIOS.find((p) => p.id === 'samsung-cover')!;
  const computed = computeMTO(preset.params);
  const params = { ...preset.params, intercompanyMto: true, icMarkupPercent: 10 };
  const amts = icAmounts(params, computed);
  const table = [];
  postIntercompany(table, params, computed);
  const tb = selectTrialBalance(table);
  if (!tb.isBalanced) throw new Error('IC TB not balanced');
  if (amts.unrealized !== Math.round(computed.plannedCost * 0.1)) {
    throw new Error(`UIP ${amts.unrealized}`);
  }
  const off = postIntercompany([], { ...preset.params, intercompanyMto: false }, computed);
  if (off.length) throw new Error('IC off must not post');
  console.log(`PASS M8 IC markup10 UIP=${amts.unrealized}`);
}

console.log('ALL PARITY CHECKS PASSED');
