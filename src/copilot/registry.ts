/**
 * Sava Copilot PR-3 — sổ đăng ký công cụ (tool registry) + phiên xác nhận. CHƯA có LLM.
 *
 * Nguyên tắc (plan D1–D3):
 *  - Mỗi nghiệp vụ = 1 tool: name + input_schema (JSON Schema, dùng lại nguyên cho Claude tool use ở PR-4),
 *    allowedRoles, requiresConfirmation, executor gọi đúng hàm engine sẵn có — KHÔNG viết logic ghi sổ mới.
 *  - Model (PR-4) chỉ trả về {tool, input}. Kiểm schema, kiểm quyền, thẻ xác nhận, ghi sổ đều chạy
 *    deterministic ở đây.
 *  - Tool có ghi sổ: requiresConfirmation = true (test chốt). Không xác nhận → 0 ghi sổ.
 *  - Copilot luôn áp SoD theo bước (canRoleRunStep), kể cả khi flag m5SodRbac tắt ở Classic.
 *  - Mỗi thẻ chờ chỉ xác nhận được 1 lần, bởi đúng vai trò đã đề xuất; đổi vai trò giữa chừng → từ chối.
 *  - Flag m6Copilot tắt → mọi đề xuất bị từ chối (phòng thủ 2 lớp, ngoài việc UI không mount).
 */
import { FeatureFlagKey } from '../features/flags';
import { AppHashRoute } from '../features/hashRoute';
import { CLOSE_SEQUENCE, canRunCloseStep, CloseChecklistState } from '../features/periodClose';
import { canRoleRunStep, SIM_ROLES, SimRole, StepAuditMeta } from '../features/sod';
import { StepResult } from '../features/stepGate';
import { planStepRun } from '../features/stepRun';
import { computeFiveTypeVariance } from '../features/variance';
import { wipStatusOf } from '../features/wip';
import { MTOComputed, MTOParameters, StepRuntimeState } from '../types';
import { STEP_DEFINITIONS } from '../utils/calculator';

// ---------------------------------------------------------------- kiểu dữ liệu

export interface CopilotContext {
  role: SimRole;
  flags: Record<FeatureFlagKey, boolean>;
  params: MTOParameters;
  computed: MTOComputed;
  closeState: CloseChecklistState;
  stepStates: Record<number, StepRuntimeState>;
  currentStepId: number;
  /** Cổng đăng ký (lead) của Classic cho bước ≥ 3; null = cho chạy. */
  registrationBlock: (stepId: number) => string | null;
  /** Đường ghi sổ DUY NHẤT — App.runStep (Classic dùng chung). */
  runStep: (stepId: number, meta: StepAuditMeta) => StepResult;
  navigate: (route: AppHashRoute) => void;
  openTutor: (question: string) => void;
}

export interface ConfirmCardModel {
  title: string;
  lines: string[];
  postings: Array<{ description: string; debit: string; credit: string; amount: number }>;
  warnings: string[];
}

type SchemaProp =
  | { type: 'integer'; minimum?: number; maximum?: number; description?: string }
  | { type: 'string'; enum?: readonly string[]; minLength?: number; maxLength?: number; description?: string };

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, SchemaProp>;
  required: string[];
  additionalProperties: false;
}

export type Precheck = { ok: true } | { ok: false; reason: string };

export interface CopilotTool {
  name: string;
  description: string;
  input_schema: ToolInputSchema;
  allowedRoles: readonly SimRole[];
  /** true nếu executor có thể ghi sổ. */
  writesLedger: boolean;
  requiresConfirmation: boolean;
  /** Kiểm nghiệp vụ trước khi lên thẻ (thuần, không đổi state). */
  precheck: (ctx: CopilotContext, input: Record<string, unknown>) => Precheck;
  /** Chỉ gọi với tool cần xác nhận. */
  card?: (ctx: CopilotContext, input: Record<string, unknown>) => ConfirmCardModel;
  execute: (ctx: CopilotContext, input: Record<string, unknown>, meta: StepAuditMeta) => ToolOutput;
}

export type ToolOutput =
  | { kind: 'step'; result: StepResult }
  | { kind: 'navigated'; route: AppHashRoute }
  | { kind: 'tutor_opened'; question: string }
  | { kind: 'data'; data: Record<string, unknown> };

export type RejectCode =
  | 'copilot_off'
  | 'unknown_tool'
  | 'invalid_input'
  | 'role_denied'
  | 'precheck_failed'
  | 'unknown_pending'
  | 'role_changed';

export type ProposeOutcome =
  | { status: 'rejected'; code: RejectCode; reason: string }
  | { status: 'needs_confirmation'; pending: PendingAction }
  | { status: 'done'; output: ToolOutput };

export type ConfirmOutcome =
  | { status: 'rejected'; code: RejectCode; reason: string }
  | { status: 'done'; output: ToolOutput };

export interface PendingAction {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  prompt?: string;
  proposedBy: SimRole;
  card: ConfirmCardModel;
}

// ---------------------------------------------------------------- kiểm schema (tập con JSON Schema, không thêm thư viện)

export function validateInput(schema: ToolInputSchema, input: unknown): string | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return 'input phải là object';
  const obj = input as Record<string, unknown>;
  for (const k of Object.keys(obj)) if (!(k in schema.properties)) return `trường lạ: ${k}`;
  for (const k of schema.required) if (!(k in obj)) return `thiếu trường bắt buộc: ${k}`;
  for (const [k, prop] of Object.entries(schema.properties)) {
    if (!(k in obj)) continue;
    const v = obj[k];
    if (prop.type === 'integer') {
      if (typeof v !== 'number' || !Number.isInteger(v)) return `${k} phải là số nguyên`;
      if (prop.minimum !== undefined && v < prop.minimum) return `${k} < ${prop.minimum}`;
      if (prop.maximum !== undefined && v > prop.maximum) return `${k} > ${prop.maximum}`;
    } else {
      if (typeof v !== 'string') return `${k} phải là chuỗi`;
      if (prop.enum && !prop.enum.includes(v)) return `${k} không thuộc danh sách cho phép`;
      if (prop.minLength !== undefined && v.trim().length < prop.minLength) return `${k} quá ngắn`;
      if (prop.maxLength !== undefined && v.length > prop.maxLength) return `${k} quá dài`;
    }
  }
  return null;
}

// ---------------------------------------------------------------- 5 tool (thứ tự ưu tiên plan: UC3, UC1, UC5, UC4, UC2)

/** Route → flag module; cockpit luôn mở. */
export const ROUTE_FLAG: Record<AppHashRoute, FeatureFlagKey | null> = {
  cockpit: null,
  variance: 'm1Variance',
  close: 'm2CloseCockpit',
  wip: 'm3WipSettlement',
  mdg: 'm4MdgGate',
  sod: 'm5SodRbac',
  ml: 'm6MaterialLedger',
  grir: 'm7GrIr',
  ic: 'm8Intercompany',
};
const ROUTES = Object.keys(ROUTE_FLAG) as AppHashRoute[];

const stepSnapshot = (ctx: CopilotContext, stepId: number) => ({
  stepId,
  fiPeriodLocked: ctx.closeState.fiPeriodLocked,
  flags: { m4MdgGate: ctx.flags.m4MdgGate, m5SodRbac: ctx.flags.m5SodRbac },
  params: ctx.params,
  computed: ctx.computed,
  role: ctx.role,
  stepStates: ctx.stepStates,
  currentStepId: ctx.currentStepId,
});

const runMtoStep: CopilotTool = {
  name: 'run_mto_step',
  description: 'Chạy (ghi sổ) một bước của quy trình MTO 7 bước. Luôn cần người dùng xác nhận trên thẻ.',
  input_schema: {
    type: 'object',
    properties: { stepId: { type: 'integer', minimum: 1, maximum: 7, description: 'Số thứ tự bước 1–7' } },
    required: ['stepId'],
    additionalProperties: false,
  },
  allowedRoles: SIM_ROLES,
  writesLedger: true,
  requiresConfirmation: true,
  precheck(ctx, input) {
    const stepId = input.stepId as number;
    const sod = canRoleRunStep(ctx.role, stepId);
    if (!sod.ok) return { ok: false, reason: sod.reason };
    const missing = [1, 2, 3, 4, 5, 6, 7].filter((id) => id < stepId && !ctx.stepStates[id]?.isExecuted);
    if (missing.length) return { ok: false, reason: `Phải chạy bước ${missing.join(', ')} trước bước ${stepId}.` };
    const reg = ctx.registrationBlock(stepId);
    if (reg) return { ok: false, reason: reg };
    // Mô phỏng trước trên hàm thuần: cổng khóa kỳ / MDG / QM chặn thì không lên thẻ.
    const plan = planStepRun(stepSnapshot(ctx, stepId));
    if (!plan.result.ok) return { ok: false, reason: plan.result.reason || 'Bước bị chặn.' };
    return { ok: true };
  },
  card(ctx, input) {
    const stepId = input.stepId as number;
    const def = STEP_DEFINITIONS.find((s) => s.id === stepId);
    const plan = planStepRun(stepSnapshot(ctx, stepId));
    const entries = plan.stepPatch?.entries || [];
    const warnings: string[] = [];
    if (ctx.stepStates[stepId]?.isExecuted) warnings.push(`Bước ${stepId} đã chạy — xác nhận sẽ ghi đè bút toán của bước này.`);
    if (stepId === 4 && !ctx.stepStates[4].qmDecision) warnings.push('Chưa chọn kết quả QM — mặc định "Đạt" (như Classic).');
    return {
      title: `Chạy bước ${stepId}: ${def?.title ?? ''}`,
      lines: [`T-code: ${def?.tCode ?? '—'} · Module: ${def?.sapModule ?? '—'}`, `Vai trò: ${ctx.role}`, `Số bút toán sẽ ghi: ${entries.length}`],
      postings: entries.map((e) => ({
        description: e.description,
        debit: `${e.debitAccount} ${e.debitAccountName}`,
        credit: `${e.creditAccount} ${e.creditAccountName}`,
        amount: e.amount,
      })),
      warnings,
    };
  },
  execute(ctx, input, meta) {
    return { kind: 'step', result: ctx.runStep(input.stepId as number, meta) };
  },
};

const navigate: CopilotTool = {
  name: 'navigate',
  description: 'Mở một màn hình/phân hệ của simulator (không ghi sổ).',
  input_schema: {
    type: 'object',
    properties: { route: { type: 'string', enum: ROUTES, description: 'Mã màn hình' } },
    required: ['route'],
    additionalProperties: false,
  },
  allowedRoles: SIM_ROLES,
  writesLedger: false,
  requiresConfirmation: false,
  precheck(ctx, input) {
    const flag = ROUTE_FLAG[input.route as AppHashRoute];
    if (flag && !ctx.flags[flag]) return { ok: false, reason: `Phân hệ ${input.route} đang tắt.` };
    return { ok: true };
  },
  execute(ctx, input) {
    ctx.navigate(input.route as AppHashRoute);
    return { kind: 'navigated', route: input.route as AppHashRoute };
  },
};

const checkCloseReadiness: CopilotTool = {
  name: 'check_close_readiness',
  description: 'Kiểm tra tình trạng đóng kỳ (MMPV→CKMLCP→KKA2→VA88→OB52) và WIP/TECO. Chỉ đọc, không chạy bước đóng kỳ.',
  input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  allowedRoles: ['Kế toán trưởng'],
  writesLedger: false,
  requiresConfirmation: false,
  precheck(ctx) {
    return ctx.flags.m2CloseCockpit ? { ok: true } : { ok: false, reason: 'Phân hệ Đóng sổ đang tắt.' };
  },
  execute(ctx) {
    const steps = CLOSE_SEQUENCE.map((step) => ({ step, done: ctx.closeState[step], ...canRunCloseStep(ctx.closeState, step) }));
    const next = steps.find((s) => s.ok)?.step ?? null;
    return {
      kind: 'data',
      data: {
        steps,
        nextStep: next,
        mtoSteps1to6Done: [1, 2, 3, 4, 5, 6].every((id) => ctx.stepStates[id]?.isExecuted),
        step7Done: !!ctx.stepStates[7]?.isExecuted,
        fiPeriodLocked: ctx.closeState.fiPeriodLocked,
        wip: wipStatusOf(ctx.params),
      },
    };
  },
};

const explainVariance: CopilotTool = {
  name: 'explain_variance',
  description: 'Trả số liệu chênh lệch sản xuất 5 loại (giá, lượng, năng suất, phế phẩm, còn lại) từ engine. Chỉ đọc.',
  input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  allowedRoles: ['Kế toán trưởng', 'Kế hoạch SX'],
  writesLedger: false,
  requiresConfirmation: false,
  precheck(ctx) {
    return ctx.flags.m1Variance ? { ok: true } : { ok: false, reason: 'Phân hệ Variance đang tắt.' };
  },
  execute(ctx) {
    return { kind: 'data', data: { ...computeFiveTypeVariance(ctx.params, ctx.computed) } };
  },
};

const askKnowledge: CopilotTool = {
  name: 'ask_knowledge',
  description: 'Chuyển câu hỏi kiến thức (kế toán/SAP/TT99) sang AI Tutor hiện có. Không ghi sổ.',
  input_schema: {
    type: 'object',
    properties: { question: { type: 'string', minLength: 3, maxLength: 1000, description: 'Câu hỏi' } },
    required: ['question'],
    additionalProperties: false,
  },
  allowedRoles: SIM_ROLES,
  writesLedger: false,
  requiresConfirmation: false,
  precheck() {
    return { ok: true };
  },
  execute(ctx, input) {
    ctx.openTutor(input.question as string);
    return { kind: 'tutor_opened', question: input.question as string };
  },
};

export const COPILOT_TOOLS: readonly CopilotTool[] = [runMtoStep, navigate, checkCloseReadiness, explainVariance, askKnowledge];

export function findTool(name: string): CopilotTool | undefined {
  return COPILOT_TOOLS.find((t) => t.name === name);
}

// ---------------------------------------------------------------- phiên: đề xuất → thẻ → xác nhận

export interface CopilotSession {
  propose: (ctx: CopilotContext, call: { tool: string; input: unknown }, prompt?: string) => ProposeOutcome;
  confirm: (ctx: CopilotContext, pendingId: string, confirmedBy: SimRole) => ConfirmOutcome;
  cancel: (pendingId: string) => void;
  pendingCount: () => number;
}

export function createCopilotSession(): CopilotSession {
  const pending = new Map<string, PendingAction>();
  let seq = 0;

  const gate = (ctx: CopilotContext, toolName: string, input: unknown) => {
    if (!ctx.flags.m6Copilot) return { err: { code: 'copilot_off' as const, reason: 'Sava Copilot đang tắt.' } };
    const tool = findTool(toolName);
    if (!tool) return { err: { code: 'unknown_tool' as const, reason: `Không có công cụ ${toolName}.` } };
    const bad = validateInput(tool.input_schema, input);
    if (bad) return { err: { code: 'invalid_input' as const, reason: bad } };
    if (!tool.allowedRoles.includes(ctx.role)) {
      return { err: { code: 'role_denied' as const, reason: `Vai trò ${ctx.role} không được dùng ${tool.name}.` } };
    }
    const obj = input as Record<string, unknown>;
    const pre = tool.precheck(ctx, obj);
    if (!pre.ok) return { err: { code: 'precheck_failed' as const, reason: (pre as { reason: string }).reason } };
    return { tool, input: obj };
  };

  return {
    propose(ctx, call, prompt) {
      const g = gate(ctx, call.tool, call.input);
      if ('err' in g) return { status: 'rejected', ...g.err };
      const { tool, input } = g;
      if (tool.requiresConfirmation) {
        const p: PendingAction = {
          id: `cp-${++seq}`,
          tool: tool.name,
          input: { ...input },
          prompt,
          proposedBy: ctx.role,
          card: tool.card ? tool.card(ctx, input) : { title: tool.name, lines: [], postings: [], warnings: [] },
        };
        pending.set(p.id, p);
        return { status: 'needs_confirmation', pending: p };
      }
      return { status: 'done', output: tool.execute(ctx, input, { channel: 'copilot', prompt, parsedIntent: { tool: tool.name, input } }) };
    },

    confirm(ctx, pendingId, confirmedBy) {
      const p = pending.get(pendingId);
      if (!p) return { status: 'rejected', code: 'unknown_pending', reason: 'Thẻ không tồn tại hoặc đã xử lý.' };
      pending.delete(pendingId); // dùng 1 lần, kể cả khi bị từ chối dưới đây
      if (confirmedBy !== ctx.role || p.proposedBy !== ctx.role) {
        return { status: 'rejected', code: 'role_changed', reason: 'Vai trò đã đổi kể từ khi lập thẻ — hãy đề xuất lại.' };
      }
      // Kiểm lại toàn bộ tại thời điểm xác nhận (state có thể đã đổi: khóa kỳ, bước khác đã chạy…).
      const g = gate(ctx, p.tool, p.input);
      if ('err' in g) return { status: 'rejected', ...g.err };
      const meta: StepAuditMeta = { channel: 'copilot', prompt: p.prompt, parsedIntent: { tool: p.tool, input: p.input }, confirmedBy };
      return { status: 'done', output: g.tool.execute(ctx, g.input, meta) };
    },

    cancel(pendingId) {
      pending.delete(pendingId);
    },

    pendingCount: () => pending.size,
  };
}
