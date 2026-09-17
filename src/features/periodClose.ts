export const CLOSE_SEQUENCE = ['MMPV', 'CKMLCP', 'KKA2', 'VA88', 'OB52'] as const;
export type CloseStep = (typeof CLOSE_SEQUENCE)[number];

export interface CloseChecklistState {
  MMPV: boolean;
  CKMLCP: boolean;
  KKA2: boolean;
  VA88: boolean;
  OB52: boolean;
  mmPeriodLocked: boolean;
  fiPeriodLocked: boolean;
}

export const EMPTY_CLOSE: CloseChecklistState = {
  MMPV: false,
  CKMLCP: false,
  KKA2: false,
  VA88: false,
  OB52: false,
  mmPeriodLocked: false,
  fiPeriodLocked: false,
};

export function predecessorOf(step: CloseStep): CloseStep | null {
  const i = CLOSE_SEQUENCE.indexOf(step);
  return i > 0 ? CLOSE_SEQUENCE[i - 1] : null;
}

export function canRunCloseStep(
  state: CloseChecklistState,
  step: CloseStep
): { ok: boolean; reason: string } {
  if (state[step]) return { ok: false, reason: `${step} đã chạy.` };
  const pred = predecessorOf(step);
  if (pred && !state[pred]) {
    return { ok: false, reason: `Thứ tự khóa: phải hoàn thành ${pred} trước ${step}.` };
  }
  if (state.fiPeriodLocked && step !== 'OB52') {
    return { ok: false, reason: 'OB52 đã khóa kỳ FI — không ghi sổ thêm.' };
  }
  return { ok: true, reason: '' };
}

export interface CloseScorecard {
  tbBalanced: boolean;
  fiveTypeBalanced: boolean;
  nonVal632OnlyStep7: boolean | null;
  controlScore: number;
}

export function scoreClosePack(input: {
  tbBalanced: boolean;
  fiveTypeBalanced: boolean;
  stockType: string;
  nonVal632OnlyStep7: boolean | null;
  checklist: CloseChecklistState;
}): CloseScorecard {
  const checks = [
    input.tbBalanced,
    input.fiveTypeBalanced,
    input.checklist.MMPV,
    input.checklist.CKMLCP,
    input.checklist.KKA2,
    input.checklist.VA88,
    input.checklist.OB52,
  ];
  if (input.stockType === 'Non-valuated' && input.nonVal632OnlyStep7 !== null) {
    checks.push(input.nonVal632OnlyStep7);
  }
  const passed = checks.filter(Boolean).length;
  return {
    tbBalanced: input.tbBalanced,
    fiveTypeBalanced: input.fiveTypeBalanced,
    nonVal632OnlyStep7: input.nonVal632OnlyStep7,
    controlScore: checks.length ? Math.round((passed / checks.length) * 100) : 0,
  };
}
