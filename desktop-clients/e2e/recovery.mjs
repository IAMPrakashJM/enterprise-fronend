import assert from 'node:assert/strict';
import {loadPlaywright} from './harness.mjs';
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false});
const base=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
try{
 const context=await browser.newContext({viewport:{width:1700,height:1100}}),page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await context.route('**/preferences',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{sidebarPinned:true,reducedMotion:true,floatingWindows:false,openRecordsInTabs:true}})}));
 await page.goto(base);await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').first().waitFor();
 async function open(id){await page.keyboard.press('Control+k');const dialog=page.getByRole('dialog');await dialog.locator('input').first().fill(id);await dialog.locator('button.group').first().click();}
 await open('customer-master');await page.getByRole('button',{name:'Edit CUS-02401',exact:true}).click();const name=page.getByRole('textbox',{name:/Legal name/});await name.waitFor();
 let mode='offline';const operations=[];
 await page.route('**/records/**',async route=>{
  if(route.request().method()!=='PUT')return route.fallback();
  operations.push(JSON.parse(route.request().postData()));
  if(mode==='offline')return route.abort('internetdisconnected');
  if(mode==='expired')return route.fulfill({status:401,contentType:'application/json',body:'{}'});
  return route.fallback();
 });
 await name.fill('Retained recovery value');const recovery=page.locator('[data-recovery-kind]');await recovery.getByText('Could not reach the service',{exact:true}).waitFor();assert.equal(await name.inputValue(),'Retained recovery value');
 mode='expired';await recovery.getByRole('button',{name:'Retry',exact:true}).click();const lock=page.getByRole('dialog',{name:'Your session has ended'});await lock.waitFor();assert.equal(await page.locator('dialog[open]').count(),1);await page.screenshot({path:'/tmp/recovery-session-lock.png'});
 await lock.getByRole('textbox',{name:/Username/}).fill('admin');await lock.locator('input[type=password]').fill('admin');mode='success';await lock.getByRole('button',{name:'Sign in',exact:true}).click();await lock.waitFor({state:'hidden'});
 assert.equal(await name.inputValue(),'Retained recovery value');await recovery.getByRole('button',{name:'Retry',exact:true}).click();
 await page.getByText('Recovery draft saved · record has unsaved changes',{exact:true}).waitFor();assert.deepEqual(operations[0],operations[2]);
 assert.deepEqual(operations[0],operations[1]);
 console.log('PASS form: disconnected write retains values and operation identity; same-user sign-in retains mounted editor');
 await page.unroute('**/records/**');
 await open('customer-master');
 await page.route('**/worklists/search',route=>route.fulfill({status:403,contentType:'application/json',body:'{"error":"PRIVATE DETAILS"}'}));
 await page.getByPlaceholder('Search customer master by ID, name or any visible value…').fill('denied');await page.locator('[data-recovery-kind=denied]').waitFor();assert.equal(await page.locator('[data-recovery-kind=denied]').getByRole('button',{name:'Retry',exact:true}).count(),0);assert.ok(!(await page.locator('main').innerText()).includes('PRIVATE DETAILS'));
 await page.unroute('**/worklists/search');await page.getByPlaceholder('Search customer master by ID, name or any visible value…').fill('');await page.getByRole('button',{name:'Edit CUS-02401',exact:true}).waitFor();
 let auditCount=0;const downloads=[];page.on('download',file=>downloads.push(file.suggestedFilename()));
 await page.route('**/exports',route=>{auditCount++;return route.fulfill({status:auditCount===1?503:200,contentType:'application/json',body:'{}'});});
 await page.getByRole('button',{name:/More actions|Actions/i}).first().click();await page.getByRole('button',{name:/Export visible records/i}).click();
 await page.getByText(/The file was generated, but its audit entry was not confirmed/).waitFor();assert.equal(downloads.length,1);await page.locator('[data-recovery-kind]').getByRole('button',{name:'Retry',exact:true}).click();await page.locator('[data-recovery-kind]').waitFor({state:'hidden'});assert.equal(auditCount,2);assert.equal(downloads.length,1);
 console.log('PASS table permission recovery and export audit retry without duplicate download');
 await page.evaluate(()=>{window.__originalObjectURL=URL.createObjectURL;URL.createObjectURL=()=>{throw Error('PRIVATE FILE ERROR');};});
 await page.getByRole('button',{name:'More worklist actions',exact:true}).click();await page.getByRole('button',{name:/Export visible records/i}).click();await page.getByText('The file could not be generated',{exact:true}).waitFor();assert.equal(downloads.length,1);
 await page.evaluate(()=>{URL.createObjectURL=window.__originalObjectURL;delete window.__originalObjectURL;});await Promise.all([page.waitForEvent('download'),page.locator('[data-recovery-kind]').getByRole('button',{name:'Retry',exact:true}).click()]);await page.waitForFunction(()=>!document.querySelector('[data-recovery-kind]'));assert.equal(downloads.length,2);
 console.log('PASS local export failure is localized, retains rows and can be retried explicitly');

 await page.getByRole('button',{name:'More worklist actions',exact:true}).click();await page.getByRole('button',{name:'Import records',exact:true}).click();
 const importer=page.getByRole('dialog',{name:'Import Customer Master',exact:true});await importer.getByText('Loading import…',{exact:true}).waitFor({state:'hidden'});
 const csv='customerCode,Company,customerType,contactName,email,address1,city\r\nRECOVERY-CSV,Retained CSV,Corporate,Demo,mail@example.test,Street,Dubai';
 await importer.getByLabel('Upload CSV file').setInputFiles({name:'recovery.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});await importer.getByLabel(/^Legal name/).selectOption('1');
 const previews=[];await page.route('**/imports',route=>{if(route.request().postDataJSON()?.action!=='preview')return route.fallback();previews.push(route.request().postDataJSON());return previews.length===1?route.fulfill({status:503,contentType:'application/json',body:'{}'}):route.fallback();});
 await importer.getByRole('button',{name:'Validate mapped rows'}).click();await importer.locator('[data-recovery-kind]').waitFor();assert.equal(await importer.getByLabel(/^Legal name/).inputValue(),'1');await importer.getByText('Retained CSV',{exact:true}).waitFor();
 await importer.getByRole('button',{name:'Retry',exact:true}).click();await importer.getByText('Rows: 1 · Ready: 1 · Imported: 0 · Invalid: 0 · Failed: 0').waitFor();assert.deepEqual(previews[0],previews[1]);
 console.log('PASS import: CSV rows, manual mapping and preview operation ID survive a failed validation request');assert.deepEqual(errors,[]);
}finally{await browser.close();}
