import {adaptRaw} from '../adapters/framework';
import type {ControlCase} from '../controls/workflow';
import {buildManufacturingMart,type ManufacturingMart} from '../mart/manufacturing';
import {createFacts,validateFacts} from '../mart/commentary';
import {sha256Hex} from '../reports/core';
import type {exportReportSnapshot} from '../reports/snapshot';
type Snapshots=Awaited<ReturnType<typeof exportReportSnapshot>>;
export const MAX_PACK_BYTES=8*1024*1024;
const VERSION='sava-p0-evidence-1.0.0';
const enc=(s:string)=>new TextEncoder().encode(s);
const exact=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const freeze=<T,>(v:T):T=>{if(v&&typeof v==='object'){Object.values(v).forEach(x=>freeze(x));Object.freeze(v);}return v;};
/** Single generated JSON package, no uploads of SAP/raw exports, no financial engine changes. */
export async function createEvidencePack(snapshots:Snapshots,caseInput:ControlCase,martInput:ManufacturingMart){
 const raw= snapshots.map(s=>({rawText:s.raw.text,rawManifest:structuredClone(s.manifest)}));
 const work=structuredClone(caseInput),mart=structuredClone(martInput);
 const quality=await Promise.all(raw.map(s=>adaptRaw(enc(s.rawText),s.rawManifest)));
 const replay=await buildManufacturingMart(quality,work);
 if(!exact(replay,mart))throw new Error('Evidence pack: MART khác control/CLEAN snapshot.');
 const facts=createFacts(mart),c08=await validateFacts(mart,facts);
 const payload={version:VERSION,label:'SIMULATED',approval:'NOT_APPROVED',publicationStatus:'DIAGNOSTIC_ONLY',runId:mart.runId,sourceHash:mart.sourceHash,
  datasets:raw.map((r,i)=>({...r,clean:quality[i].clean})),controlCase:work,mart,facts,c08};
 const payloadText=JSON.stringify(payload),payloadBytes=enc(payloadText);
 const manifest={version:VERSION,payloadSha256:await sha256Hex(payloadBytes),payloadBytes:payloadBytes.length,reportCount:raw.length};
 const text=JSON.stringify({manifest,payload},null,2)+'\n',bytes=enc(text);
 if(bytes.length>MAX_PACK_BYTES)throw new Error('Evidence pack quá8MiB.');
 return freeze({fileName:`${mart.runId}_P0_EVIDENCE_v1.json`,text,bytes:bytes.length,sha256:await sha256Hex(bytes)});
}
const obj=(v:any)=>v&&typeof v==='object'&&!Array.isArray(v);
const keys=(v:any,expected:string[])=>obj(v)&&Object.keys(v).sort().join('|')===[...expected].sort().join('|');
/** Replays original simulated RAW through the existing adapters/controls/MART.
 * Rehashing a forged model isn't authentication. This proves consistency, not SME acceptance. */
export async function verifyEvidencePack(input:string|Uint8Array,expectedFileHash?:string){
 const bytes=typeof input==='string'?enc(input):new Uint8Array(input);
 if(bytes.length>MAX_PACK_BYTES)return {technicalStatus:'BLOCKED' as const,reason:'FILE_TOO_LARGE',fileSha256:null,bytes:bytes.length,businessAcceptance:'NOT_APPROVED' as const};
 const fileSha256=await sha256Hex(bytes);
 const blocked=(reason:string)=>({technicalStatus:'BLOCKED' as const,reason,fileSha256,bytes:bytes.length,businessAcceptance:'NOT_APPROVED' as const});
 try{
  if(bytes.length>MAX_PACK_BYTES)return blocked('FILE_TOO_LARGE');
  if(expectedFileHash&&expectedFileHash!==fileSha256)return blocked('EXPORTED_FILE_HASH_MISMATCH');
  if(bytes[0]===239&&bytes[1]===187&&bytes[2]===191)return blocked('UTF8_BOM_NOT_ALLOWED');
  const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  const envelope=JSON.parse(text);
  if(!keys(envelope,['manifest','payload']))return blocked('ENVELOPE_SHAPE');
  const {manifest:m,payload:p}=envelope;
  if(!keys(m,['version','payloadSha256','payloadBytes','reportCount'])||m.version!==VERSION)return blocked('MANIFEST_VERSION');
  if(!keys(p,['version','label','approval','publicationStatus','runId','sourceHash','datasets','controlCase','mart','facts','c08'])||p.version!==VERSION||p.label!=='SIMULATED'||p.approval!=='NOT_APPROVED'||p.publicationStatus!=='DIAGNOSTIC_ONLY')return blocked('PUBLICATION_SCOPE');
  const payloadBytes=enc(JSON.stringify(p));
  if(m.payloadBytes!==payloadBytes.length||m.payloadSha256!==await sha256Hex(payloadBytes))return blocked('PAYLOAD_HASH_MISMATCH');
  if(!Array.isArray(p.datasets)||p.datasets.length!==11||m.reportCount!==11)return blocked('REPORT_INVENTORY');
  if(!p.datasets.every((d:any)=>keys(d,['rawText','rawManifest','clean'])&&typeof d.rawText==='string'))return blocked('DATASET_SHAPE');
  if(p.datasets.some((d:any)=>d.rawManifest?.phase!=='GENERATED_RAW'||d.rawManifest?.legalApproval!=='pending'||d.rawManifest?.controls!=='technical-pass'||d.rawManifest?.adapterVersion!==null))return blocked('RAW_METADATA_SCOPE');
  const quality=await Promise.all(p.datasets.map((d:any)=>adaptRaw(enc(d.rawText),d.rawManifest)));
  if(quality.some((q:any,i:number)=>q.status!=='PASS'||!exact(q.clean,p.datasets[i].clean)))return blocked('RAW_CLEAN_MISMATCH');
  const mart=await buildManufacturingMart(quality,p.controlCase);
  if(!exact(mart,p.mart)||p.runId!==mart.runId||p.sourceHash!==mart.sourceHash)return blocked('CONTROL_MART_MISMATCH');
  const c08=await validateFacts(mart,p.facts);
  if(c08.numericTraceability!=='PASS'||!exact(c08,p.c08))return blocked('C08_MISMATCH');
  return {technicalStatus:'PASS' as const,fileSha256,bytes:bytes.length,runId:mart.runId,reportCount:11,controlCount:7,metricCount:12,businessAcceptance:'NOT_APPROVED' as const,
   comparedWithExport:!!expectedFileHash,businessGaps:mart.businessGaps};
 }catch(e){return blocked(e instanceof Error?e.message:'INVALID_PACKAGE');}
}
