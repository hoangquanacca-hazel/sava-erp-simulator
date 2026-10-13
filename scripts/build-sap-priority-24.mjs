import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Workbook,SpreadsheetFile,FileBlob} from '@oai/artifact-tool';
const root=path.resolve(process.argv[2]);
const registry=JSON.parse(await fs.readFile(path.join(root,'docs/reporting-library/priority-24/registry-input.json'),'utf8'));
const model=(await import(pathToFileURL(path.join(root,'scripts/sap-priority-24-data.mjs')))).buildPriority(root,registry.rows||registry);
const out=path.join(root,'public/sap-reporting/priority-24-downloads'),proof=path.join(root,'tmp/priority-24-review');
await fs.mkdir(out,{recursive:true});await fs.mkdir(proof,{recursive:true});
const col=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
const csv=rows=>'\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';
const checks=[];const module=process.argv.find(x=>x.startsWith('--module='))?.split('=')[1];
for(const v of model.variants.filter(v=>!module||v.module===module)){
 const n=v.fields.length,pad=r=>Array.from({length:n},(_,i)=>String(r[i]??''));
 const filters=v.fields.filter(f=>f.role==='filter_or_context'),business=v.fields.filter(f=>f.role!=='filter_or_context');
 const rows=[pad(['SAVA • '+v.entry+' • '+v.title]),pad(['Dữ liệu tổng hợp; bố cục và thứ tự export SAP chưa xác minh.']),pad(['Nguồn: '+v.source_url]),...filters.map(f=>pad([f.label,v.detail_rows[0][f.position-1]])),pad([]),pad(business.map(f=>f.label)),...v.detail_rows.map(row=>pad(business.map(f=>row[f.position-1])))];
 const header=4+filters.length;
 const flat=[v.fields.map(f=>f.label),...v.detail_rows];
 const fieldRows=[['Vị trí','Nhãn SAVA','Vai trò / kiểu RAW','Diễn giải','Bằng chứng','Làm sạch','Nguồn / phiên bản'],...v.fields.map(f=>[String(f.position),f.label,f.role+' / '+f.type,f.meaning,f.evidence+'; technical name chưa xác minh',f.cleaning_rule,f.source_urls.join('\n')||'Trường đề xuất; chưa xác minh export']),[],...['grain','selection','reading','reconciliation','ifrs','lineage'].map(k=>[k,v[k]]),['Source version',v.source_version],['Source links',v.source_evidence.flatMap(s=>s.urls).join('\n')],['Quyền dùng','LINK_ONLY; dữ liệu tổng hợp SAVA; chưa xác định quyền tái phân phối tài liệu SAP'],...v.fixture_cases.map((c,i)=>['Ca dòng '+(i+1),c])].map(r=>Array.from({length:7},(_,i)=>String(r[i]??'')));
 const previews={Layout:'A1:'+col(n-1)+rows.length,'Flat input':'A1:'+col(n-1)+flat.length,Fields:'A1:G'+fieldRows.length};
 if(process.argv.includes('--render-only')){
  const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(out,v.id+'.xlsx')));
  for(const [sheetName,range]of Object.entries(previews)){const png=await wb.render({sheetName,range,scale:1,format:'png'});await fs.writeFile(path.join(proof,v.id+'-'+sheetName.replace(' ','-')+'.png'),new Uint8Array(await png.arrayBuffer()));}
  console.log('Rendered '+v.id);checks.push({id:v.id,sheets:3,rendered_saved_xlsx:true});continue;
 }
 await fs.writeFile(path.join(out,v.id+'.layout.csv'),csv(rows));await fs.writeFile(path.join(out,v.id+'.flat.csv'),csv(flat));
 const wb=Workbook.create(),layout=wb.worksheets.add('Layout'),input=wb.worksheets.add('Flat input'),fields=wb.worksheets.add('Fields');
 layout.getRangeByIndexes(0,0,rows.length,n).values=rows;input.getRangeByIndexes(0,0,flat.length,n).values=flat;
 for(const [s,count]of [[layout,rows.length],[input,flat.length]]){const a=s.getRangeByIndexes(0,0,count,n);a.setNumberFormat('@');a.format.font={name:'Arial',size:11};a.format.columnWidth=25;a.format.rowHeight=30;s.showGridLines=false;s.tabColor='#315e78';}
 for(let i=0;i<3;i++){layout.mergeCells('A'+(i+1)+':'+col(n-1)+(i+1));layout.getRangeByIndexes(i,0,1,n).format.rowHeight=i===2?38:32;}
 for(let i=0;i<n;i++){const width=Math.max(22,Math.min(42,v.fields[i].label.length+5));input.getRangeByIndexes(0,i,flat.length,1).format.columnWidth=width;const b=business[i];if(b)layout.getRangeByIndexes(0,i,rows.length,1).format.columnWidth=Math.max(22,Math.min(42,b.label.length+5));}
 layout.getRangeByIndexes(header,0,1,n).format={fill:'#dcebf0',font:{name:'Arial',size:11,bold:true},rowHeight:52,wrapText:true};input.getRangeByIndexes(0,0,1,n).format={fill:'#dcebf0',font:{name:'Arial',size:11,bold:true},rowHeight:52,wrapText:true};
 layout.freezePanes.freezeRows(header+1);input.freezePanes.freezeRows(1);input.freezePanes.freezeColumns(1);
 fields.getRangeByIndexes(0,0,fieldRows.length,7).values=fieldRows;fields.showGridLines=false;fields.tabColor='#b9ced2';const a=fields.getRangeByIndexes(0,0,fieldRows.length,7);a.setNumberFormat('@');a.format.font={name:'Arial',size:11};a.format.wrapText=true;a.format.verticalAlignment='center';
 const widths=[9,32,32,54,51,60,60];widths.forEach((w,i)=>fields.getRangeByIndexes(0,i,fieldRows.length,1).format.columnWidth=w);
 for(let i=0;i<fieldRows.length;i++){if(i>v.fields.length+1){fields.mergeCells('B'+(i+1)+':G'+(i+1));fields.getRangeByIndexes(i,0,1,7).format.rowHeight=fieldRows[i][0]==='Source links'?Math.max(70,v.source_evidence.flatMap(s=>s.urls).length*26):62;}else{const lines=Math.max(...fieldRows[i].map((s,j)=>Math.ceil(s.length/(widths[j]*.65))));fields.getRangeByIndexes(i,0,1,7).format.rowHeight=Math.max(48,lines*17+14);}}
 fields.getRange('A1:G1').format.fill='#dcebf0';fields.getRange('A1:G1').format.font.bold=true;fields.freezePanes.freezeRows(1);wb.recalculate();
 await(await SpreadsheetFile.exportXlsx(wb)).save(path.join(out,v.id+'.xlsx'));
 try{await fs.rename(path.join(out,v.id+'.xlsx.inspect.ndjson'),path.join(proof,v.id+'.inspect.ndjson'));}catch(e){if(e.code!=='ENOENT')throw e;}
 checks.push({id:v.id,fields:n,rows:v.detail_rows.length,layout_rows:rows.length,field_rows:fieldRows.length,previews});console.log('Exported '+v.id+' / '+n+' fields');if(global.gc)global.gc();
}
await fs.writeFile(path.join(proof,(process.argv.includes('--render-only')?'render-':'build-')+(module||'all')+'.json'),JSON.stringify({status:process.argv.includes('--render-only')?'RENDERED_SAVED_WORKBOOKS':'EXPORTED_WITH_ARTIFACT_TOOL',checks},null,2));
if(!process.argv.includes('--render-only')){
 const old=JSON.parse(await fs.readFile(path.join(root,'public/sap-reporting/source-layouts.json'),'utf8'));
 model.reference_variants=(old.variants||[]).filter(v=>v.id==='CO11-02');
 await fs.writeFile(path.join(root,'public/sap-reporting/priority-24.json'),JSON.stringify(model,null,2)+'\n');
 const viewer=await fs.readFile(path.join(root,'scripts/sap-priority-24-viewer.html'),'utf8');await fs.writeFile(path.join(root,'public/sap-reporting/priority-24.html'),viewer.replace('__MODEL__',JSON.stringify(model).replaceAll('<','\\u003c')));
}
