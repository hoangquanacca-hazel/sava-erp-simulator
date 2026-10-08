/**
 * COOIS (Production Order Information System) — 5 danh sách, bố cục MÔ PHỎNG.
 * Nguồn duy nhất: buildScenarioEvents() (đơn hàng, đặt chỗ, công đoạn, xác nhận, chuyển động kho).
 * Cột có hậu tố "(SIM)" là trường bổ sung của simulator để đối soát với FI, không phải trường COOIS chuẩn.
 */
import { SIM_CONFIG } from '../config/simConfig';
import type { ScenarioEvents } from '../events/scenarioEvents';
import { postingDateOf, type ReportOutput } from './core';
import { col, fmtAmt, fmtHrs, fmtQty, sumCol } from './util';

const cols = (c: readonly { field: string; label: string }[]) => c.map((x) => ({ field: x.field, label: x.label }));

/** Trạng thái hệ thống suy từ số lượng: đủ → CNF DLV; một phần → PCNF PDLV; chưa nhập kho → PCNF. */
export function systemStatusOf(ev: ScenarioEvents): string {
  const { plannedQty, deliveredQty } = ev.order;
  if (deliveredQty >= plannedQty && plannedQty > 0) return 'REL CNF DLV';
  if (deliveredQty > 0) return 'REL PCNF PDLV';
  return 'REL PCNF';
}

export const COOIS_HEADER_COLUMNS = [
  { field: 'AUFNR', label: 'Order' },
  { field: 'AUART', label: 'Order Type' },
  { field: 'WERKS', label: 'Plant' },
  { field: 'MATNR', label: 'Material' },
  { field: 'MAKTX', label: 'Material Description' },
  { field: 'GAMNG', label: 'Order Quantity' },
  { field: 'IGMNG', label: 'Confirmed Quantity' },
  { field: 'WEMNG', label: 'Delivered Quantity' },
  { field: 'GMEIN', label: 'Unit' },
  { field: 'KDAUF', label: 'Sales Order' },
  { field: 'KDPOS', label: 'SO Item' },
  { field: 'SOBKZ', label: 'Special Stock' },
  { field: 'KZBWS', label: 'Valuation of Special Stock' },
  { field: 'STRATEGY', label: 'Planning Strategy (SIM)' },
  { field: 'GSTRP', label: 'Basic Start Date' },
  { field: 'GLTRP', label: 'Basic Finish Date' },
  { field: 'STTXT', label: 'System Status' },
  { field: 'PLAN_COST', label: 'Planned Cost (SIM)' },
  { field: 'ACT_COST', label: 'Actual Cost (SIM)' },
  { field: 'WAERS', label: 'Currency' },
] as const;

export function buildCooisHeader(ev: ScenarioEvents, plannedCost: number): ReportOutput {
  const o = ev.order;
  const d = postingDateOf(3);
  const actual =
    ev.components.reduce((s, c) => s + c.actualValue, 0) +
    ev.confirmations.reduce((s, c) => s + c.laborValue + c.machineOverheadValue, 0);
  const confirmed = ev.confirmations.reduce((s, c) => s + c.yieldQty, 0);
  return {
    reportId: 'COOIS_HEADER',
    title: 'Production Orders — Order Header (COOIS)',
    columns: cols(COOIS_HEADER_COLUMNS),
    rows: [[
      o.aufnr, 'PP01', o.plant, o.matnr, o.description, fmtQty(o.plannedQty), fmtQty(confirmed), fmtQty(o.deliveredQty),
      o.uom, o.salesOrder, o.salesOrderItem, 'E', o.stockType === 'Valuated' ? 'M' : '', o.strategy, d, d,
      systemStatusOf(ev), fmtAmt(plannedCost), fmtAmt(actual), SIM_CONFIG.currency,
    ]],
  };
}

export const COOIS_COMPONENTS_COLUMNS = [
  { field: 'AUFNR', label: 'Order' },
  { field: 'RSPOS', label: 'Reservation Item' },
  { field: 'MATNR', label: 'Material' },
  { field: 'MAKTX', label: 'Material Description' },
  { field: 'WERKS', label: 'Plant' },
  { field: 'BWART', label: 'Movement Type' },
  { field: 'BDMNG', label: 'Requirement Quantity' },
  { field: 'ENMNG', label: 'Quantity Withdrawn' },
  { field: 'MEINS', label: 'Unit' },
  { field: 'PLAN_VAL', label: 'Planned Value (SIM)' },
  { field: 'ACT_VAL', label: 'Withdrawn Value (SIM)' },
  { field: 'WAERS', label: 'Currency' },
] as const;

export function buildCooisComponents(ev: ScenarioEvents): ReportOutput {
  return {
    reportId: 'COOIS_COMPONENTS',
    title: 'Production Orders — Components (COOIS)',
    columns: cols(COOIS_COMPONENTS_COLUMNS),
    rows: ev.components.map((c) => [
      c.aufnr, c.rspos, c.matnr, c.name, SIM_CONFIG.plant, '261', fmtQty(c.plannedQty), fmtQty(c.actualQty), c.uom,
      fmtAmt(c.plannedValue), fmtAmt(c.actualValue), SIM_CONFIG.currency,
    ]),
  };
}

export const COOIS_OPERATIONS_COLUMNS = [
  { field: 'AUFNR', label: 'Order' },
  { field: 'VORNR', label: 'Operation' },
  { field: 'ARBPL', label: 'Work Center' },
  { field: 'LTXA1', label: 'Operation Text' },
  { field: 'WERKS', label: 'Plant' },
  { field: 'RUEST', label: 'Setup (H)' },
  { field: 'VGW_MACH', label: 'Planned Machine Hours' },
  { field: 'VGW_LAB', label: 'Planned Labor Hours' },
  { field: 'ISM_MACH', label: 'Actual Machine Hours' },
  { field: 'ISM_LAB', label: 'Actual Labor Hours' },
  { field: 'ACT_COST', label: 'Actual Activity Cost (SIM)' },
  { field: 'WAERS', label: 'Currency' },
] as const;

export function buildCooisOperations(ev: ScenarioEvents): ReportOutput {
  return {
    reportId: 'COOIS_OPERATIONS',
    title: 'Production Orders — Operations (COOIS)',
    columns: cols(COOIS_OPERATIONS_COLUMNS),
    rows: ev.operations.map((op) => {
      const cost = ev.confirmations
        .filter((c) => c.aufnr === op.aufnr && c.vornr === op.vornr)
        .reduce((s, c) => s + c.laborValue + c.machineOverheadValue, 0);
      return [
        op.aufnr, op.vornr, op.workCenter, op.workCenterName, SIM_CONFIG.plant, fmtHrs(op.setupHours),
        fmtHrs(op.plannedMachineHours), fmtHrs(op.plannedLaborHours), fmtHrs(op.actualMachineHours),
        fmtHrs(op.actualLaborHours), fmtAmt(cost), SIM_CONFIG.currency,
      ];
    }),
  };
}

export const COOIS_CONFIRMATIONS_COLUMNS = [
  { field: 'AUFNR', label: 'Order' },
  { field: 'RUECK', label: 'Confirmation' },
  { field: 'RMZHL', label: 'Counter' },
  { field: 'VORNR', label: 'Operation' },
  { field: 'BUDAT', label: 'Posting Date' },
  { field: 'LMNGA', label: 'Yield' },
  { field: 'ISM01', label: 'Labor Hours' },
  { field: 'ISM02', label: 'Machine Hours' },
  { field: 'LAB_VAL', label: 'Labor Value (SIM)' },
  { field: 'MOH_VAL', label: 'Machine/Overhead Value (SIM)' },
  { field: 'WAERS', label: 'Currency' },
] as const;

export function buildCooisConfirmations(ev: ScenarioEvents): ReportOutput {
  return {
    reportId: 'COOIS_CONFIRMATIONS',
    title: 'Production Orders — Confirmations (COOIS)',
    columns: cols(COOIS_CONFIRMATIONS_COLUMNS),
    rows: ev.confirmations.map((c, i) => [
      c.aufnr, c.rueck, String(i + 1).padStart(8, '0'), c.vornr, postingDateOf(3), fmtQty(c.yieldQty),
      fmtHrs(c.laborHours), fmtHrs(c.machineHours), fmtAmt(c.laborValue), fmtAmt(c.machineOverheadValue),
      SIM_CONFIG.currency,
    ]),
  };
}

export const COOIS_GOODSMVT_COLUMNS = [
  { field: 'AUFNR', label: 'Order' },
  { field: 'MBLNR', label: 'Material Document' },
  { field: 'ZEILE', label: 'Item' },
  { field: 'BWART', label: 'Movement Type' },
  { field: 'MATNR', label: 'Material' },
  { field: 'WERKS', label: 'Plant' },
  { field: 'MENGE', label: 'Quantity' },
  { field: 'MEINS', label: 'Unit' },
  { field: 'DMBTR', label: 'Amount in LC' },
  { field: 'SHKZG', label: 'Debit/Credit' },
  { field: 'BUDAT', label: 'Posting Date' },
] as const;

/** Chuyển động kho gắn với lệnh sản xuất (261 xuất NVL, 101 nhập thành phẩm). 601 là của giao hàng, không thuộc lệnh. */
export function buildCooisGoodsMovements(ev: ScenarioEvents): ReportOutput {
  return {
    reportId: 'COOIS_GOODSMVT',
    title: 'Production Orders — Documented Goods Movements (COOIS)',
    columns: cols(COOIS_GOODSMVT_COLUMNS),
    rows: ev.movements
      .filter((m) => m.aufnr === ev.order.aufnr && (m.bwart === '261' || m.bwart === '101'))
      .map((m) => [
        m.aufnr, m.mblnr, m.zeile, m.bwart, m.matnr, m.plant, fmtQty(m.quantity), m.uom, fmtAmt(m.value), m.shkzg,
        postingDateOf(m.step),
      ]),
  };
}

const bw = (r: ReportOutput, b: string) => (row: string[]) => row[col(r, 'BWART')] === b;

export const cooisTotals = {
  header: (r: ReportOutput) => ({ planCost: sumCol(r, 'PLAN_COST'), actCost: sumCol(r, 'ACT_COST'), wemng: sumCol(r, 'WEMNG'), igmng: sumCol(r, 'IGMNG') }),
  components: (r: ReportOutput) => ({ actVal: sumCol(r, 'ACT_VAL'), planVal: sumCol(r, 'PLAN_VAL') }),
  operations: (r: ReportOutput) => ({ actCost: sumCol(r, 'ACT_COST') }),
  confirmations: (r: ReportOutput) => ({ labVal: sumCol(r, 'LAB_VAL'), mohVal: sumCol(r, 'MOH_VAL'), yield: sumCol(r, 'LMNGA') }),
  goodsMovements: (r: ReportOutput) => ({ v261: sumCol(r, 'DMBTR', bw(r, '261')), v101: sumCol(r, 'DMBTR', bw(r, '101')), q101: sumCol(r, 'MENGE', bw(r, '101')) }),
};
