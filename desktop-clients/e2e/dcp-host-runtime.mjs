import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {loadPlaywright} from './harness.mjs';
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false}),dir=process.env.E2E_ARTIFACTS??'/tmp/dcp-host-runtime';mkdirSync(dir,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1800,height:1200}});page.setDefaultTimeout(30000);const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});page.on('response',async r=>{if(r.url().endsWith('/dcp-designer')&&r.request().postDataJSON()?.action?.startsWith('backend-'))console.log('RUNTIME RESPONSE',r.status(),(await r.text()).slice(0,150));});
 await page.goto(process.env.E2E_DESKTOP??'http://127.0.0.1:3109');await page.locator('input').first().fill('admin');await page.locator('input[type=password]').fill('admin');await page.keyboard.press('Enter');await page.locator('header').first().waitFor();
 await page.keyboard.press('Control+k');const menu=page.getByRole('dialog');await menu.locator('input').first().fill('dcp-designer');await menu.locator('button.group').first().click();
 await page.getByRole('button',{name:'Backend contract runtime',exact:true}).click();const modal=page.getByRole('dialog');await modal.getByText('Record revision: 0',{exact:true}).waitFor().catch(async e=>{await page.screenshot({path:dir+'/failure.png'});console.log((await modal.innerText()).slice(0,1500));throw e;});
 assert.equal(await modal.getByRole('combobox',{name:'Consent recorded',exact:true}).inputValue(),'false');
 await modal.getByLabel('Name',{exact:true}).fill('Synthetic revised');await modal.getByLabel('Rating',{exact:true}).fill('11');
 await modal.getByRole('alert').filter({hasText:'The value exceeds the maximum.'}).waitFor();assert.equal(await modal.getByLabel('Name',{exact:true}).inputValue(),'Synthetic revised');
 await modal.getByLabel('Rating',{exact:true}).fill('10');await modal.getByRole('button',{name:'Add row',exact:true}).click();await modal.getByLabel('Note',{exact:true}).last().fill('Second synthetic row');
 // The automatic authoritative preview must settle before submitting the current snapshot.
 await modal.getByRole('button',{name:'Save record',exact:true}).waitFor();await page.waitForTimeout(900);
 const saving=page.waitForResponse(r=>r.url().endsWith('/dcp-designer')&&r.request().postDataJSON()?.action==='backend-save');await modal.getByRole('button',{name:'Save record',exact:true}).click();const response=await saving;assert.equal(response.status(),200);const saved=await response.json();assert.equal(saved.version,'1');assert.equal(saved.view.values.observations.length,2);assert.equal(saved.view.values.consent,false);assert.ok(saved.view.values.observations.every(r=>r._id&&!r._localKey));await modal.getByText('Server save confirmed.',{exact:true}).waitFor();
 await modal.getByLabel('Name',{exact:true}).fill('Recoverable synthetic edit');await modal.locator('[data-shared-draft]').getByText(/Draft saved/).waitFor();await page.screenshot({path:dir+'/runtime.png'});
 assert.deepEqual(errors,[]);console.log('PASS API-owned v1 runtime: required false, validation without losing edits, repeating rows with server IDs, exact revisions, confirmed save and shared recovery autosave; Chromium desktop browser.');
}finally{await browser.close();}
