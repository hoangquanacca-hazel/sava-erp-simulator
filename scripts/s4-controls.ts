import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PRESET_SCENARIOS,type AcdocaLine} from '../src/types';
import {computeMTO,generateStepEntries} from '../src/utils/calculator';
import {exportReportSnapshot} from '../src/reports/snapshot';
import {adaptRaw,type AdapterResult} from '../src/adapters/framework';
import {reconcile,type ControlRun} from '../src/controls/reconcile';
import {startCase,appendEvent,exportControlCase} from '../src/controls/workflow';
import {sha256Hex} from '../src/reports/core';
const expected=JSON.parse(readFileSync(new URL('./a0_expected.json',import.meta.url),'utf8'));
let base:AdapterResult[]=[];let baseRun:ControlRun|null=null;
for(const e of expected){
 const preset=PRESET_SCENARIOS.find(p=>p.id===e.src)!;
 const p={...preset.params,stockType:e.stock,actualVariancePercent:e.pct,deliveredQuantity:Math.round(preset.params.orderQuantity*e.ratio)};
 const c=computeMTO(p),t:AcdocaLine[]=[];
 for(let st=1;st<=7;st++)t.push(...generateStepEntries(st,p,c,0,0,null).acdoca);
 const snapshots=await exportReportSnapshot(p,c,t);
 const quality=await Promise.all(snapshots.map(s=>adaptRaw(s.raw.bytes,s.manifest)));
 const run=reconcile(quality);
 assert.equal(run.technicalStatus,'PASS',JSON.stringify(run.controls));
 assert.equal(run.controls.length,7);assert.equal(run.businessAcceptance,'PENDING_HUMAN_SME');
 assert.equal(run.controls[1].businessStatus,'BLOCKED_RESERVATION_MAPPING');
 assert.equal(run.controls[4].businessStatus,'BLOCKED_RECEIVER_ELIGIBLE_VARIANCE');
 assert.equal(run.controls[4].metrics.wip,e.wip154_dr_minus_cr);
 assert.equal(run.controls[6].metrics.residual,0);assert.ok(run.controls.every(c=>c.evidence.length>0));
 assert.ok(Object.isFrozen(run.controls[0].evidence));
 if(!base.length){base=quality;baseRun=run;}
}
// Clone only CLEAN/quality, not typed RAW getters. Source fixtures retain lineage for adversarial checks.
const clone=()=>structuredClone(base.map(({status,clean,quality})=>({status,clean,quality}))) as AdapterResult[];
function edit(id:string,fn:(r:any)=>void){const q=clone();fn(q.find(r=>r.clean?.reportId===id)!);return reconcile(q);}
function failed(run:ControlRun,id:string){assert.notEqual(run.controls.find(c=>c.id===id)!.technicalStatus,'PASS');}
failed(edit('COOIS_GOODS_MOVEMENTS',r=>r.clean.rows[0].values.material_document='ORPHAN'),'C01');
failed(edit('COOIS_GOODS_MOVEMENTS',r=>{r.clean.rows[0].values.quantity+=1;r.clean.rows[0].values.signed_quantity-=1;}),'C01');
failed(edit('COOIS_COMPONENTS',r=>r.clean.rows[0].values.withdrawn_quantity+=1),'C02');
failed(edit('COOIS_COMPONENTS',r=>{const x=structuredClone(r.clean.rows[0]);x.values.reservation_item='9999';r.clean.rows.push(x);r.quality.acceptedRows++;r.quality.sourceRows++;}),'C02');
failed(edit('COOIS_HEADER',r=>r.clean.rows[0].values.delivered_quantity+=1),'C03');
failed(edit('KOB1',r=>r.clean.rows[0].values.accounting_document='ORPHAN'),'C04');
failed(edit('SUP01',r=>r.clean.rows[0].values.settled_cost+=1),'C05');
failed(edit('KKS1',r=>r.clean.rows[0].values.wip_cost+=1),'C05');
failed(edit('CK13N',r=>r.clean.rows[1].values.total_value+=1),'C06');
failed(edit('COOIS_CONFIRMATIONS',r=>r.clean.rows[0].values.labor_value+=1),'C07');
failed(edit('COOIS_CONFIRMATIONS',r=>r.clean.rows[0].values.operation='9999'),'C07');
failed(edit('KKS1',r=>r.clean.rows[0].values.variance+=1),'C07');
for(const mutate of [()=>reconcile(clone().slice(1)),()=>{const q=clone();return reconcile([...q,q[0]]);},()=>edit('MB51',r=>r.clean.sourceHash='b'.repeat(64)),()=>edit('MB51',r=>r.clean.rows[0].values.local_currency='USD'),()=>edit('MB51',r=>r.clean.rows[0].values.signed_quantity=0),()=>edit('KKS1',r=>r.clean.rows[0].values.actual_cost=null),()=>edit('KKS1',r=>r.clean.rows[0].values.actual_cost=NaN),()=>edit('MB51',r=>r.clean.rows[0].lineage.rawHash='b'.repeat(64)),()=>edit('MB51',r=>r.quality.acceptedRows=999)])assert.equal(mutate().technicalStatus,'BLOCKED');
const w=startCase(baseRun!);
await assert.rejects(()=>appendEvent(w,'C01','REQUEST_REVIEW','SME','review',['ref']));
await assert.rejects(()=>appendEvent(w,'C01','EXPLAIN','','note',['ref']));
await assert.rejects(()=>appendEvent(w,'C01','EXPLAIN','operator','note',[]));
const a=await appendEvent(w,'C01','EXPLAIN','operator','tieout details',['rawHash:line4'],'2026-10-08T00:00:00Z');
const b=await appendEvent(a,'C01','REQUEST_REVIEW','operator','review independent',['rawHash:line4'],'2026-10-08T00:00:01Z');
assert.equal(w.events.length,0);assert.equal(b.events.length,2);assert.equal(b.events[1].previousHash,b.events[0].hash);
assert.equal(b.run.businessAcceptance,'PENDING_HUMAN_SME');assert.ok(Object.isFrozen(b.events[0].evidence));
const mutable=structuredClone(a);const pending=appendEvent(mutable,'C02','EXPLAIN','operator','snapshot',['ref']);(mutable.events as any[]).length=0;mutable.run.sourceHash='c'.repeat(64);const isolated=await pending;
assert.equal(isolated.events.length,2);assert.equal(isolated.run.sourceHash,a.run.sourceHash);assert.equal(isolated.events[1].previousHash,a.events[0].hash);
const tampered=structuredClone(b);tampered.events[0].note='changed';await assert.rejects(()=>exportControlCase(tampered));await assert.rejects(()=>appendEvent(tampered,'C01','EXPLAIN','operator','changed',['ref']));
const over=structuredClone(b);(over.events as any[]).length=1000;await assert.rejects(()=>appendEvent(over,'C01','EXPLAIN','op','note',['ref']),/limit1000/);
const exportPromise=exportControlCase(structuredClone(b));const f=await exportPromise;assert.equal(await sha256Hex(new TextEncoder().encode(f.text)),f.manifest.sha256);assert.equal(JSON.parse(f.text).approval,'NOT_APPROVED');
const failure=edit('KKS1',r=>r.clean.rows[0].values.wip_cost+=1);
const explained=await appendEvent(startCase(failure),'C05','EXPLAIN','operator','reason',['ref']);assert.equal(explained.run.controls[4].technicalStatus,'FAIL');
console.log('PASS S4: 54×7 simulation tieouts; unchanged WIP oracle; orphan/duplicate/mixed/null/NaN/lineage/amount/quantity/hour mutations rejected; business gaps BLOCKED; explanation cannot approve; isolated hash-chain exports.');
