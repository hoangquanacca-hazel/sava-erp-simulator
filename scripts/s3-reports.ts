/**
 * T2 — 11 báo cáo định dạng SAP (FAGLL03 + MB51 + 5 COOIS + KOB1 + KKS1 + CK13N + SUP01) trên 54 ca của a0_expected.json.
 * Đối soát Σ báo cáo với (a) ACDOCA tính TRỰC TIẾP từ dòng, (b) oracle độc lập a0_expected.json.
 * Mỗi báo cáo: tất định (hash), manifest, và test âm tính (sửa 1 số ⇒ đối soát phải FAIL, hash phải đổi).
 * Không có nhánh fallback/giả lập: sai là exit 1.
 */
import { readFileSync } from 'node:fs';
import { PRESET_SCENARIOS } from '../src/types.ts';
import type { AcdocaLine, MTOParameters } from '../src/types.ts';
import { computeMTO, generateStepEntries } from '../src/utils/calculator.ts';
import { buildScenarioEvents } from '../src/events/scenarioEvents.ts';
import { columnIndex, documentNumberOf, buildManifest, sha256Hex, sumColumn, toRawExport, type ReportOutput } from '../src/reports/core.ts';
import { fagll03Totals } from '../src/reports/fagll03.ts';
import { buildAllReports, REPORT_IDS } from '../src/reports/registry.ts';
import { postCkmlcp } from '../src/features/materialLedger.ts';

interface Expected {
  src: string; stock: 'Valuated' | 'Non-valuated'; pct: number; ratio: number; P: number; delta: number;
  dM: number; dL: number; dO: number; actual: number; cr152: number; cr334: number; cr214: number;
  wip154_dr_minus_cr: number; closing155: number; gp911_credit: number; closing632_dr_minus_cr: number; revenue_recognized: number;
}
const expected: Expected[] = JSON.parse(readFileSync(new URL('./a0_expected.json', import.meta.url), 'utf8'));
if (expected.length !== 54) throw new Error(`oracle phải có 54 ca, có ${expected.length}`);

function scenario(e: Expected) {
  const preset = PRESET_SCENARIOS.find((p) => p.id === e.src);
  if (!preset) throw new Error(`Không có kịch bản ${e.src}`);
  const params: MTOParameters = { ...preset.params, stockType: e.stock, actualVariancePercent: e.pct,
    deliveredQuantity: Math.round(preset.params.orderQuantity * e.ratio) };
  const computed = computeMTO(params);
  const table: AcdocaLine[] = [];
  for (let s = 1; s <= 7; s++) table.push(...generateStepEntries(s, params, computed, 0, 0, null).acdoca);
  const ev = buildScenarioEvents(params, computed, table);
  return { params, computed, table, ev };
}

/** Dùng ĐÚNG danh mục mà giao diện dùng (src/reports/registry.ts). */
function buildAll(s: ReturnType<typeof scenario>): ReportOutput[] {
  return buildAllReports(s.params, s.computed, s.table);
}

// ---- Phía FI: tính thẳng từ dòng ACDOCA, không qua code báo cáo ------------------------------
const fiDr = (t: AcdocaLine[], acc: string, tc?: (c: string) => boolean) =>
  t.filter((l) => l.glAccount === acc && (!tc || tc(l.tCode || ''))).reduce((s, l) => s + l.drAmount, 0);
const fiCr = (t: AcdocaLine[], acc: string, tc?: (c: string) => boolean) =>
  t.filter((l) => l.glAccount === acc && (!tc || tc(l.tCode || ''))).reduce((s, l) => s + l.crAmount, 0);
const has = (s: string) => (c: string) => c.includes(s);

/** Trả danh sách sai lệch "REPORTID: …". Rỗng = đạt. */
function reconcile(reps: ReportOutput[], t: AcdocaLine[], e: Expected, params: MTOParameters): string[] {
  const issues: string[] = [];
  const R = (id: string) => {
    const r = reps.find((x) => x.reportId === id);
    if (!r) throw new Error(`thiếu báo cáo ${id}`);
    return r;
  };
  const eq = (id: string, what: string, got: number, want: number) => {
    if (got !== want) issues.push(`${id}: ${what} báo cáo ${got} ≠ ${want}`);
  };
  const by = (r: ReportOutput, f: string, v: string) => { const i = columnIndex(r, f); return (row: string[]) => row[i] === v; };
  const valuated = e.stock === 'Valuated';
  const delivered = params.deliveredQuantity as number;
  const fi152 = fiCr(t, '152', has('MIGO 261E')) - fiDr(t, '152', has('MIGO 261E'));
  const fi155In = fiDr(t, '155', has('MIGO 101E'));
  const fi155Out = fiCr(t, '155', has('MIGO 601E'));
  const fiActual = fiDr(t, '621') + fiDr(t, '622') + fiDr(t, '627');
  const fi154net = fiDr(t, '154') - fiCr(t, '154');
  const oracleWip = e.wip154_dr_minus_cr;

  // FAGLL03
  const fg = fagll03Totals(R('FAGLL03'));
  eq('FAGLL03', 'Σ Nợ', fg.debit, t.reduce((s, l) => s + l.drAmount, 0));
  eq('FAGLL03', 'Σ Có', fg.credit, t.reduce((s, l) => s + l.crAmount, 0));
  eq('FAGLL03', 'Σ HSL', fg.net, 0);

  // MB51 + COOIS Documented Goods Movements
  for (const id of ['MB51', 'COOIS_GM']) {
    const r = R(id);
    eq(id, 'Σ 261 DMBTR vs FI Có 152', sumColumn(r, 'DMBTR', by(r, 'BWART', '261')), fi152);
    eq(id, 'Σ 261 DMBTR vs oracle cr152', sumColumn(r, 'DMBTR', by(r, 'BWART', '261')), e.cr152);
    eq(id, 'Σ 101 DMBTR vs FI Nợ 155', sumColumn(r, 'DMBTR', by(r, 'BWART', '101')), fi155In);
    eq(id, 'Σ 101 MENGE vs số lượng giao', sumColumn(r, 'MENGE', by(r, 'BWART', '101')), delivered);
    const bi = columnIndex(r, 'BELNR'), wi = columnIndex(r, 'BWART');
    for (const row of r.rows) {
      const fiExpected = row[wi] === '261' || valuated;
      if (fiExpected !== (row[bi] !== '')) issues.push(`${id}: ${row[wi]} BELNR "${row[bi]}" sai với loại tồn kho ${e.stock}`);
      if (row[bi] !== '') {
        const docs = new Set(t.map((l) => documentNumberOf(l.txnId)));
        if (!docs.has(row[bi])) issues.push(`${id}: BELNR ${row[bi]} không có trong ACDOCA`);
      }
    }
  }
  const mb = R('MB51');
  eq('MB51', 'Σ 601 DMBTR vs FI Có 155', sumColumn(mb, 'DMBTR', by(mb, 'BWART', '601')), fi155Out);
  eq('MB51', 'Σ 601 MENGE vs số lượng giao', sumColumn(mb, 'MENGE', by(mb, 'BWART', '601')), delivered);
  eq('COOIS_GM', 'số dòng 601 (phải 0)', R('COOIS_GM').rows.filter(by(R('COOIS_GM'), 'BWART', '601')).length, 0);

  // COOIS Order Header
  const hd = R('COOIS_HDR');
  eq('COOIS_HDR', 'ACT_COST vs FI Nợ 621+622+627', sumColumn(hd, 'ACT_COST'), fiActual);
  eq('COOIS_HDR', 'ACT_COST vs oracle actual', sumColumn(hd, 'ACT_COST'), e.actual);
  eq('COOIS_HDR', 'PLAN_COST vs oracle P', sumColumn(hd, 'PLAN_COST'), e.P);
  eq('COOIS_HDR', 'WEMNG', sumColumn(hd, 'WEMNG'), delivered);
  eq('COOIS_HDR', 'GAMNG', sumColumn(hd, 'GAMNG'), params.orderQuantity);

  // COOIS Components
  const cp = R('COOIS_CMP');
  eq('COOIS_CMP', 'Σ ACT_VAL vs FI Có 152', sumColumn(cp, 'ACT_VAL'), fi152);
  eq('COOIS_CMP', 'Σ ACT_VAL vs oracle cr152', sumColumn(cp, 'ACT_VAL'), e.cr152);
  eq('COOIS_CMP', 'Σ PLAN_VAL vs oracle cr152−dM', sumColumn(cp, 'PLAN_VAL'), e.cr152 - e.dM);
  eq('COOIS_CMP', 'Σ ENMNG vs MB51 Σ 261 MENGE', sumColumn(cp, 'ENMNG'), sumColumn(mb, 'MENGE', by(mb, 'BWART', '261')));

  // COOIS Operations + Confirmations
  for (const [id, lab, mach] of [['COOIS_OPR', 'ACT_LAB_VAL', 'ACT_MACH_VAL'], ['COOIS_CNF', 'LAB_VAL', 'MACH_VAL']]) {
    const r = R(id);
    eq(id, `Σ ${lab} vs FI Có 334`, sumColumn(r, lab), fiCr(t, '334'));
    eq(id, `Σ ${lab} vs oracle cr334`, sumColumn(r, lab), e.cr334);
    eq(id, `Σ ${mach} vs FI Có 214`, sumColumn(r, mach), fiCr(t, '214'));
    eq(id, `Σ ${mach} vs oracle cr214`, sumColumn(r, mach), e.cr214);
  }
  eq('COOIS_CNF', 'LMNGA vs số lượng giao', sumColumn(R('COOIS_CNF'), 'LMNGA'), delivered);

  // KOB1
  const kob = R('KOB1');
  const ki = columnIndex(kob, 'KSTAR');
  const primary = (r: string[]) => ['621', '622', '627'].includes(r[ki]);
  eq('KOB1', 'Σ chi phí ban đầu vs FI Nợ 154 (CO01)', sumColumn(kob, 'WKGBTR', primary), fiDr(t, '154', has('CO01')));
  eq('KOB1', 'Σ chi phí ban đầu vs oracle actual', sumColumn(kob, 'WKGBTR', primary), e.actual);
  eq('KOB1', 'số dư lệnh vs FI 154', sumColumn(kob, 'WKGBTR'), fi154net);
  eq('KOB1', 'số dư lệnh vs oracle wip154', sumColumn(kob, 'WKGBTR'), oracleWip);

  // KKS1
  const kk = R('KKS1');
  const k = (f: string) => sumColumn(kk, f);
  eq('KKS1', 'ACT_COST vs oracle actual', k('ACT_COST'), e.actual);
  eq('KKS1', 'PLAN_COST vs oracle P', k('PLAN_COST'), e.P);
  eq('KKS1', 'WIP vs FI 154', k('WIP'), fi154net);
  eq('KKS1', 'WIP vs oracle wip154', k('WIP'), oracleWip);
  eq('KKS1', 'GR_CREDIT vs FI Có 154 (101)', k('GR_CREDIT'), fiCr(t, '154', has('MIGO 101E')));
  eq('KKS1', 'ACT−GR−SETTLED vs WIP', k('ACT_COST') - k('GR_CREDIT') - k('SETTLED'), k('WIP'));
  eq('KKS1', 'VARIANCE = ACT−TARGET−WIP', k('VARIANCE'), k('ACT_COST') - k('TARGET_COST') - k('WIP'));
  if (e.ratio === 1 || e.ratio === 0) eq('KKS1', 'VARIANCE vs oracle delta×tỷ lệ giao', k('VARIANCE'), e.delta * e.ratio);

  // CK13N
  const ck = R('CK13N');
  eq('CK13N', 'Σ WERT vs oracle P', sumColumn(ck, 'WERT'), e.P);
  eq('CK13N', 'NVL (621) vs oracle cr152−dM', sumColumn(ck, 'WERT', by(ck, 'KSTAR', '621')), e.cr152 - e.dM);
  eq('CK13N', 'NC (622) vs oracle cr334−dL', sumColumn(ck, 'WERT', by(ck, 'KSTAR', '622')), e.cr334 - e.dL);
  eq('CK13N', 'SXC (627) vs oracle cr214−dO', sumColumn(ck, 'WERT', by(ck, 'KSTAR', '627')), e.cr214 - e.dO);
  eq('CK13N', 'Σ WERT vs FI thực tế − oracle delta', sumColumn(ck, 'WERT'), fiActual - e.delta);
  if (valuated && e.ratio === 1)
    for (const acc of ['632110', '632120', '632130', '632140'])
      eq('CK13N', `thành phần ${acc} vs FI Nợ ${acc} (PGI 601E)`, sumColumn(ck, 'WERT', by(ck, 'COGS_ACCT', acc)), fiDr(t, acc, has('MIGO 601E')));

  // SUP01
  const sp = R('SUP01');
  const u = (f: string) => sumColumn(sp, f);
  eq('SUP01', 'REVENUE vs oracle', u('REVENUE'), e.revenue_recognized);
  eq('SUP01', 'REVENUE vs FI Có 511 (VF01)', u('REVENUE'), fiCr(t, '511', (c) => c === 'VF01'));
  eq('SUP01', 'GROSS_PROFIT vs oracle gp911', u('GROSS_PROFIT'), e.gp911_credit);
  eq('SUP01', 'GROSS_PROFIT vs FI 911', u('GROSS_PROFIT'), fiCr(t, '911') - fiDr(t, '911'));
  eq('SUP01', 'WIP vs oracle wip154', u('WIP'), oracleWip);
  eq('SUP01', 'ACT_COST vs oracle actual', u('ACT_COST'), e.actual);
  eq('SUP01', 'PLAN_COST vs oracle P', u('PLAN_COST'), e.P);
  return issues;
}

/** Ô bị sửa cho test âm tính: một ô số mà đối soát của báo cáo đó có kiểm. */
const TAMPER: Record<string, string> = {
  FAGLL03: 'HSL', MB51: 'DMBTR', COOIS_HDR: 'ACT_COST', COOIS_CMP: 'ACT_VAL', COOIS_OPR: 'ACT_LAB_VAL',
  COOIS_CNF: 'LAB_VAL', COOIS_GM: 'DMBTR', KOB1: 'WKGBTR', KKS1: 'ACT_COST', CK13N: 'WERT', SUP01: 'REVENUE',
};

async function main() {
  const fails: string[] = [];
  let cases = 0;
  let negatives = 0;
  const reportIds = new Set<string>();
  for (const e of expected) {
    const label = `${e.src}/${e.stock}/${e.pct}%/giao ${e.ratio * 100}%`;
    const s = scenario(e);
    const reps = buildAll(s);
    if (reps.length !== 11) throw new Error(`phải có 11 báo cáo, có ${reps.length}`);
    for (const i of reconcile(reps, s.table, e, s.params)) fails.push(`${label}: ${i}`);
    // Q5 = (a) (S4): dòng BOM ROH-ADD-ESD phải xuất hiện ở MB51/COOIS_CMP/CK13N đúng khi và chỉ khi preset có phụ phí texture/kg
    // (đáp án theo oracle: denso-sensor có, samsung/canon không — không suy từ chính computeMTO).
    const wantEsd = e.src === 'denso-sensor';
    for (const id of ['MB51', 'COOIS_CMP', 'CK13N']) {
      const hasEsd = reps.find((r) => r.reportId === id)!.rows.some((row) => row.some((cell) => cell.includes('ROH-ADD-ESD')));
      if (hasEsd !== wantEsd) fails.push(`${label}: ${id} ${wantEsd ? 'thiếu' : 'thừa'} dòng ROH-ADD-ESD`);
    }

    const again = buildAll(scenario(e)); // lần sinh thứ 2: timestamp ACDOCA khác → hash phải giữ nguyên
    for (let ri = 0; ri < reps.length; ri++) {
      const r = reps[ri];
      reportIds.add(r.reportId);
      if (r.rows.length === 0 && r.reportId !== 'COOIS_GM') fails.push(`${label}: ${r.reportId} rỗng`);
      const raw = toRawExport(r);
      const h = await sha256Hex(raw.bytes);
      if (h !== (await sha256Hex(toRawExport(again[ri]).bytes))) fails.push(`${label}: ${r.reportId} không tất định`);
      if (!raw.text.includes('SIMULATED') || !raw.text.includes('TT99')) fails.push(`${label}: ${r.reportId} thiếu banner SIMULATED/TT99`);
      const m = await buildManifest(r, raw, r.rows.length, {});
      if (!/^[0-9a-f]{64}$/.test(m.sha256) || m.rowCount !== r.rows.length || m.bytes !== raw.bytes.length)
        fails.push(`${label}: ${r.reportId} manifest sai`);

      // Âm tính: sửa 1 số (+1) ở dòng đầu ⇒ hash đổi VÀ đối soát phải báo đúng báo cáo đó
      const bad = reps.map((x) => ({ ...x, rows: x.rows.map((row) => [...row]) }));
      const ci = columnIndex(bad[ri], TAMPER[r.reportId]);
      bad[ri].rows[0][ci] = String(Number(bad[ri].rows[0][ci]) + 1);
      if ((await sha256Hex(toRawExport(bad[ri]).bytes)) === h) fails.push(`${label}: ${r.reportId} sửa số không đổi hash`);
      const caught = reconcile(bad, s.table, e, s.params).filter((x) => x.startsWith(`${r.reportId}:`));
      if (caught.length === 0) fails.push(`${label}: ${r.reportId} sửa ${TAMPER[r.reportId]} +1 KHÔNG bị đối soát phát hiện`);
      negatives++;
    }
    cases++;
  }
  if (cases !== 54) fails.push(`chỉ chạy ${cases}/54 ca`);

  // Trạng thái giao diện: bảng dở dang (mới chạy bước 1..k) và bảng có CKMLCP — dựng được, đúng danh mục, FAGLL03 cân.
  let uiStates = 0;
  for (const preset of PRESET_SCENARIOS) {
    for (const stock of ['Valuated', 'Non-valuated'] as const) {
      const params: MTOParameters = { ...preset.params, stockType: stock, actualVariancePercent: 3.5 };
      const c = computeMTO(params);
      const tables: [string, AcdocaLine[]][] = [];
      for (let k = 1; k <= 7; k++) {
        const t: AcdocaLine[] = [];
        for (let st = 1; st <= k; st++) t.push(...generateStepEntries(st, params, c, 0, 0, null).acdoca);
        tables.push([`bước 1..${k}`, t]);
      }
      const ml: AcdocaLine[] = [];
      for (let st = 1; st <= 6; st++) ml.push(...generateStepEntries(st, params, c, 0, 0, null).acdoca);
      postCkmlcp(ml, params, c, 0);
      ml.push(...generateStepEntries(7, params, c, 0, 0, null, { skipVa88Variance: true }).acdoca);
      tables.push(['CKMLCP + bước 7', ml]);
      for (const [name, t] of tables) {
        const tag = `${preset.id}/${stock}/${name}`;
        try {
          const reps = buildAllReports(params, c, t);
          if (reps.map((r) => r.reportId).join() !== REPORT_IDS.join()) fails.push(`${tag}: danh mục lệch`);
          const fg = fagll03Totals(reps[0]);
          if (fg.net !== 0 || fg.debit !== t.reduce((x, l) => x + l.drAmount, 0)) fails.push(`${tag}: FAGLL03 không khớp bảng`);
          const kob = reps.find((r) => r.reportId === 'KOB1')!;
          const net154 = t.filter((l) => l.glAccount === '154').reduce((x, l) => x + l.drAmount - l.crAmount, 0);
          const co01Done = t.some((l) => l.tCode === 'CO01');
          if (co01Done && sumColumn(kob, 'WKGBTR') !== net154) fails.push(`${tag}: KOB1 ${sumColumn(kob, 'WKGBTR')} ≠ số dư 154 ${net154}`);
        } catch (err) {
          fails.push(`${tag}: THROW ${String(err instanceof Error ? err.message : err).split('\n')[0]}`);
        }
        uiStates++;
      }
    }
  }
  if ([...reportIds].join() !== REPORT_IDS.join()) fails.push(`danh mục báo cáo ${[...reportIds].join()} ≠ registry`);
  if (Object.keys(TAMPER).sort().join() !== [...REPORT_IDS].sort().join()) fails.push('TAMPER không phủ đủ danh mục báo cáo');
  if (fails.length) {
    console.error(`FAIL ${fails.length}:\n` + fails.slice(0, 40).join('\n'));
    process.exit(1);
  }
  console.log(`PASS S3 ${reportIds.size} báo cáo × ${cases}/54 ca: Σ báo cáo = Σ ACDOCA = oracle; tất định; manifest; ${negatives} test âm tính đều bị bắt`);
  console.log(`   báo cáo: ${[...reportIds].join(', ')}; ${uiStates} trạng thái giao diện (bảng dở dang/CKMLCP) dựng được`);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
