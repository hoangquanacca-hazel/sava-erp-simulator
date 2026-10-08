/**
 * CK13N (Display Cost Estimate — Itemization) — bố cục MÔ PHỎNG, từ kết quả tính giá kế hoạch computeMTO.
 * Thành phần giá (ELEMT) theo cùng cách tách giá vốn 632110–632140 của acdoca.splitCogsByCk11n:
 * MAT = NVL (621), LAB = nhân công (622), MACH = máy (627), OVH = SXC + phụ phí biến thể (627).
 */
import { SIM_CONFIG } from '../config/simConfig';
import { resolveRouting } from '../utils/calculator';
import type { MTOComputed, MTOParameters } from '../types';
import type { ReportOutput } from './core';
import { col, fmtAmt, fmtHrs, fmtQty, sumCol } from './util';

export const CK13N_ELEMENTS = ['MAT', 'LAB', 'MACH', 'OVH'] as const;
export type Ck13nElement = (typeof CK13N_ELEMENTS)[number];

export const CK13N_COLUMNS = [
  { field: 'KLVAR', label: 'Costing Variant' },
  { field: 'TVERS', label: 'Costing Version' },
  { field: 'MATNR', label: 'Costed Material' },
  { field: 'WERKS', label: 'Plant' },
  { field: 'LOSGR', label: 'Costing Lot Size' },
  { field: 'POSNR', label: 'Item' },
  { field: 'TYPPS', label: 'Item Category' },
  { field: 'RESSOURCE', label: 'Resource' },
  { field: 'LTEXT', label: 'Description' },
  { field: 'MENGE', label: 'Quantity' },
  { field: 'MEINS', label: 'Unit' },
  { field: 'PREIS', label: 'Price' },
  { field: 'KSTAR', label: 'Cost Element' },
  { field: 'ELEMT', label: 'Cost Component (SIM)' },
  { field: 'WERT', label: 'Value' },
  { field: 'WAERS', label: 'Currency' },
] as const;

export function buildCk13n(params: MTOParameters, computed: MTOComputed): ReportOutput {
  const routing = resolveRouting(params);
  const wc = routing.workCenterCode;
  const hourlyLab = params.laborCostMode === 'hourly';
  const hourlyMach = params.machineCostMode === 'hourly';
  type Item = [typ: string, res: string, text: string, qty: string, uom: string, price: string, kstar: string, el: Ck13nElement, value: number];
  const items: Item[] = [
    ...(computed.bomItemBreakdowns ?? []).map(
      (b): Item => ['M', b.itemCode, b.name, fmtQty(b.grossQty), b.uom, '', '621', 'MAT', b.totalCost]
    ),
    ['E', `${wc}/LABOR`, 'Nhân công trực tiếp', fmtHrs(computed.operatingHours), 'H', hourlyLab ? fmtAmt(routing.laborHourlyRate) : '', '622', 'LAB', computed.directLaborCost622],
    ['E', `${wc}/MACHINE`, 'Giờ máy', fmtHrs(computed.operatingHours), 'H', hourlyMach ? fmtAmt(routing.machineHourlyRate) : '', '627', 'MACH', computed.machineOverhead627],
    ['G', 'OH-SXC', `SXC ${routing.factoryOverheadRatePercent}% × (NVL + NC)`, '', '', '', '627', 'OVH', computed.factoryOverhead627],
  ];
  if (computed.variantAddonTotal !== 0) {
    items.push(['V', 'VC-ADDON', 'Phụ phí biến thể (Strategy 25)', fmtQty(params.orderQuantity), 'PC', '', '627', 'OVH', computed.variantAddonTotal]);
  }
  const rows = items.map((it, i) => [
    'PPC1', SIM_CONFIG.costingVersion, params.componentCode, SIM_CONFIG.plant, fmtQty(params.orderQuantity),
    String(i + 1).padStart(4, '0'), it[0], it[1], it[2], it[3], it[4], it[5], it[6], it[7], fmtAmt(it[8]), SIM_CONFIG.currency,
  ]);
  return {
    reportId: 'CK13N',
    title: 'Cost Estimate Itemization (CK13N)',
    columns: CK13N_COLUMNS.map((c) => ({ field: c.field, label: c.label })),
    rows,
  };
}

export function ck13nTotals(r: ReportOutput): { total: number; lotSize: number } & Record<Ck13nElement, number> {
  const by = (e: string) => sumCol(r, 'WERT', (row) => row[col(r, 'ELEMT')] === e);
  const lot = [...new Set(r.rows.map((row) => row[col(r, 'LOSGR')]))];
  if (lot.length !== 1) throw new Error(`CK13N: cỡ lô không duy nhất ${lot}`);
  return { total: sumCol(r, 'WERT'), lotSize: Number(lot[0]), MAT: by('MAT'), LAB: by('LAB'), MACH: by('MACH'), OVH: by('OVH') };
}
