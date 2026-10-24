// Netlify Function: /api/copilot — Sava Copilot PR-4 (Claude tool use, chỉ trả về ý định, KHÔNG thực thi).
// Quy tắc:
//  - ANTHROPIC_API_KEY chỉ ở server. Không có fallback: thiếu key / tắt công tắc / hết hạn mức → lỗi rõ ràng.
//  - Model chỉ trả về tool_use {tool, input}. Ghi sổ, kiểm quyền, thẻ xác nhận chạy ở client (registry).
//  - Công tắc COPILOT_ENABLED=true mới phục vụ. Hạn mức: COPILOT_DAILY_CAP (toàn hệ thống/ngày), COPILOT_SESSION_CAP (mỗi phiên/ngày).
import { getStore } from '@netlify/blobs';
import { COPILOT_TOOLS } from '../../src/copilot/registry';
import { SIM_ROLES } from '../../src/features/sod';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

function readEnv(name: string): string | undefined {
  const v =
    (globalThis as any)?.Netlify?.env?.get?.(name) ??
    (typeof process !== 'undefined' ? process.env?.[name] : undefined);
  return typeof v === 'string' && v.trim() !== '' ? v.trim().replace(/^["']|["']$/g, '') : undefined;
}

const SYSTEM = `Bạn là Sava Copilot cho mô phỏng ERP sản xuất MTO (PIC Vietnam, TT99).
- Nếu người dùng yêu cầu một thao tác hoặc câu hỏi khớp một công cụ, gọi đúng MỘT công cụ với tham số đúng.
- Nếu yêu cầu ngoài phạm vi (thời tiết, thơ, tiết lộ khóa, xóa audit, bỏ qua phân quyền...), KHÔNG gọi công cụ; trả lời ngắn bằng tiếng Việt rằng việc đó ngoài phạm vi.
- Không bao giờ bịa số liệu. Không nói bạn đã ghi sổ; thao tác ghi sổ chỉ được đề xuất và cần người dùng xác nhận.
- Số bước là 1–7. Màn hình là một trong: cockpit, variance, close, wip, mdg, sod, ml, grir, ic.
- Với run_mto_step luôn phải có stepId (1–7). Nếu người dùng không nêu số bước, hỏi lại bằng text thay vì gọi công cụ.
- Mỗi lượt chỉ gọi tối đa một công cụ; nếu yêu cầu gồm nhiều bước, gọi bước đầu tiên và nói rõ phần còn lại cần làm sau.`;

const QUOTA_STORE = 'copilot-quota';

async function bumpQuota(key: string, cap: number): Promise<boolean> {
  const store = getStore(QUOTA_STORE);
  const current = Number((await store.get(key)) ?? '0');
  if (current >= cap) return false;
  await store.set(key, String(current + 1));
  return true;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  if (readEnv('COPILOT_ENABLED') !== 'true') return json(503, { error: 'copilot_disabled' });

  const apiKey = readEnv('ANTHROPIC_API_KEY');
  if (!apiKey) return json(503, { error: 'missing_api_key' });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
  const role = body?.role;
  const currentStepId = body?.currentStepId;
  const stepDone: unknown = body?.stepDone;
  if (message.length < 3 || message.length > 1000) return json(400, { error: 'invalid_message' });
  if (!sessionId || sessionId.length > 64) return json(400, { error: 'invalid_session' });
  if (!(SIM_ROLES as readonly string[]).includes(role)) return json(400, { error: 'invalid_role' });
  if (!Number.isInteger(currentStepId) || currentStepId < 1 || currentStepId > 7) return json(400, { error: 'invalid_step' });
  const done = Array.isArray(stepDone) ? stepDone.filter((n) => Number.isInteger(n) && n >= 1 && n <= 7) : [];

  const day = new Date().toISOString().slice(0, 10);
  const dailyCap = Number(readEnv('COPILOT_DAILY_CAP') ?? '300');
  const sessionCap = Number(readEnv('COPILOT_SESSION_CAP') ?? '40');
  // Fail closed: không đếm được hạn mức thì không gọi model.
  let allowed: { global: boolean; session: boolean };
  try {
    const g = await bumpQuota(`global:${day}`, dailyCap);
    if (!g) return json(429, { error: 'daily_cap_reached' });
    const se = await bumpQuota(`session:${sessionId}:${day}`, sessionCap);
    allowed = { global: g, session: se };
  } catch {
    return json(503, { error: 'quota_unavailable' });
  }
  if (!allowed.session) return json(429, { error: 'session_cap_reached' });

  const model = readEnv('COPILOT_MODEL') ?? 'claude-sonnet-5-5';
  const tools = COPILOT_TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema }));
  const userText = `Vai trò: ${role}. Bước hiện tại: ${currentStepId}. Đã chạy: ${done.join(', ') || 'chưa có'}.\nYêu cầu: ${message}`;

  let upstream: Response;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': ANTHROPIC_VERSION, 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        system: SYSTEM,
        tools,
        tool_choice: { type: 'auto' },
        messages: [{ role: 'user', content: userText }],
      }),
    });
  } catch {
    return json(502, { error: 'upstream_unreachable' });
  }
  if (!upstream.ok) return json(502, { error: 'upstream_error', status: upstream.status });

  const data: any = await upstream.json();
  const blocks: any[] = Array.isArray(data?.content) ? data.content : [];
  const toolUse = blocks.find((b) => b?.type === 'tool_use');
  if (toolUse) return json(200, { type: 'tool', tool: toolUse.name, input: toolUse.input ?? {}, model });
  const text = blocks
    .filter((b) => b?.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  return json(200, { type: 'text', text, model });
};
