import {
  AcdocaLine,
  AcdocaPostingLine,
  CogsSplitResult,
  JournalEntry,
  MarginAnalysisResult,
  MTOComputed,
  MTOParameters,
  TrialBalanceItem,
  TrialBalanceResult,
} from '../types';

/** Missing / non-numeric input → 0. Never invent random figures. */
export function nz(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

const ACCOUNT_NAMES: Record<string, string> = {
  '131': 'Phải thu của khách hàng',
  '152': 'Nguyên liệu, vật liệu (Hạt nhựa Resin kỹ thuật)',
  '154': 'Chi phí sản xuất, kinh doanh dở dang (Lệnh SX/Sales Order MTO)',
  '155': 'Thành phẩm (Special Stock E)',
  '214': 'Hao mòn tài sản cố định (Khấu hao máy ép phun & khuôn)',
  '331': 'Phải trả cho người bán',
  '334': 'Phải trả người lao động (Tiền lương công nhân xưởng ép)',
  '3331': 'Thuế GTGT đầu ra phải nộp (10%)',
  '511': 'Doanh thu bán hàng và cung cấp dịch vụ',
  '621': 'Chi phí nguyên liệu, vật liệu trực tiếp',
  '622': 'Chi phí nhân công trực tiếp',
  '627': 'Chi phí sản xuất chung (Khấu hao máy & điện năng)',
  '632': 'Giá vốn hàng bán (Cost of Goods Sold)',
  '632110': 'TK chi tiết quản trị — COGS Vật liệu',
  '632120': 'TK chi tiết quản trị — COGS Nhân công',
  '632130': 'TK chi tiết quản trị — COGS Máy & KH',
  '632140': 'TK chi tiết quản trị — COGS SXC',
  '911': 'Xác định kết quả kinh doanh',
};

export function accountNameOf(glAccount: string, fallback?: string): string {
  return fallback || ACCOUNT_NAMES[glAccount] || `Tài khoản ${glAccount}`;
}

function nextTxnId(table: AcdocaLine[], stepId: number): string {
  const prefix = `S${stepId}-`;
  let max = 0;
  for (const row of table) {
    if (!String(row.txnId).startsWith(prefix)) continue;
    const n = Number(String(row.txnId).slice(prefix.length).replace(/\D/g, ''));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

function roundVnd(n: number): number {
  return Math.round(nz(n));
}

/**
 * Pure Universal Journal poster.
 * Assigns txnId / lineId. If Σdr ≠ Σcr throws and does not write.
 */
export function postDocument(
  ACDOCA_TABLE: AcdocaLine[],
  stepId: number,
  tCode: string,
  movementType: string | undefined,
  lines: AcdocaPostingLine[]
): AcdocaLine[] {
  const prepared = (lines || []).map((line) => {
    const dr = roundVnd(line.drAmount);
    const cr = roundVnd(line.crAmount);
    return {
      ...line,
      drAmount: dr,
      crAmount: cr,
      glAccount: line.glAccount || '',
      accountName: accountNameOf(line.glAccount, line.accountName),
    };
  });

  const sumDr = prepared.reduce((s, l) => s + l.drAmount, 0);
  const sumCr = prepared.reduce((s, l) => s + l.crAmount, 0);
  if (sumDr !== sumCr) {
    throw new Error(
      `ACDOCA document unbalanced (step ${stepId} ${tCode}): Σdr=${sumDr} ≠ Σcr=${sumCr}`
    );
  }

  const txnId = nextTxnId(ACDOCA_TABLE, stepId);
  const timestamp = new Date().toISOString();
  const written: AcdocaLine[] = prepared.map((line, idx) => ({
    txnId,
    lineId: `${txnId}-${String(idx + 1).padStart(3, '0')}`,
    stepId,
    tCode,
    movementType,
    glAccount: line.glAccount,
    accountName: line.accountName,
    drAmount: line.drAmount,
    crAmount: line.crAmount,
    kaufn: line.kaufn,
    kposn: line.kposn,
    kunnr: line.kunnr,
    matnr: line.matnr,
    werks: line.werks,
    prctr: line.prctr,
    kostl: line.kostl,
    valuationView: 'legal',
    currency: 'VND',
    timestamp,
  }));

  ACDOCA_TABLE.push(...written);
  return written;
}

export function inferMovementType(tCode: string): string | undefined {
  const t = tCode || '';
  if (t.includes('261E')) return '261E';
  if (t.includes('101E')) return '101E';
  if (t.includes('601E')) return '601E';
  if (t.includes('321E')) return '321E';
  if (t.includes('350E')) return '350E';
  return undefined;
}

export function postingDims(params: MTOParameters): Pick<
  AcdocaPostingLine,
  'kaufn' | 'kposn' | 'kunnr' | 'matnr' | 'werks' | 'prctr' | 'kostl'
> {
  return {
    kaufn: 'SO-PIC-2026-49281',
    kposn: '000010',
    kunnr: params.customer,
    matnr: params.componentCode,
    werks: 'PIC1',
    prctr: 'PC-MTO',
    kostl: params.routing?.workCenterCode || 'WC-INJ-01',
  };
}

/** Two-sided voucher → one balanced ACDOCA document. */
export function postJournalVoucher(
  ACDOCA_TABLE: AcdocaLine[],
  entry: JournalEntry,
  params: MTOParameters,
  movementType?: string
): void {
  const amount = roundVnd(entry.amount);
  if (amount === 0 && nz(entry.amount) === 0) {
    // Zero is a valid silent no-op document only when both sides are 0 — skip write.
    return;
  }
  const dims = postingDims(params);
  postDocument(ACDOCA_TABLE, entry.stepIndex, entry.tCode, movementType ?? inferMovementType(entry.tCode), [
    {
      glAccount: entry.debitAccount,
      accountName: entry.debitAccountName,
      drAmount: amount,
      crAmount: 0,
      ...dims,
    },
    {
      glAccount: entry.creditAccount,
      accountName: entry.creditAccountName,
      drAmount: 0,
      crAmount: amount,
      ...dims,
    },
  ]);
}

export function rebuildAcdocaFromJournal(
  entries: JournalEntry[],
  params: MTOParameters
): AcdocaLine[] {
  const ACDOCA_TABLE: AcdocaLine[] = [];
  for (const e of entries) {
    postJournalVoucher(ACDOCA_TABLE, e, params);
  }
  return ACDOCA_TABLE;
}

export function selectGLLedger(ACDOCA_TABLE: AcdocaLine[]): AcdocaLine[] {
  return [...ACDOCA_TABLE].sort((a, b) => {
    if (a.txnId === b.txnId) return a.lineId.localeCompare(b.lineId);
    return a.txnId.localeCompare(b.txnId);
  });
}

export function selectByAccount(ACDOCA_TABLE: AcdocaLine[], acc: string): AcdocaLine[] {
  return selectGLLedger(ACDOCA_TABLE).filter((l) => l.glAccount === acc);
}

function netTurnover(ACDOCA_TABLE: AcdocaLine[], accPrefixOrExact: string, mode: 'prefix' | 'exact' = 'exact') {
  let dr = 0;
  let cr = 0;
  for (const l of ACDOCA_TABLE) {
    const match =
      mode === 'prefix' ? l.glAccount.startsWith(accPrefixOrExact) : l.glAccount === accPrefixOrExact;
    if (!match) continue;
    dr += nz(l.drAmount);
    cr += nz(l.crAmount);
  }
  return { dr, cr, netDr: dr - cr };
}

export function selectTrialBalance(ACDOCA_TABLE: AcdocaLine[]): TrialBalanceResult {
  const accountMap: Record<string, { name: string; debit: number; credit: number }> = {};

  for (const l of ACDOCA_TABLE) {
    if (!accountMap[l.glAccount]) {
      accountMap[l.glAccount] = {
        name: accountNameOf(l.glAccount, l.accountName),
        debit: 0,
        credit: 0,
      };
    }
    accountMap[l.glAccount].debit += nz(l.drAmount);
    accountMap[l.glAccount].credit += nz(l.crAmount);
  }

  const sortedAccounts = Object.keys(accountMap).sort((a, b) => a.localeCompare(b));

  const items: TrialBalanceItem[] = sortedAccounts.map((acc) => {
    const data = accountMap[acc];
    const debit = data.debit;
    const credit = data.credit;

    let closingDebit = 0;
    let closingCredit = 0;
    let accountType: TrialBalanceItem['accountType'] = 'clearing';

    if (acc.startsWith('1') || acc.startsWith('2')) {
      accountType = 'asset';
      if (acc === '214') {
        accountType = 'liability';
        closingCredit = Math.max(0, credit - debit);
        closingDebit = Math.max(0, debit - credit);
      } else {
        const net = debit - credit;
        if (net >= 0) {
          closingDebit = net;
        } else {
          closingCredit = -net;
        }
      }
    } else if (acc.startsWith('3') || acc.startsWith('4')) {
      accountType = 'liability';
      const net = credit - debit;
      if (net >= 0) {
        closingCredit = net;
      } else {
        closingDebit = -net;
      }
    } else if (acc.startsWith('5') || acc.startsWith('7')) {
      accountType = 'revenue';
      const net = credit - debit;
      if (net >= 0) {
        closingCredit = net;
      } else {
        closingDebit = -net;
      }
    } else if (acc.startsWith('6') || acc.startsWith('8')) {
      accountType = 'expense';
      const net = debit - credit;
      if (net >= 0) {
        closingDebit = net;
      } else {
        closingCredit = -net;
      }
    } else if (acc === '911') {
      accountType = 'clearing';
      const net = credit - debit;
      if (net >= 0) {
        closingCredit = net;
      } else {
        closingDebit = -net;
      }
    }

    return {
      accountNumber: acc,
      accountName: data.name,
      openingDebit: 0,
      openingCredit: 0,
      debitTurnover: debit,
      creditTurnover: credit,
      closingDebit,
      closingCredit,
      accountType,
    };
  });

  const totalDebitTurnover = items.reduce((s, i) => s + i.debitTurnover, 0);
  const totalCreditTurnover = items.reduce((s, i) => s + i.creditTurnover, 0);
  const totalClosingDebit = items.reduce((s, i) => s + i.closingDebit, 0);
  const totalClosingCredit = items.reduce((s, i) => s + i.closingCredit, 0);

  return {
    items,
    totalDebitTurnover,
    totalCreditTurnover,
    totalClosingDebit,
    totalClosingCredit,
    isBalanced: totalDebitTurnover === totalCreditTurnover && totalClosingDebit === totalClosingCredit,
  };
}

/**
 * Pair ACDOCA documents back to the voucher grid (one Dr account / one Cr account / amount).
 * Two-line docs → one row. Multi-line COGS split → one row per debit vs the document credit.
 * Display-only: Trial Balance must use selectTrialBalance, never this mapping.
 */
export function selectGLLedgerAsJournal(ACDOCA_TABLE: AcdocaLine[]): JournalEntry[] {
  const byTxn = new Map<string, AcdocaLine[]>();
  for (const line of selectGLLedger(ACDOCA_TABLE)) {
    const list = byTxn.get(line.txnId) || [];
    list.push(line);
    byTxn.set(line.txnId, list);
  }

  const entries: JournalEntry[] = [];
  for (const [txnId, lines] of byTxn) {
    const drLines = lines.filter((l) => nz(l.drAmount) > 0);
    const crLines = lines.filter((l) => nz(l.crAmount) > 0);
    const stepId = lines[0].stepId;
    const tCode = lines[0].tCode;
    const postingDate = '15/09/2026';

    if (drLines.length === 1 && crLines.length === 1) {
      entries.push({
        id: txnId,
        stepIndex: stepId,
        voucherNo: txnId,
        docType: tCode,
        postingDate,
        tCode,
        description: `${drLines[0].accountName} / ${crLines[0].accountName}`,
        debitAccount: drLines[0].glAccount,
        debitAccountName: drLines[0].accountName,
        creditAccount: crLines[0].glAccount,
        creditAccountName: crLines[0].accountName,
        amount: nz(drLines[0].drAmount),
        costObject: drLines[0].kaufn || '',
        note: drLines[0].movementType ? `Movement ${drLines[0].movementType}` : '',
      });
      continue;
    }

    const primaryCr = crLines[0];
    for (const dr of drLines) {
      entries.push({
        id: dr.lineId,
        stepIndex: stepId,
        voucherNo: txnId,
        docType: tCode,
        postingDate,
        tCode,
        description: dr.accountName,
        debitAccount: dr.glAccount,
        debitAccountName: dr.accountName,
        creditAccount: primaryCr?.glAccount || '',
        creditAccountName: primaryCr?.accountName || '',
        amount: nz(dr.drAmount),
        costObject: dr.kaufn || '',
        note: dr.glAccount.startsWith('6321')
          ? 'TK chi tiết quản trị (không phải mã luật định)'
          : dr.movementType
            ? `Movement ${dr.movementType}`
            : '',
      });
    }
  }
  return entries;
}

export function assertParity(
  oldEntries: JournalEntry[],
  ACDOCA_TABLE: AcdocaLine[],
  label: string
): void {
  const oldMap: Record<string, { dr: number; cr: number }> = {};
  const bump = (map: Record<string, { dr: number; cr: number }>, acc: string, dr: number, cr: number) => {
    if (!map[acc]) map[acc] = { dr: 0, cr: 0 };
    map[acc].dr += dr;
    map[acc].cr += cr;
  };
  for (const e of oldEntries) {
    const amt = roundVnd(e.amount);
    bump(oldMap, e.debitAccount, amt, 0);
    bump(oldMap, e.creditAccount, 0, amt);
  }

  const newMap: Record<string, { dr: number; cr: number }> = {};
  for (const l of ACDOCA_TABLE) {
    bump(newMap, l.glAccount, roundVnd(l.drAmount), roundVnd(l.crAmount));
  }

  // Map management COGS split back to statutory 632 for comparison with the old ledger.
  const fold632 = (map: Record<string, { dr: number; cr: number }>) => {
    const out: Record<string, { dr: number; cr: number }> = {};
    for (const [acc, v] of Object.entries(map)) {
      const key = acc.startsWith('632') ? '632' : acc;
      if (!out[key]) out[key] = { dr: 0, cr: 0 };
      out[key].dr += v.dr;
      out[key].cr += v.cr;
    }
    return out;
  };

  const a = fold632(oldMap);
  const b = fold632(newMap);
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort();
  const mismatches: string[] = [];
  for (const k of keys) {
    const left = a[k] || { dr: 0, cr: 0 };
    const right = b[k] || { dr: 0, cr: 0 };
    if (left.dr !== right.dr || left.cr !== right.cr) {
      mismatches.push(`${k} old Dr/Cr=${left.dr}/${left.cr} acdoca Dr/Cr=${right.dr}/${right.cr}`);
    }
  }
  if (mismatches.length) {
    throw new Error(`PARITY FAIL (${label}):\n${mismatches.join('\n')}`);
  }
}

/** CK11N cost-component weights → PGI COGS split (VND integers, remainder on last bucket). */
export function splitCogsByCk11n(computed: MTOComputed, totalCogs: number): CogsSplitResult {
  const total = roundVnd(totalCogs);
  const wVL = nz(computed.directMaterialCost621);
  const wNC = nz(computed.directLaborCost622);
  const wMay = nz(computed.machineOverhead627);
  const wSXC = nz(computed.factoryOverhead627) + nz(computed.variantAddonTotal);
  const wSum = wVL + wNC + wMay + wSXC;

  const rVL = wSum > 0 ? wVL / wSum : 0;
  const rNC = wSum > 0 ? wNC / wSum : 0;
  const rMay = wSum > 0 ? wMay / wSum : 0;
  const rSXC = wSum > 0 ? wSXC / wSum : 0;

  if (total === 0 || wSum === 0) {
    return {
      totalCogs: total,
      rVL,
      rNC,
      rMay,
      rSXC,
      amtVL: 0,
      amtNC: 0,
      amtMay: 0,
      amtSXC: 0,
      sumSplit: 0,
      balanced: true,
    };
  }

  const raw = [rVL, rNC, rMay, rSXC].map((r) => r * total);
  const floors = raw.map((x) => Math.floor(x));
  let remain = total - floors.reduce((s, n) => s + n, 0);
  const order = raw
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (let k = 0; k < remain; k++) {
    out[order[k].i] += 1;
  }

  const [amtVL, amtNC, amtMay, amtSXC] = out;
  const sumSplit = amtVL + amtNC + amtMay + amtSXC;
  const balanced = Math.abs(sumSplit - total) <= 1;

  return {
    totalCogs: total,
    rVL,
    rNC,
    rMay,
    rSXC,
    amtVL,
    amtNC,
    amtMay,
    amtSXC,
    sumSplit,
    balanced,
  };
}

export function assertCogsSplit(split: CogsSplitResult): void {
  if (!split.balanced || split.sumSplit !== split.totalCogs) {
    throw new Error(
      `COGS split ASSERT fail: 632110+120+130+140=${split.sumSplit} vs Cr155=${split.totalCogs}`
    );
  }
}

function txnHasAccount(lines: AcdocaLine[], acc: string): boolean {
  return lines.some((l) => l.glAccount === acc);
}

export function selectMarginAnalysis(
  ACDOCA_TABLE: AcdocaLine[],
  orderCardGrossProfit?: number
): MarginAnalysisResult {
  const byTxn = new Map<string, AcdocaLine[]>();
  for (const line of ACDOCA_TABLE) {
    const list = byTxn.get(line.txnId) || [];
    list.push(line);
    byTxn.set(line.txnId, list);
  }

  let revenue511 = 0;
  let cogs632110 = 0;
  let cogs632120 = 0;
  let cogs632130 = 0;
  let cogs632140 = 0;
  let pgiStatutory632 = 0;
  let va88Cogs632 = 0;
  let settledVariance = 0;

  for (const lines of byTxn.values()) {
    const isSettlement = txnHasAccount(lines, '911');
    const addDr = (acc: string) =>
      lines.filter((l) => l.glAccount === acc).reduce((s, l) => s + nz(l.drAmount), 0);
    const addCr = (acc: string) =>
      lines.filter((l) => l.glAccount === acc).reduce((s, l) => s + nz(l.crAmount), 0);

    if (!isSettlement && txnHasAccount(lines, '511')) {
      revenue511 += addCr('511');
    }
    if (!isSettlement) {
      cogs632110 += addDr('632110');
      cogs632120 += addDr('632120');
      cogs632130 += addDr('632130');
      cogs632140 += addDr('632140');
      if (txnHasAccount(lines, '155') || (lines[0] && lines[0].stepId === 5)) {
        pgiStatutory632 += addDr('632');
      }
      if (lines[0]?.stepId === 7) {
        va88Cogs632 += addDr('632');
        settledVariance += addDr('632') - addCr('632');
      }
    }
  }

  const cogsSplitTotal = cogs632110 + cogs632120 + cogs632130 + cogs632140;
  const standardCogs = cogsSplitTotal > 0 ? cogsSplitTotal : pgiStatutory632;
  const actualCogsFinal =
    cogsSplitTotal > 0
      ? cogsSplitTotal + settledVariance
      : pgiStatutory632 > 0
        ? pgiStatutory632 + settledVariance
        : va88Cogs632;

  const standardGrossProfit = revenue511 - (cogsSplitTotal > 0 ? cogsSplitTotal : pgiStatutory632);
  const actualGrossProfit = revenue511 - actualCogsFinal;
  const actualMarginPercent =
    revenue511 > 0 ? Number(((actualGrossProfit / revenue511) * 100).toFixed(2)) : 0;
  const orderGp = nz(orderCardGrossProfit);
  const matchesOrderCard = orderCardGrossProfit === undefined || actualGrossProfit === orderGp;

  return {
    revenue511,
    cogs632110,
    cogs632120,
    cogs632130,
    cogs632140,
    cogsSplitTotal,
    cogsStatutory632: pgiStatutory632 + va88Cogs632,
    settledVariance,
    standardGrossProfit,
    actualGrossProfit,
    actualMarginPercent,
    orderCardGrossProfit: orderGp,
    matchesOrderCard,
  };
}

export { ACCOUNT_NAMES };
