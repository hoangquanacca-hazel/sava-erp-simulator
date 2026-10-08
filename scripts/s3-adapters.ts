import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PRESET_SCENARIOS,type AcdocaLine} from '../src/types';
import {computeMTO,generateStepEntries} from '../src/utils/calculator';
import {exportReportSnapshot} from '../src/reports/snapshot';
import {sha256Hex} from '../src/reports/core';
import {adaptRaw,STAGES} from '../src/adapters/framework';
import {cleanExport} from '../src/adapters/exports';
const expected=JSON.parse(readFileSync(new URL('./a0_expected.json',import.meta.url),'utf8'));
assert.equal(expected.length,54);
let runs=0;
for(const e of expected){
 const preset=PRESET_SCENARIOS.find(p=>p.id===e.src)!;
 const p={...preset.params,stockType:e.stock,actualVariancePercent:e.pct,deliveredQuantity:Math.round(preset.params.orderQuantity*e.ratio)};
 const c=computeMTO(p),t:AcdocaLine[]=[];
 for(let st=1;st<=7;st++)t.push(...generateStepEntries(st,p,c,0,0,null).acdoca);
 const snapshots=await exportReportSnapshot(p,c,t);
 for(const {raw,manifest} of snapshots){
  const result=await adaptRaw(raw.bytes,manifest);
  assert.equal(result.status,'PASS',JSON.stringify(result.quality.issues));
  assert.ok(result.clean);assert.equal(result.clean.rows.length,manifest.rowCount);
  assert.deepEqual(result.quality.stages,STAGES);
  assert.equal(result.clean.rawHash,manifest.sha256);assert.ok(Object.isFrozen(result.clean.rows));
  if(result.clean.rows.length)assert.ok(Object.isFrozen(result.clean.rows[0].values));
  const copy=result.preservedRaw.bytes;copy[0]^=1;assert.equal(await sha256Hex(result.preservedRaw.bytes),manifest.sha256);
  const clean=await cleanExport(result);assert.equal(await sha256Hex(new TextEncoder().encode(clean.text)),clean.manifest.sha256);
  const bad=raw.bytes;bad[0]^=1;
  const rejected=await adaptRaw(bad,manifest);assert.equal(rejected.status,'BLOCKED');assert.equal(rejected.clean,null);
  await assert.rejects(()=>cleanExport(rejected));
  if(manifest.reportId==='KKS1')assert.equal(result.clean.rows[0].values.wip_cost,e.wip154_dr_minus_cr);
  if(manifest.reportId==='MB51'){
   const material=result.clean.rows.filter(r=>r.values.movement_type==='261');
   assert.equal(material.reduce((s,r)=>s+Number(r.values.amount_lc),0),e.cr152);
   if(e.stock==='Non-valuated')for(const row of result.clean.rows.filter(r=>r.values.movement_type!=='261')){assert.equal(row.values.amount_lc,0);assert.equal(row.values.fi_document,null);}
  }
  runs++;
 }
}
// Hand-authored source fixture independent of generators: keys retain leading zero, amounts/signs typed.
const title='MB51 — SIMULATED layout | SIMULATED | BUKRS 1000 | WERKS 1100 | TT99 | Signs: SHKZG/DRCRK or report contract';
const header='MJAHR\tMBLNR\tZEILE\tBUDAT\tBWART\tMATNR\tWERKS\tMENGE\tMEINS\tDMBTR\tWAERS\tSHKZG\tAUFNR\tKDAUF\tZSIM_FI_BELNR';
const row=['2026','5030000001','0001','2026-09-15','261','00000042','1100','1.25','KG','100','VND','H','1000001','00012345','4930000001'];
const text=[title,'',header,row.join('\t')].join('\n')+'\n';
const bytes=new TextEncoder().encode(text);
const manifest={reportId:'MB51',schemaVersion:'sim-report-v1',generatorVersion:'s2-pack-1.0.0',fileName:'MB51_SIMULATED.txt',sha256:await sha256Hex(bytes),bytes:bytes.length,rowCount:1,sourceLineCount:6,
 totals:{DMBTR:100},config:{companyCode:'1000',plant:'1100',ledger:'0L',standard:'TT99',label:'SIMULATED'},
 sourceHash:'a'.repeat(64),runId:'SIM-'+ 'a'.repeat(16),phase:'GENERATED_RAW',selection:{postingDate:'2026-09-15',scope:'provided-scenario-snapshot',stockType:'Valuated',material:'FG',deliveredQuantity:0}};
const good=await adaptRaw(bytes,manifest);assert.equal(good.status,'PASS');
assert.deepEqual(good.clean!.rows[0].values,{fiscal_year:'2026',material_document:'5030000001',material_document_item:'0001',posting_date:'2026-09-15',movement_type:'261',material:'00000042',plant:'1100',quantity:1.25,base_uom:'KG',amount_lc:100,local_currency:'VND',debit_credit:'H',production_order:'1000001',sales_order:'00012345',fi_document:'4930000001',signed_quantity:-1.25,signed_amount_lc:-100});
async function resign(text:string,overrides:Record<string,unknown>={}){
 const b=new TextEncoder().encode(text);return adaptRaw(b,{...manifest,sha256:await sha256Hex(b),bytes:b.length,...overrides});
}
async function blocked(text:string,code:string,overrides:Record<string,unknown>={}){
 const result=await resign(text,overrides);assert.equal(result.status,'BLOCKED');assert.equal(result.clean,null);
 assert.ok(result.quality.issues.some(i=>i.code===code),JSON.stringify(result.quality.issues));
 assert.equal(new TextDecoder().decode(result.preservedRaw.bytes),text);
}
await blocked(text.replace('MJAHR\tMBLNR','MBLNR\tMJAHR'),'HEADER_MISMATCH');
await blocked(text.replace('1.25','1,25'),'PARSE_LOCALE');
await blocked(text.replace('1.25','NaN'),'PARSE_LOCALE');
await blocked(text.replace('2026-09-15\t261','2026-02-30\t261'),'DATE_INVALID');
await blocked(text.replace('\tVND\t','\tUSD\t'),'CURRENCY_INVALID');
await blocked(text.replace('\tKG\t','\tUNKNOWN\t'),'UOM_UNSUPPORTED');
await blocked(text.replace('\tH\t','\tS\t'),'SIGN_INVALID');
await blocked(text.replace('\t261\t','\t262\t'),'MOVEMENT_UNSUPPORTED');
await blocked(text.replace('\t1100\t','\t1200\t'),'SCOPE_MISMATCH');

await blocked(text,'SELECTION_DELIVERY_MISMATCH',{selection:{...manifest.selection,deliveredQuantity:999}});
await blocked(text,'ROW_COUNT_MISMATCH',{rowCount:2});
await blocked(text+row.join('\t')+'\n','KEY_DUPLICATE',{rowCount:2,totals:{DMBTR:200}});
await blocked(text,'TOTAL_MISMATCH',{totals:{DMBTR:101}});
await blocked(text,'TOTAL_REQUIRED',{totals:{}});
await blocked(text,'REPORT_UNSUPPORTED',{reportId:'toString'});
await blocked(text,'REPORT_UNSUPPORTED',{reportId:'__proto__'});
await blocked(text,'VERSION_UNSUPPORTED',{schemaVersion:'future'});
await blocked(text,'PROVENANCE_INVALID',{sourceHash:'',runId:'SIM-unknown'});
await blocked(text,'MANIFEST_INVALID',{sourceLineCount:0});
await blocked(text,'FILE_NAME_MISMATCH',{fileName:'../outside.txt'});
await blocked(text.replace(/\n/g,'\r\n'),'FORMAT_UNSUPPORTED');
await blocked(text.slice(0,-1),'FORMAT_UNSUPPORTED');
await blocked(text.slice(0,-1)+'\tEXTRA\n','ROW_SHAPE');
await blocked(text.replace('SIMULATED layout','REAL layout'),'FORMAT_UNSUPPORTED');
const invalid=bytes.slice();invalid[0]=255;
const invalidResult=await adaptRaw(invalid,{...manifest,sha256:await sha256Hex(invalid)});assert.equal(invalidResult.quality.issues[0].code,'ENCODING_INVALID');
const oversized=await adaptRaw(new Uint8Array(1024*1024+1),manifest);assert.equal(oversized.quality.issues[0].code,'FILE_TOO_LARGE');
const mutated=structuredClone(manifest),input=bytes.slice();const pending=adaptRaw(input,mutated);
input[0]^=1;mutated.rowCount=999;assert.equal((await pending).status,'PASS','manifest and bytes isolated beforeawait');
const warning=await resign(text.replace('\t00000042\t','\t 00000042 \t'));assert.equal(warning.status,'PASS');assert.equal(warning.clean!.rows[0].values.material,'00000042');assert.ok(warning.quality.issues.some(i=>i.code==='WHITESPACE_TRIMMED'));
console.log(`PASS S3 ${runs}/594 generated report conversions, oracle WIP/material, hand-authored fixture, immutable lineage, malformed/negative cases, snapshot isolation.`);
