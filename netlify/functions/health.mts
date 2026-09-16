// Netlify Function: /api/health
export default async (): Promise<Response> => {
  return Response.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    app: 'Savafinlab MTO ERP Simulator',
  });
};
