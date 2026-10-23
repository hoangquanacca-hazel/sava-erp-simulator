// test:copilot-golden — Tầng B: chạy golden set qua /api/copilot THẬT (Claude, trên Deploy Preview).
// - Không có COPILOT_EVAL_URL → SKIP (exit 2). SKIP KHÔNG được tính PASS.
// - PASS khi: độ đúng intent >= 95% VÀ 0 tool ngoài registry VÀ mọi ca chạy được (không lỗi hạ tầng).
// - Mỗi ca dùng một sessionId riêng (không đụng hạn mức phiên).
// - Ghi sổ không xác nhận: cấu trúc endpoint chỉ trả về ý định; kiểm chứng ở test:copilot-pr3 (B1).
import { readFileSync, writeFileSync } from 'node:fs';

const BASE = process.env.COPILOT_EVAL_URL;
if (!BASE) {
  console.log('copilot-golden SKIP — chưa có COPILOT_EVAL_URL (ví dụ https://deploy-preview-N--site.netlify.app). Không tính PASS.');
  process.exit(2);
}

const KNOWN_TOOLS = new Set(['run_mto_step', 'navigate', 'check_close_readiness', 'explain_variance', 'ask_knowledge']);
const golden = JSON.parse(readFileSync(new URL('../docs/golden/copilot-golden-set.json', import.meta.url), 'utf8'));
const cases = golden.cases;
if (!Array.isArray(cases) || cases.length < 60) {
  console.error(`copilot-golden FAIL — golden set thiếu (${cases?.length ?? 0} ca, cần >= 60)`);
  process.exit(1);
}

const rows = [];
let infraErrors = 0;
let unknownTool = 0;
for (const c of cases) {
  let res;
  try {
    res = await fetch(`${BASE.replace(/\/$/, '')}/api/copilot`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: c.prompt, sessionId: `eval-${c.id}-${Date.now()}`, role: 'Kế toán trưởng', currentStepId: 1, stepDone: [] }),
    });
  } catch {
    infraErrors++;
    rows.push({ id: c.id, ok: false, why: 'network' });
    continue;
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    infraErrors++;
    rows.push({ id: c.id, ok: false, why: `http ${res.status} ${body?.error ?? ''}` });
    continue;
  }
  if (body.type === 'tool' && !KNOWN_TOOLS.has(body.tool)) unknownTool++;

  const exp = c.expect ?? {};
  let ok;
  if (exp.tool === null) {
    ok = body.type === 'text';
  } else {
    ok = body.type === 'tool' && body.tool === exp.tool;
    if (ok && exp.input) {
      for (const [k, v] of Object.entries(exp.input)) {
        if (body.input?.[k] !== v) ok = false;
      }
    }
  }
  rows.push({ id: c.id, ok, got: body.type === 'tool' ? `${body.tool}${JSON.stringify(body.input ?? {})}` : `text`, want: exp.tool === null ? 'text' : `${exp.tool}${exp.input ? JSON.stringify(exp.input) : ''}` });
}

const correct = rows.filter((r) => r.ok).length;
const accuracy = correct / cases.length;
const byUc = {};
for (const c of cases) {
  byUc[c.uc] ??= { n: 0, ok: 0 };
  byUc[c.uc].n++;
  if (rows.find((r) => r.id === c.id)?.ok) byUc[c.uc].ok++;
}
const report = { url: BASE, total: cases.length, correct, accuracy: Number(accuracy.toFixed(4)), infraErrors, unknownTool, byUc, failures: rows.filter((r) => !r.ok) };
writeFileSync(new URL('../docs/golden/last-run.json', import.meta.url), JSON.stringify({ ...report, rows }, null, 2));
console.log(JSON.stringify(report, null, 2));

if (infraErrors > 0) {
  console.error(`copilot-golden FAIL — ${infraErrors} ca lỗi hạ tầng (không tính là đúng; cần chạy lại).`);
  process.exit(1);
}
if (unknownTool > 0) {
  console.error(`copilot-golden FAIL — ${unknownTool} lần model gọi tool ngoài registry.`);
  process.exit(1);
}
if (accuracy < 0.95) {
  console.error(`copilot-golden FAIL — độ đúng ${(accuracy * 100).toFixed(1)}% < 95%.`);
  process.exit(1);
}
console.log(`copilot-golden PASS — ${correct}/${cases.length} (${(accuracy * 100).toFixed(1)}%), 0 tool ngoài registry, 0 lỗi hạ tầng.`);
