import type {ManufacturingMart,Metric} from './manufacturing';
import {verifyMartSnapshot} from './manufacturing';
import type {SourceRef} from '../controls/reconcile';
import {sha256Hex} from '../reports/core';
export interface Fact {metricId:string;value:number|null;unit:string;basis:string;snapshotHash:string;text:string;refs:SourceRef[];}
export const displayMetric=(m:Pick<Metric,'value'|'unit'>)=>m.value===null?'Chưa đủ dữ liệu':`${m.value.toLocaleString('vi-VN',{maximumFractionDigits:m.unit==='PERCENT'?2:7})} ${m.unit==='PERCENT'?'%':m.unit}`;
const fact=(m:Metric,hash:string):Fact=>({metricId:m.id,value:m.value,unit:m.unit,basis:m.basis,snapshotHash:hash,text:`${m.label}: ${displayMetric(m)}. Cơ sở: ${m.basis}.${m.unavailableReason?` ${m.unavailableReason}`:''}`,refs:structuredClone(m.refs)});
/** Deterministic facts only; no AI call or invented root-cause explanation. */
export function createFacts(mart:ManufacturingMart):Fact[]{return mart.metrics.map(m=>fact(m,mart.snapshotHash));}
export async function validateFacts(input:ManufacturingMart,claims:readonly Fact[]){
 const mart=structuredClone(input),facts=structuredClone(claims);await verifyMartSnapshot(mart);
 const expected=createFacts(mart),seen=new Set<string>(),issues:string[]=[];
 if(!Array.isArray(facts))return {controlId:'C08',numericTraceability:'BLOCKED',businessStatus:'PENDING_APPROVED_MART',issues:['FACT_SHAPE']};
 if(facts.length!==expected.length)issues.push('FACT_INVENTORY');
 for(const c of facts){if(!c||Object.keys(c).sort().join('|')!==['metricId','value','unit','basis','snapshotHash','text','refs'].sort().join('|')){issues.push('FACT_SHAPE');continue;}const e=expected.find(x=>x.metricId===c.metricId);if(!e||seen.has(c.metricId)){issues.push('UNKNOWN_OR_DUPLICATE_METRIC');continue;}seen.add(c.metricId);
  if(c.value!==e.value||c.unit!==e.unit||c.basis!==e.basis||c.snapshotHash!==e.snapshotHash||c.text!==e.text||JSON.stringify(c.refs)!==JSON.stringify(e.refs))issues.push(`CLAIM_NOT_ENTAILED:${c.metricId}`);
 }
 return {controlId:'C08',numericTraceability:issues.length?'BLOCKED':'PASS',businessStatus:'PENDING_APPROVED_MART',issues};
}
export async function exportMart(input:ManufacturingMart){
 const mart=structuredClone(input);await verifyMartSnapshot(mart);const facts=createFacts(mart),c08=await validateFacts(mart,facts);
 if(c08.numericTraceability!=='PASS')throw new Error('C08 blocked');
 const text=JSON.stringify({mart,facts,c08},null,2)+'\n';const bytes=new TextEncoder().encode(text);
 const fileName=`${mart.runId}_MFG_MART_v1.json`;
 return {fileName,text,manifest:{fileName,sha256:await sha256Hex(bytes),bytes:bytes.length,snapshotHash:mart.snapshotHash,sourceHash:mart.sourceHash,controlCaseHash:mart.controlCaseHash,version:mart.version,publicationStatus:'DIAGNOSTIC_ONLY',businessAcceptance:'PENDING_HUMAN_SME',c08:'TECHNICAL_TRACEABILITY_ONLY'}};
}
