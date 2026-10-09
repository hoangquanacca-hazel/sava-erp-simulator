/**
 * test:costing (S3/T2) — so computeMTO (TS) với oracle giá thành độc lập (scripts/oracle_costing.py →
 * costing_expected.json): 3 preset + ma trận biến thể Strategy 25 (Denso 4 màu × 3 texture × 3 bao bì)
 * + Strategy 20 gắn mã biến thể. So khớp TUYỆT ĐỐI từng dòng BOM, M/L/máy/SXC/add-on/O/P/Rev. Sai là exit 1.
 */
import { readFileSync } from 'node:fs';
import { PRESET_SCENARIOS } from '../src/types.ts';
import { computeMTO } from '../src/utils/calculator.ts';

interface Case {
  id: string; src: string; override: Record<string, string>;
  M: number; L: number; O: number; P: number; Rev: number; machine: number; sxc: number; addon: number;
  bom: Record<string, number>;
}
const cases: Case[] = JSON.parse(readFileSync(new URL('./costing_expected.json', import.meta.url), 'utf8'));
if (cases.length !== 3 + 36 + 1) throw new Error(`oracle phải có 40 ca, có ${cases.length}`);

const fails: string[] = [];
for (const e of cases) {
  const preset = PRESET_SCENARIOS.find((p) => p.id === e.src);
  if (!preset) { fails.push(`${e.id}: không thấy preset ${e.src}`); continue; }
  const c = computeMTO({ ...preset.params, ...e.override });
  const bomTs: Record<string, number> = {};
  for (const b of c.bomItemBreakdowns) bomTs[b.itemCode.startsWith('ROH-MB') || b.itemCode.startsWith('VERP') ? b.itemCode : 'ROH-RESIN'] = b.totalCost;
  const got: Record<string, number> = {
    M: c.directMaterialCost621, L: c.directLaborCost622, machine: c.machineOverhead627, sxc: c.factoryOverhead627,
    addon: c.variantAddonTotal, O: c.effectiveMachineCost + c.variantAddonTotal, P: c.plannedCost, Rev: c.totalRevenue,
  };
  const diffs: string[] = [];
  for (const k of ['M', 'L', 'machine', 'sxc', 'addon', 'O', 'P', 'Rev'] as const) {
    if (got[k] !== e[k]) diffs.push(`${k} TS=${got[k]} oracle=${e[k]} Δ=${got[k] - e[k]}`);
  }
  const codes = new Set([...Object.keys(bomTs), ...Object.keys(e.bom)]);
  for (const k of codes) if (bomTs[k] !== e.bom[k]) diffs.push(`BOM ${k} TS=${bomTs[k]} oracle=${e.bom[k]}`);
  if (diffs.length) fails.push(`${e.id}: ${diffs.join('; ')}`);
}

const byPreset = (id: string) => fails.some((f) => f.startsWith(id + ':')) ? 'FAIL' : 'PASS';
console.log(`samsung-cover ${byPreset('samsung-cover')} | canon-frame ${byPreset('canon-frame')} | denso-sensor ${byPreset('denso-sensor')}`);
if (fails.length) {
  console.error(`FAIL test:costing ${fails.length}/${cases.length} ca lệch oracle:`);
  for (const f of fails) console.error('  ' + f);
  process.exit(1);
}
console.log(`PASS test:costing ${cases.length}/${cases.length} ca: computeMTO = oracle giá thành độc lập (Q1 = a)`);
