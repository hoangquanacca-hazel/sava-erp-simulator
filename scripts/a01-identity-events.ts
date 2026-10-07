/**
 * A0.1 — (1) số chứng từ bền khi lọc/sắp xếp; (2) nguồn sự kiện logistics khớp chứng từ FI trên 54 ca;
 * (3) kiểm soát phải BẮT được sai lệch cố ý. Sai là throw, không có nhánh giả lập.
 */
import { readFileSync } from 'node:fs';
import { PRESET_SCENARIOS } from '../src/types.ts';
import type { AcdocaLine } from '../src/types.ts';
import { computeMTO, generateStepEntries } from '../src/utils/calculator.ts';
import { postCkmlcp } from '../src/features/materialLedger.ts';
import { documentNumbers, documentNumberOf, lineNumberOf } from '../src/reports/core.ts';
import { buildFagll03 } from '../src/reports/fagll03.ts';
import { buildScenarioEvents, checkEventsAgainstFi } from '../src/events/scenarioEvents.ts';

const fails: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) fails.push(msg); };

// ---- 1. Số chứng từ bền ----------------------------------------------------
for (const preset of PRESET_SCENARIOS) {
  const params = { ...preset.params, actualVariancePercent: 3.5, stockType: 'Valuated' as const };
  const c = computeMTO(params);
  const full: AcdocaLine[] = [];
  for (let s = 1; s <= 6; s++) full.push(...generateStepEntries(s, params, c, 0, 0, null).acdoca);
  postCkmlcp(full, params, c, 0);
  full.push(...generateStepEntries(7, params, c, 0, 0, null, { skipVa88Variance: true }).acdoca);

  const numbers = documentNumbers(full);
  ok(new Set(numbers.values()).size === numbers.size, `${preset.id}: BELNR trùng`);
  for (const n of numbers.values()) ok(/^49\d{8}$/.test(n), `${preset.id}: BELNR ${n} không đủ 10 chữ số`);

  const firstDoc = full[0].txnId;
  const subset = full.filter((l) => l.txnId !== firstDoc).reverse();
  const repFull = buildFagll03(full);
  const repSub = buildFagll03(subset);
  const idx = (r: typeof repFull, f: string) => r.columns.findIndex((x) => x.field === f);
  const keyOf = (r: typeof repFull, i: number) => r.rows[i][idx(r, 'BELNR')] + '/' + r.rows[i][idx(r, 'DOCLN')];
  const byLine = new Map(full.map((l, i) => [l.lineId, keyOf(repFull, i)]));
  subset.forEach((l, i) => ok(byLine.get(l.lineId) === keyOf(repSub, i), `${preset.id}: ${l.lineId} đổi số khi lọc/đảo thứ tự`));
  ok(documentNumberOf('S7-ML-0001') !== documentNumberOf('S7-0001'), `${preset.id}: ML trùng số với bước 7`);
}
try { documentNumberOf('X-1'); fails.push('mã sai định dạng phải bị từ chối'); } catch { /* đúng */ }
try { documentNumberOf('S7-ZZ-0001'); fails.push('nguồn chưa đăng ký phải bị từ chối'); } catch { /* đúng */ }
try { lineNumberOf('abc'); fails.push('lineId sai phải bị từ chối'); } catch { /* đúng */ }

// ---- 2. Sự kiện logistics khớp FI (54 ca) -----------------------------------
const expected: any[] = JSON.parse(readFileSync(new URL('./a0_expected.json', import.meta.url), 'utf8'));
let cases = 0;
for (const e of expected) {
  const preset = PRESET_SCENARIOS.find((p) => p.id === e.src)!;
  const params = { ...preset.params, stockType: e.stock, actualVariancePercent: e.pct,
    deliveredQuantity: Math.round(preset.params.orderQuantity * e.ratio) };
  const label = `${e.src}/${e.stock}/${e.pct}%/giao ${e.ratio * 100}%`;
  const c = computeMTO(params);
  const t: AcdocaLine[] = [];
  for (let s = 1; s <= 7; s++) t.push(...generateStepEntries(s, params, c, 0, 0, null).acdoca);
  const ev = buildScenarioEvents(params, c, t);
  for (const i of checkEventsAgainstFi(ev, t, c, params)) fails.push(`${label}: ${i}`);
  cases++;

  // ---- 3. Kiểm soát phải bắt được sai lệch cố ý (chạy trên ca đầu của mỗi kịch bản) ----
  if (e.ratio === 1 && e.pct === 3.5) {
    const bad = JSON.parse(JSON.stringify(ev)) as typeof ev;
    bad.movements.find((m) => m.bwart === '261')!.value += 1;
    ok(checkEventsAgainstFi(bad, t, c, params).length > 0, `${label}: sửa giá trị 261 không bị phát hiện`);
    const bad2 = JSON.parse(JSON.stringify(ev)) as typeof ev;
    bad2.movements.find((m) => m.bwart === '601')!.quantity -= 1;
    ok(checkEventsAgainstFi(bad2, t, c, params).length > 0, `${label}: lệch số lượng xuất kho không bị phát hiện`);
    if (params.stockType === 'Non-valuated') {
      const bad3 = JSON.parse(JSON.stringify(ev)) as typeof ev;
      bad3.movements.find((m) => m.bwart === '101')!.fiTxnId = 'S3-0007';
      ok(checkEventsAgainstFi(bad3, t, c, params).length > 0, `${label}: FI giả cho hàng không định giá không bị phát hiện`);
    }
  }
  // ca giao 0%: không được có chuyển động nhập/xuất thành phẩm
  if (e.ratio === 0) ok(ev.movements.every((m) => m.bwart === '261'), `${label}: giao 0% nhưng có nhập/xuất thành phẩm`);
}
ok(cases === 54, `chỉ chạy ${cases}/54 ca`);

if (fails.length) { console.error(`FAIL ${fails.length}:\n` + fails.slice(0, 30).join('\n')); process.exit(1); }
console.log(`PASS A0.1: số chứng từ bền (lọc/đảo thứ tự), sự kiện logistics khớp FI ${cases}/54 ca, kiểm soát bắt được sai lệch cố ý`);
