import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {loadPlaywright} from './harness.mjs';
const XLSX=createRequire(import.meta.url)('xlsx');
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false});
const headers=['Item Code','Description','Quantity','Unit Cost','Discount %','Tax %','Net Cost','Supplier'];
const target=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
function workbook(matrix){const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(matrix),'Costing');return XLSX.write(book,{bookType:'xlsx',type:'buffer'});}
try{
 const context=await browser.newContext({viewport:{width:1600,height:1000}}),page=await context.newPage(),audits=[],downloads=[];
 await context.route('**/preferences',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{language:'en',sidebarPinned:true,reducedMotion:true,floatingWindows:false}})}));
 let rejectAudit=false;
 await context.route('**/exports',async route=>{
  audits.push(route.request().postDataJSON());
  if(rejectAudit)return route.fulfill({status:503,body:'Unavailable'});
  return route.continue();
 });
 page.on('download',download=>downloads.push(download));
 await page.goto(target);await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').waitFor();
 await page.keyboard.press('Control+k');await page.getByRole('dialog').locator('input').first().fill('spreadsheet-studio');await page.getByRole('dialog').locator('button.group').first().click();
 const cells=page.locator('[data-tour=sheet] tbody input');
 await page.locator('input[type=file]').setInputFiles({name:'unknown.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:workbook([['Patient name',...headers.slice(1)],['PRIVATE']])});
 await page.getByText('Use the eight costing-template column headers. Unknown or duplicate columns cannot be imported.',{exact:true}).waitFor();
 assert.equal(await cells.first().inputValue(),'ITM-1001','rejected import preserves current sheet');
 const data=['SKU-TEST','Literal description',2,10,0,5,21,'Vendor'];
 await page.locator('input[type=file]').setInputFiles({name:'costing.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:workbook([[...headers].reverse(),[...data].reverse()])});
 await page.waitForFunction(()=>document.querySelector('[data-tour=sheet] tbody input')?.value==='SKU-TEST');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export workbook',exact:true}).click();const download=await downloadPromise;
 const book=XLSX.readFile(await download.path());const rows=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{header:1});assert.deepEqual(rows,[headers,data]);
 assert.equal(audits.length,1);assert.equal(audits[0].columns.length,8);assert.ok(!JSON.stringify(audits[0]).includes('Literal description'));
 const stampCount=await page.locator('[data-tour=sheet] [data-classification="operational"]').count();assert.equal(stampCount,16);
 rejectAudit=true;await page.getByRole('button',{name:'Export workbook',exact:true}).click();await page.getByText('The export could not be recorded. Please retry.',{exact:true}).waitFor();assert.equal(downloads.length,1);
 console.log('PASS costing policy: unknown import rejected, mapped headers round-trip, schema classification, value-free audit, audit failure prevents download');
 await context.close();
}finally{await browser.close();}
