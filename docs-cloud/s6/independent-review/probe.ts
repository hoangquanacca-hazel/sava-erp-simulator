import {writeFileSync} from 'node:fs';
import {PRESET_SCENARIOS} from '../../../src/types.ts';
import {computeMTO,generateStepEntries} from '../../../src/utils/calculator.ts';
import {exportReportSnapshot} from '../../../src/reports/snapshot.ts';
import {adaptRaw} from '../../../src/adapters/framework.ts';
import {reconcile} from '../../../src/controls/reconcile.ts';
import {startCase,appendEvent} from '../../../src/controls/workflow.ts';
import {buildManufacturingMart} from '../../../src/mart/manufacturing.ts';
import {createFacts,validateFacts} from '../../../src/mart/commentary.ts';
import {sha256Hex} from '../../../src/reports/core.ts';
import {createEvidencePack,verifyEvidencePack} from '../../../src/evidence/pack.ts';
const enc=(s:string)=>new TextEncoder().encode(s), results:any[]=[];
async function test(name:string,text:string,expected:string,hash?:string){const r=await verifyEvidencePack(text,hash);results.push({name,expected,actual:r.technicalStatus,reason:(r as any).reason,ok:r.technicalStatus===expected});}
async function rehash(e:any){const b=enc(JSON.stringify(e.payload));e.manifest.payloadBytes=b.length;e.manifest.payloadSha256=await sha256Hex(b);return JSON.stringify(e);}
async function fixture(id:string,ratio:number){const preset=PRESET_SCENARIOS.find(x=>x.id===id)!;const p={...preset.params,deliveredQuantity:Math.round(preset.params.orderQuantity*ratio)};const c=computeMTO(p),t:any[]=[];for(let i=1;i<=7;i++)t.push(...generateStepEntries(i,p,c,0,0,null).acdoca);const s=await exportReportSnapshot(p,c,t),q=await Promise.all(s.map(x=>adaptRaw(x.raw.bytes,x.manifest))),w=await appendEvent(startCase(reconcile(q)),'C02','EXPLAIN','QA synthetic','Evidence review only',['synthetic ref'],'2026-10-08T00:00:00.000Z'),m=await buildManufacturingMart(q,w);return{s,q,w,m};}
const f=await fixture('canon-frame',.5),pack=await createEvidencePack(f.s,f.w,f.m);
await test('baseline',pack.text,'PASS',pack.sha256);await test('wrongfilehash',pack.text,'BLOCKED','0'.repeat(64));await test('malformed','{}','BLOCKED');
const changes:any[]=[['version',(e:any)=>e.manifest.version='fake'],['extra manifest',(e:any)=>e.manifest.approval='APPROVED'],['payload approval',(e:any)=>e.payload.approval='APPROVED'],['factsvalue',(e:any)=>e.payload.facts[0].value++],['cleannumber',(e:any)=>e.payload.datasets[0].clean.rows[0].values.amount_lc++],['reportcount',(e:any)=>e.manifest.reportCount=12],['stalerun',(e:any)=>e.payload.runId='SIM-0000000000000000'],['controlchanged',(e:any)=>e.payload.controlCase.run.controls[0].businessStatus='APPROVED'],['eventnote',(e:any)=>e.payload.controlCase.events[0].note='forged'],['duplicate',(e:any)=>e.payload.datasets[0]=e.payload.datasets[1]],['claimapproval',(e:any)=>e.payload.facts[0].approval='APPROVED']];
for(const[name,fn]of changes){const e=JSON.parse(pack.text);fn(e);await test(name,await rehash(e),'BLOCKED');}
for(const action of ['APPROVE','REQUEST_REVIEW']){const e=JSON.parse(pack.text),w=e.payload.controlCase;w.events[0].action=action;const {hash,...event}=w.events[0];const runHash=await sha256Hex(enc(JSON.stringify(w.run)));w.events[0].hash=await sha256Hex(enc(JSON.stringify({runHash,...event})));const m=await buildManufacturingMart(f.q,w);e.payload.mart=m;e.payload.facts=createFacts(m);e.payload.c08=await validateFacts(m,e.payload.facts);await test('rehashed invalid workflow '+action,await rehash(e),'BLOCKED');}
const mutableS=structuredClone(f.s.map(x=>({raw:{text:x.raw.text},manifest:x.manifest}))),mutableW=structuredClone(f.w),mutableM=structuredClone(f.m);const pending=createEvidencePack(mutableS as any,mutableW,mutableM);mutableS[0].raw.text='modified';mutableW.events[0].note='modified';mutableM.metrics[0].value=0;await test('async isolation',(await pending).text,'PASS');
const z=await fixture('samsung-cover',0);const zp=await createEvidencePack(z.s,z.w,z.m);await test('zero delivery',zp.text,'PASS');results.push({name:'zero margin',ok:z.m.metrics.find(x=>x.id==='gross_margin')!.value===null});
writeFileSync(new URL('./probe-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
