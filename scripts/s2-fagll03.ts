/** S2a: FAGLL03 — bảo toàn số dòng/tổng, tất định, phát hiện sửa tay. Không fallback giả lập. */
import { PRESET_SCENARIOS } from '../src/types.ts';
import type { AcdocaLine } from '../src/types.ts';
import { computeMTO, generateStepEntries } from '../src/utils/calculator.ts';
import { selectTrialBalance } from '../src/utils/acdoca.ts';
import { buildManifest, sha256Hex, toRawExport } from '../src/reports/core.ts';
import { buildFagll03, fagll03Totals } from '../src/reports/fagll03.ts';
import { SIM_CONFIG, SIM_POSTING_DATE_DMY } from '../src/config/simConfig.ts';

function tableOf(id: string): AcdocaLine[] {
  const p = PRESET_SCENARIOS.find((s) => s.id === id);
  if (!p) throw new Error(`Unknown scenario ${id}`);
  const computed = computeMTO(p.params);
  const table: AcdocaLine[] = [];
  for (let step = 1; step <= 7; step++) table.push(...generateStepEntries(step, p.params, computed, 0, 0, null).acdoca);
  return table;
}

async function main() {
  for (const p of PRESET_SCENARIOS) {
    const table = tableOf(p.id);
    if (table.length === 0) throw new Error(`${p.id}: bảng ACDOCA rỗng`);
    const rep = buildFagll03(table);

    // 1. Bảo toàn số dòng
    if (rep.rows.length !== table.length) throw new Error(`${p.id}: số dòng ${rep.rows.length} ≠ nguồn ${table.length}`);

    // 1b. Cấu hình trong báo cáo = cấu hình/nguồn chứng từ (F03): plant, ngày hạch toán, kỳ
    const col = (f: string) => rep.columns.findIndex((c) => c.field === f);
    const uniq = (f: string) => [...new Set(rep.rows.map((r) => r[col(f)]))];
    if (uniq('WERKS').join() !== SIM_CONFIG.plant) throw new Error(`${p.id}: WERKS ${uniq('WERKS')} ≠ ${SIM_CONFIG.plant}`);
    if (uniq('BUDAT').join() !== SIM_CONFIG.postingDate) throw new Error(`${p.id}: BUDAT ${uniq('BUDAT')} ≠ ${SIM_CONFIG.postingDate}`);
    const pc = computeMTO(p.params);
    for (let st = 3; st <= 7; st++) {
      for (const e of generateStepEntries(st, p.params, pc, 0, 0, null).entries) {
        if (e.postingDate !== SIM_POSTING_DATE_DMY) throw new Error(`${p.id}: voucher bước ${st} ngày ${e.postingDate} ≠ ${SIM_POSTING_DATE_DMY}`);
      }
    }

    // 2. Tổng báo cáo khớp bảng cân đối từ nguồn, và Σ = 0
    const t = fagll03Totals(rep);
    const tb = selectTrialBalance(table);
    if (t.debit !== tb.totalDebitTurnover) throw new Error(`${p.id}: Nợ báo cáo ${t.debit} ≠ TB ${tb.totalDebitTurnover}`);
    if (t.credit !== tb.totalCreditTurnover) throw new Error(`${p.id}: Có báo cáo ${t.credit} ≠ TB ${tb.totalCreditTurnover}`);
    if (t.net !== 0) throw new Error(`${p.id}: Σ HSL = ${t.net} ≠ 0`);

    // 3. Tất định: dựng 2 lần từ 2 lần sinh bảng khác nhau (timestamp khác) → cùng hash
    const rawA = toRawExport(rep);
    const rawB = toRawExport(buildFagll03(tableOf(p.id)));
    const hA = await sha256Hex(rawA.bytes);
    const hB = await sha256Hex(rawB.bytes);
    if (hA !== hB) throw new Error(`${p.id}: không tất định (${hA} ≠ ${hB})`);

    // 4. Âm tính: sửa 1 số tiền → hash đổi và tổng Σ ≠ 0 bị phát hiện
    const tampered = buildFagll03(table);
    const hi = tampered.columns.findIndex((c) => c.field === 'HSL');
    tampered.rows[0][hi] = String(Number(tampered.rows[0][hi]) + 1);
    if ((await sha256Hex(toRawExport(tampered).bytes)) === hA) throw new Error(`${p.id}: sửa tay không đổi hash`);
    if (fagll03Totals(tampered).net === 0) throw new Error(`${p.id}: sửa tay không bị phát hiện qua Σ`);

    // 5. Manifest
    const m = await buildManifest(rep, rawA, table.length, { debit: t.debit, credit: t.credit });
    if (m.rowCount !== m.sourceLineCount) throw new Error(`${p.id}: manifest lệch`);
    console.log(`PASS S2a FAGLL03 ${p.id} rows=${m.rowCount} Dr=${t.debit} sha256=${m.sha256.slice(0, 12)}…`);
  }
  console.log('ALL S2a CHECKS PASSED');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
