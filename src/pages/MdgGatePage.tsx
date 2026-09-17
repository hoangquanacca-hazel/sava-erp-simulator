import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { MTOParameters, UIMode } from '../types';
import { mdgChecks, mdgGateOpen } from '../features/mdg';

export const MdgGatePage: React.FC<{
  params: MTOParameters;
  onChange: (next: MTOParameters) => void;
  uiMode?: UIMode;
}> = ({ params, onChange, uiMode = 'fiori' }) => {
  const gate = mdgGateOpen(params);
  const checks = mdgChecks(params);
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h2 className={`text-lg font-bold ${uiMode === 'classic' ? 'text-[#0a246a]' : 'text-white'}`}>
        MDG Gate — trước Bước 1 (VA01)
      </h2>
      <p className="text-xs text-slate-400">
        Không FI. Material / BOM / Routing / hourly rates phải approved. Thiếu → chặn Step 1.
      </p>
      {!gate.ok && (
        <div className="rounded-xl border border-rose-700 bg-rose-950/40 p-3 text-rose-200 text-sm flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          BLOCK Step 1: {gate.missing.join(' · ')}
        </div>
      )}
      {gate.ok && (
        <div className="rounded-xl border border-emerald-700 bg-emerald-950/30 p-3 text-emerald-300 text-sm flex gap-2">
          <CheckCircle2 className="w-4 h-4" /> Master data approved — được tạo Sales Order.
        </div>
      )}
      <div className="space-y-2">
        {checks.map((c) => (
          <label
            key={c.key}
            className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={c.approved}
              onChange={(e) => onChange({ ...params, [c.key]: e.target.checked })}
            />
            {c.label}
          </label>
        ))}
      </div>
    </div>
  );
};

export default MdgGatePage;
