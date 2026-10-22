/**
 * test:copilot-pr3 — nghiệm thu Tầng A cho Copilot PR-3 (tool registry + thẻ xác nhận, KHÔNG LLM).
 *
 * Chạy trên engine thật: computeMTO, generateStepEntries, planStepRun, evaluateStepGate, canRoleRunStep.
 * KHÔNG có nhánh fallback: thiếu dữ liệu → assert lỗi → exit != 0. Không sinh dữ liệu giả.
 *
 * Bất biến cần chứng minh:
 *  B1  0 ghi sổ khi chưa xác nhận: đề xuất run_mto_step chỉ tạo thẻ, runStep gọi = 0, state không đổi.
 *  B2  0 vượt quyền: vai trò không đủ SoD bị từ chối trước khi lên thẻ; xác nhận bởi vai trò khác bị từ chối.
 *  B3  Flag m6Copilot tắt → mọi đề xuất bị từ chối, 0 ghi sổ.
 *  B4  Thẻ dùng 1 lần; xác nhận lại → unknown_pending, 0 ghi sổ thêm.
 *  B5  Xác nhận đúng → runStep gọi đúng 1 lần, audit meta có channel=copilot, prompt, parsedIntent, confirmedBy.
 *  B6  Schema: trường lạ / thiếu / sai kiểu / ngoài enum → invalid_input, 0 ghi sổ.
 *  B7  Cổng engine vẫn áp cho Copilot: bước chưa đủ tiền điều kiện / khóa kỳ → precheck_failed, không lên thẻ.
 *  B8  Tool không ghi sổ (navigate, check_close_readiness, explain_variance, ask_knowledge) chạy trực tiếp, không thẻ.
 *  B9  Mọi tool có ghi sổ đều requiresConfirmation = true.
 */
import assert from 'node:assert/strict';
import { PRESET_SCENARIOS, type MTOParameters, type StepRuntimeState } from '../src/types';
import { computeMTO } from '../src/utils/calculator';
import { EMPTY_CLOSE } from '../src/features/periodClose';
import { FEATURE_FLAG_DEFAULTS, type FeatureFlagKey } from '../src/features/flags';
import { planStepRun } from '../src/features/stepRun';
import { SIM_ROLES, type SimRole, type StepAuditMeta } from '../src/features/sod';
import { StepResult } from '../src/features/stepGate';
import { COPILOT_TOOLS, createCopilotSession, type CopilotContext } from '../src/copilot/registry';

// Master data đã duyệt (MDG) để bước 1 qua cổng; ca MDG chưa duyệt được test riêng ở B7.
const params0: MTOParameters = {
  ...PRESET_SCENARIOS[0].params,
  mdgMaterialApproved: true,
  mdgBomApproved: true,
  mdgRoutingApproved: true,
  mdgRatesApproved: true,
};
const paramsNoMdg: MTOParameters = { ...params0, mdgBomApproved: false };
const computed = computeMTO(params0);
const flagsOn = { ...FEATURE_FLAG_DEFAULTS, m6Copilot: true } as Record<FeatureFlagKey, boolean>;
const flagsOff = { ...FEATURE_FLAG_DEFAULTS, m6Copilot: false } as Record<FeatureFlagKey, boolean>;

const emptyStep = (): StepRuntimeState => ({
  isExecuted: false, qmDecision: null, qmReworkCost: 0, qmScrapCost: 0, qmReworkHandled: false,
  actualVariancePercent: 0, entries: [], acdocaLines: [],
});
const freshStates = (): Record<number, StepRuntimeState> =>
  Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((id) => [id, emptyStep()]));

/** Trạng thái engine thật: runStep ở đây là planStepRun + áp patch — đúng đường ghi sổ mà App dùng. */
function makeHarness(role: SimRole, flags = flagsOn) {
  let states = freshStates();
  let current = 1;
  const calls: Array<{ stepId: number; meta: StepAuditMeta }> = [];
  const ctx: CopilotContext = {
    role,
    flags,
    params: params0,
    computed,
    closeState: { ...EMPTY_CLOSE },
    stepStates: states,
    currentStepId: current,
    registrationBlock: () => null,
    runStep(stepId, meta): StepResult {
      calls.push({ stepId, meta });
      const plan = planStepRun({
        stepId, fiPeriodLocked: ctx.closeState.fiPeriodLocked,
        flags: { m4MdgGate: flags.m4MdgGate, m5SodRbac: flags.m5SodRbac },
        params: params0, computed, role, stepStates: states, currentStepId: current,
      });
      if (plan.stepPatch) states = { ...states, [stepId]: { ...states[stepId], ...plan.stepPatch } };
      if (plan.nextStepId !== null) current = plan.nextStepId;
      return plan.result;
    },
    navigate: () => {},
    openTutor: () => {},
  };
  // Đồng bộ ctx với state mới nhất trước mỗi lượt (App làm việc này bằng render lại).
  const sync = () => { ctx.stepStates = states; ctx.currentStepId = current; };
  return { ctx, sync, calls: () => calls, states: () => states };
}

let cases = 0;

// ---- B1: không xác nhận → không ghi sổ
{
  const h = makeHarness('Kế toán trưởng');
  const s = createCopilotSession();
  h.sync();
  const before = JSON.stringify(h.states());
  const out = s.propose(h.ctx, { tool: 'run_mto_step', input: { stepId: 1 } }, 'chạy bước 1');
  assert.equal(out.status, 'needs_confirmation', `run_mto_step phải tạo thẻ: ${JSON.stringify(out)}`);
  assert.equal(h.calls().length, 0, 'B1 vi phạm: ghi sổ khi chưa xác nhận');
  assert.equal(JSON.stringify(h.states()), before, 'B1 vi phạm: state đổi khi chỉ đề xuất');
  assert.equal(s.pendingCount(), 1);
  cases++;
}

// ---- B2: SoD
{
  const h = makeHarness('Sales');
  const s = createCopilotSession();
  h.sync();
  // Sales không được chạy bước 3 (Kho/Kế hoạch SX/Kế toán trưởng)
  const out = s.propose(h.ctx, { tool: 'run_mto_step', input: { stepId: 3 } });
  assert.equal(out.status, 'rejected');
  assert.equal((out as { code: string }).code, 'precheck_failed');
  assert.match((out as { reason: string }).reason, /SoD|phân quyền/);
  assert.equal(h.calls().length, 0, 'B2 vi phạm: vượt quyền');
  cases++;

  // allowedRoles phải chặn TRƯỚC precheck: check_close_readiness chỉ Kế toán trưởng; precheck của nó không kiểm vai trò.
  const hr = makeHarness('Sales');
  const sr = createCopilotSession();
  hr.sync();
  const rd = sr.propose(hr.ctx, { tool: 'check_close_readiness', input: {} });
  assert.equal((rd as { code: string }).code, 'role_denied', 'B2 vi phạm: allowedRoles không chặn tool chỉ đọc');
  cases++;

  // Xác nhận bởi vai trò khác vai trò đã đề xuất
  const h2 = makeHarness('Kế toán trưởng');
  const s2 = createCopilotSession();
  h2.sync();
  const p = s2.propose(h2.ctx, { tool: 'run_mto_step', input: { stepId: 1 } });
  assert.equal(p.status, 'needs_confirmation');
  const id = (p as { pending: { id: string } }).pending.id;
  const h2b = makeHarness('Sales'); // cùng state gốc nhưng vai trò khác
  h2b.sync();
  const c = s2.confirm({ ...h2.ctx, role: 'Sales' }, id, 'Sales');
  assert.equal(c.status, 'rejected');
  assert.equal(h2.calls().length, 0, 'B2 vi phạm: xác nhận bởi vai trò khác vẫn ghi sổ');
  cases++;
}

// ---- B3: flag tắt
{
  const h = makeHarness('Kế toán trưởng', flagsOff);
  const s = createCopilotSession();
  h.sync();
  const out = s.propose(h.ctx, { tool: 'run_mto_step', input: { stepId: 1 } });
  assert.equal((out as { code: string }).code, 'copilot_off');
  assert.equal(h.calls().length, 0);
  cases++;
}

// ---- B4 + B5: xác nhận đúng → ghi đúng 1 lần, audit đủ trường; thẻ dùng 1 lần
{
  const h = makeHarness('Kế toán trưởng');
  const s = createCopilotSession();
  h.sync();
  const p = s.propose(h.ctx, { tool: 'run_mto_step', input: { stepId: 1 } }, 'chạy bước 1 giúp tôi');
  const pending = (p as { pending: { id: string; card: { postings: unknown[]; lines: string[] } } }).pending;
  // Bước 1 (CO planning) không sinh bút toán FI trong engine: thẻ phải nói đúng 0, không bịa.
  assert.equal(pending.card.postings.length, 0, 'thẻ bước 1 phải khớp engine (0 bút toán)');
  assert.ok(pending.card.lines.some((l) => /Số bút toán sẽ ghi: 0/.test(l)), 'thẻ phải ghi rõ số bút toán');
  const ok = s.confirm(h.ctx, pending.id, 'Kế toán trưởng');
  assert.equal(ok.status, 'done');
  assert.equal(h.calls().length, 1, 'B5: xác nhận đúng phải ghi đúng 1 lần');
  const meta = h.calls()[0].meta;
  assert.equal(meta.channel, 'copilot');
  assert.equal(meta.prompt, 'chạy bước 1 giúp tôi');
  assert.deepEqual(meta.parsedIntent, { tool: 'run_mto_step', input: { stepId: 1 } });
  assert.equal(meta.confirmedBy, 'Kế toán trưởng');
  assert.ok(h.states()[1].isExecuted, 'bước 1 phải đánh dấu đã chạy qua engine');
  assert.equal(h.states()[1].entries.length, 0, 'bước 1 (CO planning) engine không sinh bút toán FI — state phải khớp');
  cases++;

  const again = s.confirm(h.ctx, pending.id, 'Kế toán trưởng');
  assert.equal((again as { code: string }).code, 'unknown_pending', 'B4: thẻ phải dùng một lần');
  assert.equal(h.calls().length, 1, 'B4 vi phạm: xác nhận lặp ghi sổ thêm');
  cases++;
}

// ---- B5b: thẻ bước có bút toán (bước 3, 6 dòng theo engine) khớp engine từng dòng
{
  const h = makeHarness('Kế toán trưởng');
  const s = createCopilotSession();
  for (const id of [1, 2]) {
    h.sync();
    const q = s.propose(h.ctx, { tool: 'run_mto_step', input: { stepId: id } }) as { pending: { id: string } };
    assert.equal(s.confirm(h.ctx, q.pending.id, 'Kế toán trưởng').status, 'done');
  }
  h.sync();
  const p3 = s.propose(h.ctx, { tool: 'run_mto_step', input: { stepId: 3 } }) as { pending: { card: { postings: Array<{ description: string; amount: number }>; lines: string[] } } };
  const engine3 = h.states()[3]; // chưa chạy → chưa có entries
  assert.equal(engine3.entries.length, 0, 'bước 3 chưa được chạy thì không được có entries');
  const engineEntries = planStepRun({
    stepId: 3, fiPeriodLocked: false, flags: { m4MdgGate: true, m5SodRbac: true },
    params: params0, computed, role: 'Kế toán trưởng', stepStates: h.states(), currentStepId: 3,
  }).stepPatch?.entries || [];
  assert.equal(p3.pending.card.postings.length, engineEntries.length, 'số dòng thẻ phải bằng engine');
  assert.ok(engineEntries.length > 0, 'bước 3 phải có bút toán từ engine (test không rỗng)');
  p3.pending.card.postings.forEach((row, i) => {
    assert.equal(row.amount, engineEntries[i].amount, `dòng ${i} lệch số tiền so với engine`);
    assert.equal(row.description, engineEntries[i].description, `dòng ${i} lệch mô tả so với engine`);
  });
  cases += 2;
}

// ---- B6: schema
{
  const h = makeHarness('Kế toán trưởng');
  const s = createCopilotSession();
  h.sync();
  const bad: Array<[string, unknown]> = [
    ['trường lạ', { stepId: 1, x: 1 }],
    ['thiếu', {}],
    ['sai kiểu', { stepId: '1' }],
    ['không nguyên', { stepId: 1.5 }],
    ['ngoài khoảng', { stepId: 8 }],
    ['không phải object', 'bước 1'],
  ];
  for (const [name, input] of bad) {
    const out = s.propose(h.ctx, { tool: 'run_mto_step', input });
    assert.equal((out as { code: string }).code, 'invalid_input', `B6: ${name} phải bị từ chối bởi schema`);
    cases++;
  }
  const unk = s.propose(h.ctx, { tool: 'xoa_so_cai', input: {} });
  assert.equal((unk as { code: string }).code, 'unknown_tool');
  assert.equal(h.calls().length, 0, 'B6 vi phạm: schema lỗi vẫn ghi sổ');
  cases++;
}

// ---- B7: tiền điều kiện engine vẫn áp cho Copilot
{
  const h = makeHarness('Kế toán trưởng');
  const s = createCopilotSession();
  h.sync();
  const out = s.propose(h.ctx, { tool: 'run_mto_step', input: { stepId: 3 } });
  assert.equal((out as { code: string }).code, 'precheck_failed', 'thiếu bước 1–2 phải chặn trước khi lên thẻ');
  assert.match((out as { reason: string }).reason, /Phải chạy bước 1, 2/);
  cases++;

  const hl = makeHarness('Kế toán trưởng');
  hl.ctx.closeState = { ...EMPTY_CLOSE, fiPeriodLocked: true };
  const sl = createCopilotSession();
  const lk = sl.propose(hl.ctx, { tool: 'run_mto_step', input: { stepId: 1 } });
  assert.equal((lk as { code: string }).code, 'precheck_failed');
  assert.match((lk as { reason: string }).reason, /OB52/);
  assert.equal(hl.calls().length, 0);
  cases++;

  // MDG chưa duyệt (m4MdgGate bật) → bước 1 bị chặn trước khi lên thẻ
  const hm = makeHarness('Kế toán trưởng');
  hm.ctx.params = paramsNoMdg;
  const sm = createCopilotSession();
  const mdg = sm.propose(hm.ctx, { tool: 'run_mto_step', input: { stepId: 1 } });
  assert.equal((mdg as { code: string }).code, 'precheck_failed');
  assert.match((mdg as { reason: string }).reason, /master data/);
  assert.equal(hm.calls().length, 0);
  cases++;
}

// ---- B8: tool chỉ đọc chạy trực tiếp, không thẻ
{
  const h = makeHarness('Kế toán trưởng');
  const s = createCopilotSession();
  h.sync();
  let routed: string | null = null;
  let tutor: string | null = null;
  h.ctx.navigate = (r) => { routed = r; };
  h.ctx.openTutor = (q) => { tutor = q; };
  const nav = s.propose(h.ctx, { tool: 'navigate', input: { route: 'variance' } });
  assert.equal(nav.status, 'done');
  assert.equal(routed, 'variance');
  const cl = s.propose(h.ctx, { tool: 'check_close_readiness', input: {} });
  assert.equal(cl.status, 'done');
  assert.equal((cl as { output: { kind: string } }).output.kind, 'data');
  const ev = s.propose(h.ctx, { tool: 'explain_variance', input: {} });
  assert.equal(ev.status, 'done');
  const ask = s.propose(h.ctx, { tool: 'ask_knowledge', input: { question: 'Thông tư 99 là gì?' } });
  assert.equal(ask.status, 'done');
  assert.equal(tutor, 'Thông tư 99 là gì?');
  assert.equal(s.pendingCount(), 0, 'tool chỉ đọc không được tạo thẻ');
  assert.equal(h.calls().length, 0);
  cases++;
}

// ---- B9: mọi tool ghi sổ phải cần xác nhận; tên tool duy nhất
{
  const names = new Set<string>();
  let writers = 0;
  for (const t of COPILOT_TOOLS) {
    assert.ok(!names.has(t.name), `trùng tên tool ${t.name}`);
    names.add(t.name);
    if (t.writesLedger) {
      writers++;
      assert.equal(t.requiresConfirmation, true, `B9: ${t.name} ghi sổ nhưng không cần xác nhận`);
    }
    cases++;
  }
  assert.equal(COPILOT_TOOLS.length, 5, 'phải đúng 5 tool phase-1');
  assert.ok(writers >= 1, 'phải có ít nhất 1 tool ghi sổ để test có ý nghĩa');
  for (const r of SIM_ROLES) assert.ok(typeof r === 'string');
}

assert.ok(cases >= 20, `số ca quá ít (${cases}) — test không đủ phủ`);
console.log(`copilot-pr3 PASS — ${cases} ca: 0 ghi sổ khi chưa xác nhận, 0 vượt quyền, thẻ dùng 1 lần, engine thật, không fallback`);
