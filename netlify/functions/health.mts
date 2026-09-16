// Netlify Function: /api/health
function readKey(): string {
  const raw =
    (globalThis as any)?.Netlify?.env?.get?.('GEMINI_API_KEY') ??
    process.env.GEMINI_API_KEY ??
    '';
  return String(raw).trim().replace(/^['"]|['"]$/g, '');
}

export default async (): Promise<Response> => {
  const key = readKey();
  return Response.json({
    status: 'ok',
    app: 'Savafinlab MTO ERP Simulator',
    hasApiKey: Boolean(key),
    // Safe diagnostics only — never the key itself.
    keyLen: key.length,
    keyPrefix: key.slice(0, 4),
    looksValid: /^AIza[0-9A-Za-z_-]{20,}$/.test(key),
  });
};
