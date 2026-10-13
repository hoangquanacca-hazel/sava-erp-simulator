/**
 * test:s4 (S4/T3+T4) — màn hình bóc tách giá thành & giờ công hiển thị (AUD-038, AUD-040).
 *  1. 40 ca của costing_expected.json (đáp án oracle): Σ lá cây BOM = Σ con của gốc = Σ nhóm bóc tách = plannedCost = P của oracle.
 *  2. Chế độ "theo giờ": giờ công hiển thị × đơn giá = 622 và giờ máy hiển thị × đơn giá = máy 627 (oracle); giờ hiển thị = giờ vận hành thực tính.
 *  3. Test âm tính: sửa 1 VND một nút lá / một giờ → phải bị phát hiện.
 * Không đổi số học: chỉ đối chiếu màn hình với computeMTO và oracle. Sai là exit 1.
 */
import { readFileSync } from 'node:fs';
import { PRESET_SCENARIOS } from '../src/types.ts';
import type { BOMComponentNode } from '../src/types.ts';
import { buildBOMTree, buildCostBreakdown, computeMTO, resolveDisplayHours } from '../src/utils/calculator.ts';

interface Case { id: string; src: string; override: Record<string, string>; L: number; machine: number; P: number }
const cases: Case[] = JSON.parse(readFileSync(new URL('./costing_expected.json', import.meta.url), 'utf8'));
if (cases.length !== 40) throw new Error(`oracle phải có 40 ca, có ${cases.length}`);

const leaves = (n: BOMComponentNode): BOMComponentNode[] => (n.children?.length ? n.children.flatMap(leaves) : [n]);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Trả danh sách sai lệch cho một ca; rỗng = đạt. */
function check(e: Case, tamper?: 'leaf' | 'hours'): string[] {
  const preset = PRESET_SCENARIOS.find((p) => p.id === e.src)!;
  const params = { ...preset.params, ...e.override };
  const c = computeMTO(params);
  const tree = buildBOMTree(params, c);
  const bd = buildCostBreakdown(params, c);
  const out: string[] = [];
  const leafSum = sum(leaves(tree).map((n) => n.totalCost)) + (tamper === 'leaf' ? 1 : 0);
  const childSum = sum((tree.children ?? []).map((n) => n.totalCost));
  const groupSum = bd.raw_material.totalCost + bd.labor.totalCost + bd.overhead.totalCost;
  const itemSum = sum([bd.raw_material, bd.labor, bd.overhead].flatMap((g) => g.items.map((i) => i.cost)));
  for (const [k, v] of [['Σ lá cây BOM', leafSum], ['Σ con của gốc', childSum], ['Σ 3 nhóm bóc tách', groupSum], ['Σ dòng bóc tách', itemSum], ['plannedCost', c.plannedCost]] as const) {
    if (v !== e.P) out.push(`${k}=${v} ≠ oracle P=${e.P}`);
  }
  const h = resolveDisplayHours(params, c);
  const lh = h.laborHours === null ? null : h.laborHours + (tamper === 'hours' ? 0.5 : 0);
  if (params.laborCostMode === 'hourly') {
    if (lh === null || Math.round(lh * h.laborRate) !== e.L) out.push(`giờ công hiển thị ${lh} × ${h.laborRate} ≠ 622 oracle ${e.L}`);
    if (h.laborHours !== c.operatingHours) out.push(`giờ công hiển thị ${h.laborHours} ≠ giờ vận hành ${c.operatingHours}`);
    const ln = leaves(tree).find((n) => n.id === 'bom-labor-op')!;
    if (Math.round(ln.totalQuantity * ln.unitCost) !== e.L) out.push(`nút nhân công: ${ln.totalQuantity} × ${ln.unitCost} ≠ ${e.L}`);
  } else if (h.laborHours !== null) out.push('chế độ tổng nhưng vẫn hiển thị giờ công');
  if (params.machineCostMode === 'hourly') {
    if (h.machineHours === null || Math.round(h.machineHours * h.machineRate) !== e.machine) out.push(`giờ máy hiển thị × đơn giá ≠ máy oracle ${e.machine}`);
  }
  return out;
}

const fails: string[] = [];
for (const e of cases) for (const m of check(e)) fails.push(`${e.id}: ${m}`);

// Âm tính: mỗi kiểu sửa phải làm FAIL trên TẤT CẢ ca (nếu không, test không bắt được lỗi)
let negatives = 0;
for (const kind of ['leaf', 'hours'] as const) {
  for (const e of cases) {
    const hourly = (PRESET_SCENARIOS.find((p) => p.id === e.src)!.params.laborCostMode) === 'hourly';
    if (kind === 'hours' && !hourly) continue;
    if (check(e, kind).length === 0) fails.push(`âm tính '${kind}' không bị bắt ở ${e.id}`);
    negatives++;
  }
}
const modes = PRESET_SCENARIOS.map((p) => `${p.id}:${p.params.laborCostMode}`).join(' ');
if (fails.length) {
  console.error(`FAIL test:s4 ${fails.length} lỗi:\n  ` + fails.slice(0, 30).join('\n  '));
  process.exit(1);
}
console.log(`PASS test:s4 ${cases.length}/40 ca: Σ bóc tách = plannedCost = oracle P; giờ công × đơn giá = 622; ${negatives} test âm tính bị bắt (${modes})`);
