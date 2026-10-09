/**
 * T2 — Báo cáo kiểm soát chi phí định dạng SAP (MÔ PHỎNG): KOB1, KKS1, CK13N, SUP01.
 * KOB1 đọc ACDOCA; KKS1/SUP01 ghép sự kiện logistics (buildScenarioEvents) với bút toán kết chuyển trong ACDOCA;
 * CK13N đọc giá thành kế hoạch (computeMTO). Đối soát FI + oracle nằm ở scripts/s3-reports.ts.
 * Quy ước dấu CO: chi phí ghi Nợ lệnh (+), ghi Có lệnh (−). Tất định: không đọc đồng hồ.
 */
import { SIM_CONFIG } from '../config/simConfig';
import type { ScenarioEvents } from '../events/scenarioEvents';
import { roundShare } from '../features/wip';
import type { AcdocaLine, MTOComputed } from '../types';
import { documentNumbers, fiscalYearOf, lineNumberOf, periodOf, postingDateOf, qty, type ReportOutput } from './core';

const cols = (defs: [string, string][]) => defs.map(([field, label]) => ({ field, label }));

/** Tài khoản chi phí ban đầu ghi vào lệnh (TT99): 621 NVL trực tiếp, 622 NC trực tiếp, 627 SXC. */
export const ORDER_COST_ACCOUNTS = ['621', '622', '627'] as const;
/** Tài khoản dở dang của lệnh (TT99): 154. */
export const ORDER_WIP_ACCOUNT = '154';

const isOrderDebit = (l: AcdocaLine) => (ORDER_COST_ACCOUNTS as readonly string[]).includes(l.glAccount) && l.drAmount > 0;
/** Dòng 154 phát sinh ngoài CO01: nhập kho 101 (Có), kết chuyển VA88 (Có khi bất lợi, Nợ khi thuận lợi). */
const isOrderCredit = (l: AcdocaLine) => l.glAccount === ORDER_WIP_ACCOUNT && l.tCode !== 'CO01';
const isSettlement = (l: AcdocaLine) => isOrderCredit(l) && (l.tCode || '').startsWith('VA88');

/**
 * KOB1 — Order Actual Line Items. Nợ lệnh = dòng Nợ 621/622/627 (xuất NVL 261, xác nhận CO11N);
 * Có lệnh = dòng 154 ngoài CO01 (nhập kho 101; kết chuyển VA88 — chênh lệch thuận lợi ghi Nợ 154 nên mang dấu +). Bút toán CO01 621/622/627→154 là luồng FI nội bộ,
 * không phải chi phí mới của lệnh → không lặp lại (AUD-014).
 */
export function buildKob1(table: AcdocaLine[], aufnr: string = SIM_CONFIG.productionOrder): ReportOutput {
  const belnr = documentNumbers(table);
  const rows = table
    .filter((l) => isOrderDebit(l) || isOrderCredit(l))
    .map((l) => {
      const budat = postingDateOf(l.stepId);
      const wkg = isOrderDebit(l) ? l.drAmount : l.drAmount - l.crAmount;
      return [
        SIM_CONFIG.controllingArea, aufnr, fiscalYearOf(budat), periodOf(budat), budat,
        belnr.get(l.txnId) as string, lineNumberOf(l.lineId), l.tCode, l.glAccount, l.accountName,
        String(wkg), SIM_CONFIG.currency, l.matnr ?? '', l.kostl ?? '',
      ];
    });
  return {
    reportId: 'KOB1',
    title: 'Orders: Actual Line Items (KOB1)',
    columns: cols([
      ['KOKRS', 'Controlling Area'], ['AUFNR', 'Order'], ['GJAHR', 'Fiscal Year'], ['PERIO', 'Period'],
      ['BUDAT', 'Posting Date'], ['BELNR', 'Ref. Document'], ['BUZEI', 'Line'], ['TCODE', 'Transaction'],
      ['KSTAR', 'Cost Element'], ['KTEXT', 'Cost Element Name'], ['WKGBTR', 'Value in CO Currency'],
      ['WAERS', 'Currency'], ['MATNR', 'Material'], ['ARBPL', 'Work Center'],
    ]),
    rows,
  };
}

/**
 * KKS1 — Variance Calculation (collective). Thực tế = Σ đặt chỗ + xác nhận (sự kiện);
 * Có do nhập kho = Σ giá trị 101 (sự kiện); Kết chuyển = Σ (Có − Nợ) 154 bởi VA88 (ACDOCA);
 * Dở dang = Thực tế − Nhập kho − Kết chuyển; Mục tiêu = Kế hoạch × tỷ lệ giao; Chênh lệch = Thực tế − Mục tiêu − Dở dang.
 */
export function buildKks1(ev: ScenarioEvents, computed: MTOComputed, table: AcdocaLine[]): ReportOutput {
  const o = ev.order;
  const actual =
    ev.components.reduce((s, c) => s + c.actualValue, 0) +
    ev.confirmations.reduce((s, c) => s + c.laborValue + c.machineOverheadValue, 0);
  const grCredit = ev.movements.filter((m) => m.bwart === '101' && m.aufnr === o.aufnr).reduce((s, m) => s + m.value, 0);
  const settled = table.filter(isSettlement).reduce((s, l) => s + l.crAmount - l.drAmount, 0); // âm khi thuận lợi
  const wip = actual - grCredit - settled;
  const ratio = o.plannedQty > 0 ? Math.min(1, Math.max(0, o.deliveredQty / o.plannedQty)) : 0;
  const target = roundShare(computed.plannedCost, ratio);
  const variance = actual - target - wip;
  return {
    reportId: 'KKS1',
    title: 'Variance Calculation: Collective Processing (KKS1)',
    columns: cols([
      ['AUFNR', 'Order'], ['MATNR', 'Material'], ['WERKS', 'Plant'], ['VERSN', 'Version'], ['GAMNG', 'Order Qty'],
      ['WEMNG', 'Delivered Qty'], ['PLAN_COST', 'Planned Costs'], ['TARGET_COST', 'Target Costs'],
      ['ACT_COST', 'Actual Costs'], ['GR_CREDIT', 'Credit from GR'], ['SETTLED', 'Settled (VA88)'],
      ['WIP', 'Work in Process'], ['VARIANCE', 'Total Variance'], ['WAERS', 'Currency'],
    ]),
    rows: [
      [
        o.aufnr, o.matnr, o.plant, SIM_CONFIG.costingVersion, qty(o.plannedQty), qty(o.deliveredQty),
        String(computed.plannedCost), String(target), String(actual), String(grCredit), String(settled),
        String(wip), String(variance), SIM_CONFIG.currency,
      ],
    ],
  };
}

/**
 * CK13N — Display Cost Estimate (cost component view). Thành phần chi phí trùng trọng số chia giá vốn PGI
 * (splitCogsByCk11n): 101 NVL→632110, 102 NC→632120, 103 Máy & KH→632130, 104 SXC (+ add-on biến thể)→632140.
 */
export function buildCk13n(computed: MTOComputed, matnr: string, lotSize: number): ReportOutput {
  const items: [string, string, string, string, number][] = [
    ['101', 'Vật liệu trực tiếp', '621', '632110', computed.directMaterialCost621],
    ['102', 'Nhân công trực tiếp', '622', '632120', computed.directLaborCost622],
    ['103', 'Máy & khấu hao', '627', '632130', computed.machineOverhead627],
    ['104', 'Sản xuất chung', '627', '632140', computed.factoryOverhead627],
    ['104', 'Add-on biến thể (SXC)', '627', '632140', computed.variantAddonTotal ?? 0],
  ];
  return {
    reportId: 'CK13N',
    title: 'Display Cost Estimate — Cost Components (CK13N)',
    columns: cols([
      ['KLVAR', 'Costing Variant'], ['TVERS', 'Costing Version'], ['MATNR', 'Material'], ['WERKS', 'Plant'],
      ['LOSGR', 'Costing Lot Size'], ['ELEMT', 'Cost Component'], ['TXELE', 'Component Text'],
      ['KSTAR', 'Cost Element'], ['COGS_ACCT', 'COGS Account (PGI)'], ['WERT', 'Value'],
      ['WERT_UNIT', 'Value per 1 PC'], ['WAERS', 'Currency'],
    ]),
    rows: items.map(([el, tx, kstar, cogs, v]) => [
      'PPC1', SIM_CONFIG.costingVersion, matnr, SIM_CONFIG.plant, qty(lotSize), el, tx, kstar, cogs,
      String(v), lotSize > 0 ? (v / lotSize).toFixed(2) : '0.00', SIM_CONFIG.currency,
    ]),
  };
}

/**
 * SUP01 — Tổng hợp lệnh sản xuất ↔ đơn bán MTO (báo cáo tổng hợp của simulator, KHÔNG phải T-code SAP chuẩn;
 * diễn giải đã được chủ dự án chốt 09/10/2026 — AUD-015). Doanh thu/giá vốn/dở dang đọc từ ACDOCA theo đơn bán.
 */
export function buildSup01(ev: ScenarioEvents, computed: MTOComputed, table: AcdocaLine[]): ReportOutput {
  const o = ev.order;
  const so = table.filter((l) => (l.kaufn ?? '') === o.salesOrder);
  const actual =
    ev.components.reduce((s, c) => s + c.actualValue, 0) +
    ev.confirmations.reduce((s, c) => s + c.laborValue + c.machineOverheadValue, 0);
  const wip = so.filter((l) => l.glAccount === ORDER_WIP_ACCOUNT).reduce((s, l) => s + l.drAmount - l.crAmount, 0);
  const revenue = so.filter((l) => l.glAccount === '511' && l.tCode === 'VF01').reduce((s, l) => s + l.crAmount - l.drAmount, 0);
  const cogs = so.filter((l) => l.glAccount === '911').reduce((s, l) => s + l.drAmount, 0); // giá vốn kết chuyển 632→911
  return {
    reportId: 'SUP01',
    title: 'MTO Order Summary: Production Order ↔ Sales Order (SUP01, simulator)',
    columns: cols([
      ['KDAUF', 'Sales Order'], ['KDPOS', 'SO Item'], ['AUFNR', 'Order'], ['MATNR', 'Material'], ['WERKS', 'Plant'],
      ['KWMENG', 'Order Qty'], ['LFIMG', 'Delivered Qty'], ['PLAN_COST', 'Planned Costs'], ['ACT_COST', 'Actual Costs'],
      ['WIP', 'WIP (154)'], ['COGS', 'COGS to 911'], ['REVENUE', 'Revenue (511)'], ['GROSS_PROFIT', 'Gross Profit'],
      ['WAERS', 'Currency'],
    ]),
    rows: [
      [
        o.salesOrder, o.salesOrderItem, o.aufnr, o.matnr, o.plant, qty(o.plannedQty), qty(o.deliveredQty),
        String(computed.plannedCost), String(actual), String(wip), String(cogs), String(revenue),
        String(revenue - cogs), SIM_CONFIG.currency,
      ],
    ],
  };
}
