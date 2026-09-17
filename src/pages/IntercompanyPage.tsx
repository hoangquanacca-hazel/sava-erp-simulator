import React from 'react';
import { AcdocaLine, MTOComputed, MTOParameters, UIMode } from '../types';
import { formatVND } from '../utils/calculator';
import { icAmounts, postIntercompany } from '../features/intercompany';

export const IntercompanyPage: React.FC<{
  params: MTOParameters;
  computed: MTOComputed;
  acdoca: AcdocaLine[];
  onParams: (p: MTOParameters) => void;
  onPosted: (lines: AcdocaLine[]) => void;
  uiMode?: UIMode;
}> = ({ params, computed, acdoca, onParams, onPosted, uiMode = 'fiori' }) => {
  const amts = icAmounts(params, computed);
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h2 className={`text-lg font-bold ${uiMode === 'classic' ? 'text-[#0a246a]' : 'text-white'}`}>
        Intercompany TP
      </h2>
      <p className="text-xs text-amber-400 font-bold">MÔ PHỎNG — giao dịch nội bộ & loại trừ hợp nhất, không phải sổ đa pháp nhân thật.</p>
      <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
        <input
          type="checkbox"
          checked={!!params.intercompanyMto}
          onChange={(e) => onParams({ ...params, intercompanyMto: e.target.checked })}
        />
        Intercompany MTO
      </label>
      <label className="block text-[11px] text-slate-400 max-w-sm">
        Markup % (trống = 0)
        <input
          type="number"
          value={params.icMarkupPercent ?? 0}
          onChange={(e) =>
            onParams({ ...params, icMarkupPercent: e.target.value === '' ? 0 : Number(e.target.value) })
          }
          className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 font-mono text-slate-100"
        />
      </label>
      <div className="text-xs text-slate-400 space-y-1">
        <p>B (produce) internal invoice: Dr 131IC / Cr 511IC, 3331 · net {formatVND(amts.internalNet)}</p>
        <p>A (sell) purchase: Dr 632 / Cr 331IC</p>
        <p>Elim: Dr 511IC / Cr 632IC · UIP Dr 632 / Cr 155 {formatVND(amts.unrealized)}</p>
      </div>
      <button
        type="button"
        disabled={!params.intercompanyMto}
        onClick={() => {
          const t = [...acdoca];
          onPosted(postIntercompany(t, params, computed));
        }}
        className="px-3 py-2 rounded-lg bg-cyan-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
      >
        Ghi IC + loại trừ (MÔ PHỎNG)
      </button>
    </div>
  );
};

export default IntercompanyPage;
