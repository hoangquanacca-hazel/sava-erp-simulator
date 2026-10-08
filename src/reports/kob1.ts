/**
 * KOB1 (Orders: Actual Line Items) — bố cục MÔ PHỎNG, đọc từ ACDOCA (S/4: dòng CO thực tế = dòng ACDOCA).
 *
 * Phạm vi dòng thuộc lệnh sản xuất:
 *  - chi phí ban đầu ghi Nợ 621/622/627 (MIGO 261E, CO11N) → ghi Nợ lệnh;
 *  - dòng 154 KHÔNG phải kết chuyển CO01: nhập kho 101E (ghi Có lệnh), quyết toán VA88/KKA2/CKMLCP.
 * Bút toán kết chuyển CO01 (Nợ 154 / Có 621,622,627) là bước kế toán TT99, không phải dòng CO trên lệnh
 * (trong SAP, TK 154 chính là lệnh), nên bị loại để không đếm hai lần. Σ WKGBTR = số dư 154 cuối kỳ.
 */
import { SIM_CONFIG } from '../config/simConfig';
import type { AcdocaLine } from '../types';
import { documentNumberOf, fiscalYearOf, lineNumberOf, periodOf, postingDateOf, type ReportOutput } from './core';
import { col, fmtAmt, sumCol } from './util';

export const KOB1_COST_ACCOUNTS = ['621', '622', '627'] as const;

export function isOrderLine(l: AcdocaLine): boolean {
  if (l.tCode === 'CO01') return false;
  return l.glAccount === '154' || (KOB1_COST_ACCOUNTS as readonly string[]).includes(l.glAccount);
}

/** Giao dịch nghiệp vụ CO (VRGNG) theo mã giao dịch nguồn. */
export function businessTransactionOf(l: AcdocaLine): string {
  const t = l.tCode || '';
  if (t.includes('101E')) return 'RMWE'; // nhập kho từ lệnh sản xuất
  if (t.includes('261E')) return 'RMWA'; // xuất NVL cho lệnh
  if (t === 'CO11N') return 'RKL'; // xác nhận công đoạn → tính giá hoạt động
  if (t.includes('VA88') || t.includes('KKA2') || t.includes('CKMLCP')) return 'KOAO'; // quyết toán
  return 'COIN';
}

export const KOB1_COLUMNS = [
  { field: 'KOKRS', label: 'Controlling Area' },
  { field: 'OBJNR', label: 'Object' },
  { field: 'AUFNR', label: 'Order' },
  { field: 'GJAHR', label: 'Fiscal Year' },
  { field: 'PERIO', label: 'Period' },
  { field: 'BUDAT', label: 'Posting Date' },
  { field: 'KSTAR', label: 'Cost Element' },
  { field: 'KTEXT', label: 'Cost Element Name' },
  { field: 'VRGNG', label: 'Business Transaction' },
  { field: 'TCODE', label: 'Transaction' },
  { field: 'BELNR', label: 'FI Document' },
  { field: 'BUZEI', label: 'FI Line Item' },
  { field: 'MATNR', label: 'Material' },
  { field: 'BEKNZ', label: 'Debit/Credit' },
  { field: 'WKGBTR', label: 'Value in CO Area Currency' },
  { field: 'TWAER', label: 'Currency' },
] as const;

export function buildKob1(table: AcdocaLine[]): ReportOutput {
  const aufnr = SIM_CONFIG.productionOrder;
  const rows = table.filter(isOrderLine).map((l) => {
    const budat = postingDateOf(l.stepId);
    const v = l.drAmount - l.crAmount;
    return [
      SIM_CONFIG.controllingArea, `OR${aufnr}`, aufnr, fiscalYearOf(budat), periodOf(budat), budat, l.glAccount,
      l.accountName, businessTransactionOf(l), l.tCode, documentNumberOf(l.txnId), lineNumberOf(l.lineId),
      l.matnr ?? '', v >= 0 ? 'S' : 'H', fmtAmt(v), l.currency,
    ];
  });
  return {
    reportId: 'KOB1',
    title: 'Orders: Actual Line Items (KOB1)',
    columns: KOB1_COLUMNS.map((c) => ({ field: c.field, label: c.label })),
    rows,
  };
}

export function kob1Totals(r: ReportOutput): { debitCosts: number; grCredit: number; settlement: number; balance: number } {
  const ce = (pred: (k: string, vr: string) => boolean) => (row: string[]) => pred(row[col(r, 'KSTAR')], row[col(r, 'VRGNG')]);
  return {
    debitCosts: sumCol(r, 'WKGBTR', ce((k) => k !== '154')),
    grCredit: sumCol(r, 'WKGBTR', ce((k, v) => k === '154' && v === 'RMWE')),
    settlement: sumCol(r, 'WKGBTR', ce((k, v) => k === '154' && v === 'KOAO')),
    balance: sumCol(r, 'WKGBTR'),
  };
}
