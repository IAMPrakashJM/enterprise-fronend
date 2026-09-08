import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadPlaywright} from './harness.mjs';
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false});
try {
 const context=await browser.newContext({viewport:{width:1600,height:1000},acceptDownloads:true});
 await context.route('**/preferences',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{language:'en',floatingWindows:false,sidebarPinned:true}})}));
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.E2E_DESKTOP??'http://127.0.0.1:3109');await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').waitFor();
 await page.keyboard.press('Control+k');await page.getByRole('dialog').locator('input').first().fill('profit-loss');await page.getByRole('dialog').locator('button.group').first().click();
 await page.getByRole('button',{name:'Schedule',exact:true}).click();const modal=page.getByRole('dialog');
 await modal.getByLabel(/^Schedule name/).fill('Scheduled delivery browser check');
 const due=new Date(Math.ceil((Date.now()+3000)/60000)*60000);
 await modal.locator('input[type=date]').fill(due.toISOString().slice(0,10));await modal.locator('input[type=time]').fill(due.toISOString().slice(11,16));
 await modal.getByRole('button',{name:'Create schedule',exact:true}).click();
 await modal.getByRole('button',{name:'Pause',exact:true}).waitFor();
 const downloadButton=modal.getByRole('button',{name:'Download',exact:true});await downloadButton.waitFor({timeout:90000});
 const [download]=await Promise.all([page.waitForEvent('download'),downloadButton.click()]);
 const content=readFileSync(await download.path(),'utf8');assert.match(content,/Abu Dhabi HQ/);assert.match(content,/Current period/);
 await modal.getByRole('button',{name:'Pause',exact:true}).click();await modal.getByRole('button',{name:'Resume',exact:true}).waitFor();assert.deepEqual(errors,[]);
 console.log('PASS scheduled reports: form, persisted schedule, background CSV delivery, download and pause');
 await context.close();
} finally {await browser.close();}
