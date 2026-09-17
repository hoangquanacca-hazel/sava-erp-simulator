import { MTOComputed, MTOParameters } from '../types';
import { nz } from '../utils/acdoca';

function roundVnd(n: number): number {
  return Math.round(nz(n));
}

/** CO-PA 5-type production variance. Display only — FI still posts net TV to 632 at VA88. */
export interface FiveTypeVariance {
  SM: number;
  SL: number;
  SO: number;
  pmPercent: number;
  qmPercent: number;
  rePercent: number;
  scrapUnits: number;
  unitCostC: number;
  stdCost: number;
  actualCost: number;
  Vp: number;
  Vq: number;
  Vr: number;
  Vs: number;
  Vrem: number;
  TV: number;
  balanced: boolean;
}

export function computeFiveTypeVariance(params: MTOParameters, computed: MTOComputed): FiveTypeVariance {
  const SM = roundVnd(computed.directMaterialCost621);
  const SL = roundVnd(computed.directLaborCost622);
  const SO = roundVnd(computed.totalOverhead627) + roundVnd(computed.variantAddonTotal);
  const pmPercent = nz(params.variancePmPercent);
  const qmPercent = nz(params.varianceQmPercent);
  const rePercent = nz(params.varianceRePercent);
  const scrapUnits = nz(params.scrapUnits);
  const unitCostC = roundVnd(computed.unitPlannedCost);
  const stdCost = roundVnd(computed.plannedCost);
  const actualCost = roundVnd(computed.actualCostBeforeRework);
  const TV = roundVnd(actualCost - stdCost);

  const Vp = roundVnd(SM * (pmPercent / 100));
  const Vq = roundVnd(SM * (qmPercent / 100));
  const Vr = roundVnd((SL + SO) * (rePercent / 100));
  const Vs = roundVnd(unitCostC * scrapUnits);
  const Vrem = TV - (Vp + Vq + Vr + Vs);

  return {
    SM,
    SL,
    SO,
    pmPercent,
    qmPercent,
    rePercent,
    scrapUnits,
    unitCostC,
    stdCost,
    actualCost,
    Vp,
    Vq,
    Vr,
    Vs,
    Vrem,
    TV,
    balanced: Vp + Vq + Vr + Vs + Vrem === TV,
  };
}

export function assertFiveTypeVariance(v: FiveTypeVariance): void {
  if (!v.balanced || v.Vp + v.Vq + v.Vr + v.Vs + v.Vrem !== v.TV) {
    throw new Error(
      `5-type variance ASSERT fail: Vp+Vq+Vr+Vs+Vrem=${v.Vp + v.Vq + v.Vr + v.Vs + v.Vrem} vs TV=${v.TV}`
    );
  }
}

export interface WaterfallBar {
  name: string;
  invisible: number;
  value: number;
  fill: string;
  signed: number;
}

/** STD → 5 types → Actual waterfall (invisible base + signed delta). */
export function buildVarianceWaterfall(v: FiveTypeVariance): WaterfallBar[] {
  const steps: Array<{ name: string; signed: number; fill: string }> = [
    { name: 'STD', signed: v.stdCost, fill: '#22d3ee' },
    { name: 'Vp giá NVL', signed: v.Vp, fill: '#f97316' },
    { name: 'Vq SL NVL', signed: v.Vq, fill: '#eab308' },
    { name: 'Vr nguồn lực', signed: v.Vr, fill: '#a855f7' },
    { name: 'Vs phế phẩm', signed: v.Vs, fill: '#f43f5e' },
    { name: 'Vrem còn lại', signed: v.Vrem, fill: '#64748b' },
    { name: 'Actual', signed: v.actualCost, fill: '#34d399' },
  ];

  let running = 0;
  return steps.map((s, i) => {
    if (i === 0 || i === steps.length - 1) {
      const bar: WaterfallBar = {
        name: s.name,
        invisible: 0,
        value: Math.abs(s.signed),
        fill: s.fill,
        signed: s.signed,
      };
      running = i === 0 ? s.signed : running;
      return bar;
    }
    const start = running;
    running += s.signed;
    const invisible = s.signed >= 0 ? start : start + s.signed;
    return {
      name: s.name,
      invisible: Math.max(0, invisible),
      value: Math.abs(s.signed),
      fill: s.fill,
      signed: s.signed,
    };
  });
}
