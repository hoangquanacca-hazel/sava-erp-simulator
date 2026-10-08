import registry from './contracts.v1.json';
import { SIM_CONFIG } from '../config/simConfig';
import { sha256Hex } from '../reports/core';

type Value=string|number|null;
interface Field {source:string;canonical:string;type:string;required:boolean;}
interface Contract {id:string;title:string;keys:string[];fields:Field[];}
const contracts=registry.reports as Record<string,Contract>;
export const ADAPTER_VERSION=registry.adapterVersion;
export const STAGES=['LOAD','DETECT FORMAT','VALIDATE HEADER','PRESERVE RAW','STANDARDIZE','VALIDATE','OUTPUT CLEAN','QUALITY LOG'] as const;
export interface QualityIssue {code:string;message:string;severity:'BLOCK'|'WARN';row?:number;column?:string;}
export interface CleanRow {values:Readonly<Record<string,Value>>;lineage:{rawHash:string;rawLine:number};}
export interface CleanDataset {reportId:string;schemaVersion:string;adapterVersion:string;sourceHash:string;runId:string;rawHash:string;rows:readonly CleanRow[];}
export interface AdapterResult {
  status:'PASS'|'BLOCKED';clean:CleanDataset|null;
  preservedRaw:{readonly fileName:string;readonly sha256:string;readonly bytes:Uint8Array};
  quality:{adapterVersion:string;rawHash:string;sourceRows:number|null;acceptedRows:number;stages:readonly string[];issues:readonly QualityIssue[];totals:Record<string,number>};
}
const MAX_BYTES=1024*1024,MAX_ROWS=5000;
function freeze<T>(value:T):T {
  if(value && typeof value==='object' && Object.isFrozen(value))return value;
  if(value && typeof value==='object'){Object.values(value).forEach(v=>freeze(v));Object.freeze(value);}return value;
}
function object(v:unknown):v is Record<string,unknown>{return !!v && typeof v==='object' && !Array.isArray(v);}
function dateValid(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
/** Only generated simulated UTF8/TSV profile. No uploads/network/storage/locale guessing. */
export async function adaptRaw(input:Uint8Array, manifestInput:unknown):Promise<AdapterResult>{
  const bytes=input.slice(); // Retain before first await, including rejected files.
  let manifestCopy:unknown;
  try{manifestCopy=structuredClone(manifestInput);}catch{manifestCopy=null;}
  const rawHash=await sha256Hex(bytes);
  const issues:QualityIssue[]=[],stages:string[]=['LOAD'];let sourceRows:number|null=null;
  let reportId='',sourceHash='',runId='',fileName='UNKNOWN_SIMULATED.txt';
  let rows:CleanRow[]=[];const totals:Record<string,number>={};
  const issue=(code:string,message:string,row?:number,column?:string)=>{issues.push({code,message,severity:'BLOCK',...(row===undefined?{}:{row}),...(column?{column}:{})});};
  const finish=():AdapterResult=>{
    if(!stages.includes('PRESERVE RAW'))stages.push('PRESERVE RAW'); // quarantine evidence survives early failure
    stages.push('QUALITY LOG');
    const blocked=issues.some(i=>i.severity==='BLOCK');
    const raw=Object.freeze({fileName,sha256:rawHash,get bytes(){return bytes.slice();}});
    return freeze({status:blocked?'BLOCKED':'PASS',clean:blocked?null:{reportId,schemaVersion:'sava-clean-v1',adapterVersion:ADAPTER_VERSION,sourceHash,runId,rawHash,rows},
      preservedRaw:raw,quality:{adapterVersion:ADAPTER_VERSION,rawHash,sourceRows,acceptedRows:blocked?0:rows.length,stages,issues,totals}} as AdapterResult);
  };
  if(bytes.length>MAX_BYTES){issue('FILE_TOO_LARGE','Giới hạn RAW mô phỏng 1 MiB.');return finish();}
  let m:Record<string,unknown>;
  try{if(!object(manifestCopy))throw new Error();m=manifestCopy;}catch{issue('MANIFEST_INVALID','Manifest phải là JSON object.');return finish();}
  if(typeof m.fileName==='string')fileName=m.fileName;
  if(typeof m.reportId==='string')reportId=m.reportId;
  if(typeof m.sourceHash==='string')sourceHash=m.sourceHash;
  if(typeof m.runId==='string')runId=m.runId;
  if(m.sha256!==rawHash || m.bytes!==bytes.length){issue('HASH_MISMATCH','RAW bị thay đổi hoặc manifest không khớp bytes/hash.');return finish();}
  if(m.schemaVersion!==registry.schemaVersion || m.generatorVersion!==registry.generatorVersion){issue('VERSION_UNSUPPORTED','Phiên bản nguồn chưa có adapter.');return finish();}
  const contract=Object.hasOwn(contracts,reportId)?contracts[reportId]:undefined;
  if(!contract){issue('REPORT_UNSUPPORTED','Báo cáo chưa có adapter mô phỏng.');return finish();}
  if(!/^[a-f0-9]{64}$/.test(sourceHash)||runId!==`SIM-${sourceHash.slice(0,16)}`||m.phase!=='GENERATED_RAW'){
    issue('PROVENANCE_INVALID','Thiếu lineage/sourceHash/runId hoặc RAW phase không hợp lệ.');return finish();}
  if(!object(m.config)||m.config.companyCode!==SIM_CONFIG.companyCode||m.config.plant!==SIM_CONFIG.plant||m.config.ledger!==SIM_CONFIG.ledger||m.config.standard!=='TT99'||m.config.label!=='SIMULATED'){
    issue('SCOPE_MISMATCH','Manifest không thuộc cấu hình mô phỏng đã chốt.');return finish();}
  if(!object(m.selection)||m.selection.postingDate!==SIM_CONFIG.postingDate||!['Valuated','Non-valuated'].includes(String(m.selection.stockType))){issue('SCOPE_MISMATCH','Selection chưa được hỗ trợ.');return finish();}
  if(!Number.isSafeInteger(m.rowCount)||Number(m.rowCount)<0||!object(m.totals)){issue('MANIFEST_INVALID','Row count/totals thiếu hoặc sai kiểu.');return finish();}
  const selection=m.selection as Record<string,unknown>;
  if(!Number.isSafeInteger(m.sourceLineCount)||Number(m.sourceLineCount)<=0){issue('MANIFEST_INVALID','Source line count không hợp lệ.');return finish();}
  if(typeof selection.material!=='string'||!selection.material||typeof selection.deliveredQuantity!=='number'||!Number.isFinite(selection.deliveredQuantity)||selection.deliveredQuantity<0){issue('SCOPE_MISMATCH','Material/delivery selection thiếu hoặc sai.');return finish();}
  const expectedName=`${reportId}_SIMULATED.txt`;
  if(fileName!==expectedName&&fileName!==`${runId}_${expectedName}`){issue('FILE_NAME_MISMATCH','Tên RAW không khớp profile/scenario.');return finish();}
  const requiredTotals=reportId==='CK13N'?['headerValue','itemValue']:contract.fields.filter(f=>['money','signed_money'].includes(f.type)).map(f=>f.source);
  if(requiredTotals.some(key=>typeof (m.totals as Record<string,unknown>)[key]!=='number')){issue('TOTAL_REQUIRED','Manifest thiếu totals bắt buộc của profile.');return finish();}
  stages.push('DETECT FORMAT');
  let text:string;
  try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{issue('ENCODING_INVALID','RAW không phải UTF-8.');return finish();}
  if(bytes[0]===239&&bytes[1]===187&&bytes[2]===191 || text.includes('\r') || text.includes('\0') || !text.endsWith('\n')){
    issue('FORMAT_UNSUPPORTED','Profile chỉ UTF-8 không BOM, LF và newline cuối.');return finish();}
  const lines=text.slice(0,-1).split('\n');
  const banner=`${contract.title} | SIMULATED | BUKRS ${SIM_CONFIG.companyCode} | WERKS ${SIM_CONFIG.plant} | TT99 | Signs: SHKZG/DRCRK or report contract`;
  if(lines[0]!==banner||lines[1]!==''){issue('FORMAT_UNSUPPORTED','Banner/định dạng không thuộc simulator profile.');return finish();}
  stages.push('VALIDATE HEADER');
  if(lines[2]!==contract.fields.map(f=>f.source).join('\t')){issue('HEADER_MISMATCH','Cột thiếu/thừa/đổi thứ tự hoặc không thuộc profile.');return finish();}
  stages.push('PRESERVE RAW');sourceRows=lines.length-3;
  if(sourceRows!==m.rowCount||sourceRows>MAX_ROWS){issue('ROW_COUNT_MISMATCH','Số dòng RAW/manifest không khớp hoặc vượt 5000.');return finish();}
  stages.push('STANDARDIZE');
  const seen=new Set<string>();
  lines.slice(3).forEach((line,i)=>{
    const rawLine=i+4,cells=line.split('\t'),values:Record<string,Value>={};
    if(cells.length!==contract.fields.length){issue('ROW_SHAPE','Số cột không khớp header.',rawLine);return;}
    contract.fields.forEach((f,j)=>{
      const original=cells[j],s=original.trim();
      if(original!==s)issues.push({code:'WHITESPACE_TRIMMED',message:'CLEAN bỏ khoảng trắng ngoài; RAW được giữ nguyên.',severity:'WARN',row:rawLine,column:f.source});
      if(s===''){values[f.canonical]=null;if(f.required)issue('REQUIRED_EMPTY','Thiếu trường bắt buộc.',rawLine,f.source);return;}
      if(['money','signed_money','quantity'].includes(f.type)){
        if(!/^-?\d+(?:\.\d+)?$/.test(s)){issue('PARSE_LOCALE','Chỉ chấp nhận số thập phân dấu chấm, không phân cách hàng nghìn.',rawLine,f.source);values[f.canonical]=null;return;}
        const n=Number(s);
        if(!Number.isFinite(n)||Math.abs(n)>Number.MAX_SAFE_INTEGER||(f.type!=='quantity'&&!Number.isSafeInteger(n))||(f.type!=='signed_money'&&n<0))issue('TYPE_INVALID','Số ngoài phạm vi/độ chính xác hoặc dấu chưa hỗ trợ.',rawLine,f.source);
        values[f.canonical]=n;
      }else{
        values[f.canonical]=s;
        if(f.type==='date'&&!dateValid(s))issue('DATE_INVALID','Ngày ISO không hợp lệ.',rawLine,f.source);
      }
    });
    const key=JSON.stringify(contract.keys.map(k=>values[k]));
    for(const k of contract.keys)if(values[k]===null&&!(reportId==='CK13N'&&k==='cost_element'&&values.record_type==='HEADER'))issue('KEY_EMPTY','Khóa thiếu.',rawLine,k);
    if(seen.has(key))issue('KEY_DUPLICATE','Trùng khóa nghiệp vụ trong scenario.',rawLine);seen.add(key);
    if(['COOIS_HEADER','CK13N'].includes(reportId) && values.material!==selection.material)issue('SCOPE_MISMATCH','Material khác selection.',rawLine);
    if(values.production_order!==undefined && values.production_order!==SIM_CONFIG.productionOrder)issue('SCOPE_MISMATCH','Order khác profile.',rawLine);
    if(values.local_currency!==undefined && values.local_currency!=='VND')issue('CURRENCY_INVALID','Chỉ hỗ trợ VND.',rawLine);
    if(values.plant!=null && values.plant!==SIM_CONFIG.plant)issue('SCOPE_MISMATCH','Plant khác manifest.',rawLine);
    if(values.posting_date!=null && values.posting_date!==SIM_CONFIG.postingDate)issue('SCOPE_MISMATCH','Ngày khác selection.',rawLine);
    if(values.company_code!=null && values.company_code!==SIM_CONFIG.companyCode)issue('SCOPE_MISMATCH','Company khác manifest.',rawLine);
    if(values.ledger!=null && values.ledger!==SIM_CONFIG.ledger)issue('SCOPE_MISMATCH','Ledger khác manifest.',rawLine);
    if(values.fiscal_year!=null && values.fiscal_year!==SIM_CONFIG.postingDate.slice(0,4))issue('SCOPE_MISMATCH','Năm tài chính khác profile.',rawLine);
    if(values.fiscal_period!=null && values.fiscal_period!==SIM_CONFIG.postingDate.slice(5,7).padStart(3,'0'))issue('SCOPE_MISMATCH','Kỳ khác profile.',rawLine);
    if(values.base_uom!=null && !['KG','PC','CÁI','SET','H','LOT'].includes(String(values.base_uom)))issue('UOM_UNSUPPORTED','UoM chưa có trong profile; không tự chuyển đổi.',rawLine);
    if(values.debit_credit!=null && !['S','H'].includes(String(values.debit_credit)))issue('SIGN_INVALID','Chỉ S/H trong profile.',rawLine);
    if(reportId==='FAGLL03' && typeof values.amount_lc==='number' && values.debit_credit!==(values.amount_lc>=0?'S':'H'))issue('SIGN_INVALID','Dấu HSL không khớp DRCRK.',rawLine);
    if(['MB51','COOIS_GOODS_MOVEMENTS'].includes(reportId)){
      if(!['261','101','601'].includes(String(values.movement_type)))issue('MOVEMENT_UNSUPPORTED','Movement chưa được simulator profile hỗ trợ.',rawLine);
      if(values.debit_credit!==(values.movement_type==='101'?'S':'H'))issue('SIGN_INVALID','Movement không khớp hướng nhập/xuất.',rawLine);
      if(selection.stockType==='Non-valuated' && values.movement_type!=='261' && (values.amount_lc!==0||values.fi_document!==null))issue('NONVALUATED_FI','101/601 không định giá chỉ số lượng, không FI.',rawLine);
      values.signed_quantity=values.debit_credit==='H'?-Number(values.quantity):values.quantity;
      values.signed_amount_lc=values.debit_credit==='H'?-Number(values.amount_lc):values.amount_lc;
    }
    rows.push({values,lineage:{rawHash,rawLine}});
  });
  stages.push('VALIDATE');
  const delivery=Number(selection.deliveredQuantity);
  if(reportId==='COOIS_HEADER')for(const row of rows){
    if(row.values.delivered_quantity!==delivery || delivery>Number(row.values.planned_quantity))issue('SELECTION_DELIVERY_MISMATCH','Số lượng giao không khớp selection/kế hoạch.',row.lineage.rawLine);
  }
  if(reportId==='COOIS_CONFIRMATIONS'&&rows.reduce((s,r)=>s+Number(r.values.yield_quantity),0)!==delivery)issue('SELECTION_DELIVERY_MISMATCH','Yield không khớp selection.');
  if(['MB51','COOIS_GOODS_MOVEMENTS'].includes(reportId))for(const movement of ['101','601']){
    const qty=rows.filter(r=>r.values.movement_type===movement).reduce((s,r)=>s+Number(r.values.quantity),0);
    if(qty!==delivery)issue('SELECTION_DELIVERY_MISMATCH','101/601 quantity không khớp selection.');
  }
  for(const [source,expected] of Object.entries(m.totals)){
    if(typeof expected!=='number'||!Number.isFinite(expected)){issue('TOTAL_INVALID','Manifest total phải là số hữu hạn.');continue;}
    if(reportId==='CK13N'&&['headerValue','itemValue'].includes(source)){
      totals[source]=rows.filter(r=>r.values.record_type===(source==='headerValue'?'HEADER':'ITEM')).reduce((s,r)=>s+Number(r.values.total_value),0);
    }else{
      const f=contract.fields.find(f=>f.source===source);
      if(!f||!['money','signed_money','quantity'].includes(f.type)){issue('TOTAL_UNSUPPORTED','Metric totals chưa có trong contract.');continue;}
      totals[source]=rows.reduce((sum,row)=>sum+Number(row.values[f.canonical]),0);
    }
    if(Math.abs(totals[source]-expected)>1e-7)issue('TOTAL_MISMATCH','Tổng CLEAN không khớp manifest.');
  }
  if(reportId==='KKS1')for(const row of rows)if(Number(row.values.actual_cost)-Number(row.values.planned_cost)!==row.values.variance)issue('VARIANCE_MISMATCH','Actual − plan không bằng variance.',row.lineage.rawLine);
  if(reportId==='CK13N'){
    const headers=rows.filter(r=>r.values.record_type==='HEADER'),items=rows.filter(r=>r.values.record_type==='ITEM');
    if(headers.length!==1||items.length!==3||rows.length!==4)issue('CK_RECORD_COUNT','CK13N profile cần1HEADER+3ITEM.');
    if(headers.length===1&&items.reduce((s,r)=>s+Number(r.values.total_value),0)!==headers[0].values.total_value)issue('CK_TOTAL','Itemization không khớp header.');
    for(const row of rows)if(Math.abs(Number(row.values.lot_quantity)*Number(row.values.unit_cost)-Number(row.values.total_value))>1e-7)issue('CK_UNIT_COST','Unit×lot không khớp value.',row.lineage.rawLine);
  }
  if(!issues.some(i=>i.severity==='BLOCK'))stages.push('OUTPUT CLEAN');
  return finish();
}
