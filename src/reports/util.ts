/**
 * S3 — tiện ích chung cho báo cáo logistics/CO (MB51, COOIS, KOB1, KKS1, CK13N, SUP01).
 * Định dạng số cố định để xuất RAW tất định: tiền VND số nguyên, số lượng 3 lẻ, giờ 2 lẻ.
 */
import type { ReportOutput } from './core';

export const fmtAmt = (n: number): string => {
  if (!Number.isInteger(n)) throw new Error(`Số tiền phải là số nguyên VND: ${n}`);
  return String(n);
};
export const fmtQty = (n: number): string => n.toFixed(3);
export const fmtHrs = (n: number): string => n.toFixed(2);

export function col(r: ReportOutput, field: string): number {
  const i = r.columns.findIndex((c) => c.field === field);
  if (i < 0) throw new Error(`${r.reportId}: không có cột ${field}`);
  return i;
}

/** Đọc số từ ô báo cáo; ô không phải số là lỗi (không mặc định 0). */
export function num(r: ReportOutput, row: string[], field: string): number {
  const v = Number(row[col(r, field)]);
  if (row[col(r, field)] === '' || !Number.isFinite(v)) throw new Error(`${r.reportId}: ${field} không phải số: "${row[col(r, field)]}"`);
  return v;
}

/** Tổng một cột tiền trên các dòng thỏa điều kiện — đọc từ CHÍNH báo cáo, không từ nguồn. */
export function sumCol(r: ReportOutput, field: string, pred: (row: string[]) => boolean = () => true): number {
  return r.rows.filter(pred).reduce((s, row) => s + num(r, row, field), 0);
}

/**
 * Chia `total` (số nguyên) theo trọng số, phương pháp số dư lớn nhất; tổng các phần luôn = total.
 * Trọng số 0 hết → dồn vào phần tử cuối.
 */
export function allocate(total: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  const wSum = weights.reduce((s, w) => s + w, 0);
  if (wSum === 0) return weights.map((_, i) => (i === weights.length - 1 ? total : 0));
  const sign = total < 0 ? -1 : 1;
  const abs = Math.abs(total);
  const raw = weights.map((w) => (abs * w) / wSum);
  const out = raw.map((x) => Math.floor(x));
  let remain = abs - out.reduce((s, n) => s + n, 0);
  const order = raw.map((x, i) => ({ i, f: x - Math.floor(x) })).sort((a, b) => b.f - a.f || a.i - b.i);
  for (let k = 0; remain > 0; k++, remain--) out[order[k % order.length].i] += 1;
  return out.map((n) => n * sign);
}
