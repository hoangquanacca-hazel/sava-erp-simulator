import {readFileSync,statSync} from 'node:fs';
import {verifyEvidencePack,MAX_PACK_BYTES} from '../src/evidence/pack';
const path=process.argv[2];
if(!path){console.error('Usage: npm run verify:p0-evidence -- <saved-P0.json> [expected-file-SHA256]');process.exit(2);}
try{if(statSync(path).size>MAX_PACK_BYTES)throw new Error('FILE_TOO_LARGE');const result=await verifyEvidencePack(readFileSync(path),process.argv[3]);console.log(JSON.stringify(result,null,2));if(result.technicalStatus!=='PASS')process.exitCode=1;}catch(e){console.error(e instanceof Error?e.message:'INVALID_FILE');process.exitCode=1;}
