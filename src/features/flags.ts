/** Feature flags for Speed MVP modules. Default ON (trừ m6Copilot — mặc định TẮT, rollback = tắt flag). Persist in localStorage. */

export type FeatureFlagKey =
  | 'm1Variance'
  | 'm2CloseCockpit'
  | 'm3WipSettlement'
  | 'm4MdgGate'
  | 'm5SodRbac'
  | 'm6MaterialLedger'
  | 'm7GrIr'
  | 'm8Intercompany'
  | 'm6Copilot';

export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlagKey, boolean> = {
  m1Variance: true,
  m2CloseCockpit: true,
  m3WipSettlement: true,
  m4MdgGate: true,
  m5SodRbac: true,
  m6MaterialLedger: true,
  m7GrIr: true,
  m8Intercompany: true,
  /** Sava Copilot (plan D2): mặc định TẮT. Không có route/UI nào đọc flag này ở PR-2. */
  m6Copilot: false,
};

const STORAGE_KEY = 'sava_feature_flags';

export function loadFeatureFlags(): Record<FeatureFlagKey, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...FEATURE_FLAG_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Record<FeatureFlagKey, boolean>>;
    return { ...FEATURE_FLAG_DEFAULTS, ...parsed };
  } catch {
    return { ...FEATURE_FLAG_DEFAULTS };
  }
}

export function saveFeatureFlags(flags: Record<FeatureFlagKey, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {
    /* ignore */
  }
}
