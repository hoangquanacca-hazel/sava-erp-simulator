/**
 * Copilot PR-1 — cổng kiểm trước khi chạy một bước MTO, dạng hàm thuần.
 *
 * Trước đây các cổng này nằm trong App.executeStepInternal và gọi thẳng window.alert,
 * nên Copilot (và test) không đọc được lý do chặn. Hàm này trả về kết quả có cấu trúc;
 * lớp hiển thị Classic vẫn hiện y như cũ (alert / modal SoD) — xem presentStepResult trong App.
 *
 * Thứ tự ưu tiên giữ nguyên như code cũ: khóa kỳ OB52 → MDG (chỉ bước 1) → SoD.
 * Chuỗi thông báo giữ NGUYÊN VĂN bản cũ (test:copilot-pr12 so từng ký tự).
 */
import { MTOParameters } from '../types';
import { mdgGateOpen } from './mdg';
import { canRoleRunStep, SimRole } from './sod';

export type StepBlockKind = 'period_locked' | 'mdg_blocked' | 'sod_denied' | 'qm_rework_pending';

/** ok=true → kind/reason bỏ trống. ok=false → luôn có kind + reason (test kiểm). Kiểu phẳng vì tsconfig không bật strict. */
export interface StepResult {
  ok: boolean;
  stepId: number;
  kind?: StepBlockKind;
  reason?: string;
}

export interface StepGateInput {
  stepId: number;
  fiPeriodLocked: boolean;
  flags: { m4MdgGate: boolean; m5SodRbac: boolean };
  params: MTOParameters;
  role: SimRole;
}

export const MSG_PERIOD_LOCKED = 'OB52 đã khóa kỳ FI — không ghi sổ thêm (MÔ PHỎNG).';
export const MSG_QM_REWORK_PENDING = 'Bước 4 (QM) không đạt — cần xử lý rework/scrap/concession trước khi ghi sổ.';

export function evaluateStepGate(input: StepGateInput): StepResult {
  const { stepId } = input;
  if (input.fiPeriodLocked) {
    return { ok: false, stepId, kind: 'period_locked', reason: MSG_PERIOD_LOCKED };
  }
  if (input.flags.m4MdgGate && stepId === 1) {
    const gate = mdgGateOpen(input.params);
    if (!gate.ok) {
      return {
        ok: false,
        stepId,
        kind: 'mdg_blocked',
        reason: `BLOCK Step 1 — master data chưa duyệt: ${gate.missing.join(', ')}`,
      };
    }
  }
  if (input.flags.m5SodRbac) {
    const sod = canRoleRunStep(input.role, stepId);
    if (!sod.ok) return { ok: false, stepId, kind: 'sod_denied', reason: sod.reason };
  }
  return { ok: true, stepId };
}
