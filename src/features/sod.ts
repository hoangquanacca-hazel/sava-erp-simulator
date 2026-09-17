export type SimRole = 'Sales' | 'Kho' | 'Kế hoạch SX' | 'Kế toán trưởng';

export const SIM_ROLES: SimRole[] = ['Sales', 'Kho', 'Kế hoạch SX', 'Kế toán trưởng'];

export interface AuditEvent {
  id: string;
  action: string;
  role: SimRole;
  time: string;
  sessionId: string;
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
