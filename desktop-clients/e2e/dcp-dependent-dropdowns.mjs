import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {loadPlaywright} from './harness.mjs';
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false});
const dir=process.env.E2E_ARTIFACTS??'/tmp/dcp-cascade-browser';mkdirSync(dir,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1700,height:1050}});page.setDefaultTimeout(25000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.E2E_DESKTOP??'http://127.0.0.1:3109');await page.locator('input').first().fill('admin');await page.locator('input[type=password]').fill('admin');await page.keyboard.press('Enter');await page.locator('header').first().waitFor();
 await page.keyboard.press('Control+k');const dialog=page.getByRole('dialog');await dialog.locator('input').first().fill('dcp-designer');await dialog.locator('button.group').first().click();const root=page.locator('[data-designer]:visible');await root.getByRole('heading',{name:'DCP Visual Designer'}).waitFor();
 await root.getByRole('button',{name:'Dropdown',exact:true}).click();await root.getByLabel('Label',{exact:true}).fill('Country');await root.getByLabel('Options: one value|label per line').fill('IN|India\nAE|UAE');
 await root.getByRole('button',{name:'Dropdown',exact:true}).click();await root.getByLabel('Label',{exact:true}).fill('State');await root.getByLabel('Options: one value|label per line').fill('KL|Kerala\nKA|Karnataka\nAZ|Abu Dhabi\nDU|Dubai');
 await page.screenshot({path:dir+'/before-dependency.png'});
 await root.getByLabel('Depends on',{exact:true}).selectOption({label:'Country'});
 for(const [label,parent] of [['Kerala','IN'],['Karnataka','IN'],['Abu Dhabi','AE'],['Dubai','AE']])await root.getByLabel('Parent value for '+label,{exact:true}).selectOption(parent);
 await page.screenshot({path:dir+'/mapping.png'});
 const save=page.waitForResponse(r=>r.url().endsWith('/dcp-designer')&&r.request().postDataJSON()?.action==='save');await root.getByRole('button',{name:'Save design draft'}).click();const saved=await(await save).json();assert.ok(saved.record);const fields=saved.record.definition.sections.flatMap(s=>s.fields);assert.equal(fields.find(f=>f.label==='State').dependsOn,fields.find(f=>f.label==='Country').id);
 await root.getByRole('button',{name:'Live preview',exact:true}).click();const preview=root.locator('[data-designer-preview]'),country=preview.getByLabel('Country',{exact:true}),state=preview.getByLabel('State',{exact:true});
 assert.equal(await state.isDisabled(),true);await country.selectOption('IN');await state.selectOption('KL');assert.deepEqual(await state.locator('option:not([value=""])').allTextContents(),['Kerala','Karnataka']);
 await country.selectOption('AE');assert.equal(await state.inputValue(),'');await state.selectOption('DU');assert.deepEqual(await state.locator('option:not([value=""])').allTextContents(),['Abu Dhabi','Dubai']);
 await preview.getByLabel('Reference',{exact:true}).fill('SYNTHETIC');
 const validation=page.waitForResponse(r=>r.url().endsWith('/dcp-designer')&&r.request().postDataJSON()?.action==='validate');await preview.getByRole('button',{name:'Validate preview'}).click();assert.deepEqual((await(await validation).json()).validation,{});
 await page.screenshot({path:dir+'/preview.png'});
 for(const lang of ['ar','hi','ml']){
  await page.keyboard.press('Control+k');const menu=page.getByRole('dialog');await menu.locator('input').first().fill('preferences');await menu.locator('button.group').first().click();
  await page.getByRole('tab').filter({hasText:/Language & help|اللغة والمساعدة|भाषा और सहायता|ഭാഷയും സഹായവും/}).click();await page.locator('[data-tour=prefs-lang] select:visible').selectOption(lang);await page.waitForFunction(l=>document.documentElement.lang===l,lang);
  await page.keyboard.press('Control+k');const back=page.getByRole('dialog');await back.locator('input').first().fill('dcp-designer');await back.locator('button.group').first().click();await root.getByRole('heading',{level:1}).waitFor();
  assert.ok(!/designer\.[a-z]/.test(await root.innerText()));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:dir+'/'+lang+'.png'});
 }
 assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('PASS dependent dropdown authoring, explicit parent mappings, API draft persistence, India/UAE filtering, child clearing server preview validation and four-language layouts; isolated synthetic API / Chromium.');
}finally{await browser.close();}
