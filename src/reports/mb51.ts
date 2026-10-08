/**
 * MB51 (Material Document List) — bố cục MÔ PHỎNG. Nguồn duy nhất: buildScenarioEvents().movements.
 * Số chứng từ FI (BELNR) suy từ fiTxnId bằng documentNumberOf (cùng quy tắc FAGLL03).
 */
import { SIM_CONFIG } from '../config/simConfig';
import type { ScenarioEvents } from '../events/scenarioEvents';
import { documentNumberOf, fiscalYearOf, postingDateOf, type ReportOutput } from './core';
import { fmtAmt, fmtQty, sumCol, col } from './util';

export const MB51_COLUMNS = [
  { field: 'MBLNR', label: 'Material Document' },
  { field: 'MJAHR', label: 'Material Doc. Year' },
  { field: 'ZEILE', label: 'Item' },
  { field: 'BWART', label: 'Movement Type' },
  { field: 'SOBKZ', label: 'Special Stock' },
  { field: 'MATNR', label: 'Material' },
  { field: 'MAKTX', label: 'Material Description' },
  { field: 'WERKS', label: 'Plant' },
  { field: 'KDAUF', label: 'Sales Order' },
  { field: 'KDPOS', label: 'SO Item' },
  { field: 'AUFNR', label: 'Order' },
  { field: 'MENGE', label: 'Quantity' },
  { field: 'MEINS', label: 'Unit' },
  { field: 'DMBTR', label: 'Amount in LC' },
  { field: 'WAERS', label: 'Currency' },
  { field: 'SHKZG', label: 'Debit/Credit' },
  { field: 'BUDAT', label: 'Posting Date' },
  { field: 'BELNR', label: 'FI Document' },
] as const;

export function buildMb51(ev: ScenarioEvents): ReportOutput {
  const rows = ev.movements.map((m) => {
    const budat = postingDateOf(m.step);
    const special = m.bwart !== '261'; // thành phẩm nằm trong tồn kho đặc biệt E; NVL xuất từ tồn kho thường
    return [
      m.mblnr,
      fiscalYearOf(budat),
      m.zeile,
      m.bwart,
      special ? 'E' : '',
      m.matnr,
      m.name,
      m.plant,
      special ? m.salesOrder : '',
      special ? ev.order.salesOrderItem : '',
      m.bwart === '601' ? '' : m.aufnr,
      fmtQty(m.quantity),
      m.uom,
      fmtAmt(m.value),
      SIM_CONFIG.currency,
      m.shkzg,
      budat,
      m.fiTxnId ? documentNumberOf(m.fiTxnId) : '',
    ];
  });
  return {
    reportId: 'MB51',
    title: 'Material Document List (MB51)',
    columns: MB51_COLUMNS.map((c) => ({ field: c.field, label: c.label })),
    rows,
  };
}

/** Tổng giá trị/số lượng theo loại chuyển động, đọc từ chính báo cáo. */
export function mb51Totals(r: ReportOutput): Record<'v261' | 'v101' | 'v601' | 'q101' | 'q601', number> {
  const bw = (b: string) => (row: string[]) => row[col(r, 'BWART')] === b;
  return {
    v261: sumCol(r, 'DMBTR', bw('261')),
    v101: sumCol(r, 'DMBTR', bw('101')),
    v601: sumCol(r, 'DMBTR', bw('601')),
    q101: sumCol(r, 'MENGE', bw('101')),
    q601: sumCol(r, 'MENGE', bw('601')),
  };
}
