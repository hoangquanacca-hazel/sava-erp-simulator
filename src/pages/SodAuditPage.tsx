import React from 'react';
import { ShieldBan } from 'lucide-react';
import { UIMode } from '../types';
import { AuditEvent, SIM_ROLES, SimRole, canRoleRunStep } from '../features/sod';

export const SodAuditPage: React.FC<{
  role: SimRole;
  onRole: (r: SimRole) => void;
  audit: AuditEvent[];
  sessionId: string;
  uiMode?: UIMode;
}> = ({ role, onRole, audit, sessionId, uiMode = 'fiori' }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h2 className={`text-lg font-bold ${uiMode === 'classic' ? 'text-[#0a246a]' : 'text-white'}`}>
        SoD / RBAC + Audit Trail
      </h2>
      <p className="text-xs text-amber-400">MÔ PHỎNG — không phải IP thật, không bất biến, không phải log SAP GRC.</p>
      <div className="flex flex-wrap gap-2">
        {SIM_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRole(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
              role === r ? 'bg-cyan-700 text-white border-cyan-400' : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-slate-500 font-mono">Session id (MÔ PHỎNG): {sessionId}</p>
      <div className="rounded-xl border border-slate-800 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="text-left p-2">Action</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Time</th>
              <th className="text-left p-2">Session id</th>
            </tr>
          </thead>
          <tbody>
            {audit.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-slate-500">
                  Chưa có hành động.
                </td>
              </tr>
            )}
            {audit.map((e) => (
              <tr key={e.id} className="border-t border-slate-800 text-slate-200">
                <td className="p-2">{e.action}</td>
                <td className="p-2">{e.role}</td>
                <td className="p-2 font-mono">{e.time}</td>
                <td className="p-2 font-mono">{e.sessionId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
        {[1, 2, 3, 4, 5, 6, 7].map((s) => {
          const g = canRoleRunStep(role, s);
          return (
            <div key={s} className={`p-2 rounded border ${g.ok ? 'border-emerald-800' : 'border-rose-800'}`}>
              Bước {s}: {g.ok ? 'được phép' : g.reason}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 flex gap-1">
        <ShieldBan className="w-3.5 h-3.5" /> Hành động trái vai trò mở modal đỏ «Vi phạm phân quyền (SoD)».
      </p>
    </div>
  );
};

export default SodAuditPage;
