import assert from 'node:assert/strict';
import {createEvidencePack,verifyEvidencePack,MAX_PACK_BYTES} from '../src/evidence/pack';
import {sha256Hex} from '../src/reports/core';
import {expectedCases,evidenceCase} from './p0-evidence-fixture';
let baseline:Awaited<ReturnType<typeof evidenceCase>>|null=null,pack:Awaited<ReturnType<typeof createEvidencePack>>|null=null;
for(const e of expectedCases){const c=await evidenceCase(e),p=await createEvidencePack(c.snapshots,c.work,c.mart),verified=await verifyEvidencePack(p.text,p.sha256);
 assert.equal(verified.technicalStatus,'PASS',JSON.stringify(verified));assert.equal(verified.businessAcceptance,'NOT_APPROVED');assert.equal(verified.fileSha256,p.sha256);assert.ok(Object.isFrozen(p));
 assert.equal(c.mart.metrics.find(m=>m.id==='gross_profit')!.value,e.gp911_credit);assert.equal(c.mart.metrics.find(m=>m.id==='wip')!.value,e.wip154_dr_minus_cr);
 assert.equal(p.sha256,(await createEvidencePack(c.snapshots,c.work,c.mart)).sha256,'deterministic package');
 if(!baseline){baseline=c;pack=p;}
}
async function changed(edit:(p:any)=>void,resign=true){const p=JSON.parse(pack!.text);edit(p);if(resign){const b=new TextEncoder().encode(JSON.stringify(p.payload));p.manifest.payloadSha256=await sha256Hex(b);p.manifest.payloadBytes=b.length;}return verifyEvidencePack(JSON.stringify(p));}
for(const edit of [(p:any)=>p.payload.datasets.pop(),(p:any)=>p.payload.datasets.push(p.payload.datasets[0]),(p:any)=>p.payload.datasets[0].rawText+='bad',(p:any)=>p.payload.datasets[0].clean.rows[0].values.amount_lc+=1,(p:any)=>p.payload.controlCase.run.controls[0].technicalStatus='FAIL',(p:any)=>p.payload.mart.metrics[0].value=0,(p:any)=>p.payload.facts[0].text='GiÃ¡ tÄƒng do supplier',(p:any)=>p.payload.facts[0].value++, (p:any)=>p.payload.approval='APPROVED',(p:any)=>p.payload.c08.businessStatus='APPROVED',(p:any)=>p.payload.extra='unexpected',(p:any)=>p.payload.facts[0].approval='APPROVED',(p:any)=>p.payload.controlCase.approval='APPROVED',(p:any)=>p.payload.datasets[0].rawManifest.legalApproval='approved',(p:any)=>p.payload.datasets[0].rawManifest.controls='FAIL',(p:any)=>p.payload.datasets[0].rawManifest.adapterVersion='forged'])assert.equal((await changed(edit)).technicalStatus,'BLOCKED');
assert.equal((await changed(p=>p.payload.datasets[0].rawText+='bad',false)).technicalStatus,'BLOCKED');
assert.equal((await verifyEvidencePack(pack!.text,'0'.repeat(64))).technicalStatus,'BLOCKED');
for(const text of ['{','null','[]',JSON.stringify({manifest:{},payload:{}}),'x'.repeat(MAX_PACK_BYTES+1)])assert.equal((await verifyEvidencePack(text)).technicalStatus,'BLOCKED');
const mutableWork=structuredClone(baseline!.work),mutableMart=structuredClone(baseline!.mart);const pending=createEvidencePack(baseline!.snapshots,mutableWork,mutableMart);mutableWork.run.sourceHash='a'.repeat(64);mutableMart.metrics[0].value=1;assert.equal((await pending).sha256,pack!.sha256);
const stale=structuredClone(baseline!.mart);stale.metrics[0].value=1;await assert.rejects(()=>createEvidencePack(baseline!.snapshots,baseline!.work,stale));
console.log('PASS S6:54 complete package/replay/deterministic roundtrips; unchanged GP/WIP oracle; signed RAW/CLEAN/CONTROL/MART/C08 mutation gates; missing/duplicate/malformed/oversize/publication/hash/stale/async checks; never human approved.');

const byteInput=new TextEncoder().encode(pack!.text);const bytePending=verifyEvidencePack(byteInput,pack!.sha256);byteInput.fill(0);assert.equal((await bytePending).technicalStatus,'PASS');
assert.equal((await verifyEvidencePack(new Uint8Array([0xff]))).technicalStatus,'BLOCKED');
assert.equal((await verifyEvidencePack(new Uint8Array([239,187,191,...new TextEncoder().encode(pack!.text)]))).technicalStatus,'BLOCKED');
