import { AcdocaLine, JournalEntry, MTOParameters } from '../types';
import { nz, postDocument, postingDims, selectByAccount } from '../utils/acdoca';

function roundVnd(n: number): number {
  return Math.round(nz(n));
}

export function grirAmounts(params: MTOParameters): {
  grAmt: number;
  miroAmt: number;
  hanging3388: number;
} {
  const grAmt = roundVnd(nz(params.grQtyKg) * nz(params.grPricePerKg));
  const miroAmt = roundVnd(nz(params.miroQtyKg) * nz(params.miroPricePerKg));
  return { grAmt, miroAmt, hanging3388: grAmt - miroAmt };
}

export function postGr(
  ACDOCA_TABLE: AcdocaLine[],
  params: MTOParameters
): { acdoca: AcdocaLine[]; entry: JournalEntry | null } {
  const { grAmt } = grirAmounts(params);
  if (grAmt === 0) return { acdoca: [], entry: null };
  const dims = postingDims(params);
  const lines = postDocument(ACDOCA_TABLE, 2, 'MIGO', '101', [
    { glAccount: '152', drAmount: grAmt, crAmount: 0, ...dims },
    { glAccount: '3388', drAmount: 0, crAmount: grAmt, ...dims },
  ]);
  return {
    acdoca: lines,
    entry: {
      id: lines[0].txnId,
      stepIndex: 2,
      voucherNo: lines[0].txnId,
      docType: 'WE - GR resin',
      postingDate: '15/09/2026',
      tCode: 'MIGO',
      description: 'GR hạt nhựa Dr 152 / Cr 3388 (MÔ PHỎNG GR/IR)',
      debitAccount: '152',
      debitAccountName: 'Nguyên liệu, vật liệu (Hạt nhựa Resin kỹ thuật)',
      creditAccount: '3388',
      creditAccountName: 'Phải trả GR/IR (MÔ PHỎNG — clearing MM)',
      amount: grAmt,
      costObject: dims.kaufn || '',
      note: 'MÔ PHỎNG',
    },
  };
}

export function postMiro(
  ACDOCA_TABLE: AcdocaLine[],
  params: MTOParameters
): { acdoca: AcdocaLine[]; entry: JournalEntry | null } {
  const { miroAmt } = grirAmounts(params);
  if (miroAmt === 0) return { acdoca: [], entry: null };
  const dims = postingDims(params);
  const lines = postDocument(ACDOCA_TABLE, 2, 'MIRO', undefined, [
    { glAccount: '3388', drAmount: miroAmt, crAmount: 0, ...dims },
    { glAccount: '331', drAmount: 0, crAmount: miroAmt, ...dims },
  ]);
  return {
    acdoca: lines,
    entry: {
      id: lines[0].txnId,
      stepIndex: 2,
      voucherNo: lines[0].txnId,
      docType: 'RE - MIRO',
      postingDate: '15/09/2026',
      tCode: 'MIRO',
      description: 'MIRO Dr 3388 / Cr 331 (MÔ PHỎNG)',
      debitAccount: '3388',
      debitAccountName: 'Phải trả GR/IR (MÔ PHỎNG — clearing MM)',
      creditAccount: '331',
      creditAccountName: 'Phải trả cho người bán',
      amount: miroAmt,
      costObject: dims.kaufn || '',
      note: 'MÔ PHỎNG',
    },
  };
}

export function hanging3388(ACDOCA_TABLE: AcdocaLine[]): number {
  const rows = selectByAccount(ACDOCA_TABLE, '3388');
  const cr = rows.reduce((s, l) => s + l.crAmount, 0);
  const dr = rows.reduce((s, l) => s + l.drAmount, 0);
  return cr - dr;
}

/** Clear hanging GR/IR to 152 (stock) or 632 (P&L). */
export function postMr11(
  ACDOCA_TABLE: AcdocaLine[],
  params: MTOParameters,
  offsetAccount: '152' | '632'
): { acdoca: AcdocaLine[]; entry: JournalEntry | null } {
  const hang = hanging3388(ACDOCA_TABLE);
  if (hang === 0) return { acdoca: [], entry: null };
  const dims = postingDims(params);
  const amt = Math.abs(hang);
  const lines =
    hang > 0
      ? postDocument(ACDOCA_TABLE, 7, 'MR11', undefined, [
          { glAccount: '3388', drAmount: amt, crAmount: 0, ...dims },
          { glAccount: offsetAccount, drAmount: 0, crAmount: amt, ...dims },
        ])
      : postDocument(ACDOCA_TABLE, 7, 'MR11', undefined, [
          { glAccount: offsetAccount, drAmount: amt, crAmount: 0, ...dims },
          { glAccount: '3388', drAmount: 0, crAmount: amt, ...dims },
        ]);
  return {
    acdoca: lines,
    entry: {
      id: lines[0].txnId,
      stepIndex: 7,
      voucherNo: lines[0].txnId,
      docType: 'MR11',
      postingDate: '15/09/2026',
      tCode: 'MR11',
      description: `MR11 clear 3388 ↔ ${offsetAccount} (MÔ PHỎNG)`,
      debitAccount: hang > 0 ? '3388' : offsetAccount,
      debitAccountName: hang > 0 ? 'GR/IR' : offsetAccount,
      creditAccount: hang > 0 ? offsetAccount : '3388',
      creditAccountName: hang > 0 ? offsetAccount : 'GR/IR',
      amount: amt,
      costObject: dims.kaufn || '',
      note: 'MÔ PHỎNG',
    },
  };
}
