import React, { useMemo } from 'react';
import { AcdocaLine, SalesOrderCostCardState, UIMode } from '../types';
import { selectMarginAnalysis } from '../utils/acdoca';
import { formatVND } from '../utils/calculator';
import { Percent, TrendingUp, Sigma, SplitSquareVertical } from 'lucide-react';

interface MarginAnalysisPanelProps {
  acdocaTable: AcdocaLine[];
  cardState: SalesOrderCostCardState;
  currentStepId: number;
  uiMode?: UIMode;
}

export const MarginAnalysisPanel: React.FC<MarginAnalysisPanelProps> = ({
  acdocaTable,
  cardState,
  currentStepId,
  uiMode = 'fiori',
}) => {
  const ma = useMemo(
    () => selectMarginAnalysis(acdocaTable, cardState.actualGrossProfit),
    [acdocaTable, cardState.actualGrossProfit]
  );

  const isClassic = uiMode === 'classic';
  const empty = acdocaTable.length === 0 || ma.revenue511 === 0;

  return (
    <section
      className={
        isClassic
          ? 'border border-[#7f9db9] bg-[#ece9d8] p-4 space-y-3'
          : 'rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4'
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-cyan-200 flex items-center gap-2">
            <Sigma className="w-4 h-4" />
            Phân tích Lợi nhuận (Account-Based Margin Analysis)
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Đọc từ <span className="font-mono text-cyan-400">selectMarginAnalysis()</span> trên ACDOCA — không
            phải costing-based CO-PA.
          </p>
        </div>
        <span className="text-[10px] font-mono text-slate-500">S/4HANA · ACDOCA · bước {currentStepId}</span>
      </div>

      {empty ? (
        <p className="text-xs text-slate-400 italic">
          Chưa có doanh thu 511 trên Universal Journal. Thực hiện Billing (VF01) rồi Settlement (VA88) để xem biên
          lợi nhuận định mức và thực tế.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <SplitSquareVertical className="w-4 h-4 text-cyan-400" />
              LN gộp ĐỊNH MỨC
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              DT 511 − (632110 + 632120 + 632130 + 632140)
            </p>
            <dl className="text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <dt className="text-slate-400">511 Doanh thu</dt>
                <dd className="text-white">{formatVND(ma.revenue511)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">632110 Vật liệu</dt>
                <dd>{formatVND(ma.cogs632110)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">632120 Nhân công</dt>
                <dd>{formatVND(ma.cogs632120)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">632130 Máy &amp; KH</dt>
                <dd>{formatVND(ma.cogs632130)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">632140 SXC</dt>
                <dd>{formatVND(ma.cogs632140)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1 font-bold text-cyan-200">
                <dt>LN gộp định mức</dt>
                <dd>{formatVND(ma.standardGrossProfit)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              LN gộp THỰC TẾ
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Định mức ± chênh lệch VA88</p>
            <dl className="text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <dt className="text-slate-400">Variance VA88</dt>
                <dd className={ma.settledVariance > 0 ? 'text-rose-300' : 'text-emerald-300'}>
                  {ma.settledVariance > 0 ? '+' : ''}
                  {formatVND(ma.settledVariance)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1 font-bold text-emerald-200">
                <dt>LN gộp thực tế</dt>
                <dd>{formatVND(ma.actualGrossProfit)}</dd>
              </div>
              <div className="flex justify-between items-center text-slate-200">
                <dt className="flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Biên LN
                </dt>
                <dd>{ma.actualMarginPercent.toFixed(2)}%</dd>
              </div>
              <div className="flex justify-between text-[11px] pt-1">
                <dt className="text-slate-500">Thẻ đơn hàng</dt>
                <dd className={ma.matchesOrderCard ? 'text-emerald-400' : 'text-rose-400'}>
                  {formatVND(ma.orderCardGrossProfit)} {ma.matchesOrderCard ? '✓ khớp' : '✗ lệch'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </section>
  );
};
