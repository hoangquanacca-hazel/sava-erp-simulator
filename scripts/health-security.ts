import assert from 'node:assert/strict';
import health from '../netlify/functions/health.mts';
const original=process.env.GEMINI_API_KEY;
try {
  for(const key of ['', 'TEST-NONSECRET-SENTINEL']){
    process.env.GEMINI_API_KEY=key;
    const response=await health(); const body=await response.json();
    assert.deepEqual(Object.keys(body).sort(),['app','hasApiKey','status']);
    assert.equal(body.hasApiKey,Boolean(key));
    assert.equal(JSON.stringify(body).includes('SENTINEL'),false);
  }
  console.log('PASS health: allowlisted fields only; empty/present key; no key diagnostics');
} finally {if(original===undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY=original;}
