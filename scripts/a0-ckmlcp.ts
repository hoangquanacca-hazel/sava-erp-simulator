/**
 * AUD-006 — đường CKMLCP (Material Ledger) phải cho cùng số dư với đường VA88 trực tiếp.
 * Kỳ vọng lấy từ oracle độc lập (a0_expected.json). Hàng không định giá: không có Material Ledger,
 * CKMLCP không được ghi thêm gì (tránh tính trùng chênh lệch với VA88).
 */
import { readFileSync } from 'node:fs';
import { PRESET_SCENARIOS } from '../src/types.ts';
import type { AcdocaLine } from '../src/types.ts';
import { computeMTO, generateStepEntries } from '../src/utils/calculator.ts';
import { postCkmlcp } from '../src/features/materialLedger.ts';

const expected: any[] = JSON.parse(readFileSync(new URL('./a0_expected.json', import.meta.url), 'utf8'));
const sum = (t: AcdocaLine[], a: string) => t.filter((l) => l.glAccount === a).reduce((s, l) => s + l.drAmount - l.crAmount, 0);
const fails: string[] = [];
let n = 0;
for (const e of expected) {
  if (e.pct === 0) continue; // không có chênh lệch → CKMLCP không phát sinh
  const preset = PRESET_SCENARIOS.find((p) => p.id === e.src)!;
  const params = { ...preset.params, stockType: e.stock, actualVariancePercent: e.pct,
    deliveredQuantity: Math.round(preset.params.orderQuantity * e.ratio) };
  const label = `${e.src}/${e.stock}/${e.pct}%/giao ${e.ratio * 100}%`;
  const c = computeMTO(params);
  const t: AcdocaLine[] = [];
  try {
    for (let s = 1; s <= 6; s++) t.push(...generateStepEntries(s, params, c, 0, 0, null).acdoca);
    postCkmlcp(t, params, c, 0);
    t.push(...generateStepEntries(7, params, c, 0, 0, null, { skipVa88Variance: true }).acdoca);
  } catch (err: any) { fails.push(`${label}: THROW ${String(err.message).split('\n')[0]}`); continue; }
  n++;
  const got = { wip154: sum(t, '154'), c632: sum(t, '632'), c155: sum(t, '155'), gp911: -sum(t, '911') };
  const want = { wip154: e.wip154_dr_minus_cr, c632: e.closing632_dr_minus_cr, c155: e.closing155, gp911: e.gp911_credit };
  for (const k of Object.keys(got) as (keyof typeof got)[])
    if (got[k] !== want[k]) fails.push(`${label}: ${k} thực ${got[k]} ≠ kỳ vọng ${want[k]}`);
}
if (n === 0) throw new Error('không chạy ca nào — test vô nghĩa');
if (fails.length) { console.error(`FAIL ${fails.length}:\n` + fails.slice(0, 30).join('\n')); process.exit(1); }
console.log(`PASS AUD-006 ${n} ca đường CKMLCP khớp oracle (có/không định giá, ±3,5%, giao 100/50/0%)`);
