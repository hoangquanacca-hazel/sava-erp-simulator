import React, { useState } from 'react';
import type { AcdocaLine, MTOComputed, MTOParameters } from '../types';
import { adaptRaw, type AdapterResult } from '../adapters/framework';
import { ControlsPanel } from './ControlsPanel';
import { cleanExport } from '../adapters/exports';
import { exportReportSnapshot } from '../reports/snapshot';

export function SapReportsPanel({params,computed,table,ready}: {
  params:MTOParameters; computed:MTOComputed; table:AcdocaLine[]; ready:boolean;
}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [quality,setQuality]=useState<readonly AdapterResult[]|null>(null);
  const [cleanFiles,setCleanFiles]=useState<Awaited<ReturnType<typeof cleanExport>>[]>([]);
  const [outputs,setOutputs]=useState<Awaited<ReturnType<typeof exportReportSnapshot>> | null>(null);
  // Changes invalidate old exports immediately, including parameter edits after completion.
  const snapshotKey=JSON.stringify({params,table});
  const [exportKey,setExportKey]=useState('');
  const current=exportKey===snapshotKey ? outputs : null;
  const download=(name:string,text:string,type:string)=>{
    const url=URL.createObjectURL(new Blob([text],{type}));
    const a=document.createElement('a'); a.href=url; a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const generate=async()=>{
    setBusy(true);setError('');setOutputs(null);setQuality(null);setCleanFiles([]);
    try {setOutputs(await exportReportSnapshot(params,computed,table));setExportKey(snapshotKey);}
    catch(e){setError(e instanceof Error ? e.message : 'Không tạo được báo cáo');}
    finally{setBusy(false);}
  };
  const standardize=async()=>{
    if(!current)return;
    setBusy(true);setError('');setQuality(null);setCleanFiles([]);
    try {
      const results=await Promise.all(current.map(({raw,manifest})=>adaptRaw(raw.bytes,manifest)));
      setQuality(results);
      const files=await Promise.all(results.filter(r=>r.status==='PASS').map(cleanExport));
      setCleanFiles(files);
    } catch {setError('Không hoàn tất chuẩn hóa. CLEAN chưa được công bố.');setQuality(null);setCleanFiles([]);}
    finally{setBusy(false);}
  };
  return <section className="rounded-xl border border-slate-700 p-5 space-y-3" aria-label="SAP Reports">
    <h2 className="font-bold text-cyan-300">SAP Reports · SIMULATED</h2>
    <p className="text-sm text-slate-300">11 báo cáo cho kịch bản cơ sở đã hoàn thành 7 bước. Bố cục mô phỏng; TT99 chưa được đối chiếu PDF Công báo. Xuất và kiểm tra ngay trong trình duyệt.</p>
    {!ready && <p className="text-sm text-amber-300">Hoàn thành 7 bước; kịch bản QM rework/scrap và các bút toán mở rộng chưa thuộc gói báo cáo này.</p>}
    <button className="rounded bg-cyan-800 px-4 py-2 disabled:opacity-40" disabled={!ready||busy} onClick={generate}>{busy?'Đang kiểm tra…':'Kiểm tra và tạo báo cáo'}</button>
    {error && <p role="alert" className="text-red-300 whitespace-pre-wrap">{error}</p>}
    {current && <><p className="text-sm text-slate-300">Đối soát kỹ thuật đạt. Chưa phải nghiệm thu nghiệp vụ độc lập. RAW và manifest phải được tải cùng nhau.</p>
      <ul className="space-y-2">{current.map(({raw,manifest})=><li key={manifest.reportId} className="flex flex-wrap gap-3 text-sm">
        <span className="w-56">{manifest.reportId} · {manifest.rowCount} dòng</span>
        <button className="text-cyan-300 underline" onClick={()=>download(`${manifest.runId}_${raw.fileName}`,raw.text,'text/plain;charset=utf-8')}>Tải RAW</button>
        <button className="text-cyan-300 underline" onClick={()=>download(`${manifest.runId}_${raw.fileName}.manifest.json`,JSON.stringify({...manifest,fileName:`${manifest.runId}_${raw.fileName}`},null,2),'application/json')}>Tải manifest</button>
      </li>)}</ul>
      <div className="border-t border-slate-700 pt-4 space-y-3" aria-label="Data Lab">
        <h3 className="font-bold text-cyan-300">Data Lab · RAW → CLEAN</h3>
        <p className="text-sm text-slate-300">Kiểm hash, cột, kiểu dữ liệu, khóa và tổng tiền từ RAW vừa tạo. Chưa nghiệm thu đối soát nghiệp vụ.</p>
        <button disabled={busy} className="rounded bg-cyan-800 px-4 py-2 disabled:opacity-40" onClick={standardize}>{busy?'Đang kiểm tra…':'Chuẩn hóa và kiểm tra dữ liệu'}</button>
        {quality && <>
          <p className="text-sm">{quality.filter(r=>r.status==='PASS').length}/{quality.length} báo cáo đạt kiểm tra chất lượng dữ liệu.</p>
          <ul className="space-y-2">{quality.map((result,i)=><li key={i} className="text-sm space-y-1">
            <span>{current[i].manifest.reportId} · {result.status==='PASS'?'Đạt':'Bị chặn'} · {result.quality.acceptedRows} dòng CLEAN</span>
            <button className="ml-3 text-cyan-300 underline" onClick={()=>download(`${current[i].manifest.runId}_${current[i].manifest.reportId}_QUALITY.json`,JSON.stringify(result.quality,null,2),'application/json')}>Tải nhật ký chất lượng</button>
            {result.clean && <details className="rounded border border-slate-700 p-2">
              <summary className="cursor-pointer text-cyan-300">Xem tối đa 3 dòng CLEAN và nguồn RAW</summary>
              <pre className="overflow-auto max-h-64 text-xs mt-2">{JSON.stringify(result.clean.rows.slice(0,3),null,2)}</pre>
            </details>}
            {result.quality.issues.map((issue,n)=><p key={n} className={issue.severity==='BLOCK'?'text-red-300':'text-amber-300'}>{issue.code}: {issue.message}{issue.row ? ` · dòng RAW ${issue.row}`:''}{issue.column ? ` · ${issue.column}`:''}</p>)}
          </li>)}</ul>
          <ul className="space-y-2">{cleanFiles.map(file=><li key={file.fileName} className="text-sm">
            <span>{file.manifest.fileName}</span>
            <button className="ml-3 text-cyan-300 underline" onClick={()=>download(file.fileName,file.text,'application/json')}>Tải CLEAN</button>
            <button className="ml-3 text-cyan-300 underline" onClick={()=>download(`${file.fileName}.manifest.json`,JSON.stringify(file.manifest,null,2),'application/json')}>Tải manifest CLEAN</button>
          </li>)}</ul>
          <ControlsPanel quality={quality}/>
        </>}
      </div>
      </>}
  </section>;
}
