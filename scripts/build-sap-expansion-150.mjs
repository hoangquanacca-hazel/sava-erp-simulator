import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Workbook,SpreadsheetFile,FileBlob} from '@oai/artifact-tool';

const root=path.resolve(process.argv[2]);
const model=(await import(pathToFileURL(path.join(root,'scripts/sap-expansion-150-data.mjs')))).buildExpansion(root);
const selected=process.argv.find(x=>x.startsWith('--module='))?.split('=')[1];
const out=path.join(root,'public/sap-reporting/expansion-150-downloads');
const proof=path.join(root,'tmp/expansion-150-review');
await fs.mkdir(out,{recursive:true});await fs.mkdir(proof,{recursive:true});
const col=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
const csv=rows=>'\uFEFF'+rows.map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';
const checks=[];
for(const r of model.reports.filter(r=>!selected||r.module===selected)){
 const v=model.variants.find(v=>v.report_id===r.id),n=v.columns.length;
 const raw=v.display.map(row=>{const cells=[];for(const c of row.cells){cells.push(c.text);for(let j=1;j<c.span;j++)cells.push('');}return cells;});
 const flat=[v.columns.map(f=>f.label),...v.detail_rows];
 if(process.argv.includes('--render-only')){
  const saved=await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(out,v.id+'.xlsx')));
  for(const [sheetName,range]of Object.entries({Layout:'A1:'+col(n-1)+(raw.length+3),'Flat input':'A1:'+col(n-1)+flat.length,Fields:'A1:F'+(n+13)})){
   const png=await saved.render({sheetName,range,scale:1,format:'png'});await fs.writeFile(path.join(proof,v.id+'-'+sheetName.replace(' ','-')+'.png'),new Uint8Array(await png.arrayBuffer()));
  }
  checks.push({id:r.id,rendered_from_saved_xlsx:true,sheets:3});console.log('Rendered saved '+r.id);continue;
 }
 await fs.writeFile(path.join(out,v.id+'.layout.csv'),csv(raw));
 await fs.writeFile(path.join(out,v.id+'.flat.csv'),csv(flat));
 const wb=Workbook.create(),layout=wb.worksheets.add('Layout'),input=wb.worksheets.add('Flat input'),fields=wb.worksheets.add('Fields');
 const pad=row=>Array.from({length:n},(_,i)=>String(row[i]??''));
 const layoutRows=[pad(['SAVA PROPOSED — '+r.id+' '+r.title]),pad(['Dữ liệu tổng hợp; layout/order/technical fields chưa xác minh SAP export.']),pad(['Nguồn ngữ cảnh: '+r.source_url]),...raw];
 layout.getRangeByIndexes(0,0,layoutRows.length,n).values=layoutRows;
 input.getRangeByIndexes(0,0,flat.length,n).values=flat;
 for(const s of [layout,input]){
  const range=s.getRangeByIndexes(0,0,s===layout?layoutRows.length:flat.length,n);range.setNumberFormat('@');range.format.font={name:'Arial',size:11};range.format.columnWidth=25;range.format.rowHeight=28;s.showGridLines=false;s.tabColor='#315e78';
 }
 for(let j=0;j<5;j++){layout.mergeCells('A'+(j+1)+':'+col(n-1)+(j+1));layout.getRangeByIndexes(j,0,1,n).format.rowHeight=32;}
 layout.getRangeByIndexes(5,0,1,n).format={fill:'#dcebf0',font:{name:'Arial',size:11,bold:true},wrapText:true,rowHeight:52};
 input.getRangeByIndexes(0,0,1,n).format={fill:'#dcebf0',font:{name:'Arial',size:11,bold:true},wrapText:true,rowHeight:52};
 layout.freezePanes.freezeRows(6);input.freezePanes.freezeRows(1);input.freezePanes.freezeColumns(1);
 for(let j=0;j<n;j++){
  const width=Math.max(22,Math.min(45,Math.max(r.fields[j].label.length,...v.detail_rows.map(row=>row[j].length))+3));
  for(const s of [layout,input])s.getRangeByIndexes(0,j,s===layout?layoutRows.length:flat.length,1).format.columnWidth=width;
 }
 // The Fields sheet owns provenance and cleaning instructions, not financial outputs.
 const fm=[['Vị trí','Nhãn đề xuất','Kiểu RAW','Diễn giải tiếng Việt','Bằng chứng / tên kỹ thuật','Quy tắc làm sạch'],...r.fields.map(f=>[String(f.position),f.label,f.type,f.meaning,'SAVA_PROPOSED / chưa xác minh',f.cleaning_rule]),[],['Nguồn ngữ cảnh',r.source_url],['Grain',r.grain],['Khóa',r.keys.join(' + ')],['Control',r.control],['IFRS',r.ifrs],['Lineage',r.lineage],['Quyền dùng','LINK_ONLY; dữ liệu tổng hợp SAVA'],['Ca dòng1',v.fixture_cases[0]],['Ca dòng2',v.fixture_cases[1]],['Ca dòng3',v.fixture_cases[2]],['Ca dòng4',v.fixture_cases[3]]].map(row=>Array.from({length:6},(_,i)=>String(row[i]??'')));
 fields.getRangeByIndexes(0,0,fm.length,6).values=fm;fields.showGridLines=false;fields.tabColor='#b9ced2';
 const all=fields.getRangeByIndexes(0,0,fm.length,6);all.format.font={name:'Arial',size:11};all.format.wrapText=true;all.format.verticalAlignment='center';
 const widths=[9,32,18,56,33,65];widths.forEach((w,i)=>fields.getRangeByIndexes(0,i,fm.length,1).format.columnWidth=w);
 for(let i=0;i<fm.length;i++){
  if(i>r.fields.length+1){fields.mergeCells('B'+(i+1)+':F'+(i+1));fields.getRangeByIndexes(i,0,1,6).format.rowHeight=i===r.fields.length+6?65:48;}
  else {const lines=Math.max(...fm[i].map((value,j)=>Math.ceil(value.length/(widths[j]*.7))));fields.getRangeByIndexes(i,0,1,6).format.rowHeight=Math.max(i===0?38:45,lines*17+12);}
 }
 fields.getRange('A1:F1').format.fill='#dcebf0';fields.getRange('A1:F1').format.font.bold=true;fields.freezePanes.freezeRows(1);
 wb.recalculate();
 const inspect=await wb.inspect({kind:'table',range:'Flat input!A1:F3',include:'values',tableMaxRows:3,tableMaxCols:6,maxChars:1300});
 // Review full populated ranges; horizontal reports keep all fields, never crop data to fit.
 const previews={Layout:'A1:'+col(n-1)+layoutRows.length,'Flat input':'A1:'+col(n-1)+flat.length,Fields:'A1:F'+fm.length};
 for(const [sheetName,range]of (process.argv.includes('--skip-previews')?[]:Object.entries(previews))){
  const png=await wb.render({sheetName,range,scale:1,format:'png'});
  await fs.writeFile(path.join(proof,v.id+'-'+sheetName.replace(' ','-')+'.png'),new Uint8Array(await png.arrayBuffer()));
 }
 await (await SpreadsheetFile.exportXlsx(wb)).save(path.join(out,v.id+'.xlsx'));
 try{await fs.rename(path.join(out,v.id+'.xlsx.inspect.ndjson'),path.join(proof,v.id+'.inspect.ndjson'));}catch(e){if(e.code!=='ENOENT')throw e;}
 checks.push({id:r.id,variant:v.id,fields:n,rows:v.detail_rows.length,inspect:inspect.ndjson,previews:Object.keys(previews)});
 console.log(`Exported ${r.id}: ${n} proposed fields /3 sheets`);
 if(global.gc)global.gc();
}
await fs.writeFile(path.join(proof,(process.argv.includes('--render-only')?'render-':'build-')+(selected||'all')+'.json'),JSON.stringify({date:'2026-10-13',status:process.argv.includes('--render-only')?'RENDERED_SAVED_WORKBOOKS':'EXPORTED_WITH_ARTIFACT_TOOL',checks},null,2));
await fs.writeFile(path.join(root,'public/sap-reporting/expansion-150.json'),JSON.stringify(model,null,2)+'\n');
const viewer=await fs.readFile(path.join(root,'scripts/sap-expansion-150-viewer.html'),'utf8');
await fs.writeFile(path.join(root,'public/sap-reporting/expansion-150.html'),viewer.replace('__MODEL__',JSON.stringify(model).replaceAll('<','\\u003c')));
console.log(`Completed ${selected||'all'}; no SAP/native/SME acceptance claimed.`);
