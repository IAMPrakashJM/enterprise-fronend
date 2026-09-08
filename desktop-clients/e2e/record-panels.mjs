// Writes fixtures. Run only with an isolated API data directory.
import assert from 'node:assert/strict';
import {loadPlaywright} from './harness.mjs';
import {audit} from './a11y.mjs';
const {chromium}=loadPlaywright();const browser=await chromium.launch({chromiumSandbox:false});
const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await context.route('**/preferences',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{sidebarPinned:true,reducedMotion:true,floatingWindows:false}})}));
async function openRecord(){await page.locator('header').waitFor();await page.keyboard.press('Control+k');await page.getByPlaceholder('Search pages, modules and actions…').fill('Customer Master');await page.getByRole('dialog').getByRole('button').filter({hasText:'Customer Master'}).first().click();await page.getByRole('button',{name:'Edit CUS-02401',exact:true}).click();await page.getByRole('region',{name:'Record supporting information'}).waitFor();}
try{
 await page.goto(process.env.E2E_DESKTOP??'http://127.0.0.1:3109');await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').waitFor();await openRecord();
 const panel=page.getByRole('region',{name:'Record supporting information'});const name=`panel-${Date.now()}.txt`;
 await panel.getByLabel('Add attachment (maximum 2 MB)').setInputFiles({name,mimeType:'text/plain',buffer:Buffer.from('Attachment browser fixture')});
 await panel.getByRole('button',{name:`Download ${name}`,exact:true}).waitFor();
 const [download]=await Promise.all([page.waitForEvent('download'),panel.getByRole('button',{name:`Download ${name}`,exact:true}).click()]);assert.equal(download.suggestedFilename(),name);
 const path=await download.path();const {readFile}=await import('node:fs/promises');assert.equal(await readFile(path,'utf8'),'Attachment browser fixture');
 console.log('PASS upload and authenticated download bytes');
 await panel.getByRole('button',{name:'Comments',exact:true}).click();const comment=`Browser comment ${Date.now()}`;await panel.getByLabel('New comment').fill(comment);await panel.getByRole('button',{name:'Post comment',exact:true}).click();await panel.getByText(comment,{exact:true}).waitFor();
 await page.reload();await openRecord();await panel.getByRole('button',{name:'Comments',exact:true}).click();await panel.getByText(comment,{exact:true}).waitFor();console.log('PASS comment persistence after reload');
 await panel.getByRole('button',{name:'Related records',exact:true}).click();const oldLink=panel.getByRole('button',{name:'Open CUS-02402',exact:true});if(await oldLink.isVisible()){await oldLink.locator('..').getByRole('button',{name:'Remove',exact:true}).click();await page.getByRole('button',{name:'Remove item',exact:true}).click();await oldLink.waitFor({state:'hidden'});}
 await panel.getByLabel('Related record ID',{exact:true}).fill('CUS-02402');await panel.getByLabel('Relationship label').fill('Related customer');await panel.getByRole('button',{name:'Link record',exact:true}).click();await panel.getByRole('button',{name:'Open CUS-02402',exact:true}).waitFor();
 await panel.getByRole('button',{name:'Open CUS-02402',exact:true}).click();await page.getByText('CUS-02402',{exact:true}).locator('visible=true').first().waitFor();await openRecord();
 await panel.getByRole('button',{name:'Activity',exact:true}).click();await panel.getByText('Linked a related record',{exact:true}).first().waitFor();await panel.getByText('Added an attachment',{exact:true}).first().waitFor();console.log('PASS related navigation and acknowledged activity');
 const violations=await audit(page,{include:'[aria-label="Record supporting information"]'});assert.deepEqual(violations.filter(v=>['critical','serious'].includes(v.impact)),[]);
 await panel.getByRole('button',{name:'Attachments',exact:true}).click();await panel.getByRole('button',{name:`Download ${name}`,exact:true}).locator('..').getByRole('button',{name:'Remove',exact:true}).click();await page.getByRole('dialog',{name:'Remove this item?'}).getByRole('button',{name:'Remove item',exact:true}).click();await panel.getByRole('button',{name:`Download ${name}`,exact:true}).waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);console.log('PASS attachment removal, panel accessibility and no runtime errors');
}finally{await browser.close();}
