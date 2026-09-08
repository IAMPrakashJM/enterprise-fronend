// Writes fixtures. Use an isolated API data directory only.
import assert from 'node:assert/strict';
import {loadPlaywright} from './harness.mjs';
import {audit} from './a11y.mjs';
const {chromium}=loadPlaywright();const browser=await chromium.launch({chromiumSandbox:false});
const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
await context.route('**/preferences',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{sidebarPinned:true,reducedMotion:true,floatingWindows:false,openRecordsIn:'same-tab'}})}));
const prefix=`CSV-${Date.now()}`;
const csv=['customerCode,Company,customerType,contactName,email,address1,city',...Array.from({length:12},(_,i)=>`${prefix}-${i},${prefix} Customer ${i},Corporate,Demo Contact,test${i}@example.com,Demo Street,Dubai`),`${prefix}-bad,Bad Email,Corporate,Contact,invalid,Street,Dubai`,`${prefix}-dup,Duplicate One,Corporate,Contact,test@example.com,Street,Dubai`,`${prefix}-dup,Duplicate Two,Corporate,Contact,test@example.com,Street,Dubai`].join('\r\n');
let runs=0;page.on('request',req=>{if(req.url().endsWith('/imports')&&req.postDataJSON()?.action==='run')runs++;});
async function openImport(){await page.locator('header').waitFor();await page.keyboard.press('Control+k');await page.getByPlaceholder('Search pages, modules and actions…').fill('Customer Master');await page.getByRole('dialog').getByRole('button').filter({hasText:'Customer Master'}).first().click();await page.getByRole('button',{name:'More worklist actions',exact:true}).click();await page.getByRole('button',{name:'Import records',exact:true}).click();}
try {
 await page.goto(process.env.E2E_DESKTOP??'http://127.0.0.1:3109');await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await openImport();
 const dialog=page.getByRole('dialog',{name:'Import Customer Master',exact:true});
 await dialog.getByText('Loading import…',{exact:true}).waitFor({state:'hidden'});
 const startNew=dialog.getByRole('button',{name:'Start new import'});if(await startNew.isVisible())await startNew.click();
 await dialog.getByLabel('Upload CSV file').setInputFiles({name:'customers.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
 await dialog.getByText('CSV preview · first 5 data rows').waitFor();
 await dialog.getByLabel(/^Legal name/).selectOption('1');
 await dialog.getByRole('button',{name:'Validate mapped rows'}).click();await dialog.getByText('Rows: 15 · Ready: 12 · Imported: 0 · Invalid: 3 · Failed: 0').waitFor();assert.equal(runs,0);
 await dialog.getByRole('button',{name:'Import valid rows: 12'}).click();assert.equal(runs,0);await page.getByRole('button',{name:'Confirm import',exact:true}).click();
 await dialog.getByText('Rows: 15 · Ready: 0 · Imported: 12 · Invalid: 3 · Failed: 0').waitFor();assert.equal(runs,2);console.log('PASS CSV preview, manual mapping, validation, explicit confirmation and two import batches');
 const [download]=await Promise.all([page.waitForEvent('download'),dialog.getByRole('button',{name:'Download error report'}).click()]);assert.equal(download.suggestedFilename(),'import-errors.csv');
 const {readFile}=await import('node:fs/promises');const report=await readFile(await download.path(),'utf8');assert.match(report,/Duplicate value within this CSV/);assert.match(report,/bad/);
 const violations=await audit(page,{include:'[role="dialog"]'});assert.deepEqual(violations.filter(v=>['critical','serious'].includes(v.impact)),[]);
 await page.reload();await openImport();await dialog.getByText('Rows: 15 · Ready: 0 · Imported: 12 · Invalid: 3 · Failed: 0').waitFor();console.log('PASS saved results restored after reload and error report download');
 await dialog.getByRole('button',{name:'Start new import'}).click();await dialog.getByLabel('Upload CSV file').setInputFiles({name:'customers.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});await dialog.getByLabel(/^Legal name/).selectOption('1');await dialog.getByRole('button',{name:'Validate mapped rows'}).click();await dialog.getByText('Rows: 15 · Ready: 0 · Imported: 0 · Invalid: 15 · Failed: 0').waitFor();assert.equal(runs,2);assert.deepEqual(errors,[]);console.log('PASS existing-record duplicates blocked, dialog accessibility and no runtime errors');
}finally{await browser.close();}
