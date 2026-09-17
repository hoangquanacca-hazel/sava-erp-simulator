import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AlertTriangle, CheckCircle2, GitCommitHorizontal } from 'lucide-react';
import { MTOComputed, MTOParameters, UIMode } from '../types';
import { formatVND } from '../utils/calculator';
import {
  assertFiveTypeVariance,
  buildVarianceWaterfall,
  computeFiveTypeVariance,
} from '../features/variance';

export const VarianceWaterfallPage: React.FC<{
  params: MTOParameters;
  computed: MTOComputed;
  uiMode?: UIMode;
}> = ({ params, computed, uiMode = 'fiori' }) => {
  const v = useMemo(() => computeFiveTypeVariance(params, computed), [params, computed]);
  const chart = useMemo(() => buildVarianceWaterfall(v), [v]);

  let assertError: string | null = null;
  try {
    assertFiveTypeVariance(v);
  } catch (e) {
    assertError = e instanceof Error ? e.message : String(e);
  }

  const isClassic = uiMode === 'classic';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30">
          <GitCommitHorizontal className="w-5 h-5" />
        </div>
        <div>
          <h2 className={`text-lg font-bold ${isClassic ? 'text-[#0a246a]' : 'text-white'}`}>
            Step 7 · Variance 5 loại & Waterfall (CO-PA)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Phân tích hiển thị: Vp = SM·pₘ, Vq = SM·qₘ, Vr = (SL+SO)·rₑ, Vs = c·Su, Vrem = TV − Σ.
            TV = Actual − STD. FI vẫn ghi net TV vào TK 632 tại VA88 (đã có). Năm loại này không tách
            bút toán luật định.
          </p>
        </div>
      </div>

      {assertError ? (
        <div className="rounded-xl border border-rose-700 bg-rose-950/50 p-3 text-rose-200 text-sm flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {assertError}
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 p-3 text-emerald-300 text-sm flex gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ASSERT Vp+Vq+Vr+Vs+Vrem === TV ({formatVND(v.TV)})
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ['SM vật liệu STD', v.SM],
          ['SL nhân công', v.SL],
          ['SO SXC', v.SO],
          ['STD', v.stdCost],
          ['Actual', v.actualCost],
          ['TV', v.TV],
        ].map(([label, amt]) => (
          <div key={String(label)} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div className="text-[10px] uppercase text-slate-500">{label}</div>
            <div className="font-mono text-sm text-cyan-300 mt-1">{formatVND(Number(amt))}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ['Vp giá NVL', v.Vp, `SM × ${v.pmPercent}%`],
          ['Vq SL NVL', v.Vq, `SM × ${v.qmPercent}%`],
          ['Vr nguồn lực', v.Vr, `(SL+SO) × ${v.rePercent}%`],
          ['Vs phế phẩm', v.Vs, `c × ${v.scrapUnits} Su`],
          ['Vrem còn lại', v.Vrem, 'TV − (Vp+Vq+Vr+Vs)'],
        ].map(([label, amt, formula]) => (
          <div key={String(label)} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="text-[10px] uppercase text-slate-500">{label}</div>
            <div className="font-mono text-sm text-white mt-1">{formatVND(Number(amt))}</div>
            <div className="text-[10px] text-slate-500 mt-1">{formula}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 h-[360px]">
        <h3 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
          Waterfall STD → Actual
        </h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chart} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              formatter={(value, name, item) => {
                if (name === 'invisible') return [null, null];
                const signed = (item as { payload?: { signed?: number } })?.payload?.signed ?? value;
                return [formatVND(Number(signed)), 'Số tiền'];
              }}
            />
            <Bar dataKey="invisible" stackId="w" fill="transparent" />
            <Bar dataKey="value" stackId="w">
              {chart.map((row) => (
                <Cell key={row.name} fill={row.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VarianceWaterfallPage;
