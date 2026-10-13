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
    // Chỉ trả cờ có/không — không lộ bất kỳ ký tự, độ dài hay định dạng nào của khóa (T1/AUD-013).
    hasApiKey: Boolean(key),
  });
};
