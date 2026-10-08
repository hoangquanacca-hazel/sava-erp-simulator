import { sha256Hex } from '../reports/core';
import type { AdapterResult } from './framework';
export async function cleanExport(result:AdapterResult){
  if(result.status!=='PASS'||!result.clean)throw new Error('CLEAN is blocked by quality checks');
  const text=JSON.stringify(result.clean,null,2)+'\n';
  const bytes=new TextEncoder().encode(text);
  const fileName=`${result.clean.runId}_${result.clean.reportId}_CLEAN_v1.json`;
  return Object.freeze({fileName,text,manifest:Object.freeze({fileName,sha256:await sha256Hex(bytes),bytes:bytes.length,
    rowCount:result.clean.rows.length,rawHash:result.clean.rawHash,sourceHash:result.clean.sourceHash,
    schemaVersion:result.clean.schemaVersion,adapterVersion:result.clean.adapterVersion,
    label:'SIMULATED',reconciliationStatus:'PENDING_S4',businessAcceptance:'PENDING_SME'})});
}
