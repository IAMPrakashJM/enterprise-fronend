import assert from 'node:assert/strict';
import {mkdirSync,readFileSync} from 'node:fs';
import {loadPlaywright} from './harness.mjs';
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false});const dir=process.env.E2E_ARTIFACTS??'/tmp/dcp-csv-options';mkdirSync(dir,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1700,height:1050}});page.setDefaultTimeout(25000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.E2E_DESKTOP??'http://127.0.0.1:3109');await page.locator('input').first().fill('admin');await page.locator('input[type=password]').fill('admin');await page.keyboard.press('Enter');await page.locator('header').first().waitFor();
 await page.keyboard.press('Control+k');const navigation=page.getByRole('dialog');await navigation.locator('input').first().fill('dcp-designer');await navigation.locator('button.group').first().click();const root=page.locator('[data-designer]:visible');await root.getByLabel('Form title').fill('Unsaved host form');
 await root.getByRole('button',{name:'Manage value sets',exact:true}).click();const modal=page.getByRole('dialog');await modal.getByLabel('Catalog name').fill('Imported departments');
 const upload=modal.locator('input[type=file]');await upload.setInputFiles({name:'bad.csv',mimeType:'text/csv',buffer:Buffer.from('id,label\n001,Accounts\n001,Sales')});
 await modal.getByLabel('ID column',{exact:true}).selectOption('0');await modal.getByLabel('Label column',{exact:true}).selectOption('1');assert.ok(await modal.getByRole('button',{name:'Replace editor with reviewed rows'}).isDisabled());assert.ok(await modal.getByRole('button',{name:'Save new revision'}).isDisabled());
 await upload.setInputFiles({name:'good.csv',mimeType:'text/csv',buffer:Buffer.from('id,label\n001,"Accounts, India"\n002,Sales')});await modal.getByLabel('ID column',{exact:true}).selectOption('0');await modal.getByLabel('Label column',{exact:true}).selectOption('1');
 await page.screenshot({path:dir+'/review.png'});await modal.getByRole('button',{name:'Replace editor with reviewed rows'}).click();assert.equal(await modal.getByLabel('Options: one value|label per line').inputValue(),'001|Accounts, India\n002|Sales');
 const saved=page.waitForResponse(r=>r.url().endsWith('/dcp-designer')&&r.request().postDataJSON()?.action==='save-value-set');await modal.getByRole('button',{name:'Save new revision'}).click();const body=await(await saved).json();assert.deepEqual(body.catalog.sets.at(-1).options,[{value:'001',label:'Accounts, India'},{value:'002',label:'Sales'}]);
 await modal.getByRole('button',{name:'Close catalog'}).click();assert.equal(await root.getByLabel('Form title').inputValue(),'Unsaved host form');assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const formSaved=page.waitForResponse(r=>r.url().endsWith('/dcp-designer')&&r.request().postDataJSON()?.action==='save');await root.getByRole('button',{name:'Save design draft'}).click();await formSaved;
 for(const lang of ['ar','hi','ml']){
  await page.keyboard.press('Control+k');const menu=page.getByRole('dialog');await menu.locator('input').first().fill('preferences');await menu.locator('button.group').first().click();
  await page.getByRole('tab').filter({hasText:/Language & help|اللغة والمساعدة|भाषा और सहायता|ഭാഷയും സഹായവും/}).click();await page.locator('[data-tour=prefs-lang] select:visible').selectOption(lang);await page.waitForFunction(l=>document.documentElement.lang===l,lang);
  await page.keyboard.press('Control+k');const back=page.getByRole('dialog');await back.locator('input').first().fill('dcp-designer');await back.locator('button.group').first().click();
  const messages=JSON.parse(readFileSync(new URL('../../dummy-api/config/localization/shared/'+lang+'.json',import.meta.url),'utf8')).messages;
  await root.getByRole('button',{name:messages['designer.catalogManage'],exact:true}).click();const localized=page.getByRole('dialog');await localized.locator('input[type=file]').setInputFiles({name:'sample.csv',mimeType:'text/csv',buffer:Buffer.from('id,label\n001,Accounts')});
  await localized.getByLabel(messages['designer.csvValue'],{exact:true}).selectOption('0');await localized.getByLabel(messages['designer.csvLabel'],{exact:true}).selectOption('1');assert.ok(!/designer\.[a-z]/.test(await localized.innerText()));assert.ok(await localized.evaluate(el=>el.scrollWidth<=el.clientWidth+1));await page.screenshot({path:dir+'/'+lang+'.png'});
  await localized.getByRole('button',{name:messages['designer.catalogClose'],exact:true}).click();await localized.getByRole('button',{name:messages['designer.discard'],exact:true}).click();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS CSV duplicate blocking, column mapping, leading-zero IDs, quoted labels, explicit atomic catalog save and preserved host form and four-language catalog layouts; isolated demo API / Chromium.');
}finally{await browser.close();}
