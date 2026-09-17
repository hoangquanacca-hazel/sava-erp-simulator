import { AcdocaLine, MTOComputed, MTOParameters } from '../types';
import { nz, postDocument, postingDims, selectTrialBalance } from '../utils/acdoca';

export const USD_RATE_LABEL = 'Tỷ giá USD minh họa (1 USD) — không phải tỷ giá thật';

export function usdOf(vnd: number, rate: number): number {
  const r = nz(rate);
  if (r === 0) return 0;
  return Number((nz(vnd) / r).toFixed(2));
}

function roundVnd(n: number): number {
  return Math.round(nz(n));
}

/** CKMLCP: legal book VND only. Skip production var if VA88 already posted it. */
export function postCkmlcp(
  ACDOCA_TABLE: AcdocaLine[],
  params: MTOParameters,
  computed: MTOComputed,
  purchaseVariance: number
): AcdocaLine[] {
  const va88VarPosted = ACDOCA_TABLE.some(
    (l) => (l.tCode || '').includes('VA88') && l.glAccount === '632' && l.stepId === 7
  );
  const prod = va88VarPosted ? 0 : roundVnd(computed.actualCostVariance);
  const purch = roundVnd(purchaseVariance);
  const total = prod + purch;
  if (total === 0) return [];

  const tb = selectTrialBalance(ACDOCA_TABLE);
  const acc155 = tb.items.find((i) => i.accountNumber === '155');
  const invNet = acc155 ? acc155.closingDebit : 0;

  let invAmt = 0;
  let cogsAmt = 0;
  if (total > 0) {
    invAmt = Math.min(invNet, total);
    cogsAmt = total - invAmt;
  } else {
    const abs = Math.abs(total);
    invAmt = -Math.min(invNet, abs);
    cogsAmt = total - invAmt;
  }

  const dims = postingDims(params);
  const lines = [];
  if (invAmt > 0) {
    lines.push({ glAccount: '155', drAmount: invAmt, crAmount: 0, ...dims });
  } else if (invAmt < 0) {
    lines.push({ glAccount: '155', drAmount: 0, crAmount: Math.abs(invAmt), ...dims });
  }
  if (cogsAmt > 0) {
    lines.push({ glAccount: '632', drAmount: cogsAmt, crAmount: 0, ...dims });
  } else if (cogsAmt < 0) {
    lines.push({ glAccount: '632', drAmount: 0, crAmount: Math.abs(cogsAmt), ...dims });
  }
  if (total > 0) {
    lines.push({ glAccount: '154', drAmount: 0, crAmount: total, ...dims });
  } else {
    lines.push({ glAccount: '154', drAmount: Math.abs(total), crAmount: 0, ...dims });
  }

  return postDocument(ACDOCA_TABLE, 7, 'CKMLCP', undefined, lines);
}
