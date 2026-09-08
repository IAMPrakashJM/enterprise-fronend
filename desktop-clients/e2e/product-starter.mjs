// Run against the Ledger example on an isolated API. The default product stays Nexora.
import assert from 'node:assert/strict';
import {loadPlaywright} from './harness.mjs';
const {chromium}=loadPlaywright();const browser=await chromium.launch({chromiumSandbox:false});
const base=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
try {
 for(const [username,editable,archive] of [['admin',true,true],['user1',true,false],['user2',false,false]]) {
  const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/preferences',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{sidebarPinned:true,reducedMotion:true,floatingWindows:false}})}));
  await page.goto(base);assert.ok((await page.locator('body').innerText()).includes('LEDGER'));
  await page.getByPlaceholder('user1').fill(username);await page.locator('input[type=password]').fill(username);await page.locator('button[type=submit]').click();await page.locator('header').waitFor();
  await page.keyboard.press('Control+k');await page.getByPlaceholder('Search pages, modules and actions…').fill('Customers');await page.getByRole('dialog').getByRole('button').filter({hasText:'Customers'}).first().click();
  await page.getByRole('button',{name:'Edit CUS-02401',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'New',exact:true}).isEnabled(),editable);
  assert.equal(await page.getByRole('button',{name:'Edit CUS-02401',exact:true}).isEnabled(),editable);
  await page.getByRole('checkbox',{name:'Select CUS-02401',exact:true}).check();assert.equal(await page.getByRole('button',{name:'Archive',exact:true}).isEnabled(),archive);
  await page.keyboard.press('Control+k');await page.getByPlaceholder('Search pages, modules and actions…').fill('AI Administration');
  const matches=page.getByRole('dialog').getByRole('button').filter({hasText:'AI Administration'});assert.equal(await matches.count()>0,username==='admin');
  assert.deepEqual(errors,[]);console.log(`PASS Ledger ${username}: branding, selected pages, role actions and command access`);await context.close();
 }
} finally {await browser.close();}
