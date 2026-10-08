import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
// Reserve an ephemeral port, then use only this test-owned child. No AI network calls.
const probe=net.createServer();
await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(0,'127.0.0.1',resolve);});
const port=probe.address().port;
await new Promise(resolve=>probe.close(resolve));
const child=spawn(process.execPath,['dist/server.mjs'],{windowsHide:true,stdio:['ignore','pipe','pipe'],
  env:{...process.env,NODE_ENV:'production',HOST:'127.0.0.1',PORT:String(port),GEMINI_API_KEY:''}});
let exited=false;child.once('exit',()=>{exited=true;});
child.stdout.resume();child.stderr.resume();
try {
  let response;
  for(let i=0;i<80;i++){
    if(exited)throw new Error('Production server exited before health');
    try{response=await fetch(`http://127.0.0.1:${port}/api/health`);break;}catch{await new Promise(r=>setTimeout(r,100));}
  }
  assert.ok(response?.ok,'server readiness timeout');
  const body=await response.json();
  assert.deepEqual(Object.keys(body).sort(),['app','hasApiKey','status']);
  assert.equal(body.hasApiKey,false);
  const page=await fetch(`http://127.0.0.1:${port}/`);assert.equal(page.status,200);
  const html=await page.text();const asset=/src="(\/assets\/[^" ]+\.js)"/.exec(html);assert.ok(asset,'built JS missing');
  const js=await fetch(`http://127.0.0.1:${port}${asset[1]}`);assert.equal(js.status,200);
  assert.match(js.headers.get('content-type') ?? '',/javascript/);
  console.log('PASS production: ESM startup; health allowlist; index and built JS HTTP200; no AI request');
}finally{
  if(!exited){const done=new Promise(resolve=>child.once('exit',resolve));child.kill();await done;}
}
