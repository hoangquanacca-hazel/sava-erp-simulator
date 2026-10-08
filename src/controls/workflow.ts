import {sha256Hex} from '../reports/core';
import type {ControlRun} from './reconcile';
export interface WorkflowEvent {sequence:number;controlId:string;action:'EXPLAIN'|'REQUEST_REVIEW';actor:string;note:string;evidence:string[];at:string;previousHash:string;hash:string;}
export interface ControlCase {run:ControlRun;events:readonly WorkflowEvent[];}
const deepFreeze=<T,>(v:T):T=>{if(v&&typeof v==='object'){Object.values(v).forEach(x=>deepFreeze(x));Object.freeze(v);}return v;};
export const startCase=(run:ControlRun):ControlCase=>deepFreeze({run:structuredClone(run),events:[]});
/** Append-only local explanations, NOT authentication or approval. Failed controls remain failed. */
export async function appendEvent(input:ControlCase,controlId:string,action:WorkflowEvent['action'],actor:string,note:string,evidence:string[],at=new Date().toISOString()):Promise<ControlCase>{
 const snapshot=structuredClone(input);
 if(snapshot.events.length>=1000)throw new Error('Local audit limit1000events; export before starting a new case.');
 const evidenceCopy=[...evidence];
 if(!snapshot.run.controls.some(c=>c.id===controlId)||!['EXPLAIN','REQUEST_REVIEW'].includes(action))throw new Error('Unknown control/action');
 if(!actor.trim()||actor.length>100||!note.trim()||note.length>2000||evidence.length<1||evidence.length>20||evidence.some(e=>!e.trim()||e.length>500))throw new Error('Cần tên, giải trình và tham chiếu bằng chứng; kiểm giới hạn độ dài.');
 const prior=snapshot.events.filter(e=>e.controlId===controlId);
 if(action==='REQUEST_REVIEW'&&prior.at(-1)?.action!=='EXPLAIN')throw new Error('Giải trình trước khi yêu cầu review.');
 if(!/^\d{4}-\d{2}-\d{2}T/.test(at)||!Number.isFinite(Date.parse(at)))throw new Error('Invalid timestamp');
 const payload={sequence:snapshot.events.length+1,controlId,action,actor:actor.trim(),note:note.trim(),evidence:evidenceCopy,at,previousHash:snapshot.events.at(-1)?.hash??''};
 const runHash=await verifySnapshot(snapshot);
 const hash=await sha256Hex(new TextEncoder().encode(JSON.stringify({runHash,...payload})));
 const event=Object.freeze({...payload,evidence:Object.freeze(payload.evidence) as unknown as string[],hash});
 return Object.freeze({run:deepFreeze(snapshot.run),events:deepFreeze([...snapshot.events,event])});
}
export async function exportControlCase(input:ControlCase){
 const snapshot=structuredClone(input);
 await verifySnapshot(snapshot);
 const text=JSON.stringify({...snapshot,approval:'NOT_APPROVED',persistence:'BROWSER_RAM_ONLY',identity:'SELF_DECLARED_NOT_AUTHENTICATED'},null,2)+'\n';
 return {fileName:`${snapshot.run.runId}_CONTROL_v1.json`,text,manifest:{sha256:await sha256Hex(new TextEncoder().encode(text)),bytes:new TextEncoder().encode(text).length,controlVersion:snapshot.run.version,sourceHash:snapshot.run.sourceHash,businessAcceptance:'PENDING_HUMAN_SME'}};
}

async function verifySnapshot(snapshot:ControlCase){
 if(!snapshot || Object.keys(snapshot).sort().join('|')!=='events|run'||!Array.isArray(snapshot.events))throw new Error('Control case shape invalid');
 if(snapshot.events.length>1000)throw new Error('Local audit limit1000events; export and start a new case.');
 const runHash=await sha256Hex(new TextEncoder().encode(JSON.stringify(snapshot.run)));
 let previous='';
 for(let i=0;i<snapshot.events.length;i++){
  const e=snapshot.events[i];
  if(!e||Object.keys(e).sort().join('|')!==['sequence','controlId','action','actor','note','evidence','at','previousHash','hash'].sort().join('|'))throw new Error('Audit event shape invalid');
  if(!snapshot.run.controls.some(c=>c.id===e.controlId)||!['EXPLAIN','REQUEST_REVIEW'].includes(e.action))throw new Error('Unknown control/action');
  if(typeof e.actor!=='string'||!e.actor.trim()||e.actor.length>100||typeof e.note!=='string'||!e.note.trim()||e.note.length>2000||!Array.isArray(e.evidence)||e.evidence.length<1||e.evidence.length>20||e.evidence.some(x=>typeof x!=='string'||!x.trim()||x.length>500))throw new Error('Audit required fields invalid');
  if(typeof e.at!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(e.at)||!Number.isFinite(Date.parse(e.at)))throw new Error('Invalid timestamp');
  if(e.action==='REQUEST_REVIEW'&&snapshot.events.slice(0,i).filter(x=>x.controlId===e.controlId).at(-1)?.action!=='EXPLAIN')throw new Error('Review requires prior explanation');
  if(e.sequence!==i+1||e.previousHash!==previous)throw new Error('Audit sequence/chain invalid');
  const payload={sequence:e.sequence,controlId:e.controlId,action:e.action,actor:e.actor,note:e.note,evidence:e.evidence,at:e.at,previousHash:e.previousHash};
  const hash=await sha256Hex(new TextEncoder().encode(JSON.stringify({runHash,...payload})));
  if(hash!==e.hash)throw new Error('Audit event/control snapshot was modified');previous=e.hash;
 }
 return runHash;
}
