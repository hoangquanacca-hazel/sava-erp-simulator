/** Phase A: simulated layouts, NOT SAP-certified export variants. Browser-only.
 * One complete base scenario, no QM rework/scrap or optional extension postings.
 * Amounts use VND integers. ZSIM fields explicitly identify derived fields.
 */
import type { AcdocaLine, MTOComputed, MTOParameters } from '../types';
import type { ScenarioEvents } from '../events/scenarioEvents';
import { checkEventsAgainstFi } from '../events/scenarioEvents';
import { SIM_CONFIG as C } from '../config/simConfig';
import { documentNumberOf, lineNumberOf, type ReportOutput } from './core';
import { buildFagll03 } from './fagll03';

function report(id: string, fields: string[], rows: (string | number)[][]): ReportOutput {
  return { reportId: id, title: `${id} — SIMULATED layout`,
    columns: fields.map(field => ({ field, label: field })), rows: rows.map(r => r.map(String)) };
}
export const REPORT_IDS = ['FAGLL03', 'MB51', 'COOIS_HEADER', 'COOIS_COMPONENTS',
  'COOIS_OPERATIONS', 'COOIS_CONFIRMATIONS', 'COOIS_GOODS_MOVEMENTS', 'KOB1', 'KKS1', 'CK13N', 'SUP01'] as const;
export type ReportPack = ReportOutput[];
const net = (ls: AcdocaLine[]) => ls.reduce((s,l) => s + l.drAmount - l.crAmount, 0);
const costs = (t: AcdocaLine[]) => t.filter(l => l.stepId === 3 && l.glAccount === '154' && l.drAmount > 0);
const settlements = (t: AcdocaLine[]) => t.filter(l => l.stepId === 7 && l.glAccount === '154');

export function buildManufacturingReports(ev: ScenarioEvents, t: AcdocaLine[], c: MTOComputed, p: MTOParameters): ReportPack {
  if (t.some(l => !Number.isFinite(l.drAmount) || !Number.isFinite(l.crAmount) || l.drAmount < 0 || l.crAmount < 0 || (l.drAmount > 0 && l.crAmount > 0))) throw new Error('Invalid FI amounts');
  const docs = new Map<string, number>();
  for (const l of t) docs.set(l.txnId, (docs.get(l.txnId) ?? 0) + l.drAmount - l.crAmount);
  if ([...docs.values()].some(n => n !== 0)) throw new Error('Unbalanced FI document');
  const issues = checkEventsAgainstFi(ev, t, c, p);
  if (issues.length) throw new Error(issues.join('\n'));
  if (!t.length || new Set(t.map(l => l.lineId)).size !== t.length) throw new Error('Empty/duplicate FI source');
  if (t.some(l => l.stepId === 4 || /-(ML|GRIR|IC)-/.test(l.txnId)))
    throw new Error('Phase A chưa hỗ trợ QM rework/scrap, ML, GR/IR hoặc intercompany');
  if (net(costs(t)) !== c.actualCostBeforeRework) throw new Error('Actual cost source mismatch');
  const movements = (id: string) => report(id,
    ['MJAHR','MBLNR','ZEILE','BUDAT','BWART','MATNR','WERKS','MENGE','MEINS','DMBTR','WAERS','SHKZG','AUFNR','KDAUF','ZSIM_FI_BELNR'],
    ev.movements.map(m => [C.postingDate.slice(0,4),m.mblnr,m.zeile,C.postingDate,m.bwart,m.matnr,m.plant,
      m.quantity,m.uom,m.value,C.currency,m.shkzg,m.aufnr,m.salesOrder,m.fiTxnId ? documentNumberOf(m.fiTxnId) : '']));
  const order = ev.order;
  const actual = net(costs(t));
  const settled = -net(settlements(t));
  const unit = p.orderQuantity > 0 ? c.plannedCost / p.orderQuantity : 0;
  return [buildFagll03(t), movements('MB51'),
    report('COOIS_HEADER',['AUFNR','MATNR','WERKS','GAMNG','WEMNG','GMEIN','KDAUF','KDPOS'],
      [[order.aufnr,order.matnr,order.plant,order.plannedQty,order.deliveredQty,order.uom,order.salesOrder,order.salesOrderItem]]),
    report('COOIS_COMPONENTS',['AUFNR','RSPOS','MATNR','BDMNG','ENMNG','MEINS','ZSIM_PLAN_VALUE','ZSIM_ACTUAL_VALUE'],
      ev.components.map(v => [v.aufnr,v.rspos,v.matnr,v.plannedQty,v.actualQty,v.uom,v.plannedValue,v.actualValue])),
    report('COOIS_OPERATIONS',['AUFNR','VORNR','ARBPL','ZSIM_SETUP_H','ZSIM_PLAN_MACHINE_H','ZSIM_PLAN_LABOR_H','ZSIM_ACT_MACHINE_H','ZSIM_ACT_LABOR_H'],
      ev.operations.map(v => [v.aufnr,v.vornr,v.workCenter,v.setupHours,v.plannedMachineHours,v.plannedLaborHours,v.actualMachineHours,v.actualLaborHours])),
    report('COOIS_CONFIRMATIONS',['AUFNR','VORNR','RUECK','GMNGA','ZSIM_LABOR_H','ZSIM_MACHINE_H','ZSIM_LABOR_VALUE','ZSIM_OVERHEAD_VALUE'],
      ev.confirmations.map(v => [v.aufnr,v.vornr,v.rueck,v.yieldQty,v.laborHours,v.machineHours,v.laborValue,v.machineOverheadValue])),
    movements('COOIS_GOODS_MOVEMENTS'),
    // Production-cost view of the simulated 154 collector. Does not include 621/622/627 again.
    report('KOB1',['AUFNR','BELNR','BUZEI','BUDAT','KSTAR','WTG001','TWAER','ZSIM_SOURCE_LINE'],
      costs(t).map(l => [order.aufnr,documentNumberOf(l.txnId),lineNumberOf(l.lineId),C.postingDate,l.glAccount,l.drAmount-l.crAmount,C.currency,l.lineId])),
    report('KKS1',['AUFNR','ZSIM_PLAN','ZSIM_ACTUAL','ZSIM_VARIANCE','ZSIM_SETTLED','ZSIM_WIP','WAERS'],
      [[order.aufnr,c.plannedCost,actual,actual-c.plannedCost,settled,net(t.filter(l=>l.glAccount==='154')),C.currency]]),
    // One table with explicit HEADER / ITEM records, sharing a synthetic costing key.
    report('CK13N',['ZSIM_RECORD','KALNR','MATNR','WERKS','KSTAR','ZSIM_LOT_QTY','ZSIM_VALUE','ZSIM_UNIT_COST','WAERS'],[
      ['HEADER','SIM000000001',order.matnr,order.plant,'',p.orderQuantity,c.plannedCost,unit,C.currency],
      ...[['621',c.materialCost],['622',c.effectiveLaborCost],['627',c.effectiveMachineCost+c.variantAddonTotal]].map(([a,v]) =>
        ['ITEM','SIM000000001',order.matnr,order.plant,a,p.orderQuantity,v, p.orderQuantity > 0 ? Number(v)/p.orderQuantity : 0,C.currency])]),
    report('SUP01',['AUFNR','BELNR','BUZEI','TCODE','RACCT','ZSIM_SETTLED','WAERS','ZSIM_SOURCE_LINE'],
      settlements(t).map(l=>[order.aufnr,documentNumberOf(l.txnId),lineNumberOf(l.lineId),l.tCode,l.glAccount,l.crAmount-l.drAmount,C.currency,l.lineId]))
  ];
}

/** Reconciles EXPORTED rows, not just generator inputs. Throws on absence/duplicates/NaN.
 * Quantity/hour lists reconcile to events; pretending these total to FI would be a unit error.
 */
export function validateReportPack(pack: ReportPack, ev: ScenarioEvents, t: AcdocaLine[], c: MTOComputed): void {
  const fail = (msg: string): never => { throw new Error(`CONTROL: ${msg}`); };
  if (pack.length !== REPORT_IDS.length || new Set(pack.map(r=>r.reportId)).size !== REPORT_IDS.length) fail('report inventory');
  const get = (id: string) => pack.find(r=>r.reportId===id) ?? fail(`missing ${id}`);
  const value = (r: ReportOutput, row: string[], f: string) => {
    const i = r.columns.findIndex(c=>c.field===f);
    if(i<0 || row[i] === undefined) return fail(`${r.reportId}: missing ${f}`);
    return row[i];
  };
  const num = (r: ReportOutput,row: string[],f: string) => {
    const s=value(r,row,f), n=Number(s); if(!s.trim() || !Number.isFinite(n)) return fail(`${r.reportId}.${f}: invalid number`); return n;
  };
  const total = (id: string,f: string, filter?: (row: string[], r: ReportOutput)=>boolean) => {
    const r=get(id); return r.rows.filter(row=>!filter || filter(row,r)).reduce((s,row)=>s+num(r,row,f),0);
  };
  const eq = (a: number,b: number,label: string) => { if(Math.abs(a-b)>1e-7) fail(`${label}: ${a} != ${b}`); };
  for(const id of REPORT_IDS) {
    const r=get(id);
    if(new Set(r.columns.map(c=>c.field)).size!==r.columns.length || r.rows.some(row=>row.length!==r.columns.length)) fail(`${id}: shape`);
  }
  const gl=get('FAGLL03');
  eq(gl.rows.length,t.length,'GL count');
  for (const line of t) {
    const rows=gl.rows.filter(row=>value(gl,row,'BELNR')===documentNumberOf(line.txnId) && value(gl,row,'DOCLN')===lineNumberOf(line.lineId));
    eq(rows.length,1,'GL source key');
    eq(num(gl,rows[0],'HSL'),line.drAmount-line.crAmount,'GL source amount');
    for(const [f,v] of [['RACCT',line.glAccount],['WERKS',line.werks ?? ''],['BUDAT',C.postingDate],['RBUKRS',C.companyCode],['RLDNR',C.ledger]])
      if(value(gl,rows[0],f)!==v) fail(`GL.${f}`);
  }
  eq(total('FAGLL03','HSL', (row,r)=>num(r,row,'HSL')>=0),t.reduce((s,l)=>s+l.drAmount,0),'GL debit');
  eq(-total('FAGLL03','HSL', (row,r)=>num(r,row,'HSL')<0),t.reduce((s,l)=>s+l.crAmount,0),'GL credit');
  for(const id of ['MB51','COOIS_GOODS_MOVEMENTS']) {
    const r=get(id); eq(r.rows.length,ev.movements.length,`${id} count`);
    for(const m of ev.movements) {
      const rows=r.rows.filter(row=>value(r,row,'MBLNR')===m.mblnr && value(r,row,'ZEILE')===m.zeile);
      eq(rows.length,1,`${id} key`); const row=rows[0];
      eq(num(r,row,'MENGE'),m.quantity,`${id} quantity`); eq(num(r,row,'DMBTR'),m.value,`${id} value`);
      for(const [f,v] of [['BWART',m.bwart],['MATNR',m.matnr],['WERKS',m.plant],['MEINS',m.uom],['AUFNR',m.aufnr],['SHKZG',m.shkzg],['ZSIM_FI_BELNR',m.fiTxnId?documentNumberOf(m.fiTxnId):'']])
        if(value(r,row,f)!==v) fail(`${id}.${f}`);
    }
  }
  eq(get('COOIS_HEADER').rows.length,1,'header count');
  eq(total('COOIS_HEADER','GAMNG'),ev.order.plannedQty,'planned quantity');
  eq(total('COOIS_HEADER','WEMNG'),ev.order.deliveredQty,'delivered quantity');
  // Match every event row by its natural key, retaining quantity/UoM separation.
  const match = (id: string, key: string, rows: {key: string; numbers: Record<string,number>}[]) => {
    const r=get(id); eq(r.rows.length,rows.length,`${id} count`);
    for(const expected of rows) {
      const found=r.rows.filter(row=>value(r,row,key)===expected.key); eq(found.length,1,`${id} key`);
      for(const [f,n] of Object.entries(expected.numbers)) eq(num(r,found[0],f),n,`${id}.${f}`);
    }
  };
  match('COOIS_COMPONENTS','RSPOS',ev.components.map(v=>({key:v.rspos,numbers:{BDMNG:v.plannedQty,ENMNG:v.actualQty,ZSIM_PLAN_VALUE:v.plannedValue,ZSIM_ACTUAL_VALUE:v.actualValue}})));
  match('COOIS_OPERATIONS','VORNR',ev.operations.map(v=>({key:v.vornr,numbers:{ZSIM_SETUP_H:v.setupHours,ZSIM_PLAN_MACHINE_H:v.plannedMachineHours,ZSIM_PLAN_LABOR_H:v.plannedLaborHours,ZSIM_ACT_MACHINE_H:v.actualMachineHours,ZSIM_ACT_LABOR_H:v.actualLaborHours}})));
  match('COOIS_CONFIRMATIONS','RUECK',ev.confirmations.map(v=>({key:v.rueck,numbers:{GMNGA:v.yieldQty,ZSIM_LABOR_H:v.laborHours,ZSIM_MACHINE_H:v.machineHours,ZSIM_LABOR_VALUE:v.laborValue,ZSIM_OVERHEAD_VALUE:v.machineOverheadValue}})));
  match('KOB1','ZSIM_SOURCE_LINE',costs(t).map(l=>({key:l.lineId,numbers:{WTG001:l.drAmount-l.crAmount}})));
  match('SUP01','ZSIM_SOURCE_LINE',settlements(t).map(l=>({key:l.lineId,numbers:{ZSIM_SETTLED:l.crAmount-l.drAmount}})));
  eq(get('KKS1').rows.length,1,'KKS1 count');
  eq(total('KKS1','ZSIM_ACTUAL'),net(costs(t)),'KKS1 ↔ 154 actual');
  eq(total('KKS1','ZSIM_PLAN'),c.plannedCost,'KKS1 plan');
  eq(total('KKS1','ZSIM_VARIANCE'),net(costs(t))-c.plannedCost,'KKS1 variance');
  eq(total('KKS1','ZSIM_SETTLED'),-net(settlements(t)),'KKS1 settlement');
  eq(total('KKS1','ZSIM_WIP'),net(t.filter(l=>l.glAccount==='154')),'KKS1 WIP');
  const ck=get('CK13N'), header=ck.rows.filter(row=>value(ck,row,'ZSIM_RECORD')==='HEADER'), items=ck.rows.filter(row=>value(ck,row,'ZSIM_RECORD')==='ITEM');
  eq(header.length,1,'CK13N header'); eq(items.length,3,'CK13N item count'); eq(ck.rows.length,4,'CK13N count');
  eq(num(ck,header[0],'ZSIM_VALUE'),c.plannedCost,'CK13N plan');
  eq(items.reduce((s,row)=>s+num(ck,row,'ZSIM_VALUE'),0),c.plannedCost,'CK13N itemization');
  for(const [account,amount] of [['621',c.materialCost],['622',c.effectiveLaborCost],['627',c.effectiveMachineCost+c.variantAddonTotal]] as const) {
    const selected=items.filter(row=>value(ck,row,'KSTAR')===account); eq(selected.length,1,'CK cost element');
    eq(num(ck,selected[0],'ZSIM_VALUE'),amount,'CK component');
  }
  for(const row of ck.rows) { eq(num(ck,row,'ZSIM_LOT_QTY'),ev.order.plannedQty,'CK lot'); eq(num(ck,row,'ZSIM_UNIT_COST')*ev.order.plannedQty,num(ck,row,'ZSIM_VALUE'),'CK unit'); }
}
