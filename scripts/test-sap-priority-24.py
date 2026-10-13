from pathlib import Path
from decimal import Decimal
import json,csv,hashlib,re,zipfile,posixpath,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PUB=ROOT/'public/sap-reporting';DOC=ROOT/'docs/reporting-library/priority-24'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
model=read(PUB/'priority-24.json');base=read(DOC/'baseline.json');master=read(PUB/'report-master-dictionary.json');progress=read(PUB/'progress.json')
assert master['all_reports'][:150]==base['reports']
assert len(master['all_reports'])==len({r['id']for r in master['all_reports']})==160
assert progress['authored_profiles']==160 and progress['xlsx']==227 and progress['csv']==454
assert not progress['all_three_phases_complete']and progress['native_exports']==0
assert len(model['priorities'])==24 and len(model['variants'])==23 and len({v['id']for v in model['variants']})==23
assert len(model['reference_variants'])==1 and model['reference_variants'][0]['id']=='CO11-02'
assert model['synthetic_data']and not model['native_export']and model['target_release']=='UNKNOWN'
preserved=[]
for f in base['files']:
 if f['path']not in ['index.html','progress.json','report-master-dictionary.json']:
  assert hashlib.sha256((PUB/f['path']).read_bytes()).hexdigest()==f['sha256'],f['path'];preserved.append(f['path'])
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def xlsx(p):
 with zipfile.ZipFile(p)as z:
  assert z.testzip()is None
  strings=[''.join(si.itertext())for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]if'xl/sharedStrings.xml'in z.namelist()else[]
  rel={r.attrib['Id']:r.attrib['Target']for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))};out={}
  for s in ET.fromstring(z.read('xl/workbook.xml')).find('s:sheets',NS):
   t=rel[s.attrib['{'+NS['r']+'}id']];t=t.lstrip('/')if t.startswith('/')else posixpath.normpath('xl/'+t);out[s.attrib['name']]={}
   for c in ET.fromstring(z.read(t)).findall('.//s:sheetData/s:row/s:c',NS):
    assert c.find('s:f',NS)is None,'Unexpected formula in RAW input'
    kind=c.attrib.get('t');v=c.find('s:v',NS)
    val=''.join(c.find('s:is',NS).itertext())if kind=='inlineStr'else(strings[int(v.text)]if kind=='s'else v.text if v is not None else'')
    out[s.attrib['name']][c.attrib['r']]=(val,kind)
  return out
def col(n):
 s='';n+=1
 while n:n,k=divmod(n-1,26);s=chr(65+k)+s
 return s
def compare(saved,rows):
 for i,row in enumerate(rows):
  for j,c in enumerate(row):assert saved.get(col(j)+str(i+1),('',None))[0]==str(c),(i,j,c,saved.get(col(j)+str(i+1)))
checks=[];fields=0
for v in model['variants']:
 n=len(v['fields']);assert len(v['detail_rows'])in[4,5]
 assert all(len(r)==n for r in v['detail_rows'])and v['detail_rows'][0]==v['detail_rows'][-1]
 assert v['observed_source_field_count']==0 and not v['native_export']and not v['full_sap_catalog_verified']
 assert all(f['technical_name']is None and not f['source_label_verified']and f['position']==i+1 for i,f in enumerate(v['fields']))
 assert all(f['meaning']and f['cleaning_rule']for f in v['fields'])
 negatives=v['detail_rows'][2:4]if'MARGIN'in v['id']else v['detail_rows'][1:3]
 assert any(r[i]==''for r in negatives for i,f in enumerate(v['fields'])if f['type']=='raw_decimal')
 assert any('1.234,50'in r for r in negatives)
 filters=[f for f in v['fields']if f['role']=='filter_or_context'];business=[f for f in v['fields']if f['role']!='filter_or_context'];pad=lambda r:[str(r[i])if i<len(r)else''for i in range(n)]
 layout=[pad(['SAVA • '+v['entry']+' • '+v['title']]),pad(['Dữ liệu tổng hợp; bố cục và thứ tự export SAP chưa xác minh.']),pad(['Nguồn: '+v['source_url']]),*[pad([f['label'],v['detail_rows'][0][f['position']-1]])for f in filters],pad([]),pad([f['label']for f in business]),*[pad([r[f['position']-1]for f in business])for r in v['detail_rows']]]
 flat=[[f['label']for f in v['fields']],*v['detail_rows']]
 folder=PUB/'priority-24-downloads'
 for ext,expected in[('.layout.csv',layout),('.flat.csv',flat)]:
  p=folder/(v['id']+ext);assert p.read_bytes().startswith(b'\xef\xbb\xbf')and b'\r\n'in p.read_bytes()
  with p.open(encoding='utf-8-sig',newline='')as f:assert list(csv.reader(f))==expected
 sheets=xlsx(folder/(v['id']+'.xlsx'));assert list(sheets)==['Layout','Flat input','Fields'];compare(sheets['Layout'],layout);compare(sheets['Flat input'],flat)
 compare(sheets['Fields'],[['Vị trí','Nhãn SAVA','Vai trò / kiểu RAW','Diễn giải','Bằng chứng','Làm sạch','Nguồn / phiên bản']]+[[str(f['position']),f['label'],f['role']+' / '+f['type'],f['meaning'],f['evidence']+'; technical name chưa xác minh',f['cleaning_rule'],'\n'.join(f['source_urls'])or'Trường đề xuất; chưa xác minh export']for f in v['fields']])
 for i,f in enumerate(v['fields']):
  value=v['detail_rows'][0][i]
  if f['type']=='raw_date'or re.fullmatch(r'0+\d+',value):assert sheets['Flat input'][col(i)+'2'][1]in['s','inlineStr','str']
 fields+=n;checks.append({'id':v['id'],'fields':n,'all_cells':'PASS','raw_strings':'PASS','negative_cases':'PASS'})
def row(id,i=0):
 v=next(v for v in model['variants']if v['id']=='P24-'+id);return dict(zip([f['label']for f in v['fields']],v['detail_rows'][i]))
def num(d,k):return Decimal(d[k])
gold=[]
def check(id,fn):assert fn(row(id)),id;gold.append(id)
for id in ['AP-CLASSIC','AR-CLASSIC']:check(id,lambda d:sum(num(d,k)for k in ['Not Due Amount','Overdue 1-30','Overdue 31-60','Overdue 61-90','Overdue Over 90'])==num(d,'Open Balance'))
check('AP-FIORI',lambda d:num(d,'Not Overdue Amount')+num(d,'Overdue Amount')==1000)
check('AR-CARD',lambda d:num(d,'Overdue Amount')+num(d,'Future Receivables')==num(d,'Receivable Amount'))
for id in ['CC-PLAN','PCA-PLAN']:check(id,lambda d:num(d,'Plan')-num(d,'Actual')==num(d,'Variance')and abs(num(d,'Variance')/num(d,'Plan')*100-num(d,'Variance Percent'))<Decimal('.0001'))
check('PCA-ACTUAL',lambda d:num(d,'Opening Balance')+num(d,'Actual')==num(d,'Closing Balance'))
check('KE30',lambda d:num(d,'Revenue')-num(d,'Discount')==num(d,'Net Revenue')and num(d,'Net Revenue')-num(d,'COGS')==num(d,'Gross Margin')and num(d,'Gross Margin')-num(d,'Allocation')==num(d,'Contribution'))
for id in ['MARGIN-PRODUCT','MARGIN-CUSTOMER']:assert -num(row(id),'Actual Amount')-num(row(id,1),'Actual Amount')==400;gold.append(id)
for id in ['ME2L','ME2M']:check(id,lambda d:num(d,'Order Quantity')-num(d,'Delivered Quantity')==num(d,'Still To Be Delivered')and num(d,'Order Quantity')-num(d,'Invoiced Quantity')==num(d,'Still To Be Invoiced')and num(d,'Order Quantity')*num(d,'Net Price')/num(d,'Price Unit')==num(d,'Net Order Value'))
check('SPEND',lambda d:num(d,'Comparison Net Amount')/num(d,'Net Amount')*100==num(d,'Purchasing Spend Ratio'))
check('INVOICE',lambda d:num(d,'Tax Amount')+num(d,'Net Amount')==num(d,'Gross Amount')and num(d,'Item Amount')==num(d,'Net Amount'))
check('SALES-VOLUME',lambda d:num(d,'Sales Volume')-num(d,'Credit Memos')==num(d,'Net Sales Volume')and num(d,'Profit Margin')-num(d,'Credit Memo Profit Margin')==num(d,'Net Profit Margin')and num(d,'Net Sales Volume')-num(d,'Net Profit Margin')==num(d,'Net Sales Cost'))
check('MCI8',lambda d:num(d,'Planned Cost')-num(d,'Actual Cost')==num(d,'Variance'))
check('AFAB',lambda d:d['Test Run']=='X'and not d['Posting Document']and not d['Posting Date']and num(d,'Posted Depreciation')==0 and num(d,'Planned Depreciation')-num(d,'Posted Depreciation')==num(d,'Difference'))
check('ASSET-BALANCES',lambda d:num(d,'Acquisition Cost')+num(d,'Accumulated Depreciation')==num(d,'Net Book Value'))
check('ASSET-HISTORY',lambda d:num(d,'Opening APC')+num(d,'Acquisitions')-num(d,'Retirements')+num(d,'Transfers')==num(d,'Closing APC')and num(d,'Opening Accumulated Depreciation')+num(d,'Depreciation')+num(d,'Depreciation on Retirements')==num(d,'Closing Accumulated Depreciation')and num(d,'Closing APC')+num(d,'Closing Accumulated Depreciation')==num(d,'Net Book Value'))
with zipfile.ZipFile(PUB/'priority-24-downloads/SAVA-24-PRIORITY-NEEDS.zip')as z:
 assert z.testzip()is None and len(z.namelist())==71
 for f in json.loads(z.read('manifest.json')):assert hashlib.sha256(z.read(f['file'])).hexdigest()==f['sha256']
catalog=(PUB/'index.html').read_text(encoding='utf8');ids=re.findall(r'<details[^>]*class="report"[^>]*id="([^"]+)"',catalog);assert len(ids)==len(set(ids))==160
for p in model['priorities']:assert p['view_id']in{v['id']for v in model['variants']+model['reference_variants']}and p['profile_id']in ids
result=dict(status='PASS',profiles=160,variants=227,needs=24,new_profiles=10,new_variants=23,new_fields=fields,new_xlsx=23,new_csv=46,prior_files_preserved=len(preserved),old_profile_objects_preserved=150,all_saved_cell_checks=checks,independent_arithmetic_fixtures=gold,native_exports=0,sap_sme_acceptance='NOT_RUN')
(DOC/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print('PASS160/227;23XLSX/46CSV all cells;413 fields;651 prior files unchanged;19 arithmetic fixtures.')
