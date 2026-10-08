import React,{useState} from 'react';
import {ManufacturingMartPanel} from './ManufacturingMartPanel';
import type {exportReportSnapshot} from '../reports/snapshot';
import type {AdapterResult} from '../adapters/framework';
import {reconcile,CONTROL_POLICY} from '../controls/reconcile';
import {startCase,appendEvent,exportControlCase,type ControlCase} from '../controls/workflow';
export function ControlsPanel({quality,snapshots}:{quality:readonly AdapterResult[];snapshots:Awaited<ReturnType<typeof exportReportSnapshot>>}){
 const [work,setWork]=useState<ControlCase|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [actor,setActor]=useState(''),[note,setNote]=useState(''),[evidence,setEvidence]=useState(''),[selected,setSelected]=useState('C01');
 const download=(name:string,text:string)=>{const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const record=async(action:'EXPLAIN'|'REQUEST_REVIEW')=>{if(!work)return;setBusy(true);setError('');try{setWork(await appendEvent(work,selected,action,actor,note,evidence.split('\n').filter(x=>x.trim())));}catch(e){setError(e instanceof Error?e.message:'Không lưu được giải trình.');}finally{setBusy(false);}};
 const exportCase=async()=>{if(!work)return;setBusy(true);setError('');try{const f=await exportControlCase(work);download(f.fileName,f.text);download(`${f.fileName}.manifest.json`,JSON.stringify(f.manifest,null,2));}catch{setError('Không xuất được hồ sơ control.');}finally{setBusy(false);}};
 return <section aria-label="Manufacturing Controls" className="border-t border-slate-700 pt-4 space-y-3">
  <h3 className="font-bold text-cyan-300">Controls · Đối soát Manufacturing</h3>
  <p className="text-sm text-slate-300">Đối chiếu dữ liệu CLEAN trong cùng kịch bản. Phạm vi mô phỏng, chưa nghiệm thu nghiệp vụ. Giải trình và nhật ký chỉ giữ trong phiên; tải hồ sơ trước khi tải lại trang.</p>
  <button disabled={busy||!!work} className="rounded bg-cyan-800 px-4 py-2 disabled:opacity-40" onClick={()=>{setError('');try{setWork(startCase(reconcile(quality)));}catch{setError('Không chạy được controls; không công bố kết quả.');}}}>Chạy đối soát CLEAN</button>
  {error&&<p role="alert" className="text-red-300">{error}</p>}
  {work&&<>
   <p className="text-sm">{work.run.controls.filter(c=>c.technicalStatus==='PASS').length}/7 phép đối chiếu mô phỏng khớp. Nghiệm thu nghiệp vụ: đang chờ.</p>
   <ul className="space-y-3">{work.run.controls.map(c=><li key={c.id} className="border border-slate-700 rounded p-3 text-sm space-y-2">
    <p className="font-bold">{c.id} · {c.name} · {c.technicalStatus==='PASS'?'Khớp mô phỏng':c.technicalStatus==='FAIL'?'Có chênh lệch':'Bị chặn'}</p>
    <p className="text-amber-300">Nghiệp vụ: {c.businessStatus}</p>
    {Object.keys(c.metrics).length>0&&<pre className="text-xs overflow-auto">{JSON.stringify(c.metrics,null,2)}</pre>}
    {c.findings.map((f,i)=><div key={i} className="text-red-300"><p>{f.code}: {f.message}{f.delta!==undefined?` · chênh lệch ${f.delta}`:''}</p><details><summary>Nguồn chênh lệch</summary><pre className="text-xs overflow-auto max-h-40">{JSON.stringify(f.refs,null,2)}</pre></details></div>)}
    <details><summary className="cursor-pointer text-cyan-300">Nguồn RAW của phép đối chiếu</summary><pre className="text-xs overflow-auto max-h-40">{JSON.stringify(c.evidence,null,2)}</pre></details>
   </li>)}</ul>
   <details><summary>Phạm vi và dữ liệu còn thiếu</summary><pre className="text-xs overflow-auto">{JSON.stringify(CONTROL_POLICY,null,2)}</pre></details>
   <div className="space-y-2 text-sm">
    <h4 className="font-bold">Giải trình / yêu cầu người khác review</h4>
    <p className="text-amber-300">Tên do người dùng tự khai, chưa xác thực vai trò. Yêu cầu review không phải phê duyệt và không xóa chênh lệch.</p>
    <label className="block">Control<select aria-label="Control cần giải trình" value={selected} onChange={e=>setSelected(e.target.value)} className="ml-2 bg-slate-800">{work.run.controls.map(c=><option key={c.id}>{c.id}</option>)}</select></label>
    <label className="block">Người giải trình<input aria-label="Người giải trình" className="block w-full bg-slate-800 p-2" maxLength={100} value={actor} onChange={e=>setActor(e.target.value)}/></label>
    <label className="block">Giải trình<textarea aria-label="Giải trình" className="block w-full bg-slate-800 p-2" maxLength={2000} value={note} onChange={e=>setNote(e.target.value)}/></label>
    <label className="block">Tham chiếu bằng chứng (mỗi dòng một tham chiếu)<textarea aria-label="Tham chiếu bằng chứng" className="block w-full bg-slate-800 p-2" value={evidence} onChange={e=>setEvidence(e.target.value)}/></label>
    <div className="flex gap-3"><button disabled={busy} className="text-cyan-300 underline" onClick={()=>record('EXPLAIN')}>Lưu giải trình</button><button disabled={busy} className="text-cyan-300 underline" onClick={()=>record('REQUEST_REVIEW')}>Yêu cầu review</button><button disabled={busy} className="text-cyan-300 underline" onClick={exportCase}>Tải hồ sơ đối soát và nhật ký</button></div>
    <ol>{work.events.map(e=><li key={e.sequence}>{e.sequence}. {e.controlId} · {e.action} · {e.actor} · {e.note}</li>)}</ol>
   </div>
   <ManufacturingMartPanel quality={quality} work={work} snapshots={snapshots}/>
  </>}
 </section>;
}
