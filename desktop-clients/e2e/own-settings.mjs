import {loadPlaywright} from './harness.mjs';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const {chromium}=loadPlaywright();const b=await chromium.launch({chromiumSandbox:false});const artifacts=process.env.E2E_ARTIFACTS??'/tmp/own-artifacts';mkdirSync(artifacts,{recursive:true});
try{
 const p=await b.newPage({viewport:{width:1600,height:1000}});p.setDefaultTimeout(20000);const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.E2E_DESKTOP??'http://127.0.0.1:3109');await p.locator('input').first().fill('admin');await p.locator('input[type=password]').fill('admin');await p.keyboard.press('Enter');await p.locator('header').first().waitFor();
 async function prefs(){await p.keyboard.press('Control+k');const d=p.getByRole('dialog');await d.locator('input').first().fill('preferences');await d.locator('button.group').first().click();await p.getByRole('tab',{name:'Own Settings',exact:true}).click();}
 await prefs();const select=p.locator('[data-preference="defaultModule"] select');const options=await select.locator('option').evaluateAll(opts=>opts.map(o=>o.value));assert.ok(options.includes('library'));assert.ok(options.includes('finance'));
 let waiting=p.waitForResponse(r=>r.url().endsWith('/preferences')&&r.request().method()==='PUT');await select.selectOption('library');let response=await waiting;assert.equal(response.status(),200);assert.equal((await response.json()).preferences.defaultModule,'library');
 waiting=p.waitForResponse(r=>new URL(r.url()).pathname==='/navigation');await p.reload();assert.equal((await(await waiting).json()).defaultModule,'library');if(process.env.E2E_SHELL==='web'){assert.ok(new URL(p.url()).pathname.endsWith('/library/preferences'));await p.goto(process.env.E2E_DESKTOP);await p.waitForURL('**/library/library-dashboard');}
 await p.locator('header').first().waitFor();assert.ok((await p.locator('header').first().innerText()).includes('Developer Library'));
 await prefs();assert.equal(await select.inputValue(),'library');await p.screenshot({path:artifacts+'/own-settings.png',fullPage:true});
 await p.getByRole('tab',{name:'Preference policies',exact:true}).click();const row=p.locator('[data-policy-key="defaultModule"]');await row.locator('select').selectOption('finance');await row.getByRole('switch',{name:'Locked',exact:true}).click();waiting=p.waitForResponse(r=>r.url().endsWith('/preference-policy')&&r.request().method()==='PUT');await p.getByRole('button',{name:'Save policy',exact:true}).click();assert.equal((await waiting).status(),200);
 await p.getByRole('tab',{name:'Own Settings',exact:true}).click();await p.waitForFunction(()=>document.querySelector('[data-preference="defaultModule"] select')?.value==='finance');assert.equal(await select.isDisabled(),true);
 assert.deepEqual(errors,[]);console.log('PASS API module choices, account save/reload, default-module startup, tenant policy selector and live lock enforcement');
}finally{await b.close();}
