import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createEvidencePack,verifyEvidencePack} from '../src/evidence/pack';
import {expectedCases,evidenceCase} from './p0-evidence-fixture';
const dir=resolve('docs-cloud/s6/review-cases');mkdirSync(dir,{recursive:true});
function preserve(name:string,text:string){const path=resolve(dir,name);if(!path.startsWith(dir+'/')&&!path.startsWith(dir+'\\'))throw new Error('Invalid output');if(existsSync(path)){if(readFileSync(path,'utf8')!==text)throw new Error('Refuse to overwrite different evidence');return;}writeFileSync(path,text,{encoding:'utf8',flag:'wx'});}
const cases=expectedCases.filter((e:any)=>(e.src.includes('canon')&&e.pct===-3.5&&e.ratio===0.5)||(e.src.includes('samsung')&&e.pct===3.5&&e.ratio===1)||(e.src.includes('samsung')&&e.pct===0&&e.ratio===0));
const summaries:any[]=[];
for(const e of cases){const c=await evidenceCase(e),p=await createEvidencePack(c.snapshots,c.work,c.mart),v=await verifyEvidencePack(p.text,p.sha256);if(v.technicalStatus!=='PASS')throw new Error('Replay failure');
 const name=`${e.src}_${e.stock}_${e.pct}_${e.ratio}_P0.json`,expected={standard_cost:e.P,actual_cost:e.actual,variance:e.delta,wip:e.wip154_dr_minus_cr,revenue:e.revenue_recognized,cogs:e.revenue_recognized-e.gp911_credit,gross_profit:e.gp911_credit};
 const checks=Object.entries(expected).map(([id,value])=>({id,expected:value,actual:c.mart.metrics.find(m=>m.id===id)!.value,difference:Number(c.mart.metrics.find(m=>m.id===id)!.value)-Number(value)}));
 if(checks.some(x=>x.difference!==0))throw new Error('Oracle difference');preserve(name,p.text);summaries.push({case:{src:e.src,stock:e.stock,pct:e.pct,ratio:e.ratio},file:name,fileSha256:p.sha256,bytes:p.bytes,checks,technicalReplay:'PASS',businessAcceptance:'NOT_APPROVED',expectedSource:'Historical Python technical oracle; pending human golden',controlGaps:c.mart.businessGaps});
}
preserve('case-index.json',JSON.stringify({version:'p0-review-evidence-1',approval:'NOT_APPROVED',cases:summaries},null,2)+'\n');
const rows=summaries.map(s=>`| ${s.case.src} / ${s.case.stock} / ${s.case.pct}% / giao ${s.case.ratio*100}% | [JSON](${s.file}) | ${s.checks.length} chỉ tiêu, diff 0 | Chưa nghiệm thu |`).join('\n');
preserve('README.md',`# Ca review P0 có evidence chạy lại\n\n6 ca đề xuất, nguồn số kỳ vọng là historical technical oracle, chưa phải golden được người review phê duyệt. Mỗi JSON chứa 11 RAW/manifest/CLEAN + CONTROL + MART/C08; kiểm SHA và chạy lại kỹ thuật đạt. Không dùng PASS thay nghiệm thu SAP/TT99.\n\n| Ca | Hồ sơ | Đối chiếu | Nghiệp vụ |\n|---|---|---|---|\n${rows}\n\n[Expected/actual/diff và hash](case-index.json). Trong app: tạo MART → Hồ sơ P0 → chọn file JSON này để chạy lại (nếu app đã xuất file của kịch bản khác, so sánh hash sẽ chặn; tải lại/chọn đúng ca). CLI: npm run verify:p0-evidence -- <absolute-file-path> <SHA256-from-case-index>. Đây là file sinh bởi script review, chưa phải bằng chứng browser download.\n`);
console.log(`Prepared${summaries.length} reviewpackages;7oraclechecks/case, replayPASS, humanapprovalNOT_APPROVED; output${dir}`);
