import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PRESET_SCENARIOS,type AcdocaLine} from '../src/types';
import {computeMTO,generateStepEntries} from '../src/utils/calculator';
import {exportReportSnapshot} from '../src/reports/snapshot';
import {adaptRaw,type AdapterResult} from '../src/adapters/framework';
import {reconcile} from '../src/controls/reconcile';
import {startCase,appendEvent,type ControlCase} from '../src/controls/workflow';
import {buildManufacturingMart,verifyMartSnapshot,type ManufacturingMart} from '../src/mart/manufacturing';
import {createFacts,validateFacts,exportMart} from '../src/mart/commentary';
import {sha256Hex} from '../src/reports/core';
const expected=JSON.parse(readFileSync(new URL('./a0_expected.json',import.meta.url),'utf8'));
let baseline:AdapterResult[]=[],work:ControlCase|null=null,mart:ManufacturingMart|null=null;
for(const e of expected){
 const preset=PRESET_SCENARIOS.find(p=>p.id===e.src)!;
 const p={...preset.params,stockType:e.stock,actualVariancePercent:e.pct,deliveredQuantity:Math.round(preset.params.orderQuantity*e.ratio)};
 const c=computeMTO(p),t:AcdocaLine[]=[];
 for(let st=1;st<=7;st++)t.push(...generateStepEntries(st,p,c,0,0,null).acdoca);
 const snapshots=await exportReportSnapshot(p,c,t),q=await Promise.all(snapshots.map(s=>adaptRaw(s.raw.bytes,s.manifest)));
 const w=startCase(reconcile(q)),m=await buildManufacturingMart(q,w),metric=(id:string)=>m.metrics.find(x=>x.id===id)!;
 assert.equal(m.publicationStatus,'DIAGNOSTIC_ONLY');assert.equal(m.businessAcceptance,'PENDING_HUMAN_SME');
 assert.equal(metric('standard_cost').value,e.P);assert.equal(metric('actual_cost').value,e.actual);assert.equal(metric('variance').value,e.delta);
 assert.equal(metric('wip').value,e.wip154_dr_minus_cr);assert.equal(metric('revenue').value,e.revenue_recognized);assert.equal(metric('gross_profit').value,e.gp911_credit);assert.equal(metric('cogs').value,e.revenue_recognized-e.gp911_credit);
 assert.deepEqual(m.costElements.map(x=>x.delta),[e.dM,e.dL,e.dO]);assert.equal(metric('variance_residual').value,0);
 if(e.ratio===0){assert.equal(metric('gross_margin').value,null);assert.ok(metric('gross_margin').unavailableReason);}
 assert.equal(metric('variance').basis,'FULL_ORDER');assert.equal(metric('cogs').basis,'POSTED_DELIVERED');
 assert.equal(m.sourceDatasets.length,11);assert.ok(m.businessGaps.filter(g=>g.status.startsWith('BLOCKED')).length===4);assert.ok(Object.isFrozen(m.metrics[0].refs));
 const facts=createFacts(m);assert.equal((await validateFacts(m,facts)).numericTraceability,'PASS');await verifyMartSnapshot(m);
 const f=await exportMart(m);assert.equal(await sha256Hex(new TextEncoder().encode(f.text)),f.manifest.sha256);assert.equal(JSON.parse(f.text).c08.businessStatus,'PENDING_APPROVED_MART');
 if(!baseline.length){baseline=q;work=w;mart=m;}
}
const qclone=()=>structuredClone(baseline.map(({status,clean,quality})=>({status,clean,quality}))) as AdapterResult[];
for(const change of [(q:AdapterResult[])=>q.pop(),(q:AdapterResult[])=>{q[0].status='BLOCKED';},(q:AdapterResult[])=>{q.find(r=>r.clean?.reportId==='KKS1')!.clean!.rows[0].values as any;const r=q.find(r=>r.clean?.reportId==='KKS1')!;(r.clean!.rows[0].values as any).wip_cost+=1;}]){const q=qclone();change(q);await assert.rejects(()=>buildManufacturingMart(q,work!));}
const stale=structuredClone(work!);stale.run.controls[0].businessStatus='APPROVED';await assert.rejects(()=>buildManufacturingMart(baseline,stale));
const mutable=qclone(),mutableWork=structuredClone(work!);const pending=buildManufacturingMart(mutable,mutableWork);mutable[0].clean!.sourceHash='a'.repeat(64);mutableWork.run.sourceHash='b'.repeat(64);const isolated=await pending;assert.equal(isolated.sourceHash,mart!.sourceHash);assert.equal(isolated.snapshotHash,mart!.snapshotHash);
for(const change of [(f:any[])=>f[0].value++, (f:any[])=>f[0].unit='USD',(f:any[])=>f[0].basis='DELIVERED',(f:any[])=>f[0].text='Giá nguyên liệu tăng do nhà cung cấp.',(f:any[])=>f[0].refs=[],(f:any[])=>f[0].snapshotHash='0'.repeat(64),(f:any[])=>f.push(f[0]),(f:any[])=>f.pop()]){const facts=createFacts(mart!);change(facts);assert.equal((await validateFacts(mart!,facts)).numericTraceability,'BLOCKED');}
const damaged=structuredClone(mart!);damaged.metrics[0].value=1;await assert.rejects(()=>exportMart(damaged));
const audited=await appendEvent(work!,'C02','EXPLAIN','QA synthetic','review requested',['source ref']);const tampered=structuredClone(audited);tampered.events[0].note='tampered';await assert.rejects(()=>buildManufacturingMart(baseline,tampered));
const updated=await buildManufacturingMart(baseline,audited);assert.notEqual(updated.snapshotHash,mart!.snapshotHash);assert.deepEqual(updated.metrics,mart!.metrics);
console.log('PASS S5:54 oracle snapshots/648metrics; typed null zero-revenue; full-order vs posted-delivered basis; no closing double count; blocked/stale/audit mutation rejection;8 C08 claim corruptions; hash/frozen/async isolation; always DIAGNOSTIC_ONLY.');
