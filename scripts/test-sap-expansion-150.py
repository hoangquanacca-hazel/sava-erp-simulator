from pathlib import Path
from collections import Counter
from urllib.parse import urlparse
import csv,json,hashlib,zipfile,xml.etree.ElementTree as ET,re,posixpath

ROOT=Path(__file__).resolve().parents[1];PUB=ROOT/'public/sap-reporting';DOC=ROOT/'docs/reporting-library/expansion-150'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
model=read(PUB/'expansion-150.json');master=read(PUB/'report-master-dictionary.json');progress=read(PUB/'progress.json');baseline=read(DOC/'baseline.json')
assert len(model['reports'])==79 and len(model['variants'])==79
assert len(master['all_reports'])==len({r['id']for r in master['all_reports']})==150
assert master['all_reports'][:71]==baseline['old_reports']
assert Counter(r['module']for r in master['all_reports'])=={'FI':30,'CO':30,'MM':30,'FI-AA':7,'PP':20,'SD':15,'QM':10,'PM':8}
assert progress['authored_profiles']==150 and progress['native_exports']==0
assert model['synthetic_data']and not model['native_export']
allowed_changes={'index.html','progress.json','report-master-dictionary.json'}
preserved=[]
for f in baseline['old_files']:
 if f['path']not in allowed_changes:
  assert hashlib.sha256((PUB/f['path']).read_bytes()).hexdigest()==f['sha256'],f['path'];preserved.append(f['path'])

NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def cells_from_xlsx(p):
 with zipfile.ZipFile(p)as z:
  assert z.testzip()is None
  strings=[]
  if 'xl/sharedStrings.xml'in z.namelist():strings=[''.join(si.itertext())for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
  rels={r.attrib['Id']:r.attrib['Target']for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
  sheets=ET.fromstring(z.read('xl/workbook.xml')).find('s:sheets',NS);out={}
  for s in sheets:
   target=rels[s.attrib['{'+NS['r']+'}id']];name=target.lstrip('/')if target.startswith('/')else posixpath.normpath('xl/'+target)
   out[s.attrib['name']]={}
   for c in ET.fromstring(z.read(name)).findall('.//s:sheetData/s:row/s:c',NS):
    assert c.find('s:f',NS)is None,'Unexpected formula in raw teaching input'
    kind=c.attrib.get('t');v=c.find('s:v',NS)
    if kind=='inlineStr':value=''.join(c.find('s:is',NS).itertext())
    elif kind=='s':value=strings[int(v.text)]
    else:value=v.text if v is not None else''
    out[s.attrib['name']][c.attrib['r']]=(value,kind)
  return out
def col(index):
 s='';index+=1
 while index:index,rem=divmod(index-1,26);s=chr(65+rem)+s
 return s
def compare(sheet,matrix,row_start=1):
 for i,row in enumerate(matrix,row_start):
  for j,value in enumerate(row):assert sheet.get(col(j)+str(i),('',None))[0]==str(value),('cell mismatch',i,j,value,sheet.get(col(j)+str(i)))

results=[];fields_total=0
for r in model['reports']:
 v=next(v for v in model['variants']if v['report_id']==r['id']);assert len(r['fields'])>=17
 assert len(set(r['columns']))==len(r['columns'])and all(k in r['columns']for k in r['keys'])
 assert [f['position']for f in r['fields']]==list(range(1,len(r['fields'])+1))
 assert all(f['evidence']=='SAVA_PROPOSED'and f['technical_name']is None and not f['source_label_verified']for f in r['fields'])
 for f in r['fields']:
  if f['label']in['Sender Credit','Receiver Debit','Price Unit','Conversion Numerator','Conversion Denominator','Dunning Fee','Opening Balance','Closing Balance']:assert f['type']=='raw_decimal','Amount/unit divisor misclassified as identifier'
 assert urlparse(r['source_url']).hostname=='help.sap.com'
 assert not v['native_export']and not v['full_sap_catalog_verified']and v['observed_source_field_count']==0
 assert all(r.get(k)for k in['purpose','selection','reading','reconciliation','control','ifrs','lineage','source_evidence'])
 assert len(v['detail_rows'])==4 and all(len(row)==len(r['fields'])for row in v['detail_rows'])
 key_indices=[r['columns'].index(k)for k in r['keys']];keys=[tuple(row[i]for i in key_indices)for row in v['detail_rows']]
 assert keys[3]==keys[0]and len(set(keys))==3,'Negative duplicate fixture not preserved'
 numeric=[i for i,f in enumerate(r['fields'])if f['type']=='raw_decimal'and f['key']not in r['keys']]
 if numeric:assert v['detail_rows'][1][numeric[0]]==''and v['detail_rows'][2][numeric[0]]=='1.234,50'
 flat=[r['columns']]+v['detail_rows']
 raw=[]
 for row in v['display']:
  rr=[]
  for cell in row['cells']:rr.extend([cell['text']]+['']*(cell['span']-1))
  raw.append(rr)
 folder=PUB/'expansion-150-downloads'
 for suffix,expected in[('.flat.csv',flat),('.layout.csv',raw)]:
  p=folder/(v['id']+suffix);data=p.read_bytes();assert data.startswith(b'\xef\xbb\xbf')and b'\r\n'in data
  with p.open(encoding='utf-8-sig',newline='')as f:assert list(csv.reader(f))==expected
 sheets=cells_from_xlsx(folder/(v['id']+'.xlsx'));assert list(sheets)==['Layout','Flat input','Fields']
 compare(sheets['Flat input'],flat);compare(sheets['Layout'],raw,4)
 compare(sheets['Fields'],[['Vị trí','Nhãn đề xuất','Kiểu RAW','Diễn giải tiếng Việt','Bằng chứng / tên kỹ thuật','Quy tắc làm sạch']]+[[str(f['position']),f['label'],f['type'],f['meaning'],'SAVA_PROPOSED / chưa xác minh',f['cleaning_rule']]for f in r['fields']])
 assert sheets['Fields']['B'+str(len(r['fields'])+3)][0]==r['source_url']
 for i,f in enumerate(r['fields']):
  if f['type']=='text'and re.fullmatch(r'0+\d+',v['detail_rows'][0][i]):assert sheets['Flat input'][col(i)+'2'][1]in['s','inlineStr','str'],'Identifier converted to numeric'
  if f['type']=='raw_date':assert sheets['Flat input'][col(i)+'2'][1]in['s','inlineStr','str'],'RAW date converted unexpectedly'
 fields_total+=len(r['fields']);results.append({'id':r['id'],'fields':len(r['fields']),'all_cells':'PASS','duplicate_and_missing_fixtures':'PASS'})
with zipfile.ZipFile(PUB/'expansion-150-downloads/SAVA-79-ADDITIONAL-PROFILES.zip')as z:
 assert z.testzip()is None and len(z.namelist())==239
 for e in json.loads(z.read('manifest.json')):assert hashlib.sha256(z.read(e['file'])).hexdigest()==e['sha256']
catalog=(PUB/'index.html').read_text(encoding='utf8');ids=re.findall(r'<details[^>]*class="report"[^>]*id="([^"]+)"',catalog);assert len(ids)==len(set(ids))==150 and set(ids)=={r['id']for r in master['all_reports']}
result={'status':'PASS','profiles':150,'new_profiles':79,'variants':204,'new_fields':fields_total,'new_xlsx':79,'new_csv':158,'prior_files_preserved':len(preserved),'all_saved_cell_checks':results,'original_sap_exports':0,'company_release_sap_sme_acceptance':'NOT_VERIFIED','spreadsheet_desktop_open':'NOT_RUN'}
def base(id):
 r=next(r for r in model['reports']if r['id']==id);v=next(v for v in model['variants']if v['report_id']==id);return dict(zip(r['columns'],v['detail_rows'][0]))
def num(row,key):return float(row[key])
golden=[]
for id,equation in[
 ('FI18',lambda d:num(d,'Debit Amount')-num(d,'Credit Amount')==num(d,'Difference')),
 ('FI20',lambda d:num(d,'Invoice Amount')-num(d,'Discount Amount')==num(d,'Payment Amount')),
 ('CO19',lambda d:num(d,'Fixed Price')+num(d,'Variable Price')==num(d,'Total Price')),
 ('CO22',lambda d:num(d,'Actual Amount')+num(d,'Commitment Amount')==num(d,'Assigned Amount')and num(d,'Released Budget')-num(d,'Assigned Amount')==num(d,'Available Budget')),
 ('CO23',lambda d:num(d,'Sender Credit')==num(d,'Receiver Debit')==num(d,'Allocated Amount')),
 ('CO25',lambda d:num(d,'Activity Quantity')*num(d,'Price')/num(d,'Price Unit')==num(d,'Allocated Amount')),
 ('MM24',lambda d:num(d,'Stored Quantity')-num(d,'Calculated Quantity')==num(d,'Difference')),
 ('MM26',lambda d:num(d,'Consumption Quantity')/num(d,'Average Stock Quantity')==num(d,'Inventory Turnover')),
 ('MM27',lambda d:num(d,'Count Quantity')-num(d,'Book Quantity')==num(d,'Difference')),
 ('PP10',lambda d:num(d,'Available Capacity')-num(d,'Required Capacity')==num(d,'Remaining Capacity')and abs(num(d,'Required Capacity')/num(d,'Available Capacity')*100-num(d,'Utilization'))<1e-7),
 ('QM05',lambda d:num(d,'Accepted Quantity')+num(d,'Rejected Quantity')+num(d,'Blocked Quantity')==num(d,'Lot Quantity'))
]:
 assert equation(base(id)),('Independent arithmetic fixture failed',id);golden.append(id)
result['independent_arithmetic_fixtures']=golden
(DOC/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'PASS:150IDs,79XLSX/158CSV all cells, {fields_total} proposed fields,239 ZIP entries,{len(preserved)} prior files unchanged.')
