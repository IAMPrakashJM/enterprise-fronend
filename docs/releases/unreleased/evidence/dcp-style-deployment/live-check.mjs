import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH);
const dir=process.env.E2E_ARTIFACTS;mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({chromiumSandbox:false});
try{for(const host of ['front-design.pepbits.com','desktop.front-design.pepbits.com']){
 const page=await browser.newPage({viewport:{width:1600,height:1000}});page.setDefaultTimeout(30000);const errors=[],writes=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('/dcp-designer')&&r.method()==='POST'&&!['load','options','validate','backend-load','backend-preview','runtime-load'].includes(r.postDataJSON()?.action))writes.push(r.postDataJSON()?.action);});
 await page.goto('https://'+host+'/library/dcp-designer');assert.equal((await(await page.request.get('https://'+host+'/__nexora-release.json')).json()).id,process.env.EXPECTED_RELEASE);assert.equal((await page.request.get('https://'+host+'/api/health')).status(),200);
 await page.locator('input').first().fill('admin');await page.locator('input[type=password]').fill('admin');await page.keyboard.press('Enter');await page.locator('header').first().waitFor();
 await page.keyboard.press('Control+k');const menu=page.getByRole('dialog');await menu.locator('input').first().fill('dcp-designer');await menu.locator('button.group').first().click();
 const root=page.locator('[data-designer]:visible');await root.getByRole('button',{name:'Dropdown',exact:true}).click();
 const inspector=root.locator('aside').last();await inspector.evaluate(e=>e.scrollTop=0);
 assert.ok((await inspector.getByRole('heading').allTextContents())[0].includes('Field settings'));
 const columns=await root.locator('aside').first().evaluate(e=>getComputedStyle(e.parentElement).gridTemplateColumns.split(' ').length);assert.equal(columns,3);
 const control=root.locator('select').filter({has:page.locator('option[value=radio]')});assert.equal(await control.isDisabled(),false);await control.selectOption('radio');await inspector.evaluate(e=>e.scrollTop=0);
 assert.ok(await root.evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.screenshot({path:dir+'/'+host+'-designer.png'});
 await root.getByRole('button',{name:'Live preview',exact:true}).click();assert.equal(await root.getByRole('radio').count(),1);
 await root.getByRole('button',{name:'Design',exact:true}).click();await page.setViewportSize({width:390,height:900});assert.ok(await root.evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.screenshot({path:dir+'/'+host+'-narrow.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);console.log('PASS '+host+': expected release, API health, three-column designer, field settings first, enabled control selection, radio preview and narrow layout; no page errors or saved designs/answers/preferences.');await page.close({runBeforeUnload:false});
}}finally{await browser.close();}
