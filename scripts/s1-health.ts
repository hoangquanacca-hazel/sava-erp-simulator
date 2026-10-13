/** T1 — /api/health không được trả bất kỳ ký tự/độ dài/định dạng nào của khóa Gemini. Sai là exit 1. */
import { readFileSync } from 'node:fs';
import health from '../netlify/functions/health.mts';

const fails: string[] = [];
// Khóa giả dựng lúc chạy (không lưu chuỗi dạng khóa trong repo).
const fake = ['AI', 'za', 'Q7x', 'K9mPz'.repeat(7)].join('');
for (const [label, value] of [['có khóa', fake], ['không khóa', '']] as const) {
  if (value) process.env.GEMINI_API_KEY = value;
  else delete process.env.GEMINI_API_KEY;
  const res = await health();
  const text = await res.text();
  const body = JSON.parse(text);
  const keys = Object.keys(body).sort().join(',');
  if (keys !== 'app,hasApiKey,status') fails.push(`${label}: trường trả về ${keys} (chỉ được app,hasApiKey,status)`);
  if (body.hasApiKey !== Boolean(value)) fails.push(`${label}: hasApiKey=${body.hasApiKey}`);
  if (value && (text.includes(value.slice(0, 4)) || text.includes(String(value.length))))
    fails.push(`${label}: phản hồi lộ tiền tố/độ dài khóa`);
}
// server.ts (dev): /api/health chỉ được dùng Boolean(process.env.GEMINI_API_KEY)
const srv = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const block = srv.slice(srv.indexOf("app.get('/api/health'"), srv.indexOf('});', srv.indexOf("app.get('/api/health'")));
if (/keyPrefix|keyLen|GEMINI_API_KEY\s*\.(slice|length|substring)/.test(block)) fails.push('server.ts /api/health lộ thông tin khóa');
if (fails.length) { console.error('FAIL\n' + fails.join('\n')); process.exit(1); }
console.log('PASS T1 /api/health chỉ trả status/app/hasApiKey (Netlify + server.ts)');
