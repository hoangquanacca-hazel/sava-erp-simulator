/**
 * test:copilot-pr12 — nghiệm thu Tầng A cho Copilot PR-1 + PR-2 (không cần LLM, chạy trên engine thật).
 *
 * KHÔNG có nhánh fallback: thiếu dữ liệu đầu vào → assert lỗi → exit != 0. Mọi vòng lặp có đếm số ca
 * tối thiểu để test không thể "xanh rỗng".
 *
 * PR-1  evaluateStepGate == khối cổng cũ của App.executeStepInternal (chép nguyên văn từ main@8c77967),
 *       so từng ký tự thông báo và đúng kênh hiển thị (alert vs modal SoD).
 * PR-2  m6Copilot mặc định TẮT; AuditEvent có 4 trường mới; buildAcdocaTable qua repository
 *       cho ra đúng dòng sổ VÀ đúng hash báo cáo như cách nối mảng cũ, trên 54 ca A0.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESET_SCENARIOS, type AcdocaLine, type MTOParameters } from '../src/types';
import { computeMTO, generateStepEntries } from '../src/utils/calculator';
import { exportReportSnapshot } from '../src/reports/snapshot';
import { mdgGateOpen } from '../src/features/mdg';
import { canRoleRunStep, SIM_ROLES, type AuditEvent, type SimRole } from '../src/features/sod';
import { evaluateStepGate, MSG_PERIOD_LOCKED } from '../src/features/stepGate';
import { FEATURE_FLAG_DEFAULTS, loadFeatureFlags } from '../src/features/flags';
import { buildAcdocaTable, InMemoryJournalRepository } from '../src/ledger/journalRepository';

// ---------------------------------------------------------------- PR-1
/** Oracle: khối cổng cũ, chép nguyên văn (chỉ thay window.alert/setSodModal bằng biến ghi lại). */
function legacyGate(stepId: number, fiPeriodLocked: boolean, flags: { m4MdgGate: boolean; m5SodRbac: boolean }, params: MTOParameters, simRole: SimRole) {
  let alertMsg: string | null = null, sodModal: string | null = null;
  const window = { alert: (m: string) => { alertMsg = m; } };
  const setSodModal = (m: string) => { sodModal = m; };
  const run = (): boolean => {
    if (fiPeriodLocked) {
      window.alert('OB52 đã khóa kỳ FI — không ghi sổ thêm (MÔ PHỎNG).');
      return false;
    }
    if (flags.m4MdgGate && stepId === 1) {
      const gate = mdgGateOpen(params);
      if (!gate.ok) {
        window.alert(`BLOCK Step 1 — master data chưa duyệt: ${gate.missing.join(', ')}`);
        return false;
      }
    }
    if (flags.m5SodRbac) {
      const sod = canRoleRunStep(simRole, stepId);
      if (!sod.ok) {
        setSodModal(sod.reason);
        return false;
      }
    }
    return true;
  };
  const passed = run();
  return { passed, alertMsg: alertMsg as string | null, sodModal: sodModal as string | null };
}

const basePreset = PRESET_SCENARIOS[0];
assert.ok(basePreset, 'thiếu PRESET_SCENARIOS');
const paramVariants: MTOParameters[] = [
  { ...basePreset.params, mdgMaterialApproved: true, mdgBomApproved: true, mdgRoutingApproved: true, mdgRatesApproved: true },
  { ...basePreset.params, mdgMaterialApproved: false, mdgBomApproved: true, mdgRoutingApproved: false, mdgRatesApproved: true },
];
let cases = 0;
const seen = { allowed: 0, period_locked: 0, mdg_blocked: 0, sod_denied: 0 };
for (const params of paramVariants)
  for (const locked of [false, true])
    for (const m4MdgGate of [false, true])
      for (const m5SodRbac of [false, true])
        for (const role of SIM_ROLES)
          for (let stepId = 1; stepId <= 7; stepId++) {
            const flags = { m4MdgGate, m5SodRbac };
            const old = legacyGate(stepId, locked, flags, params, role);
            const now = evaluateStepGate({ stepId, fiPeriodLocked: locked, flags, params, role });
            const ctx = JSON.stringify({ stepId, locked, flags, role, mdg: params.mdgMaterialApproved });
            assert.equal(now.ok, old.passed, ctx);
            assert.equal(now.stepId, stepId, ctx);
            if (now.ok) {
              assert.equal(now.kind, undefined, ctx); assert.equal(now.reason, undefined, ctx);
              seen.allowed++;
            } else {
              assert.ok(now.kind && now.reason, ctx);
              // Đúng kênh hiển thị cũ: SoD → modal, còn lại → alert; và đúng nguyên văn.
              if (now.kind === 'sod_denied') { assert.equal(old.sodModal, now.reason, ctx); assert.equal(old.alertMsg, null, ctx); }
              else { assert.equal(old.alertMsg, now.reason, ctx); assert.equal(old.sodModal, null, ctx); }
              seen[now.kind as keyof typeof seen]++;
            }
            cases++;
          }
assert.equal(cases, 2 * 2 * 2 * 2 * SIM_ROLES.length * 7);
for (const [k, n] of Object.entries(seen)) assert.ok(n > 0, `không có ca nào thuộc nhánh ${k} — test rỗng`);
assert.equal(evaluateStepGate({ stepId: 3, fiPeriodLocked: true, flags: { m4MdgGate: true, m5SodRbac: true }, params: paramVariants[1], role: 'Sales' }).reason, MSG_PERIOD_LOCKED, 'khóa kỳ phải ưu tiên trước MDG/SoD');

// Chốt cấu trúc: runStep không được tự hiển thị (alert/modal chỉ ở presentStepResult).
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const runStepBody = app.slice(app.indexOf('const runStep = '), app.indexOf('const executeStepInternal = '));
assert.ok(runStepBody.length > 500, 'không tìm thấy thân runStep trong App.tsx');
assert.ok(!/window\.alert|setSodModal/.test(runStepBody), 'runStep vẫn gọi alert/modal trực tiếp');
assert.match(app, /const executeStepInternal = \(stepId: number\): StepResult => presentStepResult\(runStep\(stepId\)\);/);
// Hiển thị Classic: chỉ khóa kỳ/MDG mới alert, SoD → modal, QM chờ xử lý → im lặng (như main).
const present = app.slice(app.indexOf('const presentStepResult = '), app.indexOf('const runStep = '));
assert.match(present, /if \(result\.kind === 'sod_denied'\) setSodModal\(result\.reason\);/);
assert.match(present, /else if \(result\.kind === 'period_locked' \|\| result\.kind === 'mdg_blocked'\) window\.alert\(result\.reason\);/);
assert.equal((present.match(/window\.alert|setSodModal/g) || []).length, 2, 'presentStepResult có thêm lời gọi hiển thị lạ');
// Thứ tự cũ: audit ghi SAU cổng và TRƯỚC nhánh QM bước 4.
// PR-3: lõi chạy bước đã tách sang planStepRun (src/features/stepRun.ts). Thứ tự cổng → audit → QM kiểm ở đó;
// App.runStep phải gọi planStepRun và không tự ghi audit trước khi có kế hoạch.
assert.match(runStepBody, /planStepRun\(\{/, 'App.runStep không còn gọi planStepRun');
const stepRunSrc = readFileSync(new URL('../src/features/stepRun.ts', import.meta.url), 'utf8');
const iGate = stepRunSrc.indexOf('if (!gate.ok) return {'), iAudit = stepRunSrc.indexOf('audit: true'), iQm = stepRunSrc.indexOf('if (stepId === 4)');
assert.ok(iGate > 0 && iQm > iGate && iAudit > iGate, 'thứ tự cổng → audit → QM bị đổi');
assert.match(stepRunSrc, /if \(!gate\.ok\) return \{ result: gate, audit: false,/, 'cổng bị chặn vẫn cho phép ghi audit');
assert.ok(runStepBody.indexOf('if (plan.audit)') > runStepBody.indexOf('planStepRun({'), 'App ghi audit trước khi có kế hoạch cổng');
// ACDOCA_TABLE: bước → assertParity (chỉ dòng bước) → extra qua repository → trả repo.lines().
const acd = app.slice(app.indexOf('const ACDOCA_TABLE = useMemo('), app.indexOf('}, [stepStates, params, extraAcdoca]);'));
const order = ['buildAcdocaTable(stepStates, [], repo)', 'assertParity(stepEntries, table', 'repo.append(extraAcdoca);', 'return [...repo.lines()];'].map((k) => acd.indexOf(k));
assert.ok(order.every((x, i) => x > 0 && (i === 0 || x > order[i - 1])), `ACDOCA_TABLE sai thứ tự/thiếu bước: ${order}`);

// ---------------------------------------------------------------- PR-2: flag + audit
assert.equal(FEATURE_FLAG_DEFAULTS.m6Copilot, false, 'm6Copilot phải mặc định TẮT');
assert.equal(loadFeatureFlags().m6Copilot, false);
for (const [k, v] of Object.entries(FEATURE_FLAG_DEFAULTS)) if (k !== 'm6Copilot') assert.equal(v, true, `flag cũ ${k} bị đổi mặc định`);
const ev: AuditEvent = {
  id: 'a-1', action: 'Execute step 3', role: 'Kế toán trưởng', time: '2026-10-22T00:00:00Z', sessionId: 'SIM-1',
  channel: 'copilot', prompt: 'chạy bước 3', parsedIntent: { tool: 'run_mto_step', input: { stepId: 3 } }, confirmedBy: 'Kế toán trưởng',
};
assert.equal(ev.parsedIntent?.tool, 'run_mto_step');
assert.match(app, /channel: 'classic'/, 'audit Classic phải gắn channel');

// ---------------------------------------------------------------- PR-2: repository parity trên engine thật
const repo = new InMemoryJournalRepository();
const sample = { txnId: 't', lineId: 'l', stepId: 1 } as AcdocaLine;
const input = [sample];
repo.append(input); input.length = 0;
const got = repo.lines();
assert.equal(got.length, 1, 'repository phải tách khỏi mảng đầu vào');
assert.ok(Object.isFrozen(got));
assert.throws(() => (got as AcdocaLine[]).push(sample));
assert.equal(repo.lines().length, 1);

const expected = JSON.parse(readFileSync(new URL('./a0_expected.json', import.meta.url), 'utf8')) as Array<{ src: string; stock: string; pct: number; ratio: number }>;
assert.equal(expected.length, 54, 'a0_expected.json phải có 54 ca');
let lineCount = 0, snapCount = 0;
for (const e of expected) {
  const preset = PRESET_SCENARIOS.find((p) => p.id === e.src);
  assert.ok(preset, `thiếu preset ${e.src}`);
  const p = { ...preset.params, stockType: e.stock, actualVariancePercent: e.pct, deliveredQuantity: Math.round(preset.params.orderQuantity * e.ratio) } as MTOParameters;
  const c = computeMTO(p);
  const stepStates: Record<number, { isExecuted: boolean; acdocaLines: AcdocaLine[] }> = {};
  const legacy: AcdocaLine[] = [];
  for (let st = 1; st <= 7; st++) {
    const lines = generateStepEntries(st, p, c, 0, 0, null).acdoca;
    stepStates[st] = { isExecuted: true, acdocaLines: lines };
    legacy.push(...lines);
  }
  assert.ok(legacy.length > 0);
  // Dòng phát sinh thêm (giả lập "extraAcdoca" = lặp dòng cuối với id riêng) để kiểm thứ tự ghép.
  const extra = [{ ...legacy[legacy.length - 1], lineId: 'EXTRA-1' }];
  const viaRepo = buildAcdocaTable(stepStates, extra);
  assert.deepEqual(viaRepo, [...legacy, ...extra], `${e.src}/${e.stock}/${e.pct}/${e.ratio}`);
  // Chỉ chạy một phần (bước 1–3 và 5): bước chưa chạy phải bị bỏ qua đúng như vòng lặp cũ.
  const partial = { ...stepStates, 4: { ...stepStates[4], isExecuted: false }, 6: { ...stepStates[6], isExecuted: false }, 7: { ...stepStates[7], isExecuted: false } };
  const legacyPartial = [1, 2, 3, 5].flatMap((s) => stepStates[s].acdocaLines);
  assert.deepEqual(buildAcdocaTable(partial, []), legacyPartial);
  // Cùng số báo cáo: hash từng báo cáo SAP giống hệt khi dựng từ hai đường.
  const [a, b] = await Promise.all([exportReportSnapshot(p, c, legacy), exportReportSnapshot(p, c, buildAcdocaTable(stepStates, []))]);
  assert.ok(a.length > 0);
  assert.deepEqual(b.map((s) => s.manifest.sha256), a.map((s) => s.manifest.sha256));
  lineCount += viaRepo.length; snapCount += a.length;
}
assert.ok(lineCount > 54 && snapCount > 54);
console.log(`copilot-pr12 PASS — gate ${cases} ca (${JSON.stringify(seen)}), repository 54 ca A0 / ${lineCount} dòng / ${snapCount} báo cáo hash khớp`);
