/**
 * Danh mục 11 báo cáo định dạng SAP — nguồn DUY NHẤT cho cả giao diện (ReportsPage) và test đối soát (scripts/s3-reports.ts),
 * để báo cáo người dùng thấy chính là báo cáo đã được đối soát.
 */
import { buildScenarioEvents } from '../events/scenarioEvents';
import type { AcdocaLine, MTOComputed, MTOParameters } from '../types';
import { buildCk13n, buildKks1, buildKob1, buildSup01 } from './controlling';
import type { ReportOutput } from './core';
import { buildFagll03 } from './fagll03';
import {
  buildCooisComponents, buildCooisConfirmations, buildCooisGoodsMovements, buildCooisHeader, buildCooisOperations, buildMb51,
} from './logistics';

export const REPORT_IDS = [
  'FAGLL03', 'MB51', 'COOIS_HDR', 'COOIS_CMP', 'COOIS_OPR', 'COOIS_CNF', 'COOIS_GM', 'KOB1', 'KKS1', 'CK13N', 'SUP01',
] as const;

export function buildAllReports(params: MTOParameters, computed: MTOComputed, table: AcdocaLine[]): ReportOutput[] {
  const ev = buildScenarioEvents(params, computed, table);
  const reps = [
    buildFagll03(table), buildMb51(ev), buildCooisHeader(ev, computed.plannedCost), buildCooisComponents(ev),
    buildCooisOperations(ev), buildCooisConfirmations(ev), buildCooisGoodsMovements(ev), buildKob1(table),
    buildKks1(ev, computed, table), buildCk13n(computed, params.componentCode, params.orderQuantity), buildSup01(ev, computed, table),
  ];
  const ids = reps.map((r) => r.reportId).join();
  if (ids !== REPORT_IDS.join()) throw new Error(`Danh mục báo cáo lệch: ${ids}`);
  return reps;
}
