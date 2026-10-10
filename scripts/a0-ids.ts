/** A0 — mã chứng từ/dòng duy nhất khi gộp luồng 7 bước với CKMLCP (ca audit F04). Sai là throw. */
import { PRESET_SCENARIOS } from '../src/types.ts';
import type { AcdocaLine } from '../src/types.ts';
import { computeMTO, generateStepEntries } from '../src/utils/calculator.ts';
import { postCkmlcp } from '../src/features/materialLedger.ts';

for (const preset of PRESET_SCENARIOS) {
  const params = { ...preset.params, actualVariancePercent: 3.5, stockType: 'Valuated' as const };
  const computed = computeMTO(params);
  const table: AcdocaLine[] = [];
  for (let s = 1; s <= 6; s++) table.push(...generateStepEntries(s, params, computed, 0, 0, null).acdoca);
  const ml = postCkmlcp(table, params, computed, 0);
  if (ml.length === 0) throw new Error(`${preset.id}: CKMLCP không phát sinh dòng nào — test vô nghĩa`);
  table.push(...generateStepEntries(7, params, computed, 0, 0, null, { skipVa88Variance: true }).acdoca);
  const ids = table.map((l) => l.lineId);
  if (new Set(ids).size !== ids.length) throw new Error(`${preset.id}: lineId trùng sau khi gộp CKMLCP + bước 7`);
  const docs = new Map<string, Set<string>>();
  for (const l of table) docs.set(l.txnId, (docs.get(l.txnId) ?? new Set()).add(l.tCode));
  for (const [id, t] of docs) if (t.size > 1) throw new Error(`${preset.id}: chứng từ ${id} trộn nhiều giao dịch: ${[...t].join(' + ')}`);
  console.log(`PASS A0-ID ${preset.id}: ${ids.length} dòng, ${docs.size} chứng từ, CKMLCP=${ml[0].txnId}`);
}
