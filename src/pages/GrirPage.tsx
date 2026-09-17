import React from 'react';
import { AcdocaLine, JournalEntry, MTOParameters, UIMode } from '../types';
import { formatVND } from '../utils/calculator';
import { grirAmounts, hanging3388, postGr, postMiro, postMr11 } from '../features/grir';

export const GrirPage: React.FC<{
  params: MTOParameters;
  acdoca: AcdocaLine[];
  onParams: (p: MTOParameters) => void;
  onPosted: (lines: AcdocaLine[], entry: JournalEntry | null) => void;
  uiMode?: UIMode;
}> = ({ params, acdoca, onParams, onPosted, uiMode = 'fiori' }) => {
  const amts = grirAmounts(params);
  const hang = hanging3388(acdoca);
  const setNum = (k: keyof MTOParameters, v: string) =>
    onParams({ ...params, [k]: v === '' ? 0 : Number(v) });
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h2 className={`text-lg font-bold ${uiMode === 'classic' ? 'text-[#0a246a]' : 'text-white'}`}>
        GR/IR · MR11
      </h2>
      <p className="text-xs text-slate-400">
        MIGO Dr 152/Cr 3388 · MIRO Dr 3388/Cr 331. Lệch giá/SL → 3388 treo. MR11 clear 3388 ↔ 632 hoặc 152. Ô trống = 0.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {(
          [
            ['grQtyKg', 'GR SL kg'],
            ['grPricePerKg', 'GR giá VND/kg'],
            ['miroQtyKg', 'MIRO SL kg'],
            ['miroPricePerKg', 'MIRO giá VND/kg'],
          ] as const
        ).map(([k, lab]) => (
          <label key={k} className="text-[10px] text-slate-400 space-y-1">
            {lab}
            <input
              type="number"
              value={(params[k] as number) ?? 0}
              onChange={(e) => setNum(k, e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 font-mono text-slate-100"
            />
          </label>
        ))}
      </div>
      <div className="text-sm text-slate-300">
        GR {formatVND(amts.grAmt)} · MIRO {formatVND(amts.miroAmt)} · Treo 3388 (tính từ input) {formatVND(amts.hanging3388)} ·
        Sổ 3388 net Có {formatVND(hang)}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded bg-slate-800 border border-slate-600 text-xs font-bold cursor-pointer"
          onClick={() => {
            const t = [...acdoca];
            const r = postGr(t, params);
            onPosted(r.acdoca, r.entry);
          }}
        >
          MIGO GR
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded bg-slate-800 border border-slate-600 text-xs font-bold cursor-pointer"
          onClick={() => {
            const t = [...acdoca];
            const r = postMiro(t, params);
            onPosted(r.acdoca, r.entry);
          }}
        >
          MIRO
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded bg-slate-800 border border-slate-600 text-xs font-bold cursor-pointer"
          onClick={() => {
            const t = [...acdoca];
            const r = postMr11(t, params, '152');
            onPosted(r.acdoca, r.entry);
          }}
        >
          MR11 → 152
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded bg-slate-800 border border-slate-600 text-xs font-bold cursor-pointer"
          onClick={() => {
            const t = [...acdoca];
            const r = postMr11(t, params, '632');
            onPosted(r.acdoca, r.entry);
          }}
        >
          MR11 → 632
        </button>
      </div>
    </div>
  );
};

export default GrirPage;
