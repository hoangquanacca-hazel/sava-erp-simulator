/**
 * Sava Copilot PR-5 — panel Copilot (chỉ hiển thị khi flag m6Copilot bật).
 *
 * PR-5 CHƯA có LLM (PR-4): panel chỉ cho chọn công cụ bằng nút bấm, không có ô chat tự do.
 * Mọi thao tác đi qua registry (propose → thẻ → confirm); panel không tự ghi sổ.
 */
import { useRef, useState } from 'react';
import {
  createCopilotSession,
  type ConfirmCardModel,
  type CopilotContext,
  type CopilotSession,
  type ToolOutput,
} from '../copilot/registry';
import { type AppHashRoute } from '../features/hashRoute';
import { CopilotConfirmCard } from './CopilotConfirmCard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ctx: CopilotContext;
}

interface Pending {
  id: string;
  card: ConfirmCardModel;
}

const ROUTES: AppHashRoute[] = ['cockpit', 'variance', 'close', 'wip', 'mdg', 'sod', 'ml', 'grir', 'ic'];

function describe(out: ToolOutput): string {
  switch (out.kind) {
    case 'step':
      return out.result.ok ? `Đã chạy bước ${out.result.stepId}.` : out.result.reason || 'Bước bị chặn.';
    case 'navigated':
      return `Đã mở màn hình: ${out.route}.`;
    case 'tutor_opened':
      return 'Đã chuyển câu hỏi sang AI Tutor.';
    case 'data':
      return JSON.stringify(out.data, null, 2);
  }
}

export function CopilotPanel({ isOpen, onClose, ctx }: Props) {
  const sessionRef = useRef<CopilotSession | null>(null);
  if (sessionRef.current === null) sessionRef.current = createCopilotSession();
  const session = sessionRef.current;

  const [stepId, setStepId] = useState<number>(ctx.currentStepId);
  const [route, setRoute] = useState<AppHashRoute>('cockpit');
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const [busy, setBusy] = useState(false);
  const sessionIdRef = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `s-${Date.now()}-${Math.random()}`
  );

  if (!isOpen) return null;

  const askLanguage = async () => {
    const text = freeText.trim();
    if (text.length < 3) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const stepDone = Object.keys(ctx.stepStates)
        .map(Number)
        .filter((id) => ctx.stepStates[id]?.isExecuted);
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionIdRef.current, role: ctx.role, currentStepId: ctx.currentStepId, stepDone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(`Trợ lý chưa phản hồi (${data?.error ?? res.status}).`);
        return;
      }
      if (data.type === 'text') {
        setMessage(data.text || '(không có nội dung)');
        return;
      }
      // Ý định từ model: đi qua đúng đường đề xuất → thẻ → xác nhận như nút bấm.
      run(data.tool, data.input, text);
    } catch {
      setError('Không kết nối được trợ lý. Thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  const run = (tool: string, input: unknown, prompt?: string) => {
    setError(null);
    setMessage(null);
    const out = session.propose(ctx, { tool, input }, prompt);
    if (out.status === 'rejected') {
      setError(out.reason);
      return;
    }
    if (out.status === 'needs_confirmation') {
      setPending({ id: out.pending.id, card: out.pending.card });
      return;
    }
    setMessage(describe(out.output));
  };

  const confirm = () => {
    if (!pending) return;
    const out = session.confirm(ctx, pending.id, ctx.role);
    setPending(null);
    if (out.status === 'rejected') {
      setError(out.reason);
      return;
    }
    setMessage(describe(out.output));
  };

  const cancel = () => {
    if (pending) session.cancel(pending.id);
    setPending(null);
    setMessage('Đã hủy thao tác.');
  };

  return (
    <aside
      aria-label="Sava Copilot"
      className="fixed bottom-4 right-4 z-40 w-[min(420px,calc(100vw-2rem))] max-h-[80vh] overflow-y-auto rounded-xl border border-slate-300 bg-white shadow-xl p-4 text-sm text-slate-800"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Sava Copilot</div>
          <div className="text-[11px] text-slate-500">Vai trò: {ctx.role} · Bước hiện tại: {ctx.currentStepId}</div>
        </div>
        <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800" aria-label="Đóng Copilot">
          ✕
        </button>
      </div>

      <section className="mt-3 space-y-2">
        <div className="text-[11px] font-semibold uppercase text-slate-500">Hỏi bằng ngôn ngữ tự nhiên</div>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={2}
          maxLength={1000}
          className="w-full border border-slate-300 rounded px-2 py-1"
          placeholder="Ví dụ: chạy bước 3 giúp tôi / mở màn hình đóng sổ"
          aria-label="Yêu cầu tự nhiên"
        />
        <button
          type="button"
          disabled={busy || freeText.trim().length < 3}
          onClick={askLanguage}
          className="rounded bg-slate-900 px-3 py-1 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {busy ? 'Đang xử lý…' : 'Gửi'}
        </button>
        <p className="text-[11px] text-slate-500">Mọi thao tác ghi sổ chỉ được đề xuất và cần bạn xác nhận trên thẻ.</p>
      </section>

      <section className="mt-4 space-y-2">
        <div className="text-[11px] font-semibold uppercase text-slate-500">Chạy bước MTO</div>
        <div className="flex gap-2">
          <select
            value={stepId}
            onChange={(e) => setStepId(Number(e.target.value))}
            className="border border-slate-300 rounded px-2 py-1"
            aria-label="Chọn bước"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                Bước {n}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => run('run_mto_step', { stepId }, `Chạy bước ${stepId} (nút)`)}
            className="rounded bg-slate-900 px-3 py-1 text-white hover:bg-slate-700"
          >
            Đề xuất chạy
          </button>
        </div>
      </section>

      <section className="mt-4 space-y-2">
        <div className="text-[11px] font-semibold uppercase text-slate-500">Mở màn hình</div>
        <div className="flex gap-2">
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value as AppHashRoute)}
            className="border border-slate-300 rounded px-2 py-1"
            aria-label="Chọn màn hình"
          >
            {ROUTES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => run('navigate', { route })} className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-100">
            Mở
          </button>
        </div>
      </section>

      <section className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => run('check_close_readiness', {})} className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-100">
          Kiểm tra đóng kỳ
        </button>
        <button type="button" onClick={() => run('explain_variance', {})} className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-100">
          Giải thích chênh lệch
        </button>
      </section>

      <section className="mt-4 space-y-2">
        <div className="text-[11px] font-semibold uppercase text-slate-500">Hỏi kiến thức (AI Tutor)</div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          maxLength={1000}
          className="w-full border border-slate-300 rounded px-2 py-1"
          placeholder="Ví dụ: TT99 quy định TK 627 thế nào?"
          aria-label="Câu hỏi kiến thức"
        />
        <button
          type="button"
          disabled={question.trim().length < 3}
          onClick={() => run('ask_knowledge', { question: question.trim() })}
          className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-50"
        >
          Hỏi
        </button>
      </section>

      {pending && (
        <div className="mt-4">
          <CopilotConfirmCard card={pending.card} role={ctx.role} onConfirm={confirm} onCancel={cancel} />
        </div>
      )}
      {error && <p className="mt-3 rounded bg-red-50 p-2 text-[12px] text-red-700" role="alert">{error}</p>}
      {message && <pre className="mt-3 whitespace-pre-wrap rounded bg-slate-50 p-2 text-[12px] text-slate-700">{message}</pre>}
    </aside>
  );
}
