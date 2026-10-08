import {writeFileSync} from 'node:fs';
import {PRESET_SCENARIOS} from 'file:///D:/sava-erp-simulator/src/types.ts';
import {computeMTO,generateStepEntries} from 'file:///D:/sava-erp-simulator/src/utils/calculator.ts';
import {exportReportSnapshot} from 'file:///D:/sava-erp-simulator/src/reports/snapshot.ts';
import {adaptRaw} from 'file:///D:/sava-erp-simulator/src/adapters/framework.ts';
import {reconcile} from 'file:///D:/sava-erp-simulator/src/controls/reconcile.ts';
import {startCase,appendEvent} from 'file:///D:/sava-erp-simulator/src/controls/workflow.ts';
import {buildManufacturingMart} from 'file:///D:/sava-erp-simulator/src/mart/manufacturing.ts';
import {createFacts,validateFacts} from 'file:///D:/sava-erp-simulator/src/mart/commentary.ts';
import {sha256Hex} from 'file:///D:/sava-erp-simulator/src/reports/core.ts';
import {createEvidencePack,verifyEvidencePack} from 'file:///D:/sava-erp-simulator/src/evidence/pack.ts';
const enc=(s:string)=>new TextEncoder().encode(s), results:any[]=[];
async function test(name:string,text:string|Uint8Array,expected:string,hash?:string){const r=await verifyEvidencePack(text,hash);results.push({name,expected,actual:r.technicalStatus,reason:(r as any).reason,ok:r.technicalStatus===expected});}
async function rehash(e:any){const b=enc(JSON.stringify(e.payload));e.manifest.payloadBytes=b.length;e.manifest.payloadSha256=await sha256Hex(b);return JSON.stringify(e);}
async function fixture(id:string,ratio:number){const preset=PRESET_SCENARIOS.find(x=>x.id===id)!;const p={...preset.params,deliveredQuantity:Math.round(preset.params.orderQuantity*ratio)};const c=computeMTO(p),t:any[]=[];for(let i=1;i<=7;i++)t.push(...generateStepEntries(i,p,c,0,0,null).acdoca);const s=await exportReportSnapshot(p,c,t),q=await Promise.all(s.map(x=>adaptRaw(x.raw.bytes,x.manifest))),w=await appendEvent(startCase(reconcile(q)),'C02','EXPLAIN','QA synthetic','Evidence review only',['synthetic ref'],'2026-10-08T00:00:00.000Z'),m=await buildManufacturingMart(q,w);return{s,q,w,m};}
const f=await fixture('canon-frame',.5),pack=await createEvidencePack(f.s,f.w,f.m); writeFileSync(new URL('./synthetic-evidence.json',import.meta.url),pack.text);
await test('baseline',pack.text,'PASS',pack.sha256);await test('wrongfilehash',pack.text,'BLOCKED','0'.repeat(64));await test('malformed','{}','BLOCKED');
const changes:any[]=[['version',(e:any)=>e.manifest.version='fake'],['extra manifest',(e:any)=>e.manifest.approval='APPROVED'],['payload approval',(e:any)=>e.payload.approval='APPROVED'],['factsvalue',(e:any)=>e.payload.facts[0].value++],['cleannumber',(e:any)=>e.payload.datasets[0].clean.rows[0].values.amount_lc++],['reportcount',(e:any)=>e.manifest.reportCount=12],['stalerun',(e:any)=>e.payload.runId='SIM-0000000000000000'],['controlchanged',(e:any)=>e.payload.controlCase.run.controls[0].businessStatus='APPROVED'],['eventnote',(e:any)=>e.payload.controlCase.events[0].note='forged'],['duplicate',(e:any)=>e.payload.datasets[0]=e.payload.datasets[1]],['claimapproval',(e:any)=>e.payload.facts[0].approval='APPROVED'],['rawlegalapproval',(e:any)=>e.payload.datasets[0].rawManifest.legalApproval='APPROVED'],['rawcontrol',(e:any)=>e.payload.datasets[0].rawManifest.controls='approved'],['rawadapter',(e:any)=>e.payload.datasets[0].rawManifest.adapterVersion='future']];
for(const[name,fn]of changes){const e=JSON.parse(pack.text);fn(e);await test(name,await rehash(e),'BLOCKED');}
for(const [name,change] of [['APPROVE',(w:any)=>w.events[0].action='APPROVE'],['REQUEST_REVIEW',(w:any)=>w.events[0].action='REQUEST_REVIEW'],['blankactor',(w:any)=>w.events[0].actor=''],['unknowncontrol',(w:any)=>w.events[0].controlId='C99'],['emptyrefs',(w:any)=>w.events[0].evidence=[]],['badtime',(w:any)=>w.events[0].at='bad'],['eventapproval',(w:any)=>w.events[0].approval='APPROVED'],['caseapproval',(w:any)=>w.approval='APPROVED']] as any[]){const e=JSON.parse(pack.text),w=e.payload.controlCase;change(w);const {hash,...event}=w.events[0];const runHash=await sha256Hex(enc(JSON.stringify(w.run)));w.events[0].hash=await sha256Hex(enc(JSON.stringify({runHash,...event})));try{const m=await buildManufacturingMart(f.q,w);e.payload.mart=m;e.payload.facts=createFacts(m);e.payload.c08=await validateFacts(m,e.payload.facts);await test('rehashed invalid workflow '+name,await rehash(e),'BLOCKED');}catch(error){results.push({name:'rehashed invalid workflow '+name,expected:'BLOCKED',actual:'BLOCKED_AT_MART',ok:true,reason:String(error)});}}
const mutableS=structuredClone(f.s.map(x=>({raw:{text:x.raw.text},manifest:x.manifest}))),mutableW=structuredClone(f.w),mutableM=structuredClone(f.m);const pending=createEvidencePack(mutableS as any,mutableW,mutableM);mutableS[0].raw.text='modified';mutableW.events[0].note='modified';mutableM.metrics[0].value=0;await test('async isolation',(await pending).text,'PASS');
const z=await fixture('samsung-cover',0);const zp=await createEvidencePack(z.s,z.w,z.m);await test('zero delivery',zp.text,'PASS');results.push({name:'zero margin',ok:z.m.metrics.find(x=>x.id==='gross_margin')!.value===null});
await test('bytes baseline',enc(pack.text),'PASS',pack.sha256);
const invalid=new Uint8Array([0xc0,0xaf]);await test('fatal UTF8',invalid,'BLOCKED');
const bom=new Uint8Array([0xef,0xbb,0xbf,...enc(pack.text)]);await test('BOM rejected',bom,'BLOCKED');
const bytes=enc(pack.text),bytePending=verifyEvidencePack(bytes,pack.sha256);bytes.fill(0);const byteResult=await bytePending;results.push({name:'byte async isolation',ok:byteResult.technicalStatus==='PASS'&&byteResult.fileSha256===pack.sha256});
await test('byte maximum',new Uint8Array(8*1024*1024+1),'BLOCKED');
for(const action of ['APPROVE','REQUEST_REVIEW']){const e=JSON.parse(pack.text),w=e.payload.controlCase;w.events[0].action=action;const {hash,...event}=w.events[0];const runHash=await sha256Hex(enc(JSON.stringify(w.run)));w.events[0].hash=await sha256Hex(enc(JSON.stringify({runHash,...event})));await test('direct verifier illegal workflow '+action,await rehash(e),'BLOCKED');}
writeFileSync(new URL('./retest-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));


