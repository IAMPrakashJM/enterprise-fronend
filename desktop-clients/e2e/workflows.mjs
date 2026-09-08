// Mutates fixtures: use an isolated API (NEXORA_DATA_DIR), never a shared deployment.
import assert from 'node:assert/strict';
import { loadPlaywright } from './harness.mjs';
import { audit } from './a11y.mjs';
const {chromium}=loadPlaywright();
const browser=await chromium.launch({chromiumSandbox:false});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
await context.route('**/preferences',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{sidebarPinned:true,reducedMotion:true,floatingWindows:false,openRecordsInTabs:true,pageSize:10}})}));
const page=await context.newPage();
const api=process.env.E2E_API??'http://localhost:3330';
const base=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
async function openPage(name) {
 await page.getByRole('button',{name:'Open page',exact:true}).click();
 await page.getByPlaceholder('Search pages, modules and actions…').fill(name);
 await page.getByRole('dialog').getByRole('button').filter({hasText:name}).first().click();
}
const search=()=>page.getByPlaceholder('Search customer master by ID, name or any visible value…');
async function settled(){await page.getByText('Loading results…',{exact:true}).waitFor({state:'hidden'});await page.getByRole('button',{name:/Edit CUS-/}).first().waitFor();}
try {
 await page.goto(base);await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').waitFor();
 await page.evaluate(async api => {
  const headers={Authorization:`Bearer ${localStorage.getItem('nexora-session-token')}`,'Content-Type':'application/json'};
  const call=async body=>(await fetch(api+'/personal-views',{method:'POST',headers,body:JSON.stringify({productId:'nexora',pageId:'customer-master',...body})})).json();
  const {views}=await call({action:'list'});
  for(const view of views) if(['Browser view','Renamed view'].includes(view.label)) await call({action:'delete',id:view.id,version:view.version});
 },api);
 await openPage('Customer Master');await settled();
 const first=await page.getByRole('button',{name:/Edit CUS-/}).first().getAttribute('aria-label');
 await Promise.all([page.waitForResponse(r=>r.url().endsWith('/worklists/search')&&r.request().postDataJSON().page===2),page.getByRole('button',{name:'Next page',exact:true}).click()]);await settled();
 assert.notEqual(await page.getByRole('button',{name:/Edit CUS-/}).first().getAttribute('aria-label'),first);
 await page.getByRole('button',{name:'Refresh results',exact:true}).click();await settled();
 console.log('PASS server paging and refresh');
 const checks=page.getByRole('checkbox',{name:/^Select CUS-/});
 const selectedIds=await checks.evaluateAll(items=>items.slice(0,2).map(el=>el.getAttribute('aria-label').slice(7)));
 await checks.nth(0).check();await checks.nth(1).check();
 await page.route('**/worklists/archive',async route=>{
  const body=route.request().postDataJSON();
  const result=await route.fetch({postData:{...body,ids:[body.ids[0],'missing-browser-fixture']}});
  const payload=await result.json();payload.results[1].id=body.ids[1];
  await route.fulfill({response:result,json:payload});
 },{times:1});
 await page.getByRole('button',{name:'Archive',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Archive',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Record no longer exists.'}).waitFor();await settled();
 assert.equal(await page.getByRole('checkbox',{name:`Select ${selectedIds[0]}`,exact:true}).count(),0);
 assert.equal(await page.getByRole('checkbox',{name:`Select ${selectedIds[1]}`,exact:true}).isChecked(),true);
 console.log('PASS partial archive failure retains only failed selection');
 await search().fill('CUS-02401');await settled();
 await page.getByRole('button',{name:'Saved views',exact:true}).click();
 await page.getByRole('textbox',{name:'View name',exact:true}).fill('Browser view');
 await page.getByRole('button',{name:'Save current view',exact:true}).click();
 await page.getByRole('button',{name:'Rename Browser view',exact:true}).click();
 await page.getByRole('textbox',{name:'Rename view',exact:true}).fill('Renamed view');await page.getByRole('button',{name:'Save name',exact:true}).click();
 await page.getByRole('button',{name:'Set default Renamed view',exact:true}).click();await page.getByRole('button',{name:'Unset default Renamed view',exact:true}).waitFor();
 await page.keyboard.press('Escape');await page.reload();await openPage('Customer Master');
 await page.waitForFunction(()=>document.querySelector('[data-tour="search"] input')?.value==='CUS-02401');await settled();
 await page.getByRole('button',{name:'Saved views',exact:true}).click();
 await page.getByRole('button',{name:'Delete Renamed view',exact:true}).click();
 const confirm=page.getByRole('dialog',{name:'Delete personal view?'});
 await confirm.waitFor();
 for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert.equal(await confirm.evaluate(el=>el.contains(document.activeElement)),true);}
 await page.keyboard.press('Escape');await confirm.waitFor({state:'hidden'});
 assert.equal(await page.getByRole('button',{name:'Delete Renamed view',exact:true}).evaluate(el=>el===document.activeElement),true);
 await page.getByRole('button',{name:'Delete Renamed view',exact:true}).click();await page.getByRole('button',{name:'Delete view',exact:true}).click();
 await page.getByText('No personal views yet. Save the current layout to create one.').waitFor();await page.keyboard.press('Escape');
 console.log('PASS saved-view create/rename/default/reload/delete; nested modal keyboard focus');
 for(const theme of ['nexora','midnight','contrast']) {
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
  const violations=await audit(page);assert.deepEqual(violations.filter(v=>['critical','serious'].includes(v.impact)),[],theme);
 }
 console.log('PASS light, dark and high-contrast desktop accessibility');
 await page.getByRole('button',{name:'Edit CUS-02401',exact:true}).click();await page.getByRole('textbox',{name:/Legal name/}).waitFor();
 await page.getByText('Loading saved record and recovery draft…',{exact:true}).waitFor({state:'hidden'});
 if(await page.getByRole('button',{name:'Restore draft',exact:true}).isVisible()){await page.getByRole('button',{name:'Restore draft',exact:true}).click();await page.getByRole('button',{name:'Discard',exact:true}).click();}
 await page.getByRole('button',{name:'Tab options',exact:true}).click();await page.getByRole('button',{name:/Split with the last document/}).click();
 assert.equal(await page.getByRole('textbox',{name:/Legal name/}).isVisible(),true);assert.equal(await search().isVisible(),true);
 await page.getByRole('textbox',{name:/Legal name/}).focus();await page.keyboard.press('Tab');
 assert.equal(await page.evaluate(()=>document.activeElement!==document.body),true);
 console.log('PASS split worklist/form and keyboard navigation');
 await page.locator('[data-tour=form-nav]:visible').getByRole('button').filter({hasText:'Address'}).click();
 await page.getByLabel('Country',{exact:false}).locator('visible=true').selectOption('AE');
 await page.getByLabel('State / Emirate',{exact:false}).locator('visible=true').selectOption('Dubai');
 await page.getByLabel('Country',{exact:false}).locator('visible=true').selectOption('GB');
 assert.equal(await page.getByLabel('State / Emirate',{exact:false}).locator('visible=true').inputValue(),'');
 await page.locator('[data-tour=form-nav]:visible').getByRole('button').filter({hasText:'Credit'}).click();
 assert.equal(await page.getByRole('textbox',{name:/Collection notes/}).count(),0);
 await page.getByRole('switch',{name:/Place on credit hold/}).click();await page.getByRole('textbox',{name:/Collection notes/}).waitFor();
 await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.locator('[data-tour=form-nav]:visible').getByRole('button').filter({hasText:'Credit'}).click();
 await page.getByText('Collection notes is required',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Discard',exact:true}).click();
 assert.deepEqual(errors,[]);console.log('PASS dependent and conditional fields; no runtime errors');
} finally { await browser.close(); }
