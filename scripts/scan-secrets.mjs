// Reports paths/revisions only. Never prints matching secret values.
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
const git=(args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024});
const pattern=/AIza[0-9A-Za-z_-]{30,}/;
let hits=[];
const files=git(['ls-files','-z','--cached','--others','--exclude-standard']).split('\0').filter(Boolean);
for(const f of files) {
  if(/(^|\/)\.env($|\.)/.test(f) && !f.endsWith('.env.example')) {hits.push({scope:'working-tree',path:f,reason:'tracked/unignored env file'});continue;}
  if(existsSync(f)&&pattern.test(readFileSync(f,'utf8')))hits.push({scope:'working-tree',path:f});
}
const commits=git(['rev-list','--all']).trim().split('\n').filter(Boolean);
for(const revision of commits){
  try {
    const paths=git(['grep','-l','-I','-E','AIza[0-9A-Za-z_-]{30,}',revision,'--']);
    for(const path of paths.trim().split('\n').filter(Boolean))hits.push({scope:'history',path});
  }catch(e){if(e.status!==1)throw e;}
}
console.log(JSON.stringify({workingFiles:files.length,commits:commits.length,hits},null,2));
if(hits.length)process.exit(1);
