/**
 * Copilot PR-3 — lõi chạy một bước MTO, dạng hàm thuần (không React state).
 *
 * Tách nguyên văn từ App.runStep (feat/copilot-pr1 @ c0bad07) để Classic và Copilot dùng CHUNG một đường
 * ghi sổ, và để test chạy được trên engine thật mà không phải dựng giao diện.
 * App.runStep chỉ còn áp kết quả (setAudit / setStepStates / setCurrentStepId / đếm lượt) theo plan này.
 *
 * Thứ tự giữ nguyên: cổng (khóa kỳ → MDG → SoD) → ghi audit → nhánh QM bước 4 → sinh bút toán.
 * test:copilot-pr3 so planStepRun với bản chép nguyên văn runStep cũ trên toàn bộ ca.
 */
import { MTOComputed, MTOParameters, StepRuntimeState } from '../types';
import { generateStepEntries } from '../utils/calculator';
import { SimRole } from './sod';
import { evaluateStepGate, MSG_QM_REWORK_PENDING, StepResult } from './stepGate';

export interface StepRunSnapshot {
  stepId: number;
  fiPeriodLocked: boolean;
  flags: { m4MdgGate: boolean; m5SodRbac: boolean };
  params: MTOParameters;
  computed: MTOComputed;
  role: SimRole;
  stepStates: Record<number, StepRuntimeState>;
  currentStepId: number;
}

export interface StepRunPlan {
  result: StepResult;
  /** true → App ghi 1 dòng audit "Execute step N" (đã qua cổng, kể cả khi QM chặn sau đó — như code cũ). */
  audit: boolean;
  /** Các trường gộp đè vào stepStates[stepId]; null = không đổi. */
  stepPatch: Partial<StepRuntimeState> | null;
  /** Bước hiện tại mới; null = không đổi. */
  nextStepId: number | null;
  /** true → tăng sava_completed_runs (chỉ bước 7). */
  completedRun: boolean;
}

export function planStepRun(s: StepRunSnapshot): StepRunPlan {
  const { stepId } = s;
  const gate = evaluateStepGate({
    stepId,
    fiPeriodLocked: s.fiPeriodLocked,
    flags: s.flags,
    params: s.params,
    role: s.role,
  });
  if (!gate.ok) return { result: gate, audit: false, stepPatch: null, nextStepId: null, completedRun: false };

  // Special validation for Step 4 (QM):
  if (stepId === 4) {
    if (!s.stepStates[4].qmDecision) {
      // If not chosen yet, set default to pass
      return {
        result: { ok: true, stepId },
        audit: true,
        stepPatch: { qmDecision: 'pass', isExecuted: true, qmReworkHandled: true, entries: [], acdocaLines: [] },
        nextStepId: s.currentStepId === 4 ? 5 : null,
        completedRun: false,
      };
    }
    if (s.stepStates[4].qmDecision === 'fail' && !s.stepStates[4].qmReworkHandled) {
      // BLOCKED!
      return {
        result: { ok: false, stepId, kind: 'qm_rework_pending', reason: MSG_QM_REWORK_PENDING },
        audit: true,
        stepPatch: null,
        nextStepId: null,
        completedRun: false,
      };
    }
  }

  const reworkCost = s.stepStates[4].qmReworkCost || 0;
  const scrapCost = s.stepStates[4].qmScrapCost || 0;
  const method = s.stepStates[4].qmResolutionMethod || null;
  const generated = generateStepEntries(stepId, s.params, s.computed, reworkCost, scrapCost, method);

  return {
    result: { ok: true, stepId },
    audit: true,
    stepPatch: { isExecuted: true, entries: generated.entries, acdocaLines: generated.acdoca },
    nextStepId: stepId < 7 ? stepId + 1 : null,
    completedRun: stepId === 7,
  };
}
