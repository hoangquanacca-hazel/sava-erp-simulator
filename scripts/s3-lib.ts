/**
 * S3 — khung test chung cho báo cáo logistics/CO. Chạy trên 54 ca của a0_expected.json (oracle độc lập).
 * Tổng FI tính TRỰC TIẾP từ dòng ACDOCA tại đây (không dùng sup01.fiFigures) để đối chiếu độc lập.
 * Không có nhánh fallback/giả lập: sai lệch nào cũng đẩy vào fails và thoát mã 1.
 */
import { readFileSync } from 'node:fs';
import { PRESET_SCENARIOS } from '../src/types.ts';
import type { AcdocaLine, MTOComputed, MTOParameters } from '../src/types.ts';
import { computeMTO, generateStepEntries } from '../src/utils/calculator.ts';
import { buildScenarioEvents, type ScenarioEvents } from '../src/events/scenarioEvents.ts';
import { buildManifest, sha256Hex, toRawExport, type ReportOutput } from '../src/reports/core.ts';

export interface Expected {
  src: string; stock: 'Valuated' | 'Non-valuated'; pct: number; ratio: number;
  P: number; delta: number; dM: number; dL: number; dO: number; actual: number;
  cr152: number; cr334: number; cr214: number; wip154_dr_minus_cr: number; closing155: number;
  gp911_credit: number; closing632_dr_minus_cr: number; revenue_recognized: number;
}

export interface Case {
  label: string;
  e: Expected;
  params: MTOParameters;
  computed: MTOComputed;
  table: AcdocaLine[];
  ev: ScenarioEvents;
}

export function loadExpected(): Expected[] {
  const xs: Expected[] = JSON.parse(readFileSync(new URL('./a0_expected.json', import.meta.url), 'utf8'));
  if (xs.length !== 54) throw new Error(`oracle phải có 54 ca, có ${xs.length}`);
  return xs;
}

export function buildCase(e: Expected): Case {
  const preset = PRESET_SCENARIOS.find((p) => p.id === e.src);
  if (!preset) throw new Error(`Không có kịch bản ${e.src}`);
  const params: MTOParameters = {
    ...preset.params, stockType: e.stock, actualVariancePercent: e.pct,
    deliveredQuantity: Math.round(preset.params.orderQuantity * e.ratio),
  };
  const computed = computeMTO(params);
  const table: AcdocaLine[] = [];
  for (let s = 1; s <= 7; s++) table.push(...generateStepEntries(s, params, computed, 0, 0, null).acdoca);
  if (table.length === 0) throw new Error(`${e.src}: bảng ACDOCA rỗng`);
  return { label: `${e.src}/${e.stock}/${e.pct}%/giao ${e.ratio * 100}%`, e, params, computed, table, ev: buildScenarioEvents(params, computed, table) };
}

// ---- Tổng FI độc lập (đọc thẳng dòng ACDOCA) ---------------------------------
type Pred = (l: AcdocaLine) => boolean;
export const fiDr = (t: AcdocaLine[], p: Pred) => t.filter(p).reduce((s, l) => s + l.drAmount, 0);
export const fiCr = (t: AcdocaLine[], p: Pred) => t.filter(p).reduce((s, l) => s + l.crAmount, 0);
export const on = (acc: string, tcode?: RegExp): Pred => (l) => l.glAccount === acc && (!tcode || tcode.test(l.tCode || ''));
export const bal154 = (t: AcdocaLine[]) => fiDr(t, on('154')) - fiCr(t, on('154'));

// ---- Đọc báo cáo -------------------------------------------------------------
export const idx = (r: ReportOutput, f: string) => {
  const i = r.columns.findIndex((c) => c.field === f);
  if (i < 0) throw new Error(`${r.reportId}: thiếu cột ${f}`);
  return i;
};
export const total = (r: ReportOutput, f: string, pred: (row: string[]) => boolean = () => true) =>
  r.rows.filter(pred).reduce((s, row) => {
    const v = Number(row[idx(r, f)]);
    if (!Number.isFinite(v) || row[idx(r, f)] === '') throw new Error(`${r.reportId}.${f} không phải số: ${row[idx(r, f)]}`);
    return s + v;
  }, 0);

/** Bản sao báo cáo với 1 ô số bị cộng thêm `delta` (mặc định +1). */
export function tamper(r: ReportOutput, field: string, row = 0, delta = 1): ReportOutput {
  const c: ReportOutput = JSON.parse(JSON.stringify(r));
  const i = idx(c, field);
  if (!c.rows[row]) throw new Error(`${r.reportId}: không có dòng ${row} để sửa`);
  c.rows[row][i] = String(Number(c.rows[row][i]) + delta);
  return c;
}

export interface Suite {
  id: string;
  build: (c: Case) => ReportOutput;
  /** Đối soát báo cáo với ACDOCA + oracle. Trả danh sách sai lệch (rỗng = đạt). */
  reconcile: (r: ReportOutput, c: Case) => string[];
  /** Cột/dòng bị sửa ở test âm tính. */
  tamperField: string;
  tamperRow?: (r: ReportOutput) => number;
  sourceCount: (c: Case) => number;
}

export async function runSuites(tag: string, suites: Suite[]): Promise<void> {
  const fails: string[] = [];
  const stats = new Map<string, { rows: number; neg: number; cases: number }>();
  for (const e of loadExpected()) {
    const a = buildCase(e);
    const b = buildCase(e); // lần sinh thứ hai, độc lập (timestamp khác)
    for (const s of suites) {
      const st = stats.get(s.id) ?? { rows: 0, neg: 0, cases: 0 };
      stats.set(s.id, st);
      let rep: ReportOutput;
      try { rep = s.build(a); } catch (err: any) { fails.push(`${s.id} ${a.label}: THROW ${err.message}`); continue; }
      for (const issue of s.reconcile(rep, a)) fails.push(`${s.id} ${a.label}: ${issue}`);
      if (rep.rows.length !== s.sourceCount(a)) fails.push(`${s.id} ${a.label}: số dòng ${rep.rows.length} ≠ nguồn ${s.sourceCount(a)}`);

      // Tất định
      const raw = toRawExport(rep);
      const h = await sha256Hex(raw.bytes);
      if (h !== (await sha256Hex(toRawExport(s.build(b)).bytes))) fails.push(`${s.id} ${a.label}: không tất định`);
      if (!raw.text.startsWith(rep.title) || !raw.text.includes('SIMULATED')) fails.push(`${s.id} ${a.label}: thiếu banner SIMULATED`);

      // Âm tính: sửa 1 số → đối soát phải FAIL và hash phải đổi
      if (rep.rows.length > 0) {
        const bad = tamper(rep, s.tamperField, s.tamperRow ? s.tamperRow(rep) : 0);
        if (s.reconcile(bad, a).length === 0) fails.push(`${s.id} ${a.label}: sửa ${s.tamperField} +1 KHÔNG bị phát hiện`);
        else st.neg++;
        if ((await sha256Hex(toRawExport(bad).bytes)) === h) fails.push(`${s.id} ${a.label}: sửa tay không đổi hash`);
      }

      // Manifest
      const m = await buildManifest(rep, raw, s.sourceCount(a), {});
      if (!/^[0-9a-f]{64}$/.test(m.sha256) || m.sha256 !== h || m.bytes !== raw.bytes.length || m.rowCount !== rep.rows.length)
        fails.push(`${s.id} ${a.label}: manifest sai`);
      st.rows += rep.rows.length;
      st.cases++;
    }
  }
  if (fails.length) {
    console.error(`FAIL ${tag} ${fails.length} sai lệch:\n` + fails.slice(0, 40).join('\n'));
    process.exit(1);
  }
  for (const [id, st] of stats) {
    if (st.cases !== 54) { console.error(`FAIL ${id}: chỉ chạy ${st.cases}/54 ca`); process.exit(1); }
    console.log(`PASS ${tag} ${id}: 54/54 ca khớp ACDOCA + oracle; âm tính bắt ${st.neg} lần; ${st.rows} dòng; tất định`);
  }
}

export function eq(issues: string[], what: string, got: number, want: number) {
  if (got !== want) issues.push(`${what}: báo cáo ${got} ≠ ${want}`);
}
