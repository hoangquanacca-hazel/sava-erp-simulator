"""Prepare sanitized public registry and private preservation baseline."""
from pathlib import Path
import json, hashlib
ROOT=Path(__file__).resolve().parents[1]
PRIMARY=Path('D:/sava-erp-simulator')
DOC=ROOT/'docs/reporting-library/priority-24'
DOC.mkdir(parents=True,exist_ok=True)
baseline=DOC/'baseline.json'
if not baseline.exists():
    master=json.loads((ROOT/'public/sap-reporting/report-master-dictionary.json').read_text(encoding='utf8'))
    manifest=json.loads((ROOT/'scripts/reporting-library-release-manifest.json').read_text(encoding='utf8'))
    assert len(master['all_reports'])==150 and len(manifest['files'])==654
    baseline.write_text(json.dumps({'commit':'ebde51a3926a1aeb649ed6d80bfcf7bb6e32b068','reports':master['all_reports'],'files':manifest['files'],'progress':json.loads((ROOT/'public/sap-reporting/progress.json').read_text(encoding='utf8')),'index_sha256':hashlib.sha256((ROOT/'public/sap-reporting/index.html').read_bytes()).hexdigest()},ensure_ascii=False,indent=2),encoding='utf8')
review=json.loads((PRIMARY/'docs/reporting-library/gap-audit-2026-10-13/review.json').read_text(encoding='utf8'))
high=[{k:r[k] for k in ['row','module','tcode_supplied','fiori_app_supplied','title_supplied','priority_supplied','review']}for r in review['rows']if r['priority_supplied']=='Cao']
assert len(high)==24
(DOC/'registry-input.json').write_text(json.dumps(high,ensure_ascii=False,indent=2),encoding='utf8')
print('Prepared baseline150/654 and sanitized24-row registry, no public changes.')
