import React from 'react';
import { AppHashRoute, navigateHash } from '../features/hashRoute';
import { FeatureFlagKey } from '../features/flags';
import { UIMode } from '../types';

export interface ModuleNavItem {
  route: AppHashRoute;
  label: string;
  flag?: FeatureFlagKey;
}

export const MODULE_NAV: ModuleNavItem[] = [
  { route: 'cockpit', label: 'Cockpit 7 bước' },
  { route: 'variance', label: 'Variance 5-type', flag: 'm1Variance' },
  { route: 'close', label: 'Đóng sổ cuối kỳ', flag: 'm2CloseCockpit' },
  { route: 'wip', label: 'WIP / KKA2', flag: 'm3WipSettlement' },
  { route: 'mdg', label: 'MDG Gate', flag: 'm4MdgGate' },
  { route: 'sod', label: 'SoD / Audit', flag: 'm5SodRbac' },
  { route: 'ml', label: 'Material Ledger', flag: 'm6MaterialLedger' },
  { route: 'grir', label: 'GR/IR MR11', flag: 'm7GrIr' },
  { route: 'ic', label: 'Intercompany TP', flag: 'm8Intercompany' },
];

export const ModuleNav: React.FC<{
  current: AppHashRoute;
  flags: Record<FeatureFlagKey, boolean>;
  uiMode?: UIMode;
}> = ({ current, flags, uiMode = 'fiori' }) => {
  const isClassic = uiMode === 'classic';
  const items = MODULE_NAV.filter((i) => !i.flag || flags[i.flag]);
  return (
    <nav
      className={`border-b overflow-x-auto ${
        isClassic ? 'bg-[#ece9d8] border-[#7f9db9]' : 'bg-slate-950 border-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-1.5 min-w-max">
        {items.map((item) => {
          const active = current === item.route;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => navigateHash(item.route)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold border cursor-pointer whitespace-nowrap ${
                active
                  ? isClassic
                    ? 'bg-[#316ac5] text-white border-[#204a87]'
                    : 'bg-cyan-600 text-white border-cyan-400'
                  : isClassic
                    ? 'bg-white text-[#0a246a] border-[#7f9db9] hover:bg-[#dce6f5]'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-700'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
