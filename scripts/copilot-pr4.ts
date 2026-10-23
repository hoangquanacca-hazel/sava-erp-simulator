/**
 * test:copilot-pr4 — Tầng A cho Netlify Function /api/copilot (không gọi Anthropic).
 * Kiểm các nhánh CHẶN: công tắc, thiếu key, dữ liệu sai, phương thức sai. Không có fallback trả lời giả.
 * Gọi model thật là Tầng B (scripts/copilot-golden.mjs), chạy trên Deploy Preview.
 */
import assert from 'node:assert/strict';

const SECRET = 'sk-test-SHOULD-NEVER-LEAK';
const mod = await import('../netlify/functions/copilot.mts');
const handler = mod.default as (req: Request) => Promise<Response>;

const env = (vals: Record<string, string | undefined>) => {
  for (const [k, v] of Object.entries(vals)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
};
const post = (body: unknown, method = 'POST') =>
  new Request('http://localhost/.netlify/functions/copilot', {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });
const valid = { message: 'chạy bước 1', sessionId: 's1', role: 'Kế toán trưởng', currentStepId: 1, stepDone: [] };

let cases = 0;
// 1) Công tắc tắt → 503, không đụng key
env({ COPILOT_ENABLED: undefined, ANTHROPIC_API_KEY: SECRET });
let r = await handler(post(valid));
assert.equal(r.status, 503); assert.equal((await r.json()).error, 'copilot_disabled'); cases++;

// 2) Bật nhưng thiếu key → 503 missing_api_key (không fallback)
env({ COPILOT_ENABLED: 'true', ANTHROPIC_API_KEY: undefined });
r = await handler(post(valid));
assert.equal(r.status, 503); assert.equal((await r.json()).error, 'missing_api_key'); cases++;

// 3) Phương thức sai
env({ COPILOT_ENABLED: 'true', ANTHROPIC_API_KEY: SECRET });
r = await handler(post(null, 'GET'));
assert.equal(r.status, 405); cases++;

// 4) Dữ liệu sai → 400, trước mọi lượt quota và gọi model
const bad: Array<[string, unknown, string]> = [
  ['message ngắn', { ...valid, message: 'ab' }, 'invalid_message'],
  ['message quá dài', { ...valid, message: 'x'.repeat(1001) }, 'invalid_message'],
  ['thiếu sessionId', { ...valid, sessionId: '' }, 'invalid_session'],
  ['role lạ', { ...valid, role: 'Admin' }, 'invalid_role'],
  ['bước 0', { ...valid, currentStepId: 0 }, 'invalid_step'],
  ['bước 8', { ...valid, currentStepId: 8 }, 'invalid_step'],
  ['bước không nguyên', { ...valid, currentStepId: 1.5 }, 'invalid_step'],
];
for (const [name, body, code] of bad) {
  r = await handler(post(body));
  assert.equal(r.status, 400, `${name} phải 400`);
  assert.equal((await r.json()).error, code, `${name} sai mã lỗi`);
  cases++;
}

// 5) JSON hỏng → 400 (request hợp lệ tới bước quota không chạy được ở local — đã xử lý fail-closed, kiểm trên preview)
r = await handler(new Request('http://localhost/x', { method: 'POST', body: '{không phải json' }));
assert.equal(r.status, 400); cases++;

// 6) Không bao giờ lộ khóa trong phản hồi lỗi
for (const res of [await handler(post({ ...valid, role: 'x' })), await handler(post({ ...valid, currentStepId: 9 }))]) {
  assert.ok(!(await res.text()).includes(SECRET), 'khóa API bị lộ trong phản hồi');
  cases++;
}

assert.ok(cases >= 12, `số ca quá ít (${cases})`);
console.log(`copilot-pr4 PASS — ${cases} ca chặn (công tắc, thiếu key, dữ liệu sai, khóa không lộ). Gọi model thật: xem Tầng B.`);
