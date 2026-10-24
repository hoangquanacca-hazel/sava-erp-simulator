// Regression gate: a normal app build must preserve the complete public library.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';

const root=process.cwd();
const library=path.join(root,'public/sap-reporting');
const built=path.join(root,'dist/sap-reporting');
const manifest=JSON.parse(readFileSync(path.join(root,'scripts/reporting-library-release-manifest.json'),'utf8'));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
assert(readFileSync(path.join(root,'src/index.css'),'utf8').includes('@source not "../public/sap-reporting";'),'Template data must not alter simulator CSS generation');
assert(readFileSync(path.join(root,'src/index.css'),'utf8').includes('@source not "../docs/reporting-library";'),'Template documentation must not alter simulator CSS generation');
const walk=(dir,prefix='')=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const relative=prefix+entry.name;
  assert(!entry.isSymbolicLink(),`Unexpected symlink: ${relative}`);
  return entry.isDirectory()?walk(path.join(dir,entry.name),relative+'/'):[relative];
}).sort();
// The Simulated Native pilot package (public/sap-reporting/simulated-native/) is a separate SIMULATED_NATIVE
// package with its own manifest + sha256 (verified by `npm run test:simulated-native`). It is kept out of
// this 160-profile template-library manifest, which stays unchanged; it is only checked to be copied byte-for-byte.
const SIMULATED_NATIVE='simulated-native/';
const allPublic=walk(library);
const files=allPublic.filter(x=>!x.startsWith(SIMULATED_NATIVE));
assert.deepEqual(files,manifest.files.map(x=>x.path).sort(),'Public library inventory changed: review and update the release manifest');
assert.deepEqual(walk(built),allPublic,'A normal app build lost or added library files');
for(const extra of allPublic.filter(x=>x.startsWith(SIMULATED_NATIVE)))assert.equal(digest(readFileSync(path.join(built,extra))),digest(readFileSync(path.join(library,extra))),`Build altered simulated-native bytes: ${extra}`);
for(const entry of manifest.files){
  const source=readFileSync(path.join(library,entry.path));
  const output=readFileSync(path.join(built,entry.path));
  assert.equal(digest(source),entry.sha256,`Published sample bytes changed: ${entry.path}`);
  assert.equal(digest(output),entry.sha256,`Build altered sample bytes: ${entry.path}`);
  assert.equal(source.length,entry.bytes);
  assert(['.html','.json','.txt','.csv','.xlsx','.zip'].includes(path.extname(entry.path)),`Source document not allowed in public library: ${entry.path}`);
  if(entry.path.endsWith('.xlsx')||entry.path.endsWith('.zip'))assert.equal(source.subarray(0,2).toString(),'PK');
  if(entry.path.endsWith('.json'))JSON.parse(source.toString('utf8'));
}
const progress=JSON.parse(readFileSync(path.join(library,'progress.json'),'utf8'));
const dictionary=JSON.parse(readFileSync(path.join(library,'report-master-dictionary.json'),'utf8'));
assert.equal(new Set(dictionary.all_reports.map(x=>x.id)).size,manifest.authored_profiles);
assert.equal(progress.authored_profiles,manifest.authored_profiles);
const groups=['source-layouts','fi-aa','co-pa','supplemental','finance-gaps','operations','expansion-150','priority-24'];
let variants=0;
for(const name of groups){
  const model=JSON.parse(readFileSync(path.join(library,name+'.json'),'utf8'));
  assert.equal(model.synthetic_data,true,`Synthetic boundary lost: ${name}`);
  assert.equal(model.native_export,false,`Native SAP acceptance changed: ${name}`);
  for(const variant of model.variants){
    variants++;
    const folder=name==='source-layouts'?'source-layout-downloads':name+'-downloads';
    for(const extension of ['.xlsx','.layout.csv','.flat.csv'])assert(existsSync(path.join(built,folder,variant.id+extension)),`Missing variant download: ${variant.id+extension}`);
  }
}
assert.equal(variants,manifest.variants);
assert.equal(variants,progress.variant_count_including_technical_extracts);
assert.equal(files.filter(x=>x.endsWith('.xlsx')).length,progress.xlsx);
assert.equal(files.filter(x=>x.endsWith('.csv')).length,progress.csv+1,'CSV samples plus one header reference');
for(const base of ['index.html','dist/index.html']){
  const html=readFileSync(path.join(root,base),'utf8');
  assert(html.includes('SAP-REPORTING-PUBLIC-2026-10-13'),`Library navigation missing from ${base}`);
  assert(/href="\/sap-reporting\/index\.html#catalog"/.test(html),`Library link missing from ${base}`);
  const markup=html.replace(/<!--[\s\S]*?-->/g,'');
  const body=markup.search(/<body\b[^>]*>/i);
  const nav=markup.indexOf('<nav aria-label="Thư viện báo cáo SAP"');
  assert(body>=0&&nav>body,`Library navigation must follow the actual body, not a body string in a comment: ${base}`);
}
// Verify literal HTML resource links remain inside the library and exist.
for(const name of files.filter(x=>x.endsWith('.html'))){
  const html=readFileSync(path.join(library,name),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  for(const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/g)){
    const value=match[1];
    if(/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(value))continue;
    const relative=value.split(/[?#]/)[0];
    if(!relative||relative.includes('${'))continue;
    const resolved=path.resolve(path.dirname(path.join(library,name)),decodeURIComponent(relative));
    assert(resolved.startsWith(library+path.sep),`Link leaves library: ${name}: ${value}`);
    assert(existsSync(resolved)&&statSync(resolved).isFile(),`Missing resource: ${name}: ${value}`);
  }
}
console.log(`PASS: ${manifest.authored_profiles} profiles / ${variants} variants; ${files.length} public files byte-identical in normal app build; navigation and download links preserved.`);
