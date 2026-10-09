/**
 * T2 — Báo cáo logistics/sản xuất định dạng SAP (MÔ PHỎNG): MB51 và 5 danh sách COOIS.
 * Nguồn DUY NHẤT: buildScenarioEvents (không tự suy số lượng từ tham số). Đối soát FI nằm ở scripts/s3-reports.ts.
 * Tất định: không đọc đồng hồ. Tiền VND nguyên; số lượng 3 chữ số thập phân.
 */
import { SIM_CONFIG } from '../config/simConfig';
import type { MaterialMovement, ScenarioEvents } from '../events/scenarioEvents';
import { documentNumberOf, fiscalYearOf, postingDateOf, qty, type ReportOutput } from './core';

const cols = (defs: [string, string][]) => defs.map(([field, label]) => ({ field, label }));

const MOVEMENT_COLUMNS = cols([
  ['MBLNR', 'Material Document'],
  ['MJAHR', 'Mat. Doc. Year'],
  ['ZEILE', 'Item'],
  ['BUDAT', 'Posting Date'],
  ['BWART', 'Movement Type'],
  ['SOBKZ', 'Special Stock'],
  ['MATNR', 'Material'],
  ['MAKTX', 'Material Description'],
  ['WERKS', 'Plant'],
  ['SHKZG', 'Debit/Credit'],
  ['MENGE', 'Quantity'],
  ['MEINS', 'Base Unit'],
  ['DMBTR', 'Amount in LC'],
  ['WAERS', 'Currency'],
  ['AUFNR', 'Order'],
  ['KDAUF', 'Sales Order'],
  ['BELNR', 'FI Document'],
]);

function movementRow(m: MaterialMovement): string[] {
  const budat = postingDateOf(m.step);
  return [
    m.mblnr,
    fiscalYearOf(budat),
    m.zeile,
    budat,
    m.bwart,
    'E', // tồn kho đơn hàng bán (MTO)
    m.matnr,
    m.name,
    m.plant,
    m.shkzg,
    qty(m.quantity),
    m.uom,
    String(m.value),
    SIM_CONFIG.currency,
    m.aufnr,
    m.salesOrder,
    m.fiTxnId ? documentNumberOf(m.fiTxnId) : '', // hàng không định giá: không có chứng từ FI
  ];
}

/** MB51 — Material Document List: mọi chuyển động kho của kịch bản (261, 101, 601). */
export function buildMb51(ev: ScenarioEvents): ReportOutput {
  return {
    reportId: 'MB51',
    title: 'Material Document List (MB51)',
    columns: MOVEMENT_COLUMNS,
    rows: ev.movements.map(movementRow),
  };
}

/** COOIS — Documented Goods Movements: chỉ chuyển động gắn lệnh sản xuất (261 xuất NVL, 101 nhập TP). 601 thuộc giao hàng, không thuộc lệnh. */
export function buildCooisGoodsMovements(ev: ScenarioEvents): ReportOutput {
  return {
    reportId: 'COOIS_GM',
    title: 'Production Order Information System — Documented Goods Movements (COOIS)',
    columns: MOVEMENT_COLUMNS,
    rows: ev.movements.filter((m) => m.aufnr === ev.order.aufnr && (m.bwart === '261' || m.bwart === '101')).map(movementRow),
  };
}

/** COOIS — Order Header. Chi phí thực tế = Σ giá trị đặt chỗ thực xuất + giá trị xác nhận (nguồn sự kiện). */
export function buildCooisHeader(ev: ScenarioEvents, plannedCost: number): ReportOutput {
  const o = ev.order;
  const actual =
    ev.components.reduce((s, c) => s + c.actualValue, 0) +
    ev.confirmations.reduce((s, c) => s + c.laborValue + c.machineOverheadValue, 0);
  const status = o.deliveredQty <= 0 ? 'REL' : o.deliveredQty >= o.plannedQty ? 'REL DLV TECO' : 'REL PDLV';
  return {
    reportId: 'COOIS_HDR',
    title: 'Production Order Information System — Order Header (COOIS)',
    columns: cols([
      ['AUFNR', 'Order'],
      ['AUART', 'Order Type'],
      ['WERKS', 'Plant'],
      ['MATNR', 'Material'],
      ['MAKTX', 'Description'],
      ['GAMNG', 'Order Quantity'],
      ['WEMNG', 'Delivered Quantity'],
      ['GMEIN', 'Unit'],
      ['KDAUF', 'Sales Order'],
      ['KDPOS', 'SO Item'],
      ['STTXT', 'System Status'],
      ['PLAN_COST', 'Planned Costs'],
      ['ACT_COST', 'Actual Costs'],
      ['WAERS', 'Currency'],
    ]),
    rows: [
      [
        o.aufnr, 'PP01', o.plant, o.matnr, o.description, qty(o.plannedQty), qty(o.deliveredQty), o.uom,
        o.salesOrder, o.salesOrderItem, status, String(plannedCost), String(actual), SIM_CONFIG.currency,
      ],
    ],
  };
}

/** COOIS — Components (đặt chỗ RESB): số lượng/giá trị kế hoạch và thực xuất. */
export function buildCooisComponents(ev: ScenarioEvents): ReportOutput {
  return {
    reportId: 'COOIS_CMP',
    title: 'Production Order Information System — Components (COOIS)',
    columns: cols([
      ['AUFNR', 'Order'],
      ['RSPOS', 'Item'],
      ['MATNR', 'Component'],
      ['MAKTX', 'Description'],
      ['WERKS', 'Plant'],
      ['BDMNG', 'Requirement Qty'],
      ['ENMNG', 'Withdrawn Qty'],
      ['MEINS', 'Unit'],
      ['PLAN_VAL', 'Planned Value'],
      ['ACT_VAL', 'Actual Value'],
      ['WAERS', 'Currency'],
    ]),
    rows: ev.components.map((c) => [
      c.aufnr, c.rspos, c.matnr, c.name, SIM_CONFIG.plant, qty(c.plannedQty), qty(c.actualQty), c.uom,
      String(c.plannedValue), String(c.actualValue), SIM_CONFIG.currency,
    ]),
  };
}

/** COOIS — Operations: giờ kế hoạch/thực tế; giá trị thực tế lấy từ xác nhận cùng công đoạn. */
export function buildCooisOperations(ev: ScenarioEvents): ReportOutput {
  return {
    reportId: 'COOIS_OPR',
    title: 'Production Order Information System — Operations (COOIS)',
    columns: cols([
      ['AUFNR', 'Order'],
      ['VORNR', 'Operation'],
      ['ARBPL', 'Work Center'],
      ['LTXA1', 'Operation Text'],
      ['WERKS', 'Plant'],
      ['VGW01', 'Setup Time (H)'],
      ['PLAN_MACH_H', 'Planned Machine Hrs'],
      ['PLAN_LAB_H', 'Planned Labor Hrs'],
      ['ISM_MACH_H', 'Actual Machine Hrs'],
      ['ISM_LAB_H', 'Actual Labor Hrs'],
      ['ACT_LAB_VAL', 'Actual Labor Value'],
      ['ACT_MACH_VAL', 'Actual Machine/OH Value'],
      ['WAERS', 'Currency'],
    ]),
    rows: ev.operations.map((op) => {
      const conf = ev.confirmations.filter((c) => c.aufnr === op.aufnr && c.vornr === op.vornr);
      return [
        op.aufnr, op.vornr, op.workCenter, op.workCenterName, SIM_CONFIG.plant, qty(op.setupHours),
        qty(op.plannedMachineHours), qty(op.plannedLaborHours), qty(op.actualMachineHours), qty(op.actualLaborHours),
        String(conf.reduce((s, c) => s + c.laborValue, 0)),
        String(conf.reduce((s, c) => s + c.machineOverheadValue, 0)),
        SIM_CONFIG.currency,
      ];
    }),
  };
}

/** COOIS — Confirmations (AFRU). */
export function buildCooisConfirmations(ev: ScenarioEvents): ReportOutput {
  return {
    reportId: 'COOIS_CNF',
    title: 'Production Order Information System — Confirmations (COOIS)',
    columns: cols([
      ['RUECK', 'Confirmation'],
      ['RMZHL', 'Counter'],
      ['AUFNR', 'Order'],
      ['VORNR', 'Operation'],
      ['BUDAT', 'Posting Date'],
      ['LMNGA', 'Yield'],
      ['ISM01', 'Labor Hrs'],
      ['ISM02', 'Machine Hrs'],
      ['LAB_VAL', 'Labor Value'],
      ['MACH_VAL', 'Machine/OH Value'],
      ['WAERS', 'Currency'],
    ]),
    rows: ev.confirmations.map((c, i) => [
      c.rueck, String(i + 1).padStart(8, '0'), c.aufnr, c.vornr, postingDateOf(3), qty(c.yieldQty),
      qty(c.laborHours), qty(c.machineHours), String(c.laborValue), String(c.machineOverheadValue), SIM_CONFIG.currency,
    ]),
  };
}
