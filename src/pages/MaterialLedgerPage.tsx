import React, { useMemo } from 'react';
import { AcdocaLine, MTOComputed, MTOParameters, UIMode } from '../types';
import { formatVND } from '../utils/calculator';
import { selectTrialBalance } from '../utils/acdoca';
import { postCkmlcp, usdOf, USD_RATE_LABEL } from '../features/materialLedger';
import { nz } from '../utils/acdoca';

export const MaterialLedgerPage: React.FC<{
  params: MTOParameters;
  computed: MTOComputed;
  acdoca: AcdocaLine[];
  onParams: (p: MTOParameters) => void;
  onPosted: (lines: AcdocaLine[]) => void;
  uiMode?: UIMode;
}> = ({ params, computed, acdoca, onParams, onPosted, uiMode = 'fiori' }) => {
  const tb = useMemo(() => selectTrialBalance(acdoca), [acdoca]);
  const rate = nz(params.usdDisplayRate);
  const run = () => {
    const table = [...acdoca];
    const lines = postCkmlcp(table, params, computed, 0);
    onPosted(lines);
  };
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h2 className={`text-lg font-bold ${uiMode === 'classic' ? 'text-[#0a246a]' : 'text-white'}`}>
        Material Ledger (simple) — CKMLCP
      </h2>
      <p className="text-xs text-slate-400">
        Một sổ luật VND. USD chỉ hiển thị. Không dựng 3 valuation books. Thiếu tỷ giá → USD = 0.
      </p>
      <label className="block text-[11px] text-slate-400 max-w-sm space-y-1">
        <span>{USD_RATE_LABEL}</span>
        <input
          type="number"
          value={params.usdDisplayRate ?? 0}
          onChange={(e) => onParams({ ...params, usdDisplayRate: e.target.value === '' ? 0 : Number(e.target.value) })}
          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 font-mono text-slate-100"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-800 p-3">
          <div className="text-[10px] text-slate-500">Legal VND · PS Nợ</div>
          <div className="font-mono text-cyan-300">{formatVND(tb.totalDebitTurnover)}</div>
        </div>
        <div className="rounded-lg border border-slate-800 p-3">
          <div className="text-[10px] text-slate-500">USD minh họa</div>
          <div className="font-mono text-amber-300">{usdOf(tb.totalDebitTurnover, rate).toLocaleString('en-US')}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={run}
        className="px-3 py-2 rounded-lg bg-cyan-700 text-white text-xs font-bold cursor-pointer"
      >
        Chạy CKMLCP (revalue 155 / 632 vs 154)
      </button>
      <p className="text-[11px] text-slate-500">
        Production variance = Actual−STD. Purchase variance = 0 trừ khi GR/IR (M7) cung cấp. Nếu VA88 đã ghi variance
        thì CKMLCP không ghi trùng.
      </p>
    </div>
  );
};

export default MaterialLedgerPage;
