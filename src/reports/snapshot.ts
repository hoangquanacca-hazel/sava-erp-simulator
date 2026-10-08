import type { AcdocaLine, MTOComputed, MTOParameters } from '../types';
import { buildScenarioEvents } from '../events/scenarioEvents';
import { buildManufacturingReports, validateReportPack } from './manufacturing';
import { buildManifest, sha256Hex, toRawExport } from './core';

/** No regenerated postings: exports reflect precisely the supplied posted ledger. */
export async function exportReportSnapshot(params: MTOParameters, computed: MTOComputed, table: AcdocaLine[]) {
  // Capture before the first await; caller edits cannot mix generations in one manifest.
  const p=structuredClone(params), c=structuredClone(computed), t=structuredClone(table);
  const ev = buildScenarioEvents(p,c,t);
  const reports = buildManufacturingReports(ev,t,c,p);
  validateReportPack(reports,ev,t,c);
  const source = JSON.stringify({params:p, computed:c, events:ev,
    ledger:t.map(({timestamp: _timestamp,...line})=>line)});
  const sourceHash = await sha256Hex(new TextEncoder().encode(source));
  const outputs = await Promise.all(reports.map(async report=> {
    const raw=toRawExport(report);
    const metricFields = ['HSL','DMBTR','WTG001','ZSIM_PLAN','ZSIM_ACTUAL','ZSIM_VARIANCE','ZSIM_SETTLED','ZSIM_WIP','ZSIM_ACTUAL_VALUE','ZSIM_PLAN_VALUE','ZSIM_LABOR_VALUE','ZSIM_OVERHEAD_VALUE'];
    const totals: Record<string,number> = {};
    for (const field of metricFields) {
      const index=report.columns.findIndex(c=>c.field===field);
      if(index>=0) totals[field]=report.rows.reduce((sum,row)=>sum+Number(row[index]),0);
    }
    if(report.reportId==='CK13N') {
      totals.headerValue=Number(report.rows[0][6]);
      totals.itemValue=report.rows.slice(1).reduce((s,row)=>s+Number(row[6]),0);
    }
    const manifest=await buildManifest(report,raw,t.length,totals);
    return Object.freeze({raw,manifest:Object.freeze({...manifest,sourceHash,
      runId:`SIM-${sourceHash.slice(0,16)}`, adapterVersion:null,
      phase:'GENERATED_RAW', controls:'technical-pass', legalApproval:'pending',
      selection:Object.freeze({...manifest.selection,material:p.componentCode,
        stockType:p.stockType,deliveredQuantity:ev.order.deliveredQty})})});
  }));
  return Object.freeze(outputs);
}
