/**
 * A0 — đối chiếu 54 ca (3 kịch bản × Valuated/Non-valuated × chênh lệch +3,5%/0/−3,5% × giao 100%/50%/0%)
 * với bảng kết quả kỳ vọng do oracle độc lập tính (scripts/a0_oracle.py → a0_expected.json).
 * Số dư tính trực tiếp từ dòng ACDOCA, KHÔNG dùng selectTrialBalance làm oracle. Sai là throw.
 */
import { readFileSync } from 'node:fs';
import { PRESET_SCENARIOS } from '../src/types.ts';
import type { AcdocaLine } from '../src/types.ts';
import { computeMTO, generateStepEntries } from '../src/utils/calculator.ts';

interface Expected {
  src: string; stock: 'Valuated' | 'Non-valuated'; pct: number; ratio: number;
  cr152: number; cr334: number; cr214: number; wip154_dr_minus_cr: number; closing155: number;
  gp911_credit: number; closing632_dr_minus_cr: number; revenue_recognized: number;
}
const expected: Expected[] = JSON.parse(readFileSync(new URL('./a0_expected.json', import.meta.url), 'utf8'));
if (expected.length !== 54) throw new Error(`oracle phải có 54 ca, có ${expected.length}`);

const sum = (t: AcdocaLine[], acc: string, side: 'dr' | 'cr') =>
  t.filter((l) => l.glAccount === acc).reduce((s, l) => s + (side === 'dr' ? l.drAmount : l.crAmount), 0);

const fails: string[] = [];
for (const e of expected) {
  const preset = PRESET_SCENARIOS.find((p) => p.id === e.src)!;
  const params = {
    ...preset.params,
    stockType: e.stock,
    actualVariancePercent: e.pct,
    deliveredQuantity: Math.round(preset.params.orderQuantity * e.ratio),
  };
  const label = `${e.src}/${e.stock}/${e.pct}%/giao ${e.ratio * 100}%`;
  const computed = computeMTO(params);
  const table: AcdocaLine[] = [];
  try {
    for (let s = 1; s <= 7; s++) table.push(...generateStepEntries(s, params, computed, 0, 0, null).acdoca);
  } catch (err: any) {
    fails.push(`${label}: THROW ${String(err.message).split('\n')[0]}`);
    continue;
  }
  // chứng từ cân từng cái + mã dòng duy nhất
  const byDoc = new Map<string, number>();
  for (const l of table) byDoc.set(l.txnId, (byDoc.get(l.txnId) ?? 0) + l.drAmount - l.crAmount);
  for (const [id, v] of byDoc) if (v !== 0) fails.push(`${label}: chứng từ ${id} lệch ${v}`);
  if (new Set(table.map((l) => l.lineId)).size !== table.length) fails.push(`${label}: lineId trùng`);

  const got = {
    cr152: sum(table, '152', 'cr') - sum(table, '152', 'dr'),
    cr334: sum(table, '334', 'cr') - sum(table, '334', 'dr'),
    cr214: sum(table, '214', 'cr') - sum(table, '214', 'dr'),
    wip154_dr_minus_cr: sum(table, '154', 'dr') - sum(table, '154', 'cr'),
    closing155: sum(table, '155', 'dr') - sum(table, '155', 'cr'),
    gp911_credit: sum(table, '911', 'cr') - sum(table, '911', 'dr'),
    closing632_dr_minus_cr: sum(table, '632', 'dr') - sum(table, '632', 'cr'),
    revenue_recognized: sum(table, '511', 'cr'),
  };
  for (const k of Object.keys(got) as (keyof typeof got)[]) {
    if (got[k] !== (e as any)[k]) fails.push(`${label}: ${k} thực ${got[k]} ≠ kỳ vọng ${(e as any)[k]}`);
  }
  // 621/622/627 phải đóng về 0 (chi phí đã kết chuyển hết vào 154)
  for (const a of ['621', '622', '627']) {
    const net = sum(table, a, 'dr') - sum(table, a, 'cr');
    if (net !== 0) fails.push(`${label}: TK ${a} chưa đóng, dư ${net}`);
  }
  // 154 không được dư Có ở bất kỳ ca nào
  if (got.wip154_dr_minus_cr < 0) fails.push(`${label}: 154 dư Có ${got.wip154_dr_minus_cr}`);
}
if (fails.length) {
  console.error(`FAIL ${fails.length} sai lệch:\n` + fails.slice(0, 40).join('\n'));
  process.exit(1);
}
console.log(`PASS A0 ${expected.length}/54 ca khớp oracle độc lập; 154 không dư Có; chứng từ cân; lineId duy nhất`);
