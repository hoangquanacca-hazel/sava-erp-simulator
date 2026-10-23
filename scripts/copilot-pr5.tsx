/**
 * test:copilot-pr5 — nghiệm thu Tầng A cho Copilot PR-5 (panel, không LLM).
 * Render thật bằng react-dom/server; không dựng DOM giả. Thiếu gì thì assert lỗi, không in PASS.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { CopilotPanel } from '../src/components/CopilotPanel';
import { PRESET_SCENARIOS, type MTOParameters } from '../src/types';
import { computeMTO } from '../src/utils/calculator';
import { EMPTY_CLOSE } from '../src/features/periodClose';
import { FEATURE_FLAG_DEFAULTS, type FeatureFlagKey } from '../src/features/flags';
import type { CopilotContext } from '../src/copilot/registry';

const params: MTOParameters = PRESET_SCENARIOS[0].params;
const stepStates = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((id) => [id, {
  isExecuted: false, qmDecision: null, qmReworkCost: 0, qmScrapCost: 0, qmReworkHandled: false,
  actualVariancePercent: 0, entries: [], acdocaLines: [],
}]));
const ctx: CopilotContext = {
  role: 'Kế toán trưởng',
  flags: { ...FEATURE_FLAG_DEFAULTS, m6Copilot: true } as Record<FeatureFlagKey, boolean>,
  params,
  computed: computeMTO(params),
  closeState: { ...EMPTY_CLOSE },
  stepStates,
  currentStepId: 1,
  registrationBlock: () => null,
  runStep: () => ({ ok: true, stepId: 1 }),
  navigate: () => {},
  openTutor: () => {},
};

// 1) Đóng → không render gì
assert.equal(renderToStaticMarkup(<CopilotPanel isOpen={false} onClose={() => {}} ctx={ctx} />), '', 'panel đóng vẫn render');

// 2) Mở → có đủ nút công cụ và ô ngôn ngữ tự nhiên (PR-4)
const html = renderToStaticMarkup(<CopilotPanel isOpen onClose={() => {}} ctx={ctx} />);
for (const must of ['Sava Copilot', 'Hỏi bằng ngôn ngữ tự nhiên', 'Đề xuất chạy', 'Kiểm tra đóng kỳ', 'Giải thích chênh lệch', 'Hỏi kiến thức (AI Tutor)', 'Kế toán trưởng']) {
  assert.ok(html.includes(must), `thiếu nội dung: ${must}`);
}
assert.equal((html.match(/<textarea/g) || []).length, 2, 'phải đúng 2 ô nhập: ngôn ngữ tự nhiên + hỏi kiến thức');
assert.equal((html.match(/<input/g) || []).length, 0, 'không được có input tự do');

// 3) Gating trong App.tsx: panel và nút mở chỉ khi flag m6Copilot bật; cổng lead đúng điều kiện Classic
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
assert.match(app, /\{flags\.m6Copilot && !copilotOpen && \(/, 'nút Copilot không được gate bằng flag');
assert.match(app, /\{flags\.m6Copilot && \(\s*<CopilotPanel/, 'panel không được gate bằng flag');
assert.match(app, /registrationBlock: \(stepId: number\) =>\s*stepId >= 3 && !isRegistered && !adminSettings\.bypassSessionLimits/, 'cổng lead của panel không khớp Classic (ngưỡng 3)');
assert.match(app, /if \(stepId >= 3 && !isRegistered && !adminSettings\.bypassSessionLimits\) \{|stepId >= 3 && !isRegistered && !adminSettings\.bypassSessionLimits/, 'Classic gốc không còn ngưỡng 3');
assert.match(app, /setLeadModalTriggerReason\('ai_tutor'\)/, 'AI Tutor không đi qua cổng lead như Classic');
assert.equal(FEATURE_FLAG_DEFAULTS.m6Copilot, false, 'm6Copilot phải mặc định TẮT');

console.log('copilot-pr5 PASS — panel render thật; có ô ngôn ngữ tự nhiên; gate flag và cổng lead khớp Classic; m6Copilot mặc định tắt');
