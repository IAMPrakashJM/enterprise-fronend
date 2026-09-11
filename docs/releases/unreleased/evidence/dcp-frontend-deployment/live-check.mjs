import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH);
const dir=process.env.E2E_ARTIFACTS??'/tmp/dcp-publish-live';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({chromiumSandbox:false});
try{
 for(const host of ['front-design.pepbits.com','desktop.front-design.pepbits.com']){
  const page=await browser.newPage({viewport:{width:1800,height:1200}});page.setDefaultTimeout(30000);const errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('/dcp-designer')&&r.method()==='POST'&&!['load','options','validate','backend-load','backend-preview','runtime-load'].includes(r.postDataJSON()?.action))writes.push(r.postDataJSON()?.action);});
  await page.goto('https://'+host+'/library/dcp-designer');assert.equal((await(await page.request.get('https://'+host+'/__nexora-release.json')).json()).id,process.env.EXPECTED_RELEASE);
  await page.locator('input').first().fill('admin');await page.locator('input[type=password]').fill('admin');await page.keyboard.press('Enter');await page.locator('header').first().waitFor();
  const loading=page.waitForResponse(r=>r.url().endsWith('/dcp-designer')&&r.request().postDataJSON()?.action==='load');
  await page.keyboard.press('Control+k');const menu=page.getByRole('dialog');await menu.locator('input').first().fill('dcp-designer');await menu.locator('button.group').first().click();
  const loaded=await(await loading).json();assert.ok(loaded.catalog.sets.length);assert.ok(loaded.runtime.entities.length);
  const contract=page.waitForResponse(r=>r.url().endsWith('/dcp-designer')&&r.request().postDataJSON()?.action==='backend-load');await page.getByRole('button',{name:'Backend contract runtime',exact:true}).click();const v1=await(await contract).json();assert.equal(v1.view.contractVersion,1);const modal=page.getByRole('dialog');await modal.getByLabel('Name',{exact:true}).waitFor();assert.ok(await modal.getByRole('button',{name:'Save record',exact:true}).isDisabled());
  await page.screenshot({path:dir+'/'+host+'-runtime.png'});await modal.getByRole('button',{name:'Close',exact:true}).click();
  const root=page.locator('[data-designer]:visible');await root.getByRole('button',{name:'Add section',exact:true}).click();await root.getByLabel('Label',{exact:true}).fill('Synthetic repeated observations');await root.getByLabel('Repeat this section',{exact:true}).check();await root.getByLabel('Maximum rows',{exact:true}).fill('2');
  await root.getByRole('button',{name:'Text',exact:true}).click();await root.getByLabel('Label',{exact:true}).fill('Synthetic note');
  await root.getByRole('button',{name:'Live preview',exact:true}).click();const preview=root.locator('[data-designer-preview]');await preview.getByRole('button',{name:'Add row',exact:true}).click();await preview.getByLabel('Synthetic note',{exact:true}).fill('First synthetic row');await preview.getByRole('button',{name:'Add row',exact:true}).click();await preview.getByLabel('Synthetic note',{exact:true}).last().fill('Second synthetic row');assert.ok(await preview.getByRole('button',{name:'Add row',exact:true}).isDisabled());assert.equal(await preview.getByLabel('Synthetic note',{exact:true}).first().inputValue(),'First synthetic row');
  await preview.getByLabel('Reference',{exact:true}).fill('SYNTHETIC');
  const validation=page.waitForResponse(r=>r.url().endsWith('/dcp-designer')&&r.request().postDataJSON()?.action==='validate');await preview.getByRole('button',{name:'Validate preview',exact:true}).click();assert.equal((await validation).status(),200);
  assert.equal(writes.length,0);assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:dir+'/'+host+'-repeating.png'});
  console.log('PASS '+host+': release identity, authenticated catalog/entity load, supplied v1 runtime, repeatable visual authoring and API preview validation, independent row values, row bounds, no page errors and desktop containment. No designs, answers or preferences saved.');
  await page.close({runBeforeUnload:false});
 }
}finally{await browser.close();}
