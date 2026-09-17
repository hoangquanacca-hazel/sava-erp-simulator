import React, { useMemo } from 'react';
import { Factory, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AcdocaLine, MTOComputed, MTOParameters, UIMode } from '../types';
import { formatVND, formatNumber } from '../utils/calculator';
import { selectTrialBalance } from '../utils/acdoca';
import { wipStatusOf } from '../features/wip';

export const WipSettlementPage: React.FC<{
  params: MTOParameters;
  computed: MTOComputed;
  acdoca: AcdocaLine[];
  onChangeDelivered: (qty: number) => void;
  uiMode?: UIMode;
}> = ({ params, computed, acdoca, onChangeDelivered, uiMode = 'fiori' }) => {
  const wip = wipStatusOf(params);
  const tb = useMemo(() => selectTrialBalance(acdoca), [acdoca]);
  const acc154 = tb.items.find((i) => i.accountNumber === '154');
  const wip154 = acc154 ? acc154.closingDebit : 0;
  const dr632 = acdoca.filter((l) => l.glAccount === '632' || l.glAccount.startsWith('632')).reduce((s, l) => s + l.drAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h2 className={`text-lg font-bold ${uiMode === 'classic' ? 'text-[#0a246a]' : 'text-white'}`}>
          KKA2 · WIP / Settlement
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Nếu SL đã giao &lt; SL đặt hàng: giữ WIP trên 154 (RA), không settle 632 phần chưa giao. TECO (giao đủ):
          clear 154 → 632.
        </p>
      </div>

      <label className="block max-w-sm text-xs text-slate-400 space-y-1">
        <span>SL đã giao (cái) — trống/không nhập trên preset = giao đủ</span>
        <input
          type="number"
          min={0}
          value={wip.deliveredWasOmitted ? wip.ordered : wip.delivered}
          onChange={(e) => onChangeDelivered(e.target.value === '' ? 0 : Number(e.target.value))}
          className="w-full text-sm rounded px-3 py-2 bg-slate-950 border border-slate-700 text-white font-mono"
        />
      </label>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <div className="text-[10px] text-slate-500">Đặt hàng</div>
          <div className="font-mono text-slate-100">{formatNumber(wip.ordered)}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <div className="text-[10px] text-slate-500">Đã giao</div>
          <div className="font-mono text-cyan-300">{formatNumber(wip.delivered)}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <div className="text-[10px] text-slate-500">Trạng thái</div>
          <div className={`font-bold ${wip.teco ? 'text-emerald-400' : 'text-amber-400'}`}>
            {wip.teco ? 'TECO — giao đủ, settle 154→632' : 'RA WIP — giữ 154, chưa settle phần chưa giao'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <div className="text-[10px] text-slate-500">Dư Nợ 154 (WIP)</div>
          <div className="font-mono text-amber-300">{formatVND(wip154)}</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300 space-y-2">
        <div className="flex items-center gap-2">
          {wip.teco ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          <Factory className="w-4 h-4 text-slate-500" />
          <span>
            STD {formatVND(computed.plannedCost)} · tỷ lệ giao {(wip.ratio * 100).toFixed(1)}% · PS Nợ 632 (gồm 632xxx){' '}
            {formatVND(dr632)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          Chạy lại 7 bước trên Cockpit sau khi đổi SL đã giao để hạch toán lại. Trial Balance hiện tại:{' '}
          {tb.isBalanced ? 'cân' : 'không cân'}.
        </p>
      </div>
    </div>
  );
};

export default WipSettlementPage;
