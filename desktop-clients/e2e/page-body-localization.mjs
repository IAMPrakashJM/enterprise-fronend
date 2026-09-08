// Run against an isolated API and Vite server. This suite never submits records.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadPlaywright} from './harness.mjs';
const engine=process.env.E2E_BROWSER??"chromium",browserType=loadPlaywright()[engine];
assert.ok(["chromium","firefox","webkit"].includes(engine),"Unsupported browser engine");
const browser=await browserType.launch(engine==="chromium"?{chromiumSandbox:false}:{});
const catalogs=Object.fromEntries(['en','ar','hi','ml'].map(lang=>[lang,JSON.parse(readFileSync(new URL(`../../dummy-api/config/localization/shared/${lang}.json`,import.meta.url),'utf8')).messages]));
const sourceKeys=new Map(Object.entries(catalogs.en).map(([key,value])=>[value,key]));
for(const language of Object.keys(catalogs))catalogs[language]=new Proxy(catalogs[language],{get:(messages,key)=>messages[key]??messages[sourceKeys.get(key)]??key});
const target=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
assert.ok(['localhost','127.0.0.1'].includes(new URL(target).hostname),'Use an isolated local API: composing a consultation saves a recovery draft.');
const errors=[];
async function open(page,id){await page.keyboard.press('Control+k');const dialog=page.getByRole('dialog');await dialog.locator('input').first().fill(id);await dialog.locator('button.group').first().click();}
async function assertCopy(page,language,messages){for(const message of messages)await page.getByText(catalogs[language][message]??message,{exact:false}).and(page.locator(':visible')).first().waitFor();assert.equal(await page.locator('main').getByText(/ui\.[a-z0-9.]+\.[0-9a-f]{8}/).count(),0,'no unresolved message keys');}
try{for(const language of ['en','ar','hi','ml']){
 const context=await browser.newContext({viewport:{width:1600,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await context.route(url=>url.pathname==='/preferences',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{language,sidebarPinned:true,floatingWindows:false,reducedMotion:true,openRecordsIn:'same-tab'}})}));
 await page.goto(target);await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').waitFor();
 await open(page,'finance-dashboard');await assertCopy(page,language,['Cash position','Forecast confidence','Daily bank feed reconciled']);
 await open(page,'billing-entry');await assertCopy(page,language,['Invoice summary','Gross subtotal','Taxable amount','Billing details']);
 await page.getByRole('button',{name:catalogs[language].Print??'Print',exact:true}).first().click();
 await page.getByRole('dialog').waitFor();await assertCopy(page,language,['Tax Invoice','Payment instructions']);await page.keyboard.press('Escape');
 await open(page,'consultation-entry');await assertCopy(page,language,['Consultation type']);
 await page.getByText(catalogs[language]['Loading saved record and recovery draft…'],{exact:true}).waitFor({state:'hidden'});
 const discard=page.getByRole('button',{name:catalogs[language]['Discard recovery draft'],exact:true});if(await discard.isVisible())await discard.click();
 for(let step=0;step<3;step++)await page.getByRole('button',{name:catalogs[language]['Continue →'],exact:true}).click();
 await page.getByRole('button',{name:catalogs[language]['Compose consultation →'],exact:true}).click();await assertCopy(page,language,['Cardiovascular examination','Baseline history','Heart sounds','I reviewed the clinical content']);
 await open(page,'spreadsheet-studio');await page.getByRole('button',{name:catalogs[language]['Discard and continue'],exact:true}).click();await assertCopy(page,language,['Item Code','Net Cost','Grand total']);
 await open(page,'profit-loss');await assertCopy(page,language,['Current period','Dimension','No material data gaps']);
 await open(page,'ai-administration');await assertCopy(page,language,['Provider credential','Save provider','Save limits']);
 await open(page,'customer-master');await page.getByRole('button',{name:catalogs[language]['More worklist actions'],exact:true}).click();await page.getByRole('button',{name:catalogs[language]['Import records'],exact:true}).click();await assertCopy(page,language,['Upload CSV file']);await page.keyboard.press('Escape');
 await page.getByRole('button',{name:catalogs[language]['Approval inbox'],exact:true}).click();await assertCopy(page,language,['Find approvals','Approval ownership']);await page.keyboard.press('Escape');
 assert.equal(await page.locator('html').getAttribute('dir'),language==='ar'?'rtl':'ltr');
 if(language==='ar'){await open(page,'billing-entry');await page.screenshot({path:'/tmp/page-body-localization-ar.png',fullPage:true});}
 await context.close();console.log(`PASS ${language}: dashboard, billing/print, composed consultation, spreadsheet, report, AI, CSV and approvals`);
}assert.deepEqual(errors,[]);}finally{await browser.close();}
