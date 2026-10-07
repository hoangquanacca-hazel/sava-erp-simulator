/** FAGLL03 (G/L line items) — bố cục MÔ PHỎNG theo trường ACDOCA. */
import { SIM_CONFIG } from '../config/simConfig';
import type { AcdocaLine } from '../types';
import { documentNumbers, fiscalYearOf, periodOf, postingDateOf, type ReportOutput } from './core';

export const FAGLL03_COLUMNS = [
  { field: 'RLDNR', label: 'Ledger' },
  { field: 'RBUKRS', label: 'Company Code' },
  { field: 'GJAHR', label: 'Fiscal Year' },
  { field: 'BELNR', label: 'Document Number' },
  { field: 'DOCLN', label: 'Line Item' },
  { field: 'BUDAT', label: 'Posting Date' },
  { field: 'POPER', label: 'Posting Period' },
  { field: 'TCODE', label: 'Transaction' },
  { field: 'RACCT', label: 'G/L Account' },
  { field: 'DRCRK', label: 'Debit/Credit' },
  { field: 'HSL', label: 'Amount in LC' },
  { field: 'RHCUR', label: 'Currency' },
  { field: 'MATNR', label: 'Material' },
  { field: 'WERKS', label: 'Plant' },
  { field: 'KDAUF', label: 'Sales Order' },
  { field: 'KDPOS', label: 'SO Item' },
  { field: 'KUNNR', label: 'Customer' },
  { field: 'PRCTR', label: 'Profit Center' },
  { field: 'KOSTL', label: 'Cost Center' },
] as const;

export function buildFagll03(table: AcdocaLine[]): ReportOutput {
  const belnr = documentNumbers(table);
  const perDoc = new Map<string, number>();
  const rows = table.map((l) => {
    const n = (perDoc.get(l.txnId) ?? 0) + 1;
    perDoc.set(l.txnId, n);
    const budat = postingDateOf(l.stepId);
    const hsl = l.drAmount - l.crAmount;
    return [
      SIM_CONFIG.ledger,
      SIM_CONFIG.companyCode,
      fiscalYearOf(budat),
      belnr.get(l.txnId) as string,
      String(n).padStart(6, '0'),
      budat,
      periodOf(budat),
      l.tCode,
      l.glAccount,
      hsl >= 0 ? 'S' : 'H',
      String(hsl),
      l.currency,
      l.matnr ?? '',
      l.werks ?? '',
      l.kaufn ?? '',
      l.kposn ?? '',
      l.kunnr ?? '',
      l.prctr ?? '',
      l.kostl ?? '',
    ];
  });
  return {
    reportId: 'FAGLL03',
    title: 'G/L Account Line Items (FAGLL03)',
    columns: FAGLL03_COLUMNS.map((c) => ({ field: c.field, label: c.label })),
    rows,
  };
}

/** Tổng từ chính báo cáo (không từ nguồn) để đối chiếu độc lập với bảng ACDOCA. */
export function fagll03Totals(r: ReportOutput): { debit: number; credit: number; net: number } {
  const i = r.columns.findIndex((c) => c.field === 'HSL');
  let debit = 0;
  let credit = 0;
  for (const row of r.rows) {
    const v = Number(row[i]);
    if (!Number.isFinite(v)) throw new Error(`FAGLL03 HSL không phải số: ${row[i]}`);
    if (v >= 0) debit += v;
    else credit += -v;
  }
  return { debit, credit, net: debit - credit };
}
