/**
 * SUP01 — Bảng đối chiếu tổng hợp (Supporting reconciliation) của simulator: KHÔNG phải T-code SAP chuẩn (AUD-014).
 * Mỗi dòng: tổng đọc từ một báo cáo logistics/CO (MB51, COOIS×5, KOB1, KKS1, CK13N) so với tổng tính trực tiếp
 * từ dòng ACDOCA theo TK + mã giao dịch. DIFF ≠ 0 ⇒ STATUS = LECH.
 * Riêng giá kế hoạch (CK13N) không có bút toán khi hàng không định giá/chưa giao → đối chiếu chéo với KKS1/COOIS.
 */
import { roundShare } from '../features/wip';
import type { AcdocaLine } from '../types';
import type { ReportOutput } from './core';
import { ck13nTotals } from './ck13n';
import { cooisTotals } from './coois';
import { kks1Totals } from './kks1';
import { kob1Totals } from './kob1';
import { mb51Totals } from './mb51';
import { col, fmtAmt } from './util';

export interface Sup01Input {
  mb51: ReportOutput;
  header: ReportOutput;
  components: ReportOutput;
  operations: ReportOutput;
  confirmations: ReportOutput;
  goodsMovements: ReportOutput;
  kob1: ReportOutput;
  kks1: ReportOutput;
  ck13n: ReportOutput;
}

type Pred = (l: AcdocaLine) => boolean;
const dr = (t: AcdocaLine[], p: Pred) => t.filter(p).reduce((s, l) => s + l.drAmount, 0);
const cr = (t: AcdocaLine[], p: Pred) => t.filter(p).reduce((s, l) => s + l.crAmount, 0);
const acc = (a: string, tc?: (t: string) => boolean): Pred => (l) => l.glAccount === a && (!tc || tc(l.tCode || ''));
const has = (s: string) => (t: string) => t.includes(s);

/** Tổng FI dùng chung cho SUP01 (định nghĩa trong GIAODICH_TT99.md, mục SUP01). */
export function fiFigures(t: AcdocaLine[]) {
  return {
    cr152_261: cr(t, acc('152', has('261E'))) - dr(t, acc('152', has('261E'))),
    dr155_101: dr(t, acc('155', has('101E'))),
    cr155_601: cr(t, acc('155', has('601E'))),
    dr622_co11n: dr(t, acc('622', (x) => x === 'CO11N')),
    dr627_co11n: dr(t, acc('627', (x) => x === 'CO11N')),
    dr154_co01: dr(t, acc('154', (x) => x === 'CO01')),
    dr62x_primary: ['621', '622', '627'].reduce((s, a) => s + dr(t, acc(a, (x) => x !== 'CO01')), 0),
    bal154: dr(t, acc('154')) - cr(t, acc('154')),
  };
}

export const SUP01_COLUMNS = [
  { field: 'CHECK', label: 'Check' },
  { field: 'REPORT', label: 'Source Report' },
  { field: 'METRIC', label: 'Metric' },
  { field: 'FI_RULE', label: 'ACDOCA Rule' },
  { field: 'REPORT_VAL', label: 'Report Value' },
  { field: 'FI_VAL', label: 'ACDOCA Value' },
  { field: 'DIFF', label: 'Difference' },
  { field: 'STATUS', label: 'Status' },
] as const;

export function buildSup01(r: Sup01Input, table: AcdocaLine[]): ReportOutput {
  const fi = fiFigures(table);
  const mb = mb51Totals(r.mb51);
  const hd = cooisTotals.header(r.header);
  const gm = cooisTotals.goodsMovements(r.goodsMovements);
  const cf = cooisTotals.confirmations(r.confirmations);
  const kb = kob1Totals(r.kob1);
  const ks = kks1Totals(r.kks1);
  const ck = ck13nTotals(r.ck13n);
  const valuated = r.header.rows[0][col(r.header, 'KZBWS')] === 'M';
  const ratio = hd.wemng > 0 && ck.lotSize > 0 ? Math.min(1, hd.wemng / ck.lotSize) : 0;

  const checks: [string, string, string, number, number][] = [
    ['MB51', 'Σ DMBTR BWART 261', 'Có 152 (MIGO 261E)', mb.v261, fi.cr152_261],
    ['MB51', 'Σ DMBTR BWART 101', 'Nợ 155 (MIGO 101E)', mb.v101, fi.dr155_101],
    ['MB51', 'Σ DMBTR BWART 601', 'Có 155 (MIGO 601E)', mb.v601, fi.cr155_601],
    ['COOIS_HEADER', 'ACT_COST', 'Nợ 154 (CO01)', hd.actCost, fi.dr154_co01],
    ['COOIS_COMPONENTS', 'Σ ACT_VAL', 'Có 152 (MIGO 261E)', cooisTotals.components(r.components).actVal, fi.cr152_261],
    ['COOIS_OPERATIONS', 'Σ ACT_COST', 'Nợ 622 + Nợ 627 (CO11N)', cooisTotals.operations(r.operations).actCost, fi.dr622_co11n + fi.dr627_co11n],
    ['COOIS_CONFIRMATIONS', 'Σ LAB_VAL', 'Nợ 622 (CO11N)', cf.labVal, fi.dr622_co11n],
    ['COOIS_CONFIRMATIONS', 'Σ MOH_VAL', 'Nợ 627 (CO11N)', cf.mohVal, fi.dr627_co11n],
    ['COOIS_GOODSMVT', 'Σ DMBTR BWART 261', 'Có 152 (MIGO 261E)', gm.v261, fi.cr152_261],
    ['COOIS_GOODSMVT', 'Σ DMBTR BWART 101', 'Nợ 155 (MIGO 101E)', gm.v101, fi.dr155_101],
    ['KOB1', 'Σ WKGBTR KSTAR 621/622/627', 'Nợ 621+622+627 (trừ CO01)', kb.debitCosts, fi.dr62x_primary],
    ['KOB1', 'Σ WKGBTR', 'Số dư Nợ 154', kb.balance, fi.bal154],
    ['KKS1', 'Σ ACTUAL', 'Nợ 154 (CO01)', ks.actual, fi.dr154_co01],
    ['KKS1', 'Σ WIP', 'Số dư Nợ 154', ks.wip, fi.bal154],
    // Giá kế hoạch không có bút toán FI khi hàng không định giá / chưa giao: đối chiếu chéo giữa các báo cáo
    ['CK13N', 'Σ WERT', 'KKS1 Σ PLAN (không có FI)', ck.total, ks.plan],
    ['CK13N', 'Σ WERT', 'COOIS_HEADER PLAN_COST (không có FI)', ck.total, hd.planCost],
  ];
  if (valuated) {
    checks.push(['KKS1', 'Σ TARGET', 'Nợ 155 (MIGO 101E)', ks.target, fi.dr155_101]);
    checks.push(['CK13N', 'Σ WERT × WEMNG/LOSGR', 'Nợ 155 (MIGO 101E)', roundShare(ck.total, ratio), fi.dr155_101]);
  }
  const rows = checks.map(([rep, metric, rule, rv, fv], i) => {
    const diff = rv - fv;
    return [String(i + 1).padStart(3, '0'), rep, metric, rule, fmtAmt(rv), fmtAmt(fv), fmtAmt(diff), diff === 0 ? 'OK' : 'LECH'];
  });
  return {
    reportId: 'SUP01',
    title: 'Supporting Reconciliation Logistics/CO ↔ ACDOCA (SUP01, SIM)',
    columns: SUP01_COLUMNS.map((c) => ({ field: c.field, label: c.label })),
    rows,
  };
}

export function sup01Breaks(r: ReportOutput): string[] {
  return r.rows
    .filter((row) => row[col(r, 'STATUS')] !== 'OK' || Number(row[col(r, 'DIFF')]) !== 0)
    .map((row) => `${row[col(r, 'REPORT')]} ${row[col(r, 'METRIC')]}: ${row[col(r, 'REPORT_VAL')]} ≠ ${row[col(r, 'FI_VAL')]}`);
}
