from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import json,re,html,hashlib,zipfile,subprocess
ROOT=Path(__file__).resolve().parents[1];PUB=ROOT/'public/sap-reporting';DOC=ROOT/'docs/reporting-library/priority-24'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
model=read(PUB/'priority-24.json');baseline=read(DOC/'baseline.json');master=read(PUB/'report-master-dictionary.json');progress=read(PUB/'progress.json')
new=[r for r in model['reports']if r['new_profile']];assert len(new)==10
master['all_reports']=baseline['reports']+new;assert len({r['id']for r in master['all_reports']})==160
master['priority_24_reports']=new;master['priority_24_registry']=model['priorities'];counts=dict(Counter(r['module']for r in master['all_reports']))
master['metadata'].update(all_reports_count=160,all_reports_as_of='2026-10-13');master['report_master_counts'].update(total_profiles=160,by_module=counts,priority_new_profiles=10,counting_rule='Unique authored profile IDs; variants and corrected entrypoints do not each count as a profile. No SAP native acceptance.')
save(PUB/'report-master-dictionary.json',master)
progress.update(authored_profiles=160,profiles_with_dedicated_csv_xlsx_samples=160,variant_count_including_technical_extracts=227,xlsx=227,csv=454,by_module=counts,release_version='2026-10-13-160-profiles-priority-24',percent_quantity=100.0)
progress['packages']=[p for p in progress['packages']if p['name']!='priority-24']+[dict(name='priority-24',profiles=10,variants=23,xlsx=23,csv=46)]
progress['phase_status']=model['phase_status'];progress['all_three_phases_complete']=False;progress['priority_24']={'business_needs':24,'new_variants':23,'reused_source_variant':'CO11-02','new_profiles':10,'native_exports':0,'observed_export_field_labels':0,'target_release':'UNKNOWN','business_acceptance':'NOT_RUN'}
save(PUB/'progress.json',progress)
s=subprocess.check_output(['git','show',baseline['commit']+':public/sap-reporting/index.html']).decode('utf8').replace('\r\n','\n')
esc=lambda v:html.escape(str(v or ''),quote=True)
class Sections(HTMLParser):
 def __init__(self,source):super().__init__();self.starts=[0]+[m.end()for m in re.finditer('\n',source)];self.depth=0;self.end=None
 def handle_starttag(self,t,a):
  if t=='section':
   if self.depth:self.depth+=1
   elif dict(a).get('id')=='catalog':self.depth=1
 def handle_endtag(self,t):
  if t=='section'and self.depth:
   self.depth-=1
   if not self.depth and self.end is None:r,c=self.getpos();self.end=self.starts[r-1]+c
p=Sections(s);p.feed(s);assert p.end
def card(r):
 v=next(v for v in model['variants']if v['report_id']==r['id']);title=esc(r['title'])
 return '<details class="report" data-module="'+r['module']+'" data-kind="'+r['kind']+'" id="'+r['id']+'"><summary><span class="id">'+r['id']+'</span> '+title+' <small>'+esc(r['tcode'])+'</small></summary><div class="inside"><p>'+title+'</p><p><a class="download" href="./priority-24.html#'+v['id']+'">Xem mẫu ngay và tải CSV/XLSX</a></p><p>Dữ liệu tổng hợp SAVA; cấu trúc và thứ tự xuất SAP chưa xác minh. '+str(len(v['fields']))+' trường trong view đầu tiên; các biến thể cùng nghiệp vụ giữ riêng.</p><p>'+esc(v['reconciliation'])+'</p><p><a href="'+esc(v['source_url'])+'" target="_blank" rel="noopener noreferrer">Nguồn ngữ cảnh SAP</a></p></div></details>'
s=s[:p.end]+''.join(card(r)for r in new)+s[p.end:]
for id in {p['profile_id']for p in model['priorities']} - {r['id']for r in new}:
 related=[p for p in model['priorities']if p['profile_id']==id];v=related[0]['view_id'];entries=', '.join(p['entrypoint']for p in related)
 pattern=r'(<details[^>]*class="report"[^>]*id="'+id+r'"[^>]*>.*?<div class="inside">)'
 s,n=re.subn(pattern,lambda m:m[1]+'<p data-priority-link><a href="./priority-24.html#'+v+'">Mẫu bổ sung: '+esc(entries)+'</a></p>',s,count=1,flags=re.S);assert n==1,id
s=s.replace('<b>150</b> hồ sơ','<b>160</b> hồ sơ').replace('<b>204</b> mẫu CSV/XLSX','<b>227</b> mẫu CSV/XLSX').replace('<b>7</b> nhóm thư viện','<b>8</b> nhóm thư viện').replace('150 hồ sơ /204 mẫu','160 hồ sơ /227 mẫu').replace("count+' / 150 hồ sơ'","count+' / 160 hồ sơ'")
s=s.replace('<nav><a data-expansion-nav','<nav><a data-priority-nav href="./priority-24.html">24 nhu cầu ưu tiên • đối chiếu và mẫu mới</a><a data-expansion-nav',1)
s=s.replace('79 hồ sơ bổ sung · đầy đủ150','79 hồ sơ bổ sung · baseline150')
s=s.replace('<section id="catalog">','<section id="catalog"><aside>Đã đạt số lượng150 hồ sơ ban đầu; hiện có160 hồ sơ. Chưa hoàn tất cả3 giai đoạn: độ sâu, native export, release mục tiêu và SME acceptance còn mở. <a href="./priority-24.html">Xem trạng thái và24 nhu cầu ưu tiên</a>.</aside>',1)
(PUB/'index.html').write_text(s,encoding='utf8');assert len(re.findall(r'<details[^>]*class="report"',s))==160
p=ROOT/'index.html';nav=p.read_bytes().decode('utf8').replace('150 hồ sơ','160 hồ sơ').replace('204 mẫu','227 mẫu');p.write_bytes(nav.encode('utf8'))
entries=[]
for v in model['variants']:
 for ext in ['.xlsx','.layout.csv','.flat.csv']:
  p=PUB/'priority-24-downloads'/(v['id']+ext);b=p.read_bytes();entries.append(dict(file=p.name,sha256=hashlib.sha256(b).hexdigest(),bytes=len(b),native_export=False))
with zipfile.ZipFile(PUB/'priority-24-downloads/SAVA-24-PRIORITY-NEEDS.zip','w',zipfile.ZIP_DEFLATED)as z:
 for e in entries:z.write(PUB/'priority-24-downloads'/e['file'],e['file'])
 z.writestr('manifest.json',json.dumps(entries,ensure_ascii=False,indent=2));z.writestr('README.txt','24 nhu cầu:23 view mới và1F1780 source-reference giữ nguyên trong thư viện cũ. 23XLSX/46CSV, không24 hồ sơ mới.\nDữ liệu tổng hợp SAVA; semantics tài liệu không chứng nhận tên/thứ tự cột export. Target releaseUNKNOWN.\nLayout:tham số và dữ liệu riêng. Flat input:toàn bộ trường giữ RAW text. Fields:nguồn/quy tắc làm sạch/controls/IFRSdraft. CSV UTF8BOM/comma/CRLF là quy ước SAVA.\nBaseline tách khỏi missing/locale/duplicate negative cases. Không cộng mọi dòng như sổ kế toán.\nNguồn chỉlink; không tái phân phối fileSAP công ty/ảnh/PDF. Không kết nối SAP/engine/API.\n')
manifest=read(ROOT/'scripts/reporting-library-release-manifest.json');manifest.update(authored_profiles=160,variants=227,previous_main=baseline['commit'],version=3)
manifest['files']=[dict(path=str(p.relative_to(PUB)).replace('\\','/'),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bytes=p.stat().st_size)for p in sorted(PUB.rglob('*'))if p.is_file()]
save(ROOT/'scripts/reporting-library-release-manifest.json',manifest);save(DOC/'integration.json',dict(status='LOCAL_CANDIDATE',profiles=160,variants=227,library_files=len(manifest['files']),new_profiles=10,new_views=23,reused_views=1,native_exports=0,business_acceptance='NOT_RUN'))
print('Integrated160 profiles /227 variants;150 original objects preserved.')
