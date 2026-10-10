import React,{useState} from 'react';
import type {exportReportSnapshot} from '../reports/snapshot';
import type {ControlCase} from '../controls/workflow';
import type {ManufacturingMart} from '../mart/manufacturing';
import {createEvidencePack,verifyEvidencePack,MAX_PACK_BYTES} from '../evidence/pack';
export function EvidencePackPanel({snapshots,work,mart}:{snapshots:Awaited<ReturnType<typeof exportReportSnapshot>>;work:ControlCase;mart:ManufacturingMart}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[artifact,setArtifact]=useState<Awaited<ReturnType<typeof createEvidencePack>>|null>(null),[verification,setVerification]=useState<Awaited<ReturnType<typeof verifyEvidencePack>>|null>(null);
 const generate=async()=>{setBusy(true);setError('');try{const f=await createEvidencePack(snapshots,work,mart);setArtifact(f);setVerification(null);const url=URL.createObjectURL(new Blob([f.text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=f.fileName;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(e instanceof Error?e.message:'Không xuất được hồ sơ.');}finally{setBusy(false);}};
 const verify=async(file:File|undefined)=>{if(!file)return;setBusy(true);setError('');setVerification(null);try{if(file.size>MAX_PACK_BYTES)throw new Error('Giới hạn hồ sơ 8 MiB.');setVerification(await verifyEvidencePack(new Uint8Array(await file.arrayBuffer()),artifact?.sha256));}catch(e){setError(e instanceof Error?e.message:'Không kiểm được hồ sơ.');}finally{setBusy(false);}};
 return <section aria-label="P0 Evidence" className="border-t border-slate-700 pt-4 space-y-3 text-sm">
  <h4 className="font-bold text-cyan-300">Hồ sơ review P0 · một file</h4>
  <p>Gồm 11 RAW và manifest, CLEAN, CONTROL/nhật ký, MART và nhận xét. Khi mở lại, chạy đối chiếu toàn chuỗi để phát hiện hồ sơ bị sửa. Chưa phải phê duyệt nghiệp vụ.</p>
  <button disabled={busy} className="text-cyan-300 underline" onClick={generate}>Tải một hồ sơ P0 để review</button>
  {artifact&&<div><p>{artifact.fileName} · {artifact.bytes}bytes</p><p className="break-all">SHA256file: {artifact.sha256}</p></div>}
  <label className="block">Kiểm tra lại hồ sơ đã lưu (chỉ JSON mô phỏng)<input aria-label="Kiểm tra hồ sơ P0 đã lưu" type="file" accept=".json" disabled={busy} onChange={e=>{const f=e.target.files?.[0];e.target.value='';void verify(f);}} className="block mt-2"/></label>
  {error&&<p role="alert" className="text-red-300">{error}</p>}
  {verification&&<div className={verification.technicalStatus==='PASS'?'text-cyan-200':'text-red-300'}><p>{verification.technicalStatus==='PASS'?'Hồ sơ khớp khi chạy lại; nghiệm thu nghiệp vụ vẫn đang chờ.':'Hồ sơ bị chặn; không dùng để nghiệm thu.'}</p><pre className="text-xs overflow-auto max-h-60">{JSON.stringify(verification,null,2)}</pre></div>}
  <p className="text-amber-300">Hash không xác thực người phê duyệt. File chọn phải được bạn thực sự lưu; bấm nút tải hoặc test trong RAM không chứng minh browser đã lưu file.</p>
 </section>;
}
