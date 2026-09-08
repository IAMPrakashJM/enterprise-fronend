import assert from 'node:assert/strict';
import {loadPlaywright} from './harness.mjs';
const api=process.env.E2E_API??'http://127.0.0.1:3330',target=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false});
const json=body=>({headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const login=async name=>(await (await fetch(api+'/auth/login',{method:'POST',...json({username:name,password:name})})).json()).token;
const call=(path,token,body)=>fetch(api+path,{method:body===undefined?'GET':'PUT',headers:{'Content-Type':'application/json','X-Product-Id':'nexora',Authorization:`Bearer ${token}`},...(body===undefined?{}:{body:JSON.stringify(body)})});
async function pageFor(name){const context=await browser.newContext({viewport:{width:1700,height:1100}}),page=await context.newPage();await page.goto(target);await page.getByPlaceholder('user1').fill(name);await page.locator('input[type=password]').fill(name);await page.locator('button[type=submit]').click();await page.locator('header').first().waitFor();await page.keyboard.press('Control+k');await page.getByRole('dialog').locator('input').first().fill('preferences');await page.getByRole('dialog').locator('button.group').first().click();return {context,page};}
try {
 const adminToken=await login('admin'),userToken=await login('user1');
 assert.equal((await call('/preferences',userToken,{preferences:{theme:'sand'}})).status,200);
 const admin=await pageFor('admin');await admin.page.getByRole('tab',{name:'Preference policies',exact:true}).click();
 const theme=admin.page.locator('[data-policy-key=theme]');await theme.locator('select').selectOption('midnight');
 await theme.getByRole('switch',{name:'Locked',exact:true}).click();
 const [saved]=await Promise.all([admin.page.waitForResponse(r=>new URL(r.url()).pathname==='/preference-policy'&&r.request().method()==='PUT'),admin.page.getByRole('button',{name:'Save policy',exact:true}).click()]);assert.equal(saved.status(),200);
 const user=await pageFor('user1');await user.page.waitForFunction(()=>document.documentElement.dataset.theme==='midnight');
 assert.equal(await user.page.getByRole('tab',{name:'Preference policies',exact:true}).count(),0);
 await user.page.getByRole('tab',{name:'Page',exact:true}).click();assert.equal(await user.page.locator('[data-preference=theme] button').first().isDisabled(),true);
 assert.equal((await call('/preferences',userToken,{policyRevision:1,preferences:{theme:'sand'}})).status,403);
 await user.page.locator('input[type=file]').setInputFiles({name:'preferences.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({theme:'sand',pageSize:50}))});
 await user.page.waitForFunction(()=>document.documentElement.dataset.theme==='midnight');
 for(let i=0;i<30;i++){const state=await(await call('/preferences',userToken)).json();if(state.preferences.pageSize===50)break;await new Promise(resolve=>setTimeout(resolve,100));}
 assert.equal((await(await call('/preferences',userToken)).json()).preferences.pageSize,50);
 await user.page.getByRole('button',{name:'Restore defaults',exact:true}).click();
 for(let i=0;i<30;i++){const state=await(await call('/preferences',userToken)).json();if(state.preferences.pageSize===20)break;await new Promise(resolve=>setTimeout(resolve,100));}
 assert.equal((await(await call('/preferences',userToken)).json()).preferences.theme,'midnight');
 assert.equal((await call('/preference-policy',adminToken,{revision:1,rules:{theme:{value:'midnight',locked:false}}})).status,200);
 await user.page.evaluate(()=>window.dispatchEvent(new Event('focus')));await user.page.waitForFunction(()=>document.documentElement.dataset.theme==='sand');
 assert.equal((await call('/preference-policy',adminToken,{revision:2,rules:{language:{value:'ar',locked:true}}})).status,200);
 await user.page.evaluate(()=>window.dispatchEvent(new Event('focus')));await user.page.waitForFunction(()=>document.documentElement.lang==='ar'&&document.documentElement.dir==='rtl');
 await user.page.reload();await user.page.locator('header').first().waitFor();assert.equal(await user.page.locator('html').getAttribute('lang'),'ar');
 console.log('PASS preference policy: tenant admin UI, locks, imports, resets, API rejection, unlock restoration and live/boot language enforcement');
 await admin.context.close();await user.context.close();
}finally{await browser.close();}
