import type {AdapterResult,CleanDataset,CleanRow} from '../adapters/framework';
import {reconcile,type SourceRef} from '../controls/reconcile';
import {exportControlCase,type ControlCase} from '../controls/workflow';
import {sha256Hex} from '../reports/core';
export interface Metric {id:string;label:string;value:number|null;unit:string;basis:string;formula:string;refs:SourceRef[];controls:string[];unavailableReason?:string;}
export interface CostElement {account:string;label:string;planned:number;actual:number;delta:number;basis:'FULL_ORDER';refs:SourceRef[];}
export interface ManufacturingMart {version:'sava-mfg-mart-1.0.0';label:'SIMULATED';publicationStatus:'DIAGNOSTIC_ONLY';businessAcceptance:'PENDING_HUMAN_SME';runId:string;sourceHash:string;snapshotHash:string;controlCaseHash:string;grain:'ONE_PRODUCTION_ORDER_SNAPSHOT';metrics:Metric[];costElements:CostElement[];sourceDatasets:{reportId:string;rawHash:string;cleanHash:string;rows:number}[];businessGaps:{controlId:string;status:string}[];limitations:string[];}
const freeze=<T,>(v:T):T=>{if(v&&typeof v==='object'){Object.values(v).forEach(x=>freeze(x));Object.freeze(v);}return v;};
const n=(r:CleanRow,f:string)=>{const v=r.values[f];if(typeof v!=='number'||!Number.isFinite(v))throw new Error(`Invalid ${f}`);return v;};
const sum=(rows:readonly CleanRow[],field:string)=>rows.reduce((s,r)=>s+n(r,field),0);
const docKey=(r:CleanRow)=>JSON.stringify([r.values.ledger,r.values.company_code,r.values.fiscal_year,r.values.accounting_document]);
/** Derived exclusively from generated CLEAN; blocked technical controls forbid even diagnostic output.
 * Business approval never inferred from numeric equality, audit notes or user-entered identities. */
export async function buildManufacturingMart(input:readonly AdapterResult[],work:ControlCase):Promise<ManufacturingMart>{
 const quality=structuredClone(input.map(({status,clean,quality})=>({status,clean,quality}))) as AdapterResult[];
 const controlCase=structuredClone(work);
 const actual=reconcile(quality);
 if(actual.technicalStatus!=='PASS')throw new Error('MART bị chặn: quality/control kỹ thuật chưa đạt.');
 if(JSON.stringify(actual)!==JSON.stringify(controlCase.run))throw new Error('MART bị chặn: control snapshot khác CLEAN hoặc bị sửa.');
 const audit=await exportControlCase(controlCase); // verifies chain using private copies
 const datasets=new Map(quality.map(r=>[r.clean!.reportId,r.clean!]));
 const get=(id:string)=>datasets.get(id)!;
 const refs=(id:string,rows:readonly CleanRow[]=get(id).rows):SourceRef[]=>rows.map(r=>({reportId:id,...r.lineage}));
 const k=get('KKS1').rows[0],h=get('COOIS_HEADER').rows[0],ck=get('CK13N'),header=ck.rows.find(r=>r.values.record_type==='HEADER')!;
 const gl=get('FAGLL03');
 const closing=new Set(gl.rows.filter(r=>r.values.gl_account==='911').map(docKey));
 const operating=gl.rows.filter(r=>!closing.has(docKey(r)));
 const revenueRows=operating.filter(r=>r.values.gl_account==='511'),cogsRows=operating.filter(r=>/^632\d*$/.test(String(r.values.gl_account)));
 const revenue=0-sum(revenueRows,'amount_lc'),cogs=sum(cogsRows,'amount_lc'),profit=revenue-cogs;
 const metric=(id:string,label:string,value:number|null,unit:string,basis:string,formula:string,sourceRefs:SourceRef[],controls:string[],unavailableReason?:string):Metric=>({id,label,value,unit,basis,formula,refs:sourceRefs,controls,...(unavailableReason?{unavailableReason}:{})});
 const metrics=[
  metric('standard_cost','Chi phí kế hoạch',n(header,'total_value'),'VND','FULL_ORDER','CK13N HEADER total_value',refs('CK13N'),['C06','C07']),
  metric('actual_cost','Chi phí sản xuất thực tế',n(k,'actual_cost'),'VND','FULL_ORDER','KKS1 actual_cost; C04 collector tieout',refs('KKS1').concat(refs('KOB1')),['C04','C07']),
  metric('variance','Chênh lệch chi phí',n(k,'variance'),'VND','FULL_ORDER','KKS1 actual_cost - planned_cost',refs('KKS1').concat(refs('CK13N')),['C07']),
  metric('settled_cost','Chi phí đã settlement',n(k,'settled_cost'),'VND','SIGNED_COLLECTOR_SETTLEMENT','SUP01 settled_cost ↔ KKS1 settled_cost',refs('KKS1').concat(refs('SUP01')),['C05']),
  metric('wip','Chi phí còn ở TK154',n(k,'wip_cost'),'VND','POSTED_CUTOFF_BALANCE','Net FAGLL03 account154 ↔ KKS1 wip_cost',refs('KKS1').concat(refs('FAGLL03',gl.rows.filter(r=>r.values.gl_account==='154'))),['C05']),
  metric('revenue','Doanh thu đã ghi nhận',revenue,'VND','POSTED_DELIVERED','-sum GL511 excluding all closing911 documents',refs('FAGLL03',revenueRows),['C05']),
  metric('cogs','Giá vốn đã ghi nhận',cogs,'VND','POSTED_DELIVERED','sum GL632* excluding all closing911 documents',refs('FAGLL03',cogsRows),['C05']),
  metric('gross_profit','Lợi nhuận gộp đã ghi nhận',profit,'VND','POSTED_DELIVERED','revenue - cogs',refs('FAGLL03',revenueRows.concat(cogsRows)),['C05']),
  metric('gross_margin','Biên lợi nhuận gộp',revenue===0?null:profit/revenue*100,'PERCENT','POSTED_DELIVERED','gross_profit / revenue *100',refs('FAGLL03',revenueRows.concat(cogsRows)),['C05'],revenue===0?'Chưa có doanh thu; không tính tỷ lệ.':undefined),
  metric('planned_quantity','Số lượng kế hoạch',n(h,'planned_quantity'),String(h.values.base_uom),'ORDER_PLANNED','COOIS Header planned_quantity',refs('COOIS_HEADER'),['C03','C06']),
  metric('delivered_quantity','Số lượng đã giao/GR theo mô hình',n(h,'delivered_quantity'),String(h.values.base_uom),'SIM_GR_EQUALS_DELIVERY','COOIS Header delivered_quantity ↔ MB51 101',refs('COOIS_HEADER').concat(refs('MB51',get('MB51').rows.filter(r=>r.values.movement_type==='101'))),['C03']),
  metric('variance_residual','Chênh lệch chưa phân bổ trong cầu nối số học',actual.controls[6].metrics.residual,'VND','FULL_ORDER','KKS variance -sum cost-element deltas',actual.controls[6].evidence,['C07'])
 ];
 const comps=get('COOIS_COMPONENTS'),conf=get('COOIS_CONFIRMATIONS');
 const elements=[['621','Vật liệu',sum(comps.rows,'actual_value'),refs('COOIS_COMPONENTS')],['622','Nhân công',sum(conf.rows,'labor_value'),refs('COOIS_CONFIRMATIONS')],['627','Sản xuất chung',sum(conf.rows,'overhead_value'),refs('COOIS_CONFIRMATIONS')]] as const;
 const costElements=elements.map(([account,label,value,evidence]):CostElement=>{const item=ck.rows.find(r=>r.values.record_type==='ITEM'&&r.values.cost_element===account)!;return {account,label,planned:n(item,'total_value'),actual:value,delta:value-n(item,'total_value'),basis:'FULL_ORDER',refs:[...evidence,...refs('CK13N',[item])]};});
 const sourceDatasets=await Promise.all([...datasets.values()].map(async d=>({reportId:d.reportId,rawHash:d.rawHash,cleanHash:await sha256Hex(new TextEncoder().encode(JSON.stringify(d))),rows:d.rows.length})));
 const payload={version:'sava-mfg-mart-1.0.0' as const,label:'SIMULATED' as const,publicationStatus:'DIAGNOSTIC_ONLY' as const,businessAcceptance:'PENDING_HUMAN_SME' as const,runId:actual.runId,sourceHash:actual.sourceHash,controlCaseHash:audit.manifest.sha256,grain:'ONE_PRODUCTION_ORDER_SNAPSHOT' as const,metrics,costElements,sourceDatasets,businessGaps:actual.controls.map(c=>({controlId:c.id,status:c.businessStatus})),limitations:[
  'Phân tích thử nghiệm; chưa được phê duyệt nghiệp vụ hoặc pháp lý.',
  'Chi phí/variance FULL_ORDER khác doanh thu/giá vốn POSTED_DELIVERED; không ghép hai cơ sở.',
  'Delta621/622/627 là cầu nối số học, chưa chứng minh nguyên nhân giá/tiêu hao/năng suất.',
  'Qty/giờ actual được suy từ cost ratios theo A0.1; không phải quan sát độc lập.',
  'GR/yield = delivery là giả định mô phỏng. Không tính DSO/DPO/DIO/CCC từ dữ liệu này.',
  'Dữ liệu chỉ ở RAM; không có authenticated approval, storage hay SAP direct integration.'
 ]};
 const snapshotHash=await sha256Hex(new TextEncoder().encode(JSON.stringify(payload)));
 return freeze({...payload,snapshotHash});
}
export async function verifyMartSnapshot(input:ManufacturingMart){
 const {snapshotHash,...payload}=structuredClone(input);
 if(await sha256Hex(new TextEncoder().encode(JSON.stringify(payload)))!==snapshotHash)throw new Error('MART snapshot bị sửa.');
 if(payload.version!=='sava-mfg-mart-1.0.0'||payload.label!=='SIMULATED'||payload.publicationStatus!=='DIAGNOSTIC_ONLY'||payload.businessAcceptance!=='PENDING_HUMAN_SME')throw new Error('MART publication scope không hợp lệ.');
}
