export type AppHashRoute =
  | 'cockpit'
  | 'variance'
  | 'close'
  | 'wip'
  | 'mdg'
  | 'sod'
  | 'ml'
  | 'grir'
  | 'ic';

const HASH_MAP: Record<string, AppHashRoute> = {
  '/': 'cockpit',
  '': 'cockpit',
  '/variance': 'variance',
  '/close': 'close',
  '/wip': 'wip',
  '/mdg': 'mdg',
  '/sod': 'sod',
  '/ml': 'ml',
  '/grir': 'grir',
  '/ic': 'ic',
};

export const ROUTE_HASH: Record<AppHashRoute, string> = {
  cockpit: '#/',
  variance: '#/variance',
  close: '#/close',
  wip: '#/wip',
  mdg: '#/mdg',
  sod: '#/sod',
  ml: '#/ml',
  grir: '#/grir',
  ic: '#/ic',
};

export function parseHash(hash = typeof window !== 'undefined' ? window.location.hash : '#/'): AppHashRoute {
  const path = (hash || '#/').replace(/^#/, '') || '/';
  return HASH_MAP[path] || 'cockpit';
}

export function navigateHash(route: AppHashRoute): void {
  const next = ROUTE_HASH[route];
  if (window.location.hash !== next) {
    window.location.hash = next;
  }
}
