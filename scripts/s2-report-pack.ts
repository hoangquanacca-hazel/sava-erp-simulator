import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESET_SCENARIOS, type AcdocaLine } from '../src/types';
import { computeMTO, generateStepEntries } from '../src/utils/calculator';
import { buildScenarioEvents } from '../src/events/scenarioEvents';
import { buildManufacturingReports, validateReportPack, REPORT_IDS } from '../src/reports/manufacturing';
import { buildManifest, toRawExport, sha256Hex } from '../src/reports/core';
import { exportReportSnapshot } from '../src/reports/snapshot';

const oracle=JSON.parse(readFileSync(new URL('./a0_expected.json',import.meta.url),'utf8'));
assert.equal(oracle.length,54);
const mutationFields=['HSL','DMBTR','WEMNG','ENMNG','ZSIM_ACT_LABOR_H','GMNGA','DMBTR','WTG001','ZSIM_VARIANCE','ZSIM_VALUE','ZSIM_SETTLED'];
let mutations=0, exports=0;
for(const e of oracle){
  const preset=PRESET_SCENARIOS.find(p=>p.id===e.src); assert.ok(preset);
  const p={...preset.params,stockType:e.stock,actualVariancePercent:e.pct,deliveredQuantity:Math.round(preset.params.orderQuantity*e.ratio)};
  const c=computeMTO(p), t:AcdocaLine[]=[];
  for(let step=1;step<=7;step++)t.push(...generateStepEntries(step,p,c,0,0,null).acdoca);
  const ev=buildScenarioEvents(p,c,t), pack=buildManufacturingReports(ev,t,c,p);
  if (process.argv.includes('--tamper')) {
    pack[1].rows[0][9]=String(Number(pack[1].rows[0][9])+1);
    // Deliberately uncaught: command MUST exit nonzero.
  }
  validateReportPack(pack,ev,t,c);
  assert.deepEqual(pack.map(r=>r.reportId),REPORT_IDS);
  const kks=pack.find(r=>r.reportId==='KKS1')!;
  assert.equal(Number(kks.rows[0][kks.columns.findIndex(c=>c.field==='ZSIM_WIP')]),e.wip154_dr_minus_cr,'WIP vs independent oracle');
  const mb=pack.find(r=>r.reportId==='MB51')!;
  assert.equal(mb.rows.filter(r=>r[4]==='261').reduce((s,r)=>s+Number(r[9]),0),e.cr152,'material vs independent oracle');
  for(let i=0;i<pack.length;i++){
    const r=pack[i], raw=toRawExport(r), hash=await sha256Hex(raw.bytes);
    const bytes=raw.bytes; bytes[0]^=1;
    assert.equal(await sha256Hex(raw.bytes),hash,'copy-on-read RAW');
    assert.ok(Object.isFrozen(raw));
    const m=await buildManifest(r,raw,t.length,{});assert.ok(Object.isFrozen(m));assert.ok(Object.isFrozen(m.config));
    const bad=structuredClone(pack), row=bad[i].rows[0], col=r.columns.findIndex(c=>c.field===mutationFields[i]);
    if(row) row[col]=String(Number(row[col])+1);
    else bad[i].rows.push(r.columns.map(()=> '1')); // empty settlement must reject fabricated row
    assert.throws(()=>validateReportPack(bad,ev,t,c),undefined,`${e.src}/${r.reportId}: tamper not caught`); mutations++;
    assert.notEqual(await sha256Hex(toRawExport(bad[i]).bytes),hash);
    await assert.rejects(()=>buildManifest(bad[i],raw,t.length,{}));
    const truncated=structuredClone(pack); truncated.splice(i,1);
    assert.throws(()=>validateReportPack(truncated,ev,t,c));
    exports++;
  }
  const snap=await exportReportSnapshot(p,c,t);
  const mutableTable=structuredClone(t), mutableParams=structuredClone(p);
  const pending=exportReportSnapshot(mutableParams,c,mutableTable);
  mutableTable.pop(); mutableParams.componentCode='EDIT-DURING-EXPORT';
  assert.deepEqual((await pending).map(s=>s.manifest),snap.map(s=>s.manifest),'async snapshot isolation');
  const other=await exportReportSnapshot(p,c,t.map(l=>({...l,timestamp:'2099-01-01T00:00:00Z'})));
  assert.deepEqual(snap.map(s=>s.manifest),other.map(s=>s.manifest),'timestamp must not change output');
  const changed=structuredClone(t);changed[0].drAmount+=1;
  await assert.rejects(()=>exportReportSnapshot(p,c,changed),'unbalanced FI rejected');
}
console.log(`PASS Phase A: 54 cases × 11 reports = ${exports}; ${mutations} numeric/fabricated-row mutations rejected; missing reports rejected; independent oracle WIP/material checked; deterministic immutable RAW.`);
