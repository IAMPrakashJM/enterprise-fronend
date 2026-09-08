/** Native lifecycle regression. See docs/running-tauri.md. */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
const driver = process.env.TAURI_DRIVER_URL || 'http://127.0.0.1:4444';
const application = resolve(process.env.TAURI_APPLICATION || 'apps/desktop/src-tauri/target/debug/app');
let session;
async function request(path,body,method=body===undefined?'GET':'POST'){
 const r=await fetch(`${driver}/session/${session}${path}`,{method,headers:{'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 const v=await r.json();if(!r.ok)throw Error(JSON.stringify(v));return v.value;
}
const js=(script,args=[])=>request('/execute/sync',{script,args});
async function element(selector){return (await request('/element',{using:'css selector',value:selector}))['element-6066-11e4-a52e-4f735466cecf'];}
async function click(selector){return request(`/element/${await element(selector)}/click`,{});}
async function type(selector,text){return request(`/element/${await element(selector)}/value`,{text});}
async function until(fn,description){for(let i=0;i<50;i++){if(await fn())return;await new Promise(r=>setTimeout(r,200));}throw Error('Timed out: '+description);}
async function clickText(text,within=''){
 const xpath=`${within||'//'}button[contains(normalize-space(.),${JSON.stringify(text)})]`;
 const result=await request('/element',{using:'xpath',value:xpath});
 return request(`/element/${result['element-6066-11e4-a52e-4f735466cecf']}/click`,{});
}

async function login() {
await until(()=>js('return !!document.querySelector("input[type=password]")'),'login screen');
await js(`window.__nativeCheck={errors:[],preferenceWrites:0};
window.addEventListener('error',e=>window.__nativeCheck.errors.push(e.message));
window.addEventListener('unhandledrejection',e=>window.__nativeCheck.errors.push(String(e.reason)));
const originalFetch=window.fetch.bind(window);
window.fetch=(input,init)=>{
 const url=typeof input==='string'?input:input.url;
  if(url.includes('/auth/') && url.slice(0,url.indexOf('/auth/')) !== ${JSON.stringify(process.env.E2E_API??'http://127.0.0.1:3330')})throw new Error('Native API target mismatch');
 if(new URL(url,location.href).pathname.endsWith('/preferences')){
  if(init?.method==='PUT'){window.__nativeCheck.preferenceWrites++;return Promise.resolve(new Response(null,{status:204}));}
  return Promise.resolve(new Response(JSON.stringify({preferences:{sidebarPinned:true,floatingWindows:false,openRecordsInTabs:true,reducedMotion:true}}),{status:200,headers:{'content-type':'application/json'}}));
 }
 return originalFetch(input,init);
};`);
await type('input[placeholder="user1"]','user1');
await type('input[type="password"]','user1');
await click('button[type="submit"]');
await until(()=>js('return !!document.querySelector("header")'),'signed-in shell');
}
async function openRecord() {
await click('button[aria-label="Open page"]');
await type('input[placeholder="Search pages, modules and actions…"]','customer master');
await clickText('Customer Master','//*[@role="dialog"]//');
await until(()=>js('return document.querySelector("h1")?.textContent.includes("Customer Master")'),'customer page');
await until(()=>js(`return !!document.querySelector('button[aria-label="Edit CUS-02401"]')`),'record rows loaded');
await click('button[aria-label="Edit CUS-02401"]');
await until(()=>js('return !!document.querySelector("[data-tour=form-actions]")'),'record form');
}
async function detach(main) {
  await click('button[aria-label="Tab options"]');
  await clickText('Open in its own window');
  await until(async()=> (await request('/window/handles')).length===2,'detached window');
  const child=(await request('/window/handles')).find(h=>h!==main);
  await request('/window',{handle:child});
  await until(()=>js('return !!document.querySelector("header") && document.querySelector("main")?.innerText.includes("CUS-02401")'),'detached record/session');
  const title=await request('/execute/async',{script:`const done=arguments[arguments.length-1];window.__TAURI_INTERNALS__.invoke('plugin:window|title',{label:window.__TAURI_INTERNALS__.metadata.currentWindow.label}).then(done).catch(e=>done({error:String(e)}));`,args:[]});
  assert.equal(title,'CUSTOMER-MASTER edit~CUS-02401');
}
async function logout() {
  await click('button[aria-label="Open profile menu"]');
  try { await clickText('Sign out'); } catch(e) {
    if(!String(e).includes('no such window')) throw e;
  }
}
async function assertLoggedOut(main) {
  await until(async()=> (await request('/window/handles')).length===1,'logout closes child');
  await request('/window',{handle:main});
  await until(()=>js('return !!document.querySelector("input[type=password]") && !document.querySelector("header")'),'main signed out');
  assert.deepEqual(await js('return window.__nativeCheck.errors'),[]);
  assert.equal(await js('return window.__nativeCheck.preferenceWrites'),0);
}
try {
  const response=await fetch(`${driver}/session`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({capabilities:{alwaysMatch:{'tauri:options':{application}}}}),signal:AbortSignal.timeout(60000)});
  const result=await response.json();
  if(!response.ok)throw Error(JSON.stringify(result));
  session=result.value.sessionId;
  const main=(await request('/window/handles'))[0];
  await login();
  await openRecord();
  await detach(main);
  // Native close request follows the window close control's event path.
  // WebDriver DELETE /window bypasses that request and destroys the context.
  await js(`window.__TAURI_INTERNALS__.invoke('plugin:window|close',{label:window.__TAURI_INTERNALS__.metadata.currentWindow.label}).catch(()=>{});return true;`);
  await request('/window',{handle:main});
  await until(async()=> (await request('/window/handles')).length===1,'native close');
  await until(()=>js('return [...document.querySelectorAll("[role=tab]")].every(t=>!t.getAttribute("aria-label")?.includes("in its own window"))'),'record reattached');
  await click('[role="tab"][aria-label="Atlas Horizon LLC • Edit"]');
  await detach(main);
  await logout();
  await assertLoggedOut(main);
  console.log('PASS: native record load/title, close request, reattach, reopen, child logout propagation');
  await login();
  await openRecord();
  await detach(main);
  await request('/window',{handle:main});
  await logout();
  await assertLoggedOut(main);
  console.log('PASS: main logout closes child; no main-window runtime errors or preference writes');
} finally {
  if(session) {
    try {
      for(const handle of await request('/window/handles')) {
        await request('/window',{handle});
        if(await js('return !!document.querySelector("header")')) { await logout(); break; }
      }
    } finally { await request('',undefined,'DELETE'); }
  }
}
