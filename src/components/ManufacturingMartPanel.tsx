import React,{useState} from 'react';
import {EvidencePackPanel} from './EvidencePackPanel';
import type {exportReportSnapshot} from '../reports/snapshot';
import type {AdapterResult} from '../adapters/framework';
import type {ControlCase} from '../controls/workflow';
import {buildManufacturingMart,type ManufacturingMart} from '../mart/manufacturing';
import {createFacts,validateFacts,displayMetric,exportMart} from '../mart/commentary';
export function ManufacturingMartPanel({quality,work,snapshots}:{quality:readonly AdapterResult[];work:ControlCase;snapshots:Awaited<ReturnType<typeof exportReportSnapshot>>}){
 const [mart,setMart]=useState<ManufacturingMart|null>(null),[savedKey,setSavedKey]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const currentKey=JSON.stringify(work),current=savedKey===currentKey?mart:null;
 const generate=async()=>{setBusy(true);setError('');setMart(null);try{const m=await buildManufacturingMart(quality,work);const c08=await validateFacts(m,createFacts(m));if(c08.numericTraceability!=='PASS')throw new Error('Không công bố facts: C08 bị chặn.');setMart(m);setSavedKey(currentKey);}catch(e){setError(e instanceof Error?e.message:'Không dựng được phân tích.');}finally{setBusy(false);}};
 const download=async()=>{if(!current)return;setBusy(true);setError('');try{const f=await exportMart(current);for(const [name,text] of [[f.fileName,f.text],[`${f.fileName}.manifest.json`,JSON.stringify(f.manifest,null,2)]]){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}catch(e){setError(e instanceof Error?e.message:'Không xuất được MART.');}finally{setBusy(false);}};
 return <section aria-label="Manufacturing Analytics" className="border-t border-slate-700 pt-4 space-y-3">
  <h3 className="font-bold text-cyan-300">Phân tích Manufacturing · thử nghiệm</h3>
  <p className="text-sm text-amber-300">Chỉ phân tích dữ liệu mô phỏng đã khớp kiểm tra kỹ thuật. Chưa nghiệm thu nghiệp vụ; chưa được dùng làm báo cáo quản trị chính thức.</p>
  <button disabled={busy||!!current||work.run.technicalStatus!=='PASS'} className="rounded bg-cyan-800 px-4 py-2 disabled:opacity-40" onClick={generate}>Tạo phân tích từ CLEAN đã đối soát</button>
  {error&&<p role="alert" className="text-red-300">{error}</p>}
  {current&&<>
   <p className="text-sm">C08: số liệu và nhận xét truy vết khớp. Phê duyệt nghiệp vụ: đang chờ.</p>
   <p className="text-sm text-amber-300">Chi phí sản xuất và chênh lệch tính cho toàn lệnh; doanh thu/giá vốn/lợi nhuận tính theo phần đã ghi nhận. Delta yếu tố chi phí chưa chứng minh nguyên nhân.</p>
   <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{current.metrics.map(m=><div key={m.id} className="rounded border border-slate-700 p-3 text-sm"><p>{m.label}</p><p className="font-bold text-cyan-200">{displayMetric(m)}</p><details><summary className="cursor-pointer text-cyan-300">Xem cơ sở và nguồn số liệu</summary><p>{m.basis} · {m.formula}</p>{m.unavailableReason&&<p>{m.unavailableReason}</p>}<pre className="text-xs overflow-auto max-h-40">{JSON.stringify(m.refs,null,2)}</pre></details></div>)}</div>
   <h4 className="font-bold text-sm">Cầu nối chi phí toàn lệnh</h4>
   <div className="overflow-auto"><table className="text-sm w-full"><thead><tr><th className="text-left">Yếu tố</th><th>Kế hoạch (VND)</th><th>Thực tế (VND)</th><th>Chênh lệch (VND)</th></tr></thead><tbody>{current.costElements.map(e=><tr key={e.account}><td>{e.label}<details><summary>Nguồn</summary><pre className="text-xs max-h-40 overflow-auto">{JSON.stringify(e.refs,null,2)}</pre></details></td><td className="text-right">{e.planned.toLocaleString('vi-VN')}</td><td className="text-right">{e.actual.toLocaleString('vi-VN')}</td><td className="text-right">{e.delta.toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div>
   <h4 className="font-bold text-sm">Nhận xét có căn cứ số liệu</h4><ul className="text-sm space-y-2">{createFacts(current).map(f=><li key={f.metricId}>{f.text}</li>)}</ul>
   <p className="text-sm text-amber-300">Chưa xác định nguyên nhân giá, tiêu hao hoặc năng suất. Cần dữ liệu và người review độc lập trước khi kết luận.</p>
   <button disabled={busy} className="text-cyan-300 underline" onClick={download}>Tải phân tích và hồ sơ truy vết</button>
   <details><summary>Giới hạn và nghiệm thu còn thiếu</summary><ul className="text-sm">{current.limitations.map((l,i)=><li key={i}>{l}</li>)}</ul><pre className="text-xs overflow-auto">{JSON.stringify(current.businessGaps,null,2)}</pre></details>
   <EvidencePackPanel snapshots={snapshots} work={work} mart={current}/>
  </>}
 </section>;
}
