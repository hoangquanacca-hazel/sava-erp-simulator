import contracts from './manufacturingFinance.contracts.json';
import { bankMatch, dunningProposal, FINANCE_SCOPE, type FinanceState } from '../features/manufacturingFinance';
import type { ReportOutput } from './core';

/** Reuse FI21/FI22 practice headers, never certify them as SAP-native fields. */
export function manufacturingFinanceReports(s: FinanceState): ReportOutput[] {
  const date = (v: string) => v ? v.split('-').reverse().join('.') : '';
  const proposal = s.dunning?.rows ?? dunningProposal(s);
  const fi21: Record<string, string>[] = proposal.map(r => {
    const i = s.invoices.find(i => i.id === r.invoiceId)!;
    const stale = s.dunning && !s.dunning.issued && s.dunning.sourceRevision !== s.revision;
    return { 'Company Code': i.company, 'Run ID': s.dunning ? `SIM-${s.dunning.sourceRevision}` : 'PREVIEW',
      'Run Date': date(FINANCE_SCOPE.cutoff), Customer: i.customer, Document: i.document, 'Fiscal Year': i.year, Item: i.item,
      'Due Date': date(i.due), 'Days Overdue': String(r.overdue), 'Open Amount': String(r.open), Currency: i.currency,
      'Dunning Area': 'MFG-DEMO', 'Dunning Level': String(r.level), 'Dunning Block': i.block ? 'X' : '',
      'Last Dunning Date': date(i.lastDunned), 'Dunning Fee': '0', Status: stale ? 'STALE_PROPOSAL' : r.status, Message: r.message };
  });
  const fi22: Record<string, string>[] = s.bank.map(b => ({
    'Company Code': b.company, 'House Bank': b.houseBank, 'Bank Account': b.account, Statement: b.statement,
    'Statement Date': date(FINANCE_SCOPE.cutoff), Item: b.item, 'Value Date': date(FINANCE_SCOPE.cutoff), 'Posting Date': date(FINANCE_SCOPE.cutoff),
    'External Transaction': 'CREDIT-DEMO', Amount: String(b.amount), Currency: b.currency, Reference: b.reference,
    Assignment: b.clearedInvoices.join(';'), 'Posting Rule': b.rule, 'Accounting Document': b.accountingDocument,
    'Clearing Document': b.clearingDocument, Status: bankMatch(s, b).status,
    Message: b.clearingDocument ? 'SIMULATED; invoice links in Assignment; bank amount counted once.' : 'Review required; no amount-only auto-match.',
  }));
  return contracts.reports.map((c, index) => ({ reportId: c.id, title: `${c.tcode} · Manufacturing Finance · SIMULATED`,
    columns: c.columns.map(field => ({ field, label: field })), rows: (index === 0 ? fi21 : fi22).map(row => c.columns.map(k => row[k] ?? '')) }));
}

/** Separate exporter: core.toRawExport uses the legacy MTO date/scope. */
export function financeReportText(report: ReportOutput) {
  return [`${report.title} | ${FINANCE_SCOPE.id} | cutoff ${FINANCE_SCOPE.cutoff} | VND | SAVA_PROPOSED | SAP acceptance NOT_RUN`,
    '', report.columns.map(c => c.field).join('\t'), ...report.rows.map(row => row.map(v => v.replace(/[\t\r\n]/g, ' ')).join('\t'))].join('\n') + '\n';
}
