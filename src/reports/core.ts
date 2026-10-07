/**
 * S2 — lõi sinh báo cáo định dạng SAP từ ACDOCA mô phỏng (quyết định A: chỉ simulator tự sinh).
 * Tất định: không đọc đồng hồ máy, không dùng AcdocaLine.timestamp. Cùng bảng → cùng byte → cùng hash.
 * Quy ước dấu: Nợ (+), Có (−) theo trường HSL của ACDOCA. Số tiền VND nguyên.
 */
import { SIM_CONFIG } from '../config/simConfig';
import type { AcdocaLine } from '../types';

export interface ReportColumn {
  /** Tên trường kỹ thuật SAP (hoặc tên gần nhất). */
  field: string;
  label: string;
}

export interface ReportOutput {
  reportId: string;
  title: string;
  columns: ReportColumn[];
  rows: string[][];
}

export interface RawExport {
  fileName: string;
  text: string;
  bytes: Uint8Array;
}

export interface RawManifest {
  reportId: string;
  fileName: string;
  sha256: string;
  bytes: number;
  rowCount: number;
  sourceLineCount: number;
  totals: Record<string, number>;
  config: { companyCode: string; plant: string; ledger: string; standard: string; label: string };
}

const ORIGIN_DIGIT: Record<string, string> = { '': '0', ML: '1', GRIR: '2', IC: '3' };

/**
 * Số chứng từ 10 chữ số suy RA TỪ mã chứng từ (txnId), không phụ thuộc thứ tự/tập chứng từ đầu vào:
 * '49' + bước(1) + nguồn(1: 0 luồng chính, 1 ML, 2 GRIR, 3 IC) + số thứ tự(6).
 * Lọc, sắp xếp hay bỏ bớt chứng từ không làm đổi số của chứng từ còn lại (AUD-003).
 */
export function documentNumberOf(txnId: string): string {
  const m = /^S(\d)(?:-([A-Z]+))?-(\d{1,6})$/.exec(txnId);
  if (!m) throw new Error(`Mã chứng từ không hợp lệ: ${txnId}`);
  const origin = ORIGIN_DIGIT[m[2] ?? ''];
  if (origin === undefined) throw new Error(`Nguồn chứng từ chưa đăng ký: ${m[2]} (${txnId})`);
  return `49${m[1]}${origin}${m[3].padStart(6, '0')}`;
}

export function documentNumbers(table: AcdocaLine[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const l of table) if (!map.has(l.txnId)) map.set(l.txnId, documentNumberOf(l.txnId));
  return map;
}

/** Số dòng trong chứng từ, lấy từ hậu tố của lineId (bền theo dòng, không đếm theo bảng). */
export function lineNumberOf(lineId: string): string {
  const m = /-(\d{3})$/.exec(lineId);
  if (!m) throw new Error(`lineId không hợp lệ: ${lineId}`);
  return m[1].padStart(6, '0');
}

/** Ngày hạch toán (YYYY-MM-DD): một nguồn chung với journal (SIM_CONFIG.postingDate). */
export function postingDateOf(_stepId?: number): string {
  return SIM_CONFIG.postingDate;
}

export function fiscalYearOf(date: string): string {
  return date.slice(0, 4); // variant K4: năm tài chính = năm dương lịch
}

export function periodOf(date: string): string {
  return date.slice(5, 7).padStart(3, '0'); // kỳ 001–012
}

function cell(v: string): string {
  return v.replace(/[\t\r\n]+/g, ' ');
}

/** Tab-delimited UTF-8, LF. Banner SIMULATED + cấu hình ở đầu file. */
export function toRawExport(r: ReportOutput): RawExport {
  const banner = `${r.title} | ${SIM_CONFIG.label} | BUKRS ${SIM_CONFIG.companyCode} | WERKS ${SIM_CONFIG.plant} | ${SIM_CONFIG.accountingStandard} | Dr(+)/Cr(-)`;
  const lines = [
    banner,
    '',
    r.columns.map((c) => cell(c.field)).join('\t'),
    ...r.rows.map((row) => row.map(cell).join('\t')),
  ];
  const text = lines.join('\n') + '\n';
  return { fileName: `${r.reportId}_${SIM_CONFIG.label}.txt`, text, bytes: new TextEncoder().encode(text) };
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function buildManifest(
  r: ReportOutput,
  raw: RawExport,
  sourceLineCount: number,
  totals: Record<string, number>
): Promise<RawManifest> {
  return {
    reportId: r.reportId,
    fileName: raw.fileName,
    sha256: await sha256Hex(raw.bytes),
    bytes: raw.bytes.length,
    rowCount: r.rows.length,
    sourceLineCount,
    totals,
    config: {
      companyCode: SIM_CONFIG.companyCode,
      plant: SIM_CONFIG.plant,
      ledger: SIM_CONFIG.ledger,
      standard: SIM_CONFIG.accountingStandard,
      label: SIM_CONFIG.label,
    },
  };
}
