// Local fixtures only. Captures real XLSX downloads and Chromium print-to-PDF output.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {loadPlaywright} from './harness.mjs';
const require=createRequire(new URL('../package.json',import.meta.url)),XLSX=require('xlsx');
const target=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
assert.ok(['localhost','127.0.0.1'].includes(new URL(target).hostname));
const output=process.env.E2E_ARTIFACTS??'/tmp/localization-export-artifacts';mkdirSync(output,{recursive:true});
const english=JSON.parse(readFileSync(new URL('../../dummy-api/config/localization/shared/en.json',import.meta.url))).messages;
const sourceKeys=new Map(Object.entries(english).map(([key,value])=>[value,key]));
const {chromium}=loadPlaywright(),browser=await chromium.launch({chromiumSandbox:false});
async function open(page,id){await page.keyboard.press('Control+k');const dialog=page.getByRole('dialog');await dialog.locator('input').first().fill(id);await dialog.locator('button.group').first().click();}
try {for(const language of ['en','ar','hi','ml']){
 const messages=JSON.parse(readFileSync(new URL(`../../dummy-api/config/localization/shared/${language}.json`,import.meta.url))).messages;
 const t=source=>messages[source]??messages[sourceKeys.get(source)]??source;
 const context=await browser.newContext({viewport:{width:1600,height:1000},acceptDownloads:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await context.addInitScript(()=>{window.__printCalls=0;window.print=()=>{window.__printCalls++;};});
 await context.route(url=>url.pathname==='/preferences',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{language,exportFormat:'xlsx',numberLocale:'de-DE',currencyCode:'AED',currencyDisplay:'code',decimalPlaces:2,dateFormat:'dmy',sidebarPinned:true,reducedMotion:true,floatingWindows:false}})}));
 await page.goto(target);await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').waitFor();
 await open(page,'customer-master');await page.getByRole('button',{name:t('Edit {item}').replace('{item}','CUS-02401'),exact:true}).waitFor();
 await page.getByRole('button',{name:t('More worklist actions'),exact:true}).click();
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:t('Export visible records ({format})').replace('{format}','XLSX'),exact:true}).click()]);
 assert.match(download.suggestedFilename(),/^customer-master-.*\.xlsx$/);const path=`${output}/customers-${language}.xlsx`;await download.saveAs(path);
 const book=XLSX.readFile(path),rows=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{header:1});
 assert.ok(rows.length>1);assert.ok(JSON.stringify(rows).includes('CUS-02401'));assert.ok(!JSON.stringify(rows[0]).includes('column.'));
 if(language!=='en')assert.ok(rows[0].some(label=>/[^\x00-\x7F]/.test(String(label))),'export headers use native text');
 await open(page,'billing-entry');await page.getByRole('button',{name:t('Print'),exact:true}).first().click();
 const invoice=page.locator('[data-invoice-print]');await invoice.waitFor();await invoice.getByText('02/09/2026',{exact:false}).waitFor();
 assert.ok((await invoice.innerText()).includes('76.235,46'),'invoice total uses configured number format');
 await page.getByRole('button',{name:t('Save as PDF'),exact:true}).click();assert.equal(await page.evaluate(()=>window.__printCalls),1);
 await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('aside[data-tour=sidebar]').evaluate(node=>getComputedStyle(node).display),'none');
 assert.notEqual(await invoice.locator('header').evaluate(node=>getComputedStyle(node).display),'none');
 const pdf=await page.pdf({path:`${output}/invoice-${language}.pdf`,format:'A4',printBackground:true,margin:{top:'12mm',right:'12mm',bottom:'12mm',left:'12mm'}});
 assert.equal(pdf.subarray(0,5).toString(),'%PDF-');assert.ok(pdf.length>5000);
 await page.emulateMedia({media:'screen'});await page.keyboard.press('Escape');await open(page,'profit-loss');
 await page.getByRole('button',{name:t('Schedule'),exact:true}).click();
 assert.equal(await page.getByRole('button',{name:t('Create schedule'),exact:true}).isDisabled(),true);
 await page.getByText(t('Scheduled delivery is not connected. No report will be sent.'),{exact:true}).waitFor();
 assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${language}: real XLSX contents, invoice PDF/formatting, honest scheduling state`);
}}finally{await browser.close();}
