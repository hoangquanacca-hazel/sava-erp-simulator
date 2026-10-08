import type { AdapterResult, CleanDataset, CleanRow } from '../adapters/framework';
import registry from '../adapters/contracts.v1.json';
import policy from './policy.v1.json';
export {policy as CONTROL_POLICY};
export interface SourceRef {reportId:string;rawHash:string;rawLine:number;}
export interface Finding {code:string;message:string;refs:SourceRef[];left?:number;right?:number;delta?:number;}
export interface ControlResult {id:string;name:string;technicalStatus:'PASS'|'FAIL'|'BLOCKED';businessStatus:string;findings:Finding[];evidence:SourceRef[];metrics:Record<string,number>;}
export interface ControlRun {version:string;runId:string;sourceHash:string;label:'SIMULATED';businessAcceptance:'PENDING_HUMAN_SME';controls:ControlResult[];technicalStatus:'PASS'|'FAIL'|'BLOCKED';}
const settlementTransaction=(value:unknown)=>['VA88','VA88 / KKA2'].includes(String(value));
const names=['Material documents: COOIS ↔ MB51','Component aggregate ↔ goods issues','Order delivered ↔ goods receipts','SIM 154 collector ↔ KKS actual','SIM settlement ↔ GL + WIP','CK13N header ↔ additive items','Full-order cost-element variance bridge'];
const dependencies=[['MB51','COOIS_GOODS_MOVEMENTS'],['MB51','COOIS_COMPONENTS'],['MB51','COOIS_HEADER'],['KOB1','KKS1','FAGLL03'],['SUP01','KKS1','FAGLL03'],['CK13N','COOIS_HEADER'],['COOIS_COMPONENTS','COOIS_OPERATIONS','COOIS_CONFIRMATIONS','KOB1','KKS1','CK13N','COOIS_HEADER']];
const ref=(d:CleanDataset,r:CleanRow):SourceRef=>({reportId:d.reportId,...r.lineage});
const key=(r:CleanRow,fields:string[])=>JSON.stringify(fields.map(f=>r.values[f]));
const n=(r:CleanRow,f:string)=>{const v=r.values[f];if(typeof v!=='number'||!Number.isFinite(v))throw new Error(`Invalid numeric ${f}`);return v;};
const sum=(rows:readonly CleanRow[],f:string)=>rows.reduce((a,r)=>a+n(r,f),0);
const freeze=<T,>(v:T):T=>{if(v&&typeof v==='object'){Object.values(v).forEach(x=>freeze(x));Object.freeze(v);}return v;};
/** Trusted generated adapters, no import API. Verify schema/lineage and scope before any tieout.
 * Real business gates remain separate, regardless of diagnostic success. */
export function reconcile(input:readonly AdapterResult[]):ControlRun {
 const results=structuredClone(input.map(r=>({status:r.status,clean:r.clean,quality:r.quality}))); // private snapshot; do not clone RAW getters
 const datasets=new Map<string,CleanDataset>(),global:Finding[]=[];
 let runId='',sourceHash='';
 for(const result of results){
  const d=result.clean;
  if(result.status!=='PASS'||!d){global.push({code:'QUALITY_BLOCKED',message:'Có RAW chưa vượt quality gate.',refs:[]});continue;}
  if(datasets.has(d.reportId)){global.push({code:'DUPLICATE_REPORT',message:d.reportId,refs:[]});continue;}
  datasets.set(d.reportId,d);
  if(!runId){runId=d.runId;sourceHash=d.sourceHash;}
  if(d.runId!==runId||d.sourceHash!==sourceHash||!/^SIM-[a-f0-9]{16}$/.test(d.runId)||d.runId!==`SIM-${d.sourceHash.slice(0,16)}`||! /^[a-f0-9]{64}$/.test(d.sourceHash))global.push({code:'MIXED_SNAPSHOT',message:'Datasets không cùng source snapshot.',refs:[]});
  if(d.schemaVersion!=='sava-clean-v1'||d.adapterVersion!==registry.adapterVersion||d.rawHash!==result.quality.rawHash||! /^[a-f0-9]{64}$/.test(d.rawHash))global.push({code:'LINEAGE_INVALID',message:d.reportId,refs:[]});
  if(result.quality.acceptedRows!==d.rows.length||result.quality.sourceRows!==d.rows.length||result.quality.issues.some(i=>i.severity==='BLOCK'))global.push({code:'QUALITY_INVALID',message:d.reportId,refs:[]});
  const contract=Object.hasOwn(registry.reports,d.reportId)?registry.reports[d.reportId as keyof typeof registry.reports]:null;
  if(!contract){global.push({code:'PROFILE_UNSUPPORTED',message:d.reportId,refs:[]});continue;}
  const seen=new Set<string>();
  for(const r of d.rows){
   const refs=[ref(d,r)];
   if(r.lineage.rawHash!==d.rawHash||!Number.isInteger(r.lineage.rawLine)||r.lineage.rawLine<4)global.push({code:'LINEAGE_INVALID',message:'Row source invalid',refs});
   for(const f of contract.fields){const v=r.values[f.canonical];
    if(v===undefined||(f.required&&v===null)||(v!==null&&(['money','signed_money','quantity'].includes(f.type)?typeof v!=='number'||!Number.isFinite(v):typeof v!=='string')))global.push({code:'FIELD_INVALID',message:`${d.reportId}.${f.canonical}`,refs});
   }
   if(['MB51','COOIS_GOODS_MOVEMENTS'].includes(d.reportId)){
    const sign=r.values.debit_credit==='H'?-1:1;
    if(!['S','H'].includes(String(r.values.debit_credit))||r.values.signed_quantity!==Number(r.values.quantity)*sign||r.values.signed_amount_lc!==Number(r.values.amount_lc)*sign)global.push({code:'SIGNED_VALUE_INVALID',message:d.reportId,refs});
   }
   const k=key(r,contract.keys);if(seen.has(k))global.push({code:'DUPLICATE_KEY',message:d.reportId,refs});seen.add(k);
   for(const [f,v] of [['production_order','1000001'],['company_code','1000'],['plant','1100'],['local_currency','VND'],['ledger','0L'],['posting_date',policy.cutoff],['fiscal_year','2026'],['fiscal_period','009']] as const){
    if(r.values[f]!=null&&r.values[f]!==v)global.push({code:'SCOPE_MISMATCH',message:`${d.reportId}.${f}`,refs});
   }
  }
 }
 for(const id of Object.keys(registry.reports))if(!datasets.has(id))global.push({code:'MISSING_REPORT',message:id,refs:[]});
 const controls=names.map((name,i):ControlResult=>{
  const id=`C0${i+1}`,refs=dependencies[i].flatMap(r=>datasets.get(r)?.rows.map(row=>ref(datasets.get(r)!,row))??[]);
  return {id,name,technicalStatus:global.length?'BLOCKED':'PASS',businessStatus:(policy.businessBlocks as Record<string,string>)[id]??'PENDING_SME',findings:global.map(f=>({...f,refs:[...f.refs]})),evidence:refs,metrics:{}};
 });
 if(!global.length)for(let i=0;i<controls.length;i++){
  const out=controls[i];
  const get=(id:string)=>datasets.get(id)!;
  const fail=(code:string,message:string,refs:SourceRef[]=out.evidence)=>{out.findings.push({code,message,refs});out.technicalStatus='FAIL';};
  const eq=(left:number,right:number,message:string,qty=false,refs:SourceRef[]=out.evidence)=>{if(Math.abs(left-right)>(qty?policy.quantityTolerance:policy.moneyToleranceVND)){out.findings.push({code:'VALUE_MISMATCH',message,refs,left,right,delta:left-right});out.technicalStatus='FAIL';}};
  const unique=(rows:readonly CleanRow[],fields:string[],label:string)=>{const seen=new Set<string>();for(const r of rows){const k=key(r,fields);if(seen.has(k))fail('AMBIGUOUS_JOIN',label);seen.add(k);}};
  const single=(id:string)=>{const rows=get(id).rows;if(rows.length!==1)throw new Error(`${id}: expected one row`);return rows[0];};
  try {
   if(i===0){
    const a=get('MB51'),b=get('COOIS_GOODS_MOVEMENTS'),fields=['fiscal_year','material_document','material_document_item'];
    const left=new Map(a.rows.map(r=>[key(r,fields),r])),right=new Map(b.rows.map(r=>[key(r,fields),r]));
    for(const k of new Set([...left.keys(),...right.keys()])){const l=left.get(k),r=right.get(k),refs=[...(l?[ref(a,l)]:[]),...(r?[ref(b,r)]:[])];
     if(!l||!r){fail('ORPHAN_DOCUMENT',k,refs);continue;}
     for(const f of ['material','plant','base_uom','movement_type','production_order','sales_order','fi_document','debit_credit'])if(l.values[f]!==r.values[f])fail('DIMENSION_MISMATCH',f,refs);
     eq(n(l,'signed_quantity'),n(r,'signed_quantity'),'Signed quantity',true,refs);eq(n(l,'signed_amount_lc'),n(r,'signed_amount_lc'),'Signed amount',false,refs);
    }out.metrics.documents=left.size;
   }else if(i===1){
    const a=get('COOIS_COMPONENTS'),b=get('MB51'),issues=b.rows.filter(r=>r.values.movement_type==='261');
    const fields=['production_order','component_material','base_uom'];unique(a.rows,fields,'Không thể phân bổ nhiều reservation items cùng vật tư/UoM.');
    const grouped=new Map<string,CleanRow[]>();for(const r of issues){const k=JSON.stringify([r.values.production_order,r.values.material,r.values.base_uom]);grouped.set(k,[...(grouped.get(k)??[]),r]);}
    for(const r of a.rows){const k=key(r,fields),found=grouped.get(k);if(!found){fail('MISSING_ISSUE',k,[ref(a,r)]);continue;}eq(n(r,'withdrawn_quantity'),-sum(found,'signed_quantity'),'Unique material aggregate withdrawn',true,[ref(a,r),...found.map(x=>ref(b,x))]);eq(n(r,'actual_value'),sum(found,'amount_lc'),'Component actual value',false,[ref(a,r),...found.map(x=>ref(b,x))]);grouped.delete(k);}
    for(const rows of grouped.values())fail('ORPHAN_ISSUE','GI không có component.',rows.map(r=>ref(b,r)));
    out.metrics.componentGroups=a.rows.length;
   }else if(i===2){
    const h=single('COOIS_HEADER'),b=get('MB51'),gr=b.rows.filter(r=>r.values.movement_type==='101');
    for(const r of gr)for(const [f,hf] of [['material','material'],['production_order','production_order'],['base_uom','base_uom'],['sales_order','sales_order']])if(r.values[f]!==h.values[hf])fail('OUTPUT_SCOPE','GR output scope khác header.',[ref(b,r),ref(get('COOIS_HEADER'),h)]);
    eq(n(h,'delivered_quantity'),sum(gr,'signed_quantity'),'Zero opening + cumulative SIM GR',true);out.metrics.delivered=n(h,'delivered_quantity');
   }else if(i===3){
    const a=get('KOB1'),gl=get('FAGLL03'),k=single('KKS1');const keys=['accounting_document','line_item'];
    const g=new Map(gl.rows.map(r=>[key(r,keys),r]));const costKeys=new Set(a.rows.map(r=>key(r,keys)));
    for(const r of a.rows){const found=g.get(key(r,keys));if(!found){fail('ORPHAN_COST','KOB1 không có GL.',[ref(a,r)]);continue;}
     if(r.values.cost_element!=='154'||found.values.gl_account!=='154'||n(found,'amount_lc')<0)fail('COST_CLASSIFICATION','Profile chỉ accumulated debit154.',[ref(a,r),ref(gl,found)]);
     eq(n(r,'amount_lc'),n(found,'amount_lc'),'KOB1 GL line',false,[ref(a,r),ref(gl,found)]);
    }
    for(const r of gl.rows.filter(r=>r.values.gl_account==='154'&&!settlementTransaction(r.values.transaction)&&n(r,'amount_lc')>0))if(!costKeys.has(key(r,keys)))fail('UNCLASSIFIED_COST','Debit154 thiếu KOB1.',[ref(gl,r)]);
    eq(sum(a.rows,'amount_lc'),n(k,'actual_cost'),'SIM accumulated production cost');out.metrics.actual=sum(a.rows,'amount_lc');
   }else if(i===4){
    const a=get('SUP01'),gl=get('FAGLL03'),k=single('KKS1'),fields=['accounting_document','line_item'];const g=new Map(gl.rows.map(r=>[key(r,fields),r])),seen=new Set<string>();
    for(const r of a.rows){const sk=key(r,fields);seen.add(sk);const found=g.get(sk);if(!found){fail('ORPHAN_SETTLEMENT','SUP01 thiếu GL.',[ref(a,r)]);continue;}
     if(r.values.gl_account!=='154'||!settlementTransaction(r.values.transaction)||found.values.gl_account!==r.values.gl_account||found.values.transaction!==r.values.transaction)fail('SETTLEMENT_DIMENSION','Account/transaction khác profile.',[ref(a,r),ref(gl,found)]);
     eq(n(r,'settled_cost'),-n(found,'amount_lc'),'Signed settlement GL',false,[ref(a,r),ref(gl,found)]);
    }
    for(const r of gl.rows.filter(r=>settlementTransaction(r.values.transaction)&&r.values.gl_account==='154'))if(!seen.has(key(r,fields)))fail('UNALLOCATED_SETTLEMENT','GL settlement không có SUP01.',[ref(gl,r)]);
    eq(sum(a.rows,'settled_cost'),n(k,'settled_cost'),'KKS settled ↔ SUP01');eq(sum(gl.rows.filter(r=>r.values.gl_account==='154'),'amount_lc'),n(k,'wip_cost'),'Residual154 ↔ KKS WIP');
    out.metrics.settled=sum(a.rows,'settled_cost');out.metrics.wip=n(k,'wip_cost');
   }else if(i===5){
    const a=get('CK13N'),headers=a.rows.filter(r=>r.values.record_type==='HEADER'),items=a.rows.filter(r=>r.values.record_type==='ITEM'),h=single('COOIS_HEADER');
    if(headers.length!==1||items.length!==3||a.rows.length!==4)throw new Error('CK profile cần1header/3additive items');const head=headers[0];unique(items,['cost_element'],'Duplicate CK leaf');
    for(const r of a.rows){for(const f of ['cost_estimate','material','plant','lot_quantity','local_currency'])if(r.values[f]!==head.values[f])fail('ESTIMATE_SCOPE',f,[ref(a,r),ref(a,head)]);if(n(r,'lot_quantity')<=0)fail('LOT_INVALID','Lot phải >0.');eq(n(r,'unit_cost')*n(r,'lot_quantity'),n(r,'total_value'),'Lot × unit',true,[ref(a,r)]);}
    if(head.values.material!==h.values.material)fail('OUTPUT_SCOPE','Costing material khác order');eq(n(head,'lot_quantity'),n(h,'planned_quantity'),'Lot ↔ planned qty',true);eq(sum(items,'total_value'),n(head,'total_value'),'Additive leaves');out.metrics.standardCost=n(head,'total_value');
   }else{
    const comps=get('COOIS_COMPONENTS'),conf=get('COOIS_CONFIRMATIONS'),ops=get('COOIS_OPERATIONS'),ck=get('CK13N'),k=single('KKS1'),h=single('COOIS_HEADER');
    unique(ops.rows,['production_order','operation'],'Operation ambiguity');unique(conf.rows,['production_order','operation'],'Multiple confirmations outside SIM profile');
    const operations=new Map(ops.rows.map(r=>[key(r,['production_order','operation']),r]));
    for(const r of conf.rows){const sk=key(r,['production_order','operation']),op=operations.get(sk);if(!op){fail('ORPHAN_CONFIRMATION','Không có operation.',[ref(conf,r)]);continue;}eq(n(r,'labor_hours'),n(op,'actual_labor_hours'),'Labor hours',true,[ref(conf,r),ref(ops,op)]);eq(n(r,'machine_hours'),n(op,'actual_machine_hours'),'Machine hours',true,[ref(conf,r),ref(ops,op)]);operations.delete(sk);}
    for(const r of operations.values())fail('MISSING_CONFIRMATION','Operation chưa có confirmation.',[ref(ops,r)]);
    eq(sum(conf.rows,'yield_quantity'),n(h,'delivered_quantity'),'SIM yield ↔ delivered',true);
    const actuals=[sum(comps.rows,'actual_value'),sum(conf.rows,'labor_value'),sum(conf.rows,'overhead_value')];
    const plans=['621','622','627'].map(account=>{const rows=ck.rows.filter(r=>r.values.record_type==='ITEM'&&r.values.cost_element===account);if(rows.length!==1)throw new Error('Missing/duplicate cost-element leaf');return n(rows[0],'total_value');});
    eq(sum(comps.rows,'planned_value'),plans[0],'Component planned material');eq(actuals.reduce((s,x)=>s+x,0),n(k,'actual_cost'),'Actual classified elements ↔ KKS');eq(plans.reduce((s,x)=>s+x,0),n(k,'planned_cost'),'Target full-order ↔ CK');
    const deltas=actuals.map((v,j)=>v-plans[j]);const residual=n(k,'variance')-deltas.reduce((s,x)=>s+x,0);eq(residual,0,'Explicit residual');eq(n(k,'actual_cost')-n(k,'planned_cost'),n(k,'variance'),'Actual-target variance');
    out.metrics={materialDelta:deltas[0],laborDelta:deltas[1],overheadDelta:deltas[2],residual,fullOrderVariance:n(k,'variance')};
   }
  }catch(e){out.technicalStatus='BLOCKED';out.findings.push({code:'BASIS_MISSING',message:e instanceof Error?e.message:'Missing basis',refs:out.evidence});}
 }
 return freeze({version:policy.version,runId,sourceHash,label:'SIMULATED',businessAcceptance:'PENDING_HUMAN_SME',controls,technicalStatus:controls.some(c=>c.technicalStatus==='BLOCKED')?'BLOCKED':controls.some(c=>c.technicalStatus==='FAIL')?'FAIL':'PASS'} as ControlRun);
}
