/** Focused, deterministic training ledger. Never writes to the MTO ACDOCA table. */
export const FINANCE_SCOPE = {
  id: 'MFG-FIN-20261021', label: 'SIMULATED', cutoff: '2026-10-21', currency: 'VND',
  company: '1000', factoryCompany: '2000', plant: '1100', order: 'IO-MOULD-01',
  targetSapRelease: 'UNKNOWN', nativeAcceptance: 'NOT_RUN', businessAcceptance: 'NOT_APPROVED',
} as const;

export interface FinanceInvoice {
  id: string; company: string; year: string; document: string; item: string;
  customer: string; reference: string; currency: string; due: string;
  original: number; open: number; block: boolean; level: number; lastDunned: string;
}
export interface FinanceBankItem {
  id: string; company: string; houseBank: string; account: string; statement: string;
  item: string; currency: string; amount: number; reference: string; rule: string;
  accountingDocument: string; clearingDocument: string; clearedInvoices: string[];
}
export interface FinanceLine { account: string; debit: number; credit: number; partner?: string; order?: string; specialGL?: string }
export interface FinanceDocument { id: string; company: string; date: string; currency: 'VND'; transaction: string; jointId?: string; lines: FinanceLine[] }
export interface DunningRow { invoiceId: string; open: number; overdue: number; level: number; status: string; message: string }
export interface FinanceState {
  revision: number;
  deposit: { requested: boolean; received: number; applied: number };
  invoices: FinanceInvoice[]; bank: FinanceBankItem[]; documents: FinanceDocument[];
  budget: { original: number; actual: number; commitment: number; reserved: boolean; posted: boolean; active: boolean; warningPercent: number };
  intercompany: { supplierOpen: number; paid: boolean };
  dunning: { sourceRevision: number; issued: boolean; rows: DunningRow[] } | null;
  history: { sequence: number; action: string; command: FinanceCommand; message: string }[];
}
export type FinanceCommand =
  | { type: 'REQUEST_DEPOSIT' | 'RECEIVE_DEPOSIT' | 'BILL_ORDER' | 'APPLY_DEPOSIT' | 'PROPOSE_DUNNING' | 'ISSUE_DUNNING' | 'AUTO_BANK' | 'POST_MAINTENANCE' | 'PAY_INTERCOMPANY' }
  | { type: 'RESERVE_MAINTENANCE'; amount: number }
  | { type: 'REPROCESS_BANK'; bankId: string; invoiceId: string };
export interface FinanceResult { state: FinanceState; status: 'SIMULATED' | 'BLOCKED' | 'NO_CHANGE'; message: string }

export const invoiceKey = (i: Pick<FinanceInvoice, 'company' | 'year' | 'document' | 'item'>) => `${i.company}/${i.year}/${i.document}/${i.item}`;
const money = (n: number) => Number.isSafeInteger(n) && n >= 0;
const day = (d: string) => Date.parse(`${d}T00:00:00Z`) / 86400000;
const line = (account: string, debit: number, credit: number, extra: Partial<FinanceLine> = {}): FinanceLine => ({ account, debit, credit, ...extra });

function post(s: FinanceState, id: string, company: string, transaction: string, lines: FinanceLine[], jointId?: string) {
  if (s.documents.some(d => d.id === id && d.company === company)) throw new Error('Duplicate training document');
  if (lines.some(l => !money(l.debit) || !money(l.credit) || (l.debit > 0 && l.credit > 0)) ||
      lines.reduce((n, l) => n + l.debit - l.credit, 0) !== 0) throw new Error('Unbalanced training document');
  s.documents.push({ id, company, date: FINANCE_SCOPE.cutoff, currency: 'VND', transaction, lines, ...(jointId ? { jointId } : {}) });
}

export function createManufacturingFinance(): FinanceState {
  const s: FinanceState = {
    revision: 0, deposit: { requested: false, received: 0, applied: 0 }, invoices: [], bank: [], documents: [],
    budget: { original: 100_000_000, actual: 20_000_000, commitment: 10_000_000, reserved: false, posted: false, active: true, warningPercent: 90 },
    intercompany: { supplierOpen: 60_000_000, paid: false }, dunning: null, history: [],
  };
  const seed = (document: string, amount: number, reference: string, customer = 'OEM-01', block = false, due = '2026-10-01') => {
    const i: FinanceInvoice = { id: '', company: '1000', year: '2026', document, item: '001', customer, reference,
      currency: 'VND', due, original: amount, open: amount, block, level: 0, lastDunned: '' };
    i.id = invoiceKey(i); s.invoices.push(i);
    post(s, `OPEN-${document}`, '1000', 'OPENING_FIXTURE', [line('AR', amount, 0), line('REVENUE', 0, amount)]);
  };
  seed('9100000002', 15_000_000, 'OEM-BATCH'); seed('9100000003', 25_000_000, 'OEM-BATCH');
  seed('9100000004', 12_000_000, 'REPAIR-01'); seed('9100000005', 20_000_000, 'DISPUTE', 'OEM-01', true);
  seed('9100000006', 10_000_000, 'NOT-DUE', 'OEM-01', false, '2026-11-01');
  seed('9100000007', 5_000_000, 'AMBIG', 'OEM-02'); seed('9100000008', 5_000_000, 'AMBIG', 'OEM-03');
  post(s, 'OPEN-IO', '2000', 'OPENING_FIXTURE', [line('MAINTENANCE', 20_000_000, 0, { order: FINANCE_SCOPE.order }), line('AP', 0, 20_000_000)]);
  post(s, 'OPEN-SUPPLIER', '2000', 'OPENING_FIXTURE', [line('FACTORY_SERVICES', 60_000_000, 0), line('AP', 0, 60_000_000)]);
  s.bank = [['001', 84_000_000, 'SO-MF-01'], ['002', 40_000_000, 'OEM-BATCH'], ['003', 12_000_000, 'MISSING-REF'], ['004', 5_000_000, 'AMBIG']].map(([item, amount, reference]) => ({
    id: `1000/HB01/OPERATING/2026-10-21/${item}`, company: '1000', houseBank: 'HB01', account: 'OPERATING',
    statement: '2026-10-21', item: String(item), currency: 'VND', amount: Number(amount), reference: String(reference), rule: 'INCOMING_AR',
    accountingDocument: '', clearingDocument: '', clearedInvoices: [],
  }));
  return s;
}

export function budgetCheck(s: FinanceState, amount: number) {
  const assigned = s.budget.actual + s.budget.commitment + amount;
  const status = !s.budget.active || !money(amount) || amount === 0 || !money(assigned) || assigned > s.budget.original ? 'BLOCKED'
    : assigned * 100 >= s.budget.original * s.budget.warningPercent ? 'WARNING' : 'WITHIN_BUDGET';
  return { status, assigned, available: s.budget.original - assigned };
}

export function dunningProposal(s: FinanceState): DunningRow[] {
  return s.invoices.map(i => {
    const overdue = Math.max(0, day(FINANCE_SCOPE.cutoff) - day(i.due));
    // Deliberately simple local policy, NOT a recovered SAP dunning procedure.
    const status = i.open === 0 ? 'CLEARED' : i.block ? 'BLOCKED' : i.currency !== 'VND' ? 'UNSUPPORTED_CURRENCY'
      : overdue <= 3 ? 'NOT_DUE_OR_GRACE' : i.lastDunned && day(FINANCE_SCOPE.cutoff) - day(i.lastDunned) < 7 ? 'INTERVAL' : 'PROPOSED';
    return { invoiceId: i.id, open: i.open, overdue, level: status === 'PROPOSED' ? Math.max(i.level, overdue >= 30 ? 2 : 1) : i.level,
      status, message: status === 'PROPOSED' ? 'Đủ điều kiện theo chính sách demo; phí 0 VND.' : 'Giữ lại dòng bị loại để review.' };
  });
}

export function bankMatch(s: FinanceState, b: FinanceBankItem) {
  if (b.clearingDocument) return { status: 'CLEARED', invoices: [] as FinanceInvoice[] };
  if (!money(b.amount) || b.amount === 0 || b.currency !== 'VND' || b.company !== '1000' || b.rule !== 'INCOMING_AR')
    return { status: 'UNSUPPORTED_SCOPE_OR_RULE', invoices: [] as FinanceInvoice[] };
  const invoices = s.invoices.filter(i => i.company === b.company && i.currency === b.currency && i.open > 0 && i.reference === b.reference && b.reference !== '');
  if (!invoices.length) return { status: 'UNMATCHED', invoices };
  if (new Set(invoices.map(i => i.customer)).size !== 1) return { status: 'AMBIGUOUS', invoices };
  if (invoices.reduce((n, i) => n + i.open, 0) !== b.amount) return { status: 'AMOUNT_DIFFERENCE', invoices };
  return { status: 'MATCHED', invoices };
}

function clearBank(s: FinanceState, b: FinanceBankItem, invoices: FinanceInvoice[]) {
  const id = `BANK-${b.item}`;
  // Single-stage training posting: no separate SAP posting areas 1/2 simulated.
  post(s, id, b.company, 'FEBAN-SIM', [line('BANK', b.amount, 0), line('AR', 0, b.amount)]);
  b.accountingDocument = id; b.clearingDocument = id; b.clearedInvoices = invoices.map(i => i.id);
  invoices.forEach(i => { i.open = 0; });
}

/** Rejected commands return the original state; accepted commands clone atomically. */
export function executeFinance(input: FinanceState, command: FinanceCommand): FinanceResult {
  const s = structuredClone(input);
  const blocked = (message: string): FinanceResult => ({ state: input, status: 'BLOCKED', message });
  const unchanged = (message: string): FinanceResult => ({ state: input, status: 'NO_CHANGE', message });
  let message = '';
  switch (command.type) {
    case 'REQUEST_DEPOSIT':
      if (s.deposit.requested) return unchanged('Yêu cầu cọc đã tồn tại.');
      s.deposit.requested = true; message = 'F-37 demo: noted item 36 triệu; chưa có tiền hay bút toán.'; break;
    case 'RECEIVE_DEPOSIT':
      if (s.deposit.received) return unchanged('Khoản cọc đã được ghi nhận.');
      if (!s.deposit.requested) return blocked('Tạo yêu cầu cọc trước.');
      post(s, 'DEPOSIT-RECEIPT', '1000', 'F-29-SIM', [line('BANK', 36_000_000, 0), line('CUSTOMER_ADVANCE_ALT', 0, 36_000_000, { specialGL: 'A' })]);
      s.deposit.received = 36_000_000; message = 'Nhận 36 triệu vào tài khoản đối ứng Special G/L demo; không ghi doanh thu.'; break;
    case 'BILL_ORDER': {
      if (s.invoices.some(i => i.reference === 'SO-MF-01')) return unchanged('Hóa đơn đơn hàng đã tồn tại.');
      const i: FinanceInvoice = { id: '1000/2026/9100000001/001', company: '1000', year: '2026', document: '9100000001', item: '001',
        customer: 'OEM-01', reference: 'SO-MF-01', currency: 'VND', due: '2026-10-01', original: 120_000_000, open: 120_000_000, block: false, level: 0, lastDunned: '' };
      s.invoices.push(i);
      post(s, 'BILL-ORDER', '1000', 'BILLING-SIM', [line('AR', 120_000_000, 0), line('REVENUE', 0, 120_000_000)]);
      message = 'Hóa đơn luyện tập 120 triệu, giả định không thuế cho bài này.'; break;
    }
    case 'APPLY_DEPOSIT': {
      if (s.deposit.applied) return unchanged('Khoản cọc đã được cấn trừ.');
      const i = s.invoices.find(i => i.reference === 'SO-MF-01');
      if (!i || !s.deposit.received || i.open < s.deposit.received) return blocked('Cần khoản cọc đã nhận và hóa đơn còn đủ dư.');
      post(s, 'DEPOSIT-CLEAR', '1000', 'F-39-SIM', [line('CUSTOMER_ADVANCE_ALT', s.deposit.received, 0, { specialGL: 'A' }), line('AR', 0, s.deposit.received)]);
      i.open -= s.deposit.received; s.deposit.applied = s.deposit.received;
      message = 'Cấn cọc 36 triệu; khoản phải thu SO-MF-01 còn 84 triệu.'; break;
    }
    case 'PROPOSE_DUNNING':
      s.dunning = { sourceRevision: s.revision + 1, issued: false, rows: dunningProposal(s) };
      message = 'F150 demo: đã tạo đề xuất; chưa phát hành thư, chưa đổi lịch sử nhắc nợ.'; break;
    case 'ISSUE_DUNNING':
      if (!s.dunning) return blocked('Chạy đề xuất F150 trước.');
      if (s.dunning.issued) return unchanged('Thông báo của đề xuất này đã phát hành trong mô phỏng.');
      if (s.dunning.sourceRevision !== s.revision) return blocked('Dữ liệu đã thay đổi; chạy lại đề xuất F150.');
      if (!s.dunning.rows.some(r => r.status === 'PROPOSED')) return blocked('Không có khoản đủ điều kiện nhắc nợ.');
      for (const r of s.dunning.rows.filter(r => r.status === 'PROPOSED')) {
        const i = s.invoices.find(i => i.id === r.invoiceId)!; i.level = r.level; i.lastDunned = FINANCE_SCOPE.cutoff; r.status = 'NOTICE_SIMULATED';
      }
      s.dunning.issued = true; message = 'Đã phát hành thông báo trong demo; không gửi email/thư thật, không ghi phí hay ECL.'; break;
    case 'AUTO_BANK': {
      let count = 0;
      for (const b of s.bank) {
        const match = bankMatch(s, b);
        if (match.status === 'MATCHED') { clearBank(s, b, match.invoices); count++; }
      }
      if (!count) return unchanged('Chưa có dòng khớp chắc chắn; xem ngoại lệ FEBAN.');
      message = `Đã clearing ${count} dòng sao kê; giữ lại các dòng không khớp hoặc mơ hồ.`; break;
    }
    case 'REPROCESS_BANK': {
      const b = s.bank.find(b => b.id === command.bankId);
      const i = s.invoices.find(i => i.id === command.invoiceId);
      if (!b || !i) return blocked('Chọn dòng sao kê và hóa đơn còn mở.');
      if (b.clearingDocument) return unchanged('Dòng sao kê đã clearing.');
      if (bankMatch(s, b).status === 'UNSUPPORTED_SCOPE_OR_RULE' || i.company !== b.company || i.currency !== b.currency || i.open !== b.amount || i.open <= 0)
        return blocked('Sai company/currency/rule hoặc số tiền không khớp; không tự xóa chênh lệch.');
      clearBank(s, b, [i]); message = 'FEBAN demo: người dùng chọn hóa đơn; lưu liên kết clearing, giữ nguyên reference gốc của ngân hàng.'; break;
    }
    case 'RESERVE_MAINTENANCE': {
      if (s.budget.reserved) return unchanged('PO sửa khuôn đã được ghi nhận commitment.');
      const check = budgetCheck(s, command.amount);
      if (check.status === 'BLOCKED') return blocked('AVC demo: vượt ngân sách, số tiền không hợp lệ hoặc kiểm soát chưa hoạt động; PO chưa được ghi.');
      s.budget.commitment += command.amount; s.budget.reserved = true;
      message = `${check.status}: đã giữ ${command.amount.toLocaleString('vi-VN')} VND cho PO sửa khuôn; chưa ghi chi phí FI.`; break;
    }
    case 'POST_MAINTENANCE': {
      if (s.budget.posted) return unchanged('Hóa đơn sửa khuôn đã ghi.');
      if (!s.budget.reserved || !s.budget.active) return blocked('Cần PO đã qua AVC và kiểm soát còn hoạt động.');
      const amount = s.budget.commitment - 10_000_000;
      post(s, 'IO-ACTUAL', '2000', 'INVOICE-IO-SIM', [line('MAINTENANCE', amount, 0, { order: FINANCE_SCOPE.order }), line('AP', 0, amount)]);
      s.budget.actual += amount; s.budget.commitment -= amount; s.budget.posted = true;
      message = 'Đã chuyển commitment của PO mới sang actual; không cộng hai lần assigned value.'; break;
    }
    case 'PAY_INTERCOMPANY': {
      if (s.intercompany.paid) return unchanged('Giao dịch thanh toán hộ đã được ghi.');
      const amount = s.intercompany.supplierOpen;
      if (!money(amount) || amount === 0) return blocked('Không có khoản phải trả nhà cung cấp hợp lệ.');
      const jointId = 'IC-PAY-01';
      post(s, 'IC-1000', '1000', 'CROSS-COMPANY-PAYMENT-SIM', [line('DUE_FROM_2000', amount, 0, { partner: '2000' }), line('BANK', 0, amount)], jointId);
      post(s, 'IC-2000', '2000', 'CROSS-COMPANY-CLEARING-SIM', [line('AP', amount, 0), line('DUE_TO_1000', 0, amount, { partner: '1000' })], jointId);
      s.intercompany.supplierOpen = 0; s.intercompany.paid = true;
      message = '1000 trả hộ 2000: AP nhà cung cấp đã clearing; công nợ giữa hai công ty vẫn mở 60 triệu.'; break;
    }
    default: return blocked('Lệnh không được hỗ trợ.');
  }
  s.revision++;
  s.history.push({ sequence: s.revision, action: command.type, command: structuredClone(command), message });
  return { state: s, status: 'SIMULATED', message };
}

export function financeControls(s: FinanceState) {
  const balance = (account: string, company: string) => s.documents.filter(d => d.company === company).flatMap(d => d.lines).filter(l => l.account === account).reduce((n, l) => n + l.debit - l.credit, 0);
  return [
    { id: 'MF01', label: 'Mỗi chứng từ cân Nợ/Có trong từng company', pass: s.documents.every(d => d.lines.reduce((n, l) => n + l.debit - l.credit, 0) === 0) },
    { id: 'MF02', label: 'Special G/L = cọc đã nhận − đã cấn', pass: -balance('CUSTOMER_ADVANCE_ALT', '1000') === s.deposit.received - s.deposit.applied },
    { id: 'MF03', label: 'AR trong sổ = tổng khoản còn mở', pass: balance('AR', '1000') === s.invoices.reduce((n, i) => n + i.open, 0) },
    { id: 'MF04', label: 'Actual + commitment không vượt ngân sách', pass: s.budget.actual + s.budget.commitment <= s.budget.original },
    { id: 'MF05', label: 'Phải thu 2000 = phải trả 1000', pass: balance('DUE_FROM_2000', '1000') === -balance('DUE_TO_1000', '2000') },
    { id: 'MF06', label: 'Mỗi dòng sao kê clearing đúng tổng phân bổ', pass: s.bank.filter(b => b.clearingDocument).every(b => {
      const doc = s.documents.find(d => d.id === b.clearingDocument && d.company === b.company);
      return !!doc && doc.lines.filter(l => l.account === 'AR').reduce((n, l) => n + l.credit, 0) === b.amount && b.clearedInvoices.length > 0;
    }) },
  ].map(c => ({ ...c, status: c.pass ? 'SIMULATED_PASS' : 'FAIL' }));
}
