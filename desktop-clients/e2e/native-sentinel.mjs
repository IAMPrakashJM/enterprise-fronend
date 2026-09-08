// Real debug-process panic followed by a fresh WebDriver launch and API delivery.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtempSync,writeFileSync,rmSync,mkdirSync,openSync,closeSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
const driver=process.env.TAURI_DRIVER_URL??'http://127.0.0.1:4444';
const binary=resolve(process.env.TAURI_APPLICATION??'apps/desktop/src-tauri/target/debug/app');
const api=process.env.E2E_API??'http://127.0.0.1:3330';
assert.ok(process.env.XDG_DATA_HOME,'Use isolated XDG_DATA_HOME for native recovery testing');
const scratch=mkdtempSync(join(tmpdir(),'sentinel-panic-test-')),trigger=join(scratch,'once');
// This suite owns its WebKit profile. Other suites may still be releasing
// their profile locks after WebDriver deletes a session.
const application=join(scratch,'launch');
const quote=value=>"'"+value.replaceAll("'", "'\"'\"'")+"'";
const folders=Object.fromEntries(['DATA','CONFIG','CACHE'].map(name=>[name,join(scratch,name.toLowerCase())]));
for(const folder of Object.values(folders))mkdirSync(folder,{recursive:true});
writeFileSync(application,'#!/bin/sh\n'+Object.entries(folders).map(([name,path])=>'export XDG_'+name+'_HOME='+quote(path)).join('\n')+'\nexec '+quote(binary)+'\n',{mode:0o700});
let session;
async function wd(path,body,method=body===undefined?'GET':'POST'){
 const response=await fetch(`${driver}/session/${session}${path}`,{method,headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 const json=await response.json();assert.ok(response.ok,JSON.stringify(json));return json.value;
}
const js=script=>wd('/execute/sync',{script,args:[]});
const invoke=command=>wd('/execute/async',{script:`const done=arguments[arguments.length-1];window.__TAURI_INTERNALS__.invoke('${command}').then(done,()=>done('invoke-failed'));`,args:[]});
async function until(fn,name){for(let i=0;i<150;i++){if(await fn())return;await new Promise(r=>setTimeout(r,200));}throw Error(`Timed out: ${name}`);}
async function element(selector){return (await wd('/element',{using:'css selector',value:selector}))['element-6066-11e4-a52e-4f735466cecf'];}
try{
 writeFileSync(trigger,'once');
 const log=openSync('/tmp/native-sentinel-panic.log','w');
 const child=spawn(application,[],{env:{...process.env,NEXORA_SENTINEL_TEST_PANIC_ONCE:trigger},stdio:['ignore',log,log]});closeSync(log);
 const deadline=setTimeout(()=>child.kill('SIGKILL'),30000);
 const [code,signal]=await once(child,'exit');clearTimeout(deadline);assert.equal(code,86,`Debug panic hook must run and exit the native process (signal=${signal}; see /tmp/native-sentinel-panic.log)`);
 const response=await fetch(driver+'/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({capabilities:{alwaysMatch:{'tauri:options':{application}}}})});
 const result=await response.json();assert.ok(response.ok,JSON.stringify(result));session=result.value.sessionId;
 await until(()=>js('return document.readyState==="complete"'),'webview');
 await js('localStorage.clear();sessionStorage.clear();window.__reloading=true;location.reload();return true;');
 await until(()=>js('return !window.__reloading && !!document.querySelector("input[type=password]")'),'fresh login');
 assert.equal(await invoke('sentinel_pending_failure'),true,'Panic must survive process restart');
 for(const [selector,text] of [['input[placeholder="user1"]','admin'],['input[type=password]','admin']])await wd(`/element/${await element(selector)}/value`,{text});
 await wd(`/element/${await element('button[type=submit]')}/click`,{});
 await until(()=>js('return !!document.querySelector("header")'),'authenticated shell');
 await until(async()=>await invoke('sentinel_pending_failure')===false,'successful delivery clears marker');
 const login=await fetch(api+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'admin'})});
 const {token}=await login.json();
 const list=await fetch(api+'/monitoring/incidents',{headers:{Authorization:`Bearer ${token}`,'X-Product-Id':'nexora'}});assert.equal(list.status,200);
 const payload=await list.json();assert.ok(JSON.stringify(payload).includes('native-panic'),'Restart report must reach demo API');
 assert.ok(!JSON.stringify(payload).includes('Sentinel isolated recovery test'),'Panic text must stay out of API');
 await js('window.__retainedHeader=document.querySelector("header");localStorage.setItem("nexora-session-expired","1");localStorage.removeItem("nexora-session-token");window.dispatchEvent(new Event("nexora-session-invalidated"));return true;');
 await until(()=>js('return !!document.querySelector("dialog[open]")'),'native session recovery dialog');
 for(const [selector,text] of [['dialog input[autocomplete="username"]','admin'],['dialog input[type=password]','admin']])await wd(`/element/${await element(selector)}/value`,{text});
 await wd(`/element/${await element('dialog button[type=submit]')}/click`,{});
 await until(()=>js('return !document.querySelector("dialog[open]")'),'native same-user sign-in');
 assert.equal(await js('return window.__retainedHeader===document.querySelector("header")'),true,'Reauthentication must retain the mounted native shell');
 console.log('PASS native recovery: locked session, same-user sign-in, mounted shell retained');
 console.log('PASS native Sentinel: real panic, process exit, restart, authenticated upload, marker acknowledgement, sanitized incident');
}finally{if(session)await wd('',undefined,'DELETE').catch(()=>{});rmSync(scratch,{recursive:true,force:true});}
