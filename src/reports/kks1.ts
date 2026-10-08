/**
 * KKS1 (Variance Calculation — production order) — bố cục MÔ PHỎNG, theo yếu tố chi phí 621/622/627.
 *
 *  PLAN    : chi phí kế hoạch (CK13N) của cả lệnh.
 *  ACTUAL  : chi phí thực tế từ sự kiện (đặt chỗ 261 + xác nhận CO11N) — KHÔNG đọc từ FI.
 *  TARGET  : chi phí mục tiêu = PLAN × (SL nhập kho / SL lệnh) — chính là giá trị ghi Có lệnh khi nhập kho (hàng định giá).
 *  WIP     : dở dang = ACTUAL − ghi Có lệnh khi nhập kho (FI 101E) − quyết toán (FI VA88/KKA2/CKMLCP).
 *  VARIANCE: chênh lệch của phần đã giao = ACTUAL − WIP − TARGET.
 *  ORDER_VAR: chênh lệch toàn lệnh = ACTUAL − PLAN (tham khảo, không phải số đã quyết toán).
 * Tổng mỗi cột được chia theo yếu tố bằng phương pháp số dư lớn nhất (TARGET theo PLAN, WIP theo ACTUAL).
 * Chưa tách loại chênh lệch (giá/lượng/năng suất) — xem AUD-016.
 */
import { SIM_CONFIG } from '../config/simConfig';
import type { ScenarioEvents } from '../events/scenarioEvents';
import { roundShare } from '../features/wip';
import type { AcdocaLine, MTOComputed } from '../types';
import type { ReportOutput } from './core';
import { isOrderLine } from './kob1';
import { allocate, fmtAmt, sumCol } from './util';

export const KKS1_COLUMNS = [
  { field: 'AUFNR', label: 'Order' },
  { field: 'KSTAR', label: 'Cost Element' },
  { field: 'KTEXT', label: 'Cost Element Name' },
  { field: 'PLAN', label: 'Plan Costs' },
  { field: 'TARGET', label: 'Target Costs' },
  { field: 'ACTUAL', label: 'Actual Costs' },
  { field: 'WIP', label: 'Work in Process' },
  { field: 'VARIANCE', label: 'Variance (delivered)' },
  { field: 'ORDER_VAR', label: 'Actual − Plan (SIM)' },
  { field: 'WAERS', label: 'Currency' },
] as const;

export function buildKks1(ev: ScenarioEvents, computed: MTOComputed, table: AcdocaLine[]): ReportOutput {
  const plan = [computed.materialCost, computed.effectiveLaborCost, computed.effectiveMachineCost + computed.variantAddonTotal];
  const actual = [
    ev.components.reduce((s, c) => s + c.actualValue, 0),
    ev.confirmations.reduce((s, c) => s + c.laborValue, 0),
    ev.confirmations.reduce((s, c) => s + c.machineOverheadValue, 0),
  ];
  const ratio = ev.order.plannedQty > 0 ? Math.min(1, ev.order.deliveredQty / ev.order.plannedQty) : 0;
  const targetTotal = roundShare(plan.reduce((s, n) => s + n, 0), ratio);

  const orderCredits = table
    .filter((l) => isOrderLine(l) && l.glAccount === '154')
    .reduce((s, l) => s + l.crAmount - l.drAmount, 0); // ghi Có lệnh: nhập kho + quyết toán
  const wipTotal = actual.reduce((s, n) => s + n, 0) - orderCredits;

  const target = allocate(targetTotal, plan);
  const wip = allocate(wipTotal, actual);
  const names = ['Chi phí NVL trực tiếp', 'Chi phí nhân công trực tiếp', 'Chi phí sản xuất chung'];
  const rows = ['621', '622', '627'].map((k, i) => [
    SIM_CONFIG.productionOrder, k, names[i], fmtAmt(plan[i]), fmtAmt(target[i]), fmtAmt(actual[i]), fmtAmt(wip[i]),
    fmtAmt(actual[i] - wip[i] - target[i]), fmtAmt(actual[i] - plan[i]), SIM_CONFIG.currency,
  ]);
  return {
    reportId: 'KKS1',
    title: 'Variance Calculation — Production Order (KKS1)',
    columns: KKS1_COLUMNS.map((c) => ({ field: c.field, label: c.label })),
    rows,
  };
}

export function kks1Totals(r: ReportOutput): Record<'plan' | 'target' | 'actual' | 'wip' | 'variance' | 'orderVar', number> {
  return {
    plan: sumCol(r, 'PLAN'), target: sumCol(r, 'TARGET'), actual: sumCol(r, 'ACTUAL'), wip: sumCol(r, 'WIP'),
    variance: sumCol(r, 'VARIANCE'), orderVar: sumCol(r, 'ORDER_VAR'),
  };
}

