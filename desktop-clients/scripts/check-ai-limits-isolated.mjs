import {startApi} from '../e2e/managed-api.mjs';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {execFileSync} from 'node:child_process';
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');
const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const api=`http://127.0.0.1:${port}`;
const stop=await startApi(api,'ai-limits');
try {
 const login=await fetch(api+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'admin'})}).then(response=>response.json());
 const response=await fetch(api+'/ai/config/credential',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${login.token}`},body:JSON.stringify({secret:'isolated-rate-test-no-provider-key'})});
 if(!response.ok)throw new Error('Could not configure isolated rate-limit fixture');
 execFileSync(process.execPath,[new URL('./verify-ai-limits.mjs',import.meta.url).pathname],{env:{...process.env,AI_API:api},stdio:'inherit'});
} finally {await stop();}
