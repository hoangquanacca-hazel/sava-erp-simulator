from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import json,re,hashlib,html,zipfile,subprocess

ROOT=Path(__file__).resolve().parents[1]
PUB=ROOT/'public/sap-reporting'
DOC=ROOT/'docs/reporting-library/expansion-150'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def save(p,data):p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
model=load(PUB/'expansion-150.json');master=load(PUB/'report-master-dictionary.json');progress=load(PUB/'progress.json');manifest=load(ROOT/'scripts/reporting-library-release-manifest.json')
if not(DOC/'baseline.json').exists():
 save(DOC/'baseline.json',{'commit':'43e4fb6a09e9c89e287905381f137f85d07e4a6b','old_ids':[r['id']for r in master['all_reports']],'old_reports':master['all_reports'],'old_files':manifest['files'],'old_progress':progress})
baseline=load(DOC/'baseline.json')
assert len(baseline['old_ids'])==71 and len(model['reports'])==79
newids={r['id']for r in model['reports']};assert not(newids&set(baseline['old_ids']))
master['expansion_reports']=model['reports'];master['all_reports']=baseline['old_reports']+model['reports'];assert len({r['id']for r in master['all_reports']})==150
module_counts=dict(Counter(r['module']for r in master['all_reports']))
master['report_master_counts']={'total_profiles':150,'by_module':module_counts,'native_exports':0,'full_company_catalog_verified':False,'new_proposed_profiles':79,'counting_rule':'Unique authored profile IDs; includes display/master/worklists/run evidence/derived analysis; not150 certified SAP outputs.'}
master['metadata']['all_reports_count']=150;master['metadata']['all_reports_as_of']='2026-10-13';master['metadata']['phase1_metadata_is_historical']=True
save(PUB/'report-master-dictionary.json',master)
progress.update(date='2026-10-13',authored_profiles=150,percent_quantity=100.0,remaining_budget=0,profiles_with_dedicated_csv_xlsx_samples=150,profiles_without_dedicated_samples=[],variant_count_including_technical_extracts=204,xlsx=204,csv=408,by_module=module_counts,release_version='2026-10-13-150-authored-profiles',public_deployment='AUTHORIZED_GIT_RELEASE_2026-10-13')
progress['packages']=[p for p in progress['packages']if p['name']!='expansion-150']+[{'name':'expansion-150','profiles':79,'variants':79,'xlsx':79,'csv':158}]
progress['quality_counts']={'new_proposed_layouts':79,'new_native_layouts_verified':0,'native_exports':0,'company_release_verified':False,'sap_sme_acceptance':'NOT_RUN','quantity_target_reached_is_not_quality_acceptance':True}
save(PUB/'progress.json',progress)
s=subprocess.check_output(['git','show',baseline['commit']+':public/sap-reporting/index.html']).decode('utf8').replace('\r\n','\n')
class Sections(HTMLParser):
 def __init__(self,source):super().__init__();self.starts=[0];self.depth=0;self.end=None;[self.starts.append(m.end())for m in re.finditer('\n',source)]
 def char_offset(self):row,column=self.getpos();return self.starts[row-1]+column
 def handle_starttag(self,tag,attrs):
  if tag=='section':
   if self.depth:self.depth+=1
   elif dict(attrs).get('id')=='catalog':self.depth=1
 def handle_endtag(self,tag):
  if tag=='section'and self.depth:
   self.depth-=1
   if self.depth==0 and self.end is None:self.end=self.char_offset()
parser=Sections(s);parser.feed(s);assert parser.end is not None
existing=set(re.findall(r'<details[^>]*class="report"[^>]*id="([^"]+)"',s))
esc=lambda x:html.escape(str(x or ''),quote=True)
def card(r):
 id=r['id'];title=r.get('title')or r.get('name')or r.get('name_vi')or id;tcode=r.get('tcode')or r.get('fiori_app')or 'Phân tích quản trị'
 viewer=('expansion-150.html#'+id)if id in newids else r.get('viewer')or ('fi-aa.html#'+id if r['module']=='FI-AA'else'supplemental.html#'+id if id=='FI17'else'operations.html#'+id)
 v=next((v for v in model['variants']if v['report_id']==id),None)
 body='<p>'+esc(r.get('purpose')or title)+'</p><p><b>Grain:</b> '+esc(r.get('grain')or'Xem hồ sơ đầy đủ')+'</p>'
 body+='<p><a class="download" href="./'+esc(viewer)+'">Xem toàn bộ mẫu và tải CSV/XLSX</a></p>'
 if v:
  body+='<p>Mẫu đề xuất SAVA: '+str(len(v['columns']))+' trường, thứ tự chưa chứng nhận từ export SAP.</p><div class="table-scroll"><table><thead><tr>'+''.join('<th>'+esc(f['label'])+'</th>'for f in v['columns'])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+esc(c)+'</td>'for c in row)+'</tr>'for row in v['detail_rows'])+'</tbody></table></div>'
  body+='<p>'+''.join('<a class="download" style="margin-right:12px" download href="./expansion-150-downloads/'+v['id']+ext+'">'+label+'</a>'for ext,label in[('.layout.csv','CSV bố cục'),('.flat.csv','CSV bảng phẳng'),('.xlsx','XLSX')])+'</p>'
  body+='<details class="report-guide"><summary>Cách chạy, đọc, IFRS, kiểm soát và nguồn</summary><div>'+''.join('<h3>'+label+'</h3><p>'+esc(r[key])+'</p>'for key,label in[('selection','Chạy và export'),('reading','Đọc mẫu'),('reconciliation','Đối chiếu'),('ifrs','IFRS'),('lineage','Data lineage')])+'<p><a href="'+esc(r['source_url'])+'" target="_blank" rel="noopener noreferrer">Nguồn ngữ cảnh SAP</a>. Layout, field catalog và hệ mục tiêu chưa xác minh.</p></div></details>'
 return '<details class="report" data-module="'+esc(r['module'])+'" data-kind="'+esc(r.get('kind')or'NEW_BUSINESS_REPORT')+'" id="'+id+'"><summary><span class="id">'+id+'</span> '+esc(title)+' <small>'+esc(tcode)+'</small></summary><div class="inside">'+body+'</div></details>'
cards=''.join(card(r)for r in master['all_reports']if r['id']not in existing)
s=s[:parser.end]+cards+s[parser.end:]
s=s.replace('<b>71</b> hồ sơ','<b>150</b> hồ sơ').replace('<b>125</b> mẫu CSV/XLSX','<b>204</b> mẫu CSV/XLSX').replace('<b>6</b> nhóm thư viện','<b>7</b> nhóm thư viện').replace('71 hồ sơ /125 mẫu','150 hồ sơ /204 mẫu').replace('từ Giai đoạn 1 đến 12/10/2026','từ Giai đoạn 1 đến 13/10/2026')
if 'data-expansion-nav'not in s:s=s.replace('<nav><a data-operations-nav','<nav><a data-expansion-nav href="./expansion-150.html">79 hồ sơ bổ sung · đầy đủ150</a><a data-operations-nav',1)
s=s.replace("count+' / 48 hồ sơ'","count+' / 150 hồ sơ'")
# Historical JSON sample handler applies to its buttons, not CSV/XLSX navigation anchors.
s=s.replace("document.querySelectorAll('.download').forEach(b=>b.addEventListener", "document.querySelectorAll('button.download[data-report]').forEach(b=>b.addEventListener")
# Repair the malformed historical kind option while extending the same library filter.
kinds=sorted({r.get('kind')or'NEW_BUSINESS_REPORT'for r in master['all_reports']})
s=re.sub(r'<select id="kind".*?</select>','<select id="kind" aria-label="Loại hồ sơ"><option value="">Tất cả loại</option>'+''.join('<option value="'+esc(k)+'">'+esc(k)+'</option>'for k in kinds)+'</select>',s,count=1,flags=re.S)
modules=['FI','CO','MM','FI-AA','PP','SD','QM','PM']
s=re.sub(r'<select id="module".*?</select>','<select id="module" aria-label="Phân hệ"><option value="">Tất cả phân hệ</option>'+''.join('<option value="'+m+'">'+m+'</option>'for m in modules)+'</select>',s,count=1,flags=re.S)
(PUB/'index.html').write_text(s,encoding='utf8')
assert len(re.findall(r'<details[^>]*class="report"',s))==150
# Update only the existing isolated navigation text; no app logic or CSS.
p=ROOT/'index.html';nav=p.read_bytes().decode('utf8');nav=nav.replace('71 hồ sơ','150 hồ sơ').replace('125 mẫu','204 mẫu');p.write_bytes(nav.encode('utf8'))
entries=[]
for v in model['variants']:
 for ext in['.xlsx','.layout.csv','.flat.csv']:
  p=PUB/'expansion-150-downloads'/(v['id']+ext);b=p.read_bytes();entries.append({'file':p.name,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'native_export':False})
README='SAVA — 79 hồ sơ bổ sung /158 CSV /79 XLSX. Tất cả là schema/layout đề xuất và dữ liệu tổng hợp, không phải SAP original export.\nLayout giữ title/context/header/detail; Flat input chỉ gồm detail. Fields trong XLSX giải thích từng cột, provenance và quy tắc làm sạch.\nMỗi mẫu có4 ca: baseline tổng hợp, thiếu giá trị, locale châu Âu và khóa trùng cố ý. Không bỏ các ca lỗi như dữ liệu thật trước khi lưu exception/lineage.\nRAW là chuỗi; XLSX giữ số0 đầu. CSV UTF8BOM/comma/CRLF do SAVA chọn, chưa xác minh delimiter/encoding SAP công ty.\nNguồn SAP chỉ dẫn link, không tái phân phối PDF/ảnh. Không có dữ liệu công ty và không kết nối SAP.\n'
with zipfile.ZipFile(PUB/'expansion-150-downloads/SAVA-79-ADDITIONAL-PROFILES.zip','w',zipfile.ZIP_DEFLATED)as z:
 for e in entries:z.write(PUB/'expansion-150-downloads'/e['file'],e['file'])
 z.writestr('manifest.json',json.dumps(entries,ensure_ascii=False,indent=2));z.writestr('README.txt',README)
manifest.update(authored_profiles=150,variants=204,previous_main='43e4fb6a09e9c89e287905381f137f85d07e4a6b',version=2)
manifest['files']=[{'path':str(p.relative_to(PUB)).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}for p in sorted(PUB.rglob('*'))if p.is_file()]
save(ROOT/'scripts/reporting-library-release-manifest.json',manifest)
save(DOC/'integration.json',{'status':'LOCAL_CANDIDATE','profiles':150,'variants':204,'library_files':len(manifest['files']),'by_module':module_counts,'old_profile_objects_preserved':71,'new_proposed_profiles':79,'native_exports':0,'quantity_percent':100,'business_acceptance':'NOT_RUN'})
print('Integrated150 unique profiles; original71 objects preserved; byte manifest updated intentionally.')
