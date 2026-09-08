// Native Tauri/WebKitGTK display check. Uses isolated WebDriver application data.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const driver=process.env.TAURI_DRIVER_URL??'http://127.0.0.1:4444';
const application=resolve(process.env.TAURI_APPLICATION??'apps/desktop/src-tauri/target/debug/app');
const output=process.env.E2E_ARTIFACTS??'/tmp/localization-native-artifacts';mkdirSync(output,{recursive:true});
let session;
async function wd(path,body,method=body===undefined?'GET':'POST'){
 const response=await fetch(`${driver}/session/${session}${path}`,{method,headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 const json=await response.json();if(!response.ok)throw Error(JSON.stringify(json));return json.value;
}
const js=(script,args=[])=>wd('/execute/sync',{script,args});
async function until(fn,name){for(let i=0;i<100;i++){if(await fn())return;await new Promise(r=>setTimeout(r,200));}throw Error(`Timed out: ${name}`);}
async function el(selector){return (await wd('/element',{using:'css selector',value:selector}))['element-6066-11e4-a52e-4f735466cecf'];}
const click=async selector=>wd(`/element/${await el(selector)}/click`,{});
const type=async(selector,text)=>wd(`/element/${await el(selector)}/value`,{text});
try{for(const language of ['ar','hi','ml']){
 const messages=JSON.parse(readFileSync(new URL(`../../dummy-api/config/localization/shared/${language}.json`,import.meta.url))).messages;
 const response=await fetch(driver+'/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({capabilities:{alwaysMatch:{'tauri:options':{application}}}})});const result=await response.json();assert.ok(response.ok,JSON.stringify(result));session=result.value.sessionId;
 await until(()=>js('return document.readyState === "complete"'),'webview ready');
 await js('window.__reloadMarker=true;localStorage.clear();sessionStorage.clear();location.reload();return true;');
 await until(()=>js('return !window.__reloadMarker && document.readyState==="complete" && !!document.querySelector("input[type=password]")'),'login');
 await js(`const language=arguments[0];window.__nativeLocale={errors:[],preferenceWrites:0};
 window.addEventListener('error',event=>window.__nativeLocale.errors.push(event.message));
 window.addEventListener('unhandledrejection',event=>window.__nativeLocale.errors.push(String(event.reason)));
 const original=window.fetch.bind(window);window.fetch=(input,init)=>{
  const url=typeof input==='string'?input:input.url;
  if(url.includes('/auth/') && url.slice(0,url.indexOf('/auth/')) !== ${JSON.stringify(process.env.E2E_API??'http://127.0.0.1:3330')})throw new Error('Native API target mismatch');
  if(new URL(url,location.href).pathname.endsWith('/preferences')){
   if(init?.method==='PUT')window.__nativeLocale.preferenceWrites++;
   return Promise.resolve(new Response(JSON.stringify({preferences:{language,sidebarPinned:true,reducedMotion:true,floatingWindows:false}}),{status:200,headers:{'Content-Type':'application/json'}}));
  }return original(input,init);
 };return true;`,[language]);
 await type('input[placeholder="user1"]','admin');await type('input[type=password]','admin');await click('button[type=submit]');await until(()=>js('return !!document.querySelector("header")'),'shell');
 await click(`button[aria-label="${messages['ui.open.page.af030334']}"]`);
 await until(()=>js('return !!document.querySelector("[role=dialog] input")'),'command palette');await type('[role=dialog] input','billing-entry');
 await until(()=>js('return document.querySelectorAll("[role=dialog] button.group").length===1'),'billing result');await click('[role=dialog] button.group');

 await until(()=>js('return document.querySelector("main")?.innerText.includes(arguments[0]);',[messages['Invoice summary']]),'native billing copy');
 assert.equal(await js('return document.documentElement.lang'),language);assert.equal(await js('return document.documentElement.dir'),language==='ar'?'rtl':'ltr');
 assert.equal(await js('return [...document.querySelectorAll("main input")].some(input=>input.value==="INV-26-005184")'),true);
 assert.deepEqual(await js('return window.__nativeLocale.errors'),[]);assert.equal(await js('return window.__nativeLocale.preferenceWrites'),0);
 writeFileSync(`${output}/native-${language}.png`,Buffer.from(await wd('/screenshot'),'base64'));
 await wd('',undefined,'DELETE');session=undefined;console.log(`PASS native ${language}: translated billing, direction, stable ID, no runtime errors or preference writes`);
}}finally{if(session)await wd('',undefined,'DELETE').catch(()=>{});}
