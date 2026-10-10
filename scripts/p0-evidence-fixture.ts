import {readFileSync} from 'node:fs';
import {PRESET_SCENARIOS,type AcdocaLine} from '../src/types';
import {computeMTO,generateStepEntries} from '../src/utils/calculator';
import {exportReportSnapshot} from '../src/reports/snapshot';
import {adaptRaw} from '../src/adapters/framework';
import {reconcile} from '../src/controls/reconcile';
import {startCase} from '../src/controls/workflow';
import {buildManufacturingMart} from '../src/mart/manufacturing';
export const expectedCases=JSON.parse(readFileSync(new URL('./a0_expected.json',import.meta.url),'utf8'));
export async function evidenceCase(e:any){
 const preset=PRESET_SCENARIOS.find(p=>p.id===e.src)!;
 const params={...preset.params,stockType:e.stock,actualVariancePercent:e.pct,deliveredQuantity:Math.round(preset.params.orderQuantity*e.ratio)};
 const computed=computeMTO(params),table:AcdocaLine[]=[];
 for(let step=1;step<=7;step++)table.push(...generateStepEntries(step,params,computed,0,0,null).acdoca);
 const snapshots=await exportReportSnapshot(params,computed,table),quality=await Promise.all(snapshots.map(s=>adaptRaw(s.raw.bytes,s.manifest)));
 const work=startCase(reconcile(quality)),mart=await buildManufacturingMart(quality,work);
 return {snapshots,work,mart,params};
}
