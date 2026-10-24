import { createManufacturingFinance, executeFinance, financeControls, FINANCE_SCOPE, type FinanceCommand, type FinanceState } from '../features/manufacturingFinance';
import { financeReportText, manufacturingFinanceReports } from '../reports/manufacturingFinance';
import { sha256Hex } from '../reports/core';

export const FINANCE_EVIDENCE_MAX_BYTES = 2 * 1024 * 1024;
const MAX_HISTORY = 1000;

export async function exportFinanceEvidence(input: FinanceState) {
  const state = structuredClone(input);
  if (state.history.length > MAX_HISTORY) throw new Error('Evidence supports at most 1000 training events; start a new lesson.');
  let replay = createManufacturingFinance();
  for (const event of state.history) {
    const result = executeFinance(replay, event.command);
    if (result.status !== 'SIMULATED') throw new Error('Training history cannot be replayed');
    replay = result.state;
  }
  if (JSON.stringify(replay) !== JSON.stringify(state)) throw new Error('Training state differs from command replay');
  const reports = await Promise.all(manufacturingFinanceReports(state).map(async report => {
    const text = financeReportText(report);
    return { ...report, text, sha256: await sha256Hex(new TextEncoder().encode(text)) };
  }));
  const payload = {
    schema: 'sava-manufacturing-finance-evidence-v1', scope: FINANCE_SCOPE,
    persistence: 'BROWSER_RAM_ONLY', identity: 'SELF_DECLARED_NOT_AUTHENTICATED',
    infographic: 'FIVE_WORKFLOWS_FROM_USER_DESCRIPTION; ORIGINAL_IMAGE_NOT_AVAILABLE',
    controls: financeControls(state), state, reports,
    acceptance: { simulatedReplay: 'PASS', sapNative: 'NOT_RUN', targetRelease: 'UNKNOWN', independentSme: 'PENDING', business: 'NOT_APPROVED' },
    limits: ['Synthetic fixture and local policy only; no SAP connection or native export.',
      'Customer down payment only; no supplier/security-deposit lifecycle or tax/FX.',
      'Dunning is a local notice simulation, no real scheduling, delivery, fee or ECL posting.',
      'Bank clearing is single-stage; SAP posting areas and bank file parsing are not implemented.',
      'One overall Internal Order budget; no annual/released budgets or SAP tolerance configuration.',
      'Cross-company supplier clearing leaves reciprocal intercompany balances open; no consolidation elimination.',
      'Hash and replay do not prove authentication, SME approval or SAP-native acceptance.'],
  };
  const text = JSON.stringify(payload, null, 2) + '\n';
  if (new TextEncoder().encode(text).byteLength > FINANCE_EVIDENCE_MAX_BYTES) throw new Error('Evidence exceeds the 2 MiB file limit.');
  return { fileName: `${FINANCE_SCOPE.id}_SIMULATED.json`, text, sha256: await sha256Hex(new TextEncoder().encode(text)) };
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function savedCommand(value: unknown): FinanceCommand {
  if (!object(value) || typeof value.type !== 'string') throw new Error('Invalid training command.');
  const plain = ['REQUEST_DEPOSIT', 'RECEIVE_DEPOSIT', 'BILL_ORDER', 'APPLY_DEPOSIT', 'PROPOSE_DUNNING',
    'ISSUE_DUNNING', 'AUTO_BANK', 'POST_MAINTENANCE', 'PAY_INTERCOMPANY'];
  const keys = Object.keys(value).sort().join(',');
  if (plain.includes(value.type) && keys === 'type') return value as FinanceCommand;
  if (value.type === 'RESERVE_MAINTENANCE' && keys === 'amount,type' &&
      Number.isSafeInteger(value.amount) && Number(value.amount) > 0) return value as FinanceCommand;
  if (value.type === 'REPROCESS_BANK' && keys === 'bankId,invoiceId,type' &&
      typeof value.bankId === 'string' && value.bankId.length <= 100 &&
      typeof value.invoiceId === 'string' && value.invoiceId.length <= 100) return value as FinanceCommand;
  throw new Error('Unknown or invalid training command.');
}

/** Read-only verification of an original export. Recomputed bytes also reject
 * duplicate JSON keys, changed approval labels and edited report/hash fields.
 * This proves consistency with the demo engine, never authorship or approval.
 */
export async function verifyFinanceEvidence(bytes: Uint8Array, expectedSha256 = '') {
  if (!bytes.byteLength || bytes.byteLength > FINANCE_EVIDENCE_MAX_BYTES) throw new Error('Chọn file JSON gốc, tối đa 2 MiB.');
  const pin = expectedSha256.trim().toLowerCase();
  if (pin && !/^[a-f0-9]{64}$/.test(pin)) throw new Error('SHA-256 đối chiếu phải có 64 ký tự hex.');
  const sha256 = await sha256Hex(bytes);
  if (pin && pin !== sha256) throw new Error('SHA-256 không khớp bản đối chiếu.');
  let text: string, data: unknown;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    data = JSON.parse(text);
  } catch { throw new Error('File không phải JSON UTF-8 hợp lệ.'); }
  if (!object(data) || data.schema !== 'sava-manufacturing-finance-evidence-v1' ||
      !object(data.state) || !Array.isArray(data.state.history) || data.state.history.length > MAX_HISTORY) {
    throw new Error('Sai schema hoặc lịch sử vượt giới hạn 1000 bước.');
  }
  let state = createManufacturingFinance();
  for (const event of data.state.history) {
    if (!object(event)) throw new Error('Lịch sử không hợp lệ.');
    const result = executeFinance(state, savedCommand(event.command));
    if (result.status !== 'SIMULATED') throw new Error('Không thể phát lại lịch sử luyện tập.');
    state = result.state;
  }
  const rebuilt = await exportFinanceEvidence(state);
  if (rebuilt.text !== text) throw new Error('File khác bản xuất gốc được phát lại. Hãy dùng JSON nguyên bản, chưa chỉnh sửa hoặc định dạng lại.');
  return { status: 'VERIFIED_SIMULATION_ONLY' as const, sha256, hashCompared: !!pin,
    revision: state.revision, documents: state.documents.length,
    reports: manufacturingFinanceReports(state).map(r => ({ id: r.reportId, rows: r.rows.length })),
    sapNative: 'NOT_RUN' as const, independentSme: 'PENDING' as const, business: 'NOT_APPROVED' as const };
}
