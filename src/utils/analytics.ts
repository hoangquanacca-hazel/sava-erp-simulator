// Lightweight analytics wrapper (Google Analytics 4).
// Enabled only when VITE_GA_ID is set at build time (Netlify env var).
// No ID -> no-op, so local dev and un-configured deploys stay clean.

const GA_ID = (import.meta as any)?.env?.VITE_GA_ID as string | undefined;
let inited = false;

export function initAnalytics(): void {
  if (inited || !GA_ID || typeof document === 'undefined') return;
  inited = true;
  try {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      w.dataLayer.push(arguments);
    };
    w.gtag('js', new Date());
    w.gtag('config', GA_ID);
  } catch {
    /* analytics must never break the app */
  }
}

export function track(event: string, params: Record<string, any> = {}): void {
  try {
    (window as any).gtag?.('event', event, params);
  } catch {
    /* no-op */
  }
}
