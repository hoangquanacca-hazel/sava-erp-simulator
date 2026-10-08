import { VARIANT_COLORS, VARIANT_PACKAGINGS } from '../types';
import type { AcdocaLine, BOMComponentNode, MTOComputed, MTOParameters, RawMaterialBOMItem, SalesOrderCostCardState, JournalEntry } from '../types';
import { roundShare, wipStatusOf } from '../features/wip';

export interface PlanItem {name:string;code:string;qty:number;uom:string;cost:number;account:string;}
export function planGroups(p:MTOParameters,c:MTOComputed) {
  const materials:PlanItem[]=(c.bomItemBreakdowns??[]).map(b=>({name:b.name,code:b.itemCode,qty:b.grossQty,uom:b.uom,cost:b.totalCost,account:'621'}));
  const labor:PlanItem[]=[{name:'Nhân công theo routing',code:'ACT-LAB-OP01',qty:c.operatingHours,uom:'H',cost:c.effectiveLaborCost,account:'622'}];
  const overhead:PlanItem[]=[
    {name:'Chi phí máy theo routing',code:'ACT-MACHINE',qty:c.operatingHours,uom:'H',cost:c.machineOverhead627,account:'627'},
    {name:'Chi phí chung nhà máy',code:'OH-FACTORY',qty:1,uom:'LOT',cost:c.factoryOverhead627,account:'627'},
    {name:'Phụ phí cấu hình theo CK11N',code:'OH-VARIANT',qty:1,uom:'LOT',cost:c.variantAddonTotal,account:'627'}];
  return [
    {id:'raw_material',name:'Nguyên vật liệu',account:'621',cost:c.materialCost,items:materials},
    {id:'labor',name:'Nhân công',account:'622',cost:c.effectiveLaborCost,items:labor},
    {id:'overhead',name:'Sản xuất chung',account:'627',cost:c.effectiveMachineCost+c.variantAddonTotal,items:overhead}
  ] as const;
}
export function canonicalBomTree(p:MTOParameters,c:MTOComputed):BOMComponentNode {
  const qty=p.orderQuantity;
  const node=(id:string,name:string,code:string,cost:number,quantity:number,uom:string,account:string,level:number):BOMComponentNode=>({
    id,itemNumber:code,level,materialNumber:code,description:name,materialType:level===0?'FERT':account==='621'?'ROH':'ACT',
    itemCategory:account==='621'?'L':'E',unitOfMeasure:uom,quantityPerUnit:qty>0?quantity/qty:0,
    totalQuantity:quantity,unitCost:quantity>0?cost/quantity:0,totalCost:cost,
    costSharePercent:c.plannedCost>0?cost/c.plannedCost*100:0,tt200Account:`TK ${account}`,
    tt200AccountName:`TK ${account} — cấu hình mô phỏng TT99`,sapModule:'PP / CO-PC',sapTCode:'CK11N / CK13N',
    technicalNotes:'Giá trị kế hoạch từ bảng tính CK11N hiện có.'
  });
  const root=node('bom-root',p.componentName,p.componentCode,c.plannedCost,qty,'PC','154',0);
  root.children=planGroups(p,c).map(g=>{
    const parent=node(`bom-${g.id}`,g.name,g.account,g.cost,1,'LOT',g.account,1);
    parent.children=g.items.map((i,n)=>node(`bom-${g.id}-${n}`,i.name,i.code,i.cost,i.qty,i.uom,i.account,2));
    return parent;
  });
  return root;
}
const net=(ls:AcdocaLine[])=>ls.reduce((s,l)=>s+l.drAmount-l.crAmount,0);
export function settlementView(p:MTOParameters,c:MTOComputed,t:AcdocaLine[],executed:boolean) {
  const ratio=wipStatusOf(p).ratio;
  const actual=c.actualCostBeforeRework+net(t.filter(l=>l.stepId===4 && l.glAccount==='154'));
  const variance=roundShare(c.actualCostVariance,ratio);
  const settled=executed?0-net(t.filter(l=>l.stepId===7 && l.glAccount==='154')):
    p.stockType==='Non-valuated'?roundShare(actual,ratio):variance;
  const wip=executed?net(t.filter(l=>l.glAccount==='154')):
    actual-(p.stockType==='Valuated'?roundShare(c.plannedCost,ratio):0)-settled;
  return {ratio,actual,variance,settled,wip};
}
/** Exclude closing documents rather than counting expense once more at closing911. */
export function dashboardView(p:MTOParameters,c:MTOComputed,t:AcdocaLine[]) {
  const closingDocs=new Set(t.filter(l=>l.glAccount==='911').map(l=>l.txnId));
  const revenue=0-net(t.filter(l=>l.glAccount==='511' && !closingDocs.has(l.txnId)));
  const cogs=net(t.filter(l=>/^632\d*$/.test(l.glAccount) && !closingDocs.has(l.txnId)));
  const ratio=wipStatusOf(p).ratio;
  const plannedRevenue=roundShare(c.totalRevenue,ratio), plannedCogs=roundShare(c.plannedCost,ratio);
  // Breakdown is a bridge from standard cost to posted COGS, not root-cause evidence.
  const recognized=t.some(l=>/^632\d*$/.test(l.glAccount) && !closingDocs.has(l.txnId));
  const material=recognized&&c.plannedCost>0?Math.round(plannedCogs*c.materialCost/c.plannedCost):0;
  const labor=recognized&&c.plannedCost>0?Math.round(plannedCogs*c.effectiveLaborCost/c.plannedCost):0;
  const overhead=recognized?plannedCogs-material-labor:0;
  const delta=cogs-material-labor-overhead;
  const breakdown=[
    {name:'NVL kế hoạch phần đã giao (621)',value:material,color:'#38bdf8'},
    {name:'Nhân công kế hoạch phần đã giao (622)',value:labor,color:'#818cf8'},
    {name:'SXC kế hoạch phần đã giao (627)',value:overhead,color:'#a78bfa'},
    ...(delta!==0?[{name:'Chênh lệch so với kế hoạch đã giao',value:delta,color:delta>0?'#fb923c':'#4ade80'}]:[])
  ];
  return {revenue,cogs,plannedRevenue,plannedCogs,plannedProfit:plannedRevenue-plannedCogs,
    grossProfit:revenue-cogs,hasCompletedStep7:t.some(l=>l.stepId===7),recognized,breakdown};
}


/** Master editor fallback describes the SAME inputs currently used by computeMTO. */
export function displayedBomInputs(p:MTOParameters,c:MTOComputed):RawMaterialBOMItem[]{
  if(p.bomItems?.length)return p.bomItems;
  const color=p.strategy==='Strategy 25'?VARIANT_COLORS.find(v=>v.id===p.variantColorId):undefined;
  const packaging=p.strategy==='Strategy 25'?VARIANT_PACKAGINGS.find(v=>v.id===p.variantPackagingId):undefined;
  return (c.bomItemBreakdowns??[]).map((b,index)=>({
    id:`computed-bom-${index}`,itemCode:b.itemCode,name:b.name,materialType:b.itemCode.startsWith('VERP')?'VERP':'ROH',
    qtyPer1000:index===0?p.materialNormKgPer1000:b.itemCode==='ROH-MB-COLOR'?Number((p.materialNormKgPer1000*0.02).toFixed(2)):1000,
    scrapRatePercent:index===0?2.5:1,
    unitPrice:index===0?c.effectiveResinPricePerKg:b.itemCode==='ROH-MB-COLOR'?(color?.resinCostAddonPerKg??0)*50:packaging?.unitCostAddon??0,uom:b.uom
  }));
}
export function postedCostCard(base:SalesOrderCostCardState,p:MTOParameters,c:MTOComputed,t:AcdocaLine[]):SalesOrderCostCardState{
  const view=dashboardView(p,c,t);
  const debit=(account:string)=>t.filter(l=>l.stepId===3&&l.glAccount===account).reduce((s,l)=>s+l.drAmount,0);
  const material=debit('621'),labor=debit('622'),overhead=debit('627');
  return {...base,accumulatedMaterialCost:material,accumulatedLaborCost:labor,accumulatedMachineCost:overhead,
    totalAccumulatedCost:material+labor+overhead+base.qmReworkCost+base.qmScrapCost,
    recognizedRevenue:view.revenue,recognizedCOGS:view.cogs,actualGrossProfit:view.grossProfit};
}
/** Preserve original posting metadata; only the screen description reflects delivery scope. */
export function journalDescription(entry:JournalEntry,p?:MTOParameters){
  if(p&&entry.stepIndex===6&&entry.tCode==='VF01'&&entry.creditAccount==='511'){
    const w=wipStatusOf(p);return `Doanh thu phần đã giao ${roundShare(w.ordered,w.ratio).toLocaleString('vi-VN')} cái ${p.componentCode} cho ${p.customer}`;
  }
  return entry.description;
}
