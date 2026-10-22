/**
 * Sava Copilot PR-3 — thẻ xác nhận. Chỉ hiển thị; mọi quyết định (ghi sổ / hủy) do App quyết.
 * Chưa được mount ở bất kỳ đâu: chỉ xuất hiện khi flag m6Copilot bật (PR-5 mới gắn panel).
 */
import type { ConfirmCardModel } from '../copilot/registry';
import type { SimRole } from '../features/sod';

interface Props {
  card: ConfirmCardModel;
  role: SimRole;
  onConfirm: () => void;
  onCancel: () => void;
}

const vnd = (n: number) => `${Math.round(n).toLocaleString('vi-VN')} đ`;

export function CopilotConfirmCard({ card, role, onConfirm, onCancel }: Props) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Xác nhận thao tác Copilot" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-slate-800">
      <div className="font-semibold">{card.title}</div>
      <ul className="mt-2 list-disc pl-5">
        {card.lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {card.postings.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1 pr-2">Diễn giải</th>
                <th className="py-1 pr-2">Nợ</th>
                <th className="py-1 pr-2">Có</th>
                <th className="py-1 text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {card.postings.map((p, i) => (
                <tr key={i} className="border-t border-amber-200">
                  <td className="py-1 pr-2">{p.description}</td>
                  <td className="py-1 pr-2">{p.debit}</td>
                  <td className="py-1 pr-2">{p.credit}</td>
                  <td className="py-1 text-right tabular-nums">{vnd(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {card.warnings.length > 0 && (
        <ul className="mt-3 space-y-1 text-amber-800">
          {card.warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-white">
          Hủy
        </button>
        <button type="button" onClick={onConfirm} className="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700">
          Xác nhận ghi sổ ({role})
        </button>
      </div>
    </div>
  );
}
