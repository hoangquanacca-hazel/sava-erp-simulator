import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Lock, Play, FileSpreadsheet, Printer } from 'lucide-react';
import { AcdocaLine, JournalEntry, MTOComputed, MTOParameters, UIMode } from '../types';
import { formatVND, generateStepEntries } from '../utils/calculator';
import { selectTrialBalance } from '../utils/acdoca';
import { computeFiveTypeVariance, buildVarianceWaterfall, assertFiveTypeVariance } from '../features/variance';
import {
  CLOSE_SEQUENCE,
  CloseChecklistState,
  CloseStep,
  canRunCloseStep,
  scoreClosePack,
} from '../features/periodClose';
import { exportClosePackExcel } from '../utils/excelService';
import { exportFullERPPackageExcel } from '../utils/excelService';
import { computeTrialBalance } from '../utils/calculator';

const STEP_HELP: Record<CloseStep, string> = {
  MMPV: 'Khóa kỳ MM (cờ, không FI).',
  CKMLCP: 'Material Ledger period-end — gắn M6 khi có. M2: đánh dấu checklist, chưa revalue.',
  KKA2: 'Results Analysis / WIP — chạy phân tích trước settlement.',
  VA88: 'Settlement Sales Order + kết chuyển 911 (FI qua postDocument).',
  OB52: 'Khóa kỳ FI (cờ). Sau OB52 không ghi sổ FI thêm.',
};

export const CloseCockpitPage: React.FC<{
  params: MTOParameters;
  computed: MTOComputed;
  acdoca: AcdocaLine[];
  entries: JournalEntry[];
  step7Executed: boolean;
  priorStepsReady: boolean;
  closeState: CloseChecklistState;
  onCloseState: (next: CloseChecklistState) => void;
  onPostStep7: (posted: { entries: JournalEntry[]; acdoca: AcdocaLine[] }) => void;
  onCkmlcp?: () => void;
  skipVa88Variance?: boolean;
  onOpenPdf: () => void;
  uiMode?: UIMode;
}> = ({
  params,
  computed,
  acdoca,
  entries,
  step7Executed,
  priorStepsReady,
  closeState,
  onCloseState,
  onPostStep7,
  onCkmlcp,
  skipVa88Variance,
  onOpenPdf,
  uiMode = 'fiori',
}) => {
  const tb = useMemo(() => selectTrialBalance(acdoca), [acdoca]);
  const five = useMemo(() => computeFiveTypeVariance(params, computed), [params, computed]);
  const waterfall = useMemo(() => buildVarianceWaterfall(five), [five]);
  const nv632 =
    params.stockType === 'Non-valuated'
      ? acdoca.filter((l) => l.stepId === 5 && l.glAccount.startsWith('632')).length === 0 &&
        acdoca.some((l) => l.stepId === 7 && l.glAccount === '632' && l.drAmount > 0)
      : null;
  const score = scoreClosePack({
    tbBalanced: tb.isBalanced,
    fiveTypeBalanced: five.balanced,
    stockType: params.stockType,
    nonVal632OnlyStep7: nv632,
    checklist: closeState,
  });

  const run = (step: CloseStep) => {
    const gate = canRunCloseStep(closeState, step);
    if (!gate.ok) {
      window.alert(gate.reason);
      return;
    }
    const next = { ...closeState, [step]: true };
    if (step === 'MMPV') next.mmPeriodLocked = true;
    if (step === 'OB52') next.fiPeriodLocked = true;
    if (step === 'CKMLCP') {
      if (!priorStepsReady) {
        window.alert('Cần hoàn thành bước 1–6 trước CKMLCP.');
        return;
      }
      onCkmlcp?.();
    }
    if (step === 'VA88') {
      if (!priorStepsReady) {
        window.alert('Cần hoàn thành bước 1–6 trên Cockpit trước khi VA88.');
        return;
      }
      if (!step7Executed) {
        const posted = generateStepEntries(7, params, computed, 0, 0, null, {
          skipVa88Variance: !!skipVa88Variance || step === 'VA88' && closeState.CKMLCP,
        });
        onPostStep7(posted);
      }
    }
    onCloseState(next);
  };

  const exportPack = () => {
    try {
      assertFiveTypeVariance(five);
    } catch {
      /* still export real numbers, never fake PASS */
    }
    exportClosePackExcel({
      params,
      computed,
      trialBalance: tb,
      waterfall: waterfall.map((w) => ({ name: w.name, signed: w.signed })),
      summaryLines: [
        ['Khách hàng', params.customer],
        ['Mã hàng', params.componentCode],
        ['Kho', params.stockType],
        ['STD', computed.plannedCost],
        ['Actual', computed.actualCostBeforeRework],
        ['TV', five.TV],
        ['TB balanced', tb.isBalanced ? 'YES' : 'NO'],
        ['Control score', score.controlScore],
      ],
      scorecard: [
        ['ΣDr===ΣCr', tb.isBalanced ? 'PASS' : 'FAIL'],
        ['5-type = TV', five.balanced ? 'PASS' : 'FAIL'],
        ['MMPV', closeState.MMPV ? 'DONE' : 'OPEN'],
        ['CKMLCP', closeState.CKMLCP ? 'DONE' : 'OPEN'],
        ['KKA2', closeState.KKA2 ? 'DONE' : 'OPEN'],
        ['VA88', closeState.VA88 ? 'DONE' : 'OPEN'],
        ['OB52', closeState.OB52 ? 'DONE' : 'OPEN'],
        ['Điểm kiểm soát', `${score.controlScore}%`],
      ],
    });
    exportFullERPPackageExcel(entries, computeTrialBalance(entries), params, computed);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h2 className={`text-lg font-bold ${uiMode === 'classic' ? 'text-[#0a246a]' : 'text-white'}`}>
          Đóng sổ cuối kỳ
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Thứ tự khóa MMPV → CKMLCP → KKA2 → VA88 → OB52. MÔ PHỎNG — không phải kỳ kế toán SAP thật.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportPack}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-100 flex items-center gap-1.5 cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          Export Close Pack (Excel)
        </button>
        <button
          type="button"
          onClick={onOpenPdf}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-100 flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-cyan-400" />
          Close Pack PDF (báo cáo TT200)
        </button>
      </div>

      <div className="grid gap-3">
        {CLOSE_SEQUENCE.map((step) => {
          const done = closeState[step];
          const gate = canRunCloseStep(closeState, step);
          return (
            <div
              key={step}
              className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 ${
                done ? 'border-emerald-700/50 bg-emerald-950/20' : 'border-slate-800 bg-slate-900'
              }`}
            >
              <div>
                <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-500" />
                  )}
                  {step}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{STEP_HELP[step]}</p>
                {!gate.ok && !done && (
                  <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {gate.reason}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={done}
                onClick={() => run(step)}
                className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                {done ? 'Đã chạy' : 'Thực hiện'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] text-slate-500 uppercase">Trial Balance</div>
          <div className={tb.isBalanced ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {tb.isBalanced ? 'ΣDr = ΣCr' : 'KHÔNG CÂN'}
          </div>
          <div className="font-mono text-xs text-slate-400 mt-1">{formatVND(tb.totalDebitTurnover)}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] text-slate-500 uppercase">Waterfall = TV</div>
          <div className={five.balanced ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {five.balanced ? 'PASS' : 'FAIL'}
          </div>
          <div className="font-mono text-xs text-slate-400 mt-1">TV {formatVND(five.TV)}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] text-slate-500 uppercase">MM / FI lock</div>
          <div className="text-sm text-slate-200">
            MMPV {closeState.mmPeriodLocked ? 'ON' : 'off'} · OB52 {closeState.fiPeriodLocked ? 'ON' : 'off'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] text-slate-500 uppercase">Control score</div>
          <div className="text-2xl font-black text-cyan-300">{score.controlScore}%</div>
        </div>
      </div>
    </div>
  );
};

export default CloseCockpitPage;
