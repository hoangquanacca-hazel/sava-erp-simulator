import { MTOParameters } from '../types';

export interface MdgCheck {
  key: 'mdgMaterialApproved' | 'mdgBomApproved' | 'mdgRoutingApproved' | 'mdgRatesApproved';
  label: string;
  approved: boolean;
}

export function mdgChecks(params: MTOParameters): MdgCheck[] {
  return [
    { key: 'mdgMaterialApproved', label: 'Material Master (MM01) approved', approved: params.mdgMaterialApproved === true },
    { key: 'mdgBomApproved', label: 'BOM (CS01) approved', approved: params.mdgBomApproved === true },
    { key: 'mdgRoutingApproved', label: 'Routing (CA01) approved', approved: params.mdgRoutingApproved === true },
    { key: 'mdgRatesApproved', label: 'Hourly rates (CR01) approved', approved: params.mdgRatesApproved === true },
  ];
}

export function mdgGateOpen(params: MTOParameters): { ok: boolean; missing: string[] } {
  const checks = mdgChecks(params);
  const missing = checks.filter((c) => !c.approved).map((c) => c.label);
  return { ok: missing.length === 0, missing };
}
