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
    // Không trả bất kỳ ký tự/độ dài nào của khóa (AUD-013): chỉ cho biết có khóa hay không.
    hasApiKey: Boolean(key),
  });
};
