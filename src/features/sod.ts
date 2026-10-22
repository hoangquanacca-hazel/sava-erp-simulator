export type SimRole = 'Sales' | 'Kho' | 'Kế hoạch SX' | 'Kế toán trưởng';

export const SIM_ROLES: SimRole[] = ['Sales', 'Kho', 'Kế hoạch SX', 'Kế toán trưởng'];

/** Kênh phát sinh thao tác: giao diện cổ điển hay Sava Copilot (plan PR-2). */
export type AuditChannel = 'classic' | 'copilot';

/** Ý định Copilot đã trích (tool + trường) — chỉ ghi khi channel = 'copilot'. */
export interface CopilotParsedIntent {
  tool: string;
  input: Record<string, unknown>;
}

export interface AuditEvent {
  id: string;
  action: string;
  role: SimRole;
  time: string;
  sessionId: string;
  /** PR-2 — bản ghi cũ không có trường này được hiểu là 'classic'. */
  channel?: AuditChannel;
  /** PR-2 — câu lệnh người dùng gõ cho Copilot (nguyên văn). */
  prompt?: string;
  /** PR-2 — ý định Copilot trích được, trước khi xác nhận. */
  parsedIntent?: CopilotParsedIntent;
  /** PR-2 — vai trò đã bấm xác nhận thẻ Copilot (bắt buộc cho thao tác ghi sổ qua Copilot). */
  confirmedBy?: SimRole;
}

/** Kế toán trưởng may run all steps in this MÔ PHỎNG. Other roles are restricted. */
const STEP_ROLES: Record<number, SimRole[]> = {
  1: ['Sales', 'Kế toán trưởng'],
  2: ['Kế hoạch SX', 'Kế toán trưởng'],
  3: ['Kho', 'Kế hoạch SX', 'Kế toán trưởng'],
  4: ['Kho', 'Kế toán trưởng'],
  5: ['Kho', 'Kế toán trưởng'],
  6: ['Sales', 'Kế toán trưởng'],
  7: ['Kế toán trưởng'],
};

export function canRoleRunStep(role: SimRole, stepId: number): { ok: boolean; reason: string } {
  const allowed = STEP_ROLES[stepId] || ['Kế toán trưởng'];
  if (allowed.includes(role)) return { ok: true, reason: '' };
  return {
    ok: false,
    reason: `Vi phạm phân quyền (SoD): vai trò ${role} không được chạy bước ${stepId}.`,
  };
}

export function newSessionId(): string {
  return `SIM-${Date.now()}`;
}
