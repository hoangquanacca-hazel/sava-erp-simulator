/**
 * A0.1 — Nguồn sự kiện logistics/sản xuất DUY NHẤT của một kịch bản mô phỏng.
 * MB51, 5 danh sách COOIS và các kiểm soát đều đọc từ đây; không báo cáo nào được tự suy số lượng từ tham số.
 *
 * GIẢ ĐỊNH MÔ PHỎNG (xem AUD-001, AUD-012): số lượng/giờ thực tế = kế hoạch × hệ số thực tế/kế hoạch của từng
 * yếu tố chi phí (cùng cách phân bổ chênh lệch của A0). Số lượng nhập kho/giao = số lượng lệnh × tỷ lệ giao.
 * Tất định: không đọc đồng hồ máy.
 */
import { SIM_CONFIG } from '../config/simConfig';
import { roundShare, wipStatusOf } from '../features/wip';
import { postingDims } from '../utils/acdoca';
import { resolveRouting } from '../utils/calculator';
import type { AcdocaLine, MTOComputed, MTOParameters } from '../types';

export interface ProductionOrderEvent {
  aufnr: string;
  matnr: string;
  description: string;
  plant: string;
  plannedQty: number;
  deliveredQty: number;
  uom: string;
  stockType: MTOParameters['stockType'];
  strategy: MTOParameters['strategy'];
  salesOrder: string;
  salesOrderItem: string;
}

export interface ComponentEvent {
  aufnr: string;
  rspos: string; // số dòng đặt chỗ
  matnr: string;
  name: string;
  uom: string;
  plannedQty: number;
  actualQty: number;
  plannedValue: number;
  actualValue: number;
}

export interface OperationEvent {
  aufnr: string;
  vornr: string;
  workCenter: string;
  workCenterName: string;
  setupHours: number;
  plannedMachineHours: number;
  plannedLaborHours: number;
  actualMachineHours: number;
  actualLaborHours: number;
}

export interface ConfirmationEvent {
  aufnr: string;
  vornr: string;
  rueck: string;
  yieldQty: number;
  laborHours: number;
  machineHours: number;
  laborValue: number;
  machineOverheadValue: number;
}

export interface MaterialMovement {
  mblnr: string; // số chứng từ vật tư (10 chữ số)
  zeile: string;
  step: number;
  bwart: '261' | '101' | '601';
  matnr: string;
  name: string;
  plant: string;
  quantity: number;
  uom: string;
  value: number; // VND; 0 khi không có giá trị (hàng không định giá)
  shkzg: 'S' | 'H'; // S = nhập (tăng tồn), H = xuất
  aufnr: string;
  salesOrder: string;
  /** Chứng từ kế toán tương ứng (nếu có). Hàng không định giá: nhập/xuất kho không có bút toán FI. */
  fiTxnId?: string;
}

export interface ScenarioEvents {
  order: ProductionOrderEvent;
  components: ComponentEvent[];
  operations: OperationEvent[];
  confirmations: ConfirmationEvent[];
  movements: MaterialMovement[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function docOf(table: AcdocaLine[], pred: (l: AcdocaLine) => boolean): { txnId: string; dr: number } | undefined {
  const lines = table.filter(pred);
  if (lines.length === 0) return undefined;
  return { txnId: lines[0].txnId, dr: lines.reduce((s, l) => s + l.drAmount, 0) };
}

export function buildScenarioEvents(
  params: MTOParameters,
  computed: MTOComputed,
  table: AcdocaLine[]
): ScenarioEvents {
  const dims = postingDims(params);
  const aufnr = SIM_CONFIG.productionOrder;
  const wip = wipStatusOf(params);
  const ratio = wip.ratio;
  const valuated = params.stockType === 'Valuated';
  const plannedMat = computed.materialCost;
  const matFactor = plannedMat > 0 ? computed.actualMaterialCost / plannedMat : 1;

  // --- Thành phần (đặt chỗ) --------------------------------------------------
  const bom = computed.bomItemBreakdowns ?? [];
  let allocated = 0;
  const components: ComponentEvent[] = bom.map((b, i) => {
    const last = i === bom.length - 1;
    const actualValue = last ? computed.actualMaterialCost - allocated : Math.round(b.totalCost * matFactor);
    allocated += actualValue;
    return {
      aufnr,
      rspos: String(i + 1).padStart(4, '0'),
      matnr: b.itemCode,
      name: b.name,
      uom: b.uom,
      plannedQty: b.grossQty,
      actualQty: r2(b.grossQty * matFactor),
      plannedValue: b.totalCost,
      actualValue,
    };
  });

  // --- Công đoạn và xác nhận --------------------------------------------------
  const routing = resolveRouting(params);
  const plannedOverheadPosted = computed.effectiveMachineCost + computed.variantAddonTotal;
  const laborFactor = computed.effectiveLaborCost > 0 ? computed.actualLaborCost / computed.effectiveLaborCost : 1;
  const machFactor = plannedOverheadPosted > 0 ? computed.actualOverheadCost / plannedOverheadPosted : 1;
  const operations: OperationEvent[] = [
    {
      aufnr,
      vornr: '0010',
      workCenter: routing.workCenterCode,
      workCenterName: routing.workCenterName,
      setupHours: routing.machineSetupTimeHours || 0,
      plannedMachineHours: computed.operatingHours,
      plannedLaborHours: computed.operatingHours,
      actualMachineHours: r2(computed.operatingHours * machFactor),
      actualLaborHours: r2(computed.operatingHours * laborFactor),
    },
  ];
  const confirmations: ConfirmationEvent[] = [
    {
      aufnr,
      vornr: '0010',
      rueck: '0000000001',
      yieldQty: roundShare(wip.ordered, ratio),
      laborHours: operations[0].actualLaborHours,
      machineHours: operations[0].actualMachineHours,
      laborValue: computed.actualLaborCost,
      machineOverheadValue: computed.actualOverheadCost,
    },
  ];

  // --- Chuyển động kho --------------------------------------------------------
  const fi261 = docOf(table, (l) => l.tCode === 'MIGO 261E' && l.glAccount === '621');
  const fi101 = docOf(table, (l) => l.tCode === 'MIGO 101E' && l.glAccount === '155');
  const fi601 = docOf(table, (l) => (l.tCode || '').includes('MIGO 601E') && l.glAccount.startsWith('6321'));
  const deliveredQty = roundShare(wip.ordered, ratio);
  const movements: MaterialMovement[] = [];
  const base = { plant: SIM_CONFIG.plant, aufnr, salesOrder: dims.kaufn ?? '' };
  const mbl = (step: number, seq: number) => `50${step}${String(seq).padStart(7, '0')}`;

  components.forEach((c, i) =>
    movements.push({
      ...base, mblnr: mbl(3, 1), zeile: String(i + 1).padStart(4, '0'), step: 3, bwart: '261',
      matnr: c.matnr, name: c.name, quantity: c.actualQty, uom: c.uom, value: c.actualValue, shkzg: 'H',
      fiTxnId: fi261?.txnId,
    })
  );
  if (deliveredQty > 0) {
    movements.push({
      ...base, mblnr: mbl(3, 2), zeile: '0001', step: 3, bwart: '101', matnr: params.componentCode,
      name: params.componentName, quantity: deliveredQty, uom: 'PC',
      value: valuated ? roundShare(computed.plannedCost, ratio) : 0, shkzg: 'S', fiTxnId: fi101?.txnId,
    });
    movements.push({
      ...base, mblnr: mbl(5, 1), zeile: '0001', step: 5, bwart: '601', matnr: params.componentCode,
      name: params.componentName, quantity: deliveredQty, uom: 'PC',
      value: valuated ? roundShare(computed.plannedCost, ratio) : 0, shkzg: 'H', fiTxnId: fi601?.txnId,
    });
  }

  return {
    order: {
      aufnr, matnr: params.componentCode, description: params.componentName, plant: SIM_CONFIG.plant,
      plannedQty: wip.ordered, deliveredQty, uom: 'PC', stockType: params.stockType, strategy: params.strategy,
      salesOrder: dims.kaufn ?? '', salesOrderItem: dims.kposn ?? '',
    },
    components, operations, confirmations, movements,
  };
}

/**
 * Kiểm soát: sự kiện logistics phải khớp chứng từ kế toán. Trả danh sách sai lệch (rỗng = đạt).
 * Không có nhánh "tự chấp nhận": thiếu chứng từ FI khi lẽ ra phải có cũng là sai lệch.
 */
export function checkEventsAgainstFi(
  ev: ScenarioEvents,
  table: AcdocaLine[],
  computed: MTOComputed,
  params: MTOParameters
): string[] {
  const issues: string[] = [];
  const valuated = params.stockType === 'Valuated';
  const sumDr = (pred: (l: AcdocaLine) => boolean) => table.filter(pred).reduce((s, l) => s + l.drAmount, 0);

  const m261 = ev.movements.filter((m) => m.bwart === '261');
  const v261 = m261.reduce((s, m) => s + m.value, 0);
  const fi621 = sumDr((l) => l.tCode === 'MIGO 261E' && l.glAccount === '621');
  if (v261 !== fi621) issues.push(`261: giá trị vật tư ${v261} ≠ FI 621 ${fi621}`);
  if (v261 !== computed.actualMaterialCost) issues.push(`261: ${v261} ≠ chi phí NVL thực tế ${computed.actualMaterialCost}`);
  const compSum = ev.components.reduce((s, c) => s + c.actualValue, 0);
  if (compSum !== computed.actualMaterialCost) issues.push(`đặt chỗ: Σ giá trị ${compSum} ≠ NVL thực tế ${computed.actualMaterialCost}`);

  const m101 = ev.movements.filter((m) => m.bwart === '101');
  const m601 = ev.movements.filter((m) => m.bwart === '601');
  const q101 = m101.reduce((s, m) => s + m.quantity, 0);
  const q601 = m601.reduce((s, m) => s + m.quantity, 0);
  if (q101 !== q601) issues.push(`tồn kho đặc biệt E: nhập ${q101} ≠ xuất ${q601}`);
  if (q101 !== ev.order.deliveredQty) issues.push(`nhập kho ${q101} ≠ số lượng giao ${ev.order.deliveredQty}`);

  const fi155 = sumDr((l) => l.tCode === 'MIGO 101E' && l.glAccount === '155');
  const fiCogs = sumDr((l) => (l.tCode || '').includes('MIGO 601E') && l.glAccount.startsWith('6321'));
  const v101 = m101.reduce((s, m) => s + m.value, 0);
  const v601 = m601.reduce((s, m) => s + m.value, 0);
  if (valuated) {
    if (v101 !== fi155) issues.push(`101: giá trị ${v101} ≠ FI 155 ${fi155}`);
    if (v601 !== fiCogs) issues.push(`601: giá trị ${v601} ≠ FI 632xxx ${fiCogs}`);
    for (const m of [...m101, ...m601]) if (!m.fiTxnId) issues.push(`${m.bwart}: thiếu chứng từ FI cho hàng có định giá`);
  } else {
    if (fi155 !== 0 || fiCogs !== 0) issues.push(`hàng không định giá nhưng có FI nhập/xuất kho (${fi155}/${fiCogs})`);
    for (const m of [...m101, ...m601]) {
      if (m.value !== 0) issues.push(`${m.bwart}: hàng không định giá có giá trị ${m.value}`);
      if (m.fiTxnId) issues.push(`${m.bwart}: hàng không định giá không được có chứng từ FI ${m.fiTxnId}`);
    }
  }

  const conf = ev.confirmations[0];
  const fi622 = sumDr((l) => l.tCode === 'CO11N' && l.glAccount === '622');
  const fi627 = sumDr((l) => l.tCode === 'CO11N' && l.glAccount === '627');
  if (conf.laborValue !== fi622) issues.push(`xác nhận: nhân công ${conf.laborValue} ≠ FI 622 ${fi622}`);
  if (conf.machineOverheadValue !== fi627) issues.push(`xác nhận: máy/SXC ${conf.machineOverheadValue} ≠ FI 627 ${fi627}`);
  if (conf.yieldQty !== ev.order.deliveredQty) issues.push(`xác nhận: sản lượng ${conf.yieldQty} ≠ số lượng giao ${ev.order.deliveredQty}`);
  return issues;
}
