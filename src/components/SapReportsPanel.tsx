import React, { useState } from 'react';
import type { AcdocaLine, MTOComputed, MTOParameters } from '../types';
import { exportReportSnapshot } from '../reports/snapshot';

export function SapReportsPanel({params,computed,table,ready}: {
  params:MTOParameters; computed:MTOComputed; table:AcdocaLine[]; ready:boolean;
}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
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
    setBusy(true);setError('');setOutputs(null);
    try {setOutputs(await exportReportSnapshot(params,computed,table));setExportKey(snapshotKey);}
    catch(e){setError(e instanceof Error ? e.message : 'Không tạo được báo cáo');}
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
      </li>)}</ul></>}
  </section>;
}
