"""Read-only publication check. Credentials never appear in receipts or output."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import json,hashlib,urllib.request,urllib.error,sys,datetime
from sap_html_integrity import equivalent_after_pretty_urls
ROOT=Path(__file__).resolve().parents[1];DOC=ROOT/'docs/reporting-library/priority-24';PUB=ROOT/'public/sap-reporting'
SITE='ed44f609-8ec1-4403-908e-5ca0fffe520f'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
cfg=read(Path.home()/'AppData/Roaming/netlify/Config/config.json');user=cfg['users'][cfg['userId']];token=user['auth']['token']if isinstance(user.get('auth'),dict)else user.get('authToken',user.get('token'))
assert token,'Existing Netlify auth missing'
def api(s):
 req=urllib.request.Request('https://api.netlify.com/api/v1/'+s,headers={'Authorization':'Bearer '+token});return json.load(urllib.request.urlopen(req,timeout=30))
site=api('sites/'+SITE);deploy=site['published_deploy']
if '--state'in sys.argv:
 recent=api('sites/'+SITE+'/deploys?per_page=6')
 out={'published':{k:deploy.get(k)for k in['id','state','commit_ref','context','published_at','deploy_ssl_url']},'recent':[{k:d.get(k)for k in['id','state','commit_ref','context','published_at','deploy_ssl_url','review_id','error_message']}for d in recent]}
 print(json.dumps(out,indent=2));sys.exit(0)
url=next((s.split('=',1)[1]for s in sys.argv if s.startswith('--url=')),'https://simulator.savafinlab.com.vn')
name='preview-verification'if '--url='in' '.join(sys.argv)else'live-verification'
if name=='preview-verification':
 deploy=next(d for d in api('sites/'+SITE+'/deploys?per_page=12')if d.get('deploy_ssl_url','').rstrip('/')==url.rstrip('/')and d['state']=='ready')
manifest=read(ROOT/'scripts/reporting-library-release-manifest.json');base=read(DOC/'baseline.json');old={f['path']:f for f in base['files']}
# Check changed/new payloads and representative unchanged pages/downloads. Old651 preservation is proven locally; old654 were verified on prior main.
targets=[f for f in manifest['files']if f['path']not in old or f['sha256']!=old[f['path']]['sha256']]
for p in ['source-layout-downloads/CO11-02.xlsx','source-layouts.html','expansion-150.html','co-pa.html','fi-aa.html']:
 targets.append(next(f for f in manifest['files']if f['path']==p))
def get(f):
 try:
  address=url+'/sap-reporting/'+f['path'];r=urllib.request.urlopen(address,timeout=15);b=r.read();actual=hashlib.sha256(b).hexdigest();assert r.status==200
  mode='EXACT_BYTES'
  if actual!=f['sha256']:
   assert f['path'].endswith('.html')and equivalent_after_pretty_urls((PUB/f['path']).read_bytes(),b,address),(f['path'],'Unexpected payload change',actual)
   mode='HTML_INTERNAL_PRETTY_URL_AND_NEWLINE_ONLY'
  return dict(path=f['path'],status='PASS',integrity_mode=mode,http=200,bytes=len(b),source_sha256=f['sha256'],http_sha256=actual)
 except Exception as e:return dict(path=f['path'],status='FAIL',error=str(e))
downloads=[]
with ThreadPoolExecutor(max_workers=8)as ex:
 for future in as_completed([ex.submit(get,f)for f in targets]):
  r=future.result();downloads.append(r)
  (DOC/(name+'-partial.json')).write_text(json.dumps({'status':'IN_PROGRESS','completed':len(downloads),'expected':len(targets),'downloads':downloads},indent=2),encoding='utf8')
  if r['status']=='FAIL':print('HTTP check failed:',r['path'],r['error'],flush=True)
  if len(downloads)%10==0:print('HTTP checks:',len(downloads),'/',len(targets),flush=True)
baseline=read(Path('D:/sava-erp-simulator/docs/reporting-library/deployment-2026-10-13/live-baseline.json'))
assets=[]
for p in sorted((ROOT/'dist/assets').iterdir()):
 if p.is_file():
  key='/assets/'+p.name;oldasset=next(f for f in baseline['files']if f['path'].lower()==key.lower());expected=oldasset['sha'];assert hashlib.sha1(p.read_bytes()).hexdigest()==expected,(key,'App build changed')
  b=urllib.request.urlopen(url+key,timeout=30).read();assert hashlib.sha1(b).hexdigest()==expected;assets.append(key)
health=json.load(urllib.request.urlopen(url+'/api/health',timeout=30))
try:r=urllib.request.urlopen(url+'/api/chat',timeout=30);chat=r.status
except urllib.error.HTTPError as e:chat=e.code
assert chat==405
fail=[r for r in downloads if r['status']!='PASS']
out=dict(status='FAIL'if fail else'PASS',checked_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),url=url,deploy_id=deploy['id'],commit_ref=deploy.get('commit_ref'),profiles=160,variants=227,changed_and_representative_http_files=len(downloads),unchanged_application_assets=len(assets),downloads=downloads,health=health,chat_get_status=chat,errors=fail,native_export_sme_acceptance='NOT_VERIFIED')
(DOC/(name+'.json')).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(out['status'],len(downloads),'HTTP/hash checks,',len(assets),'app assets unchanged.');sys.exit(bool(fail))
