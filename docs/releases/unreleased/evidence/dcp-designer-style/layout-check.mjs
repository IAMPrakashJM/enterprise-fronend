import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startApi} from '/home/pepadmin/enterprice/desktop-clients/e2e/managed-api.mjs';
const stop=await startApi('http://127.0.0.1:3330','dcp-style-layout');
const {chromium}=createRequire(import.meta.url)('/home/pepadmin/.npm/_npx/f0a362733743bae2/node_modules/playwright');
const browser=await chromium.launch({chromiumSandbox:false});
try{
 const p=await browser.newPage({viewport:{width:1600,height:1000}});p.setDefaultTimeout(25000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:3109');await p.locator('input').first().fill('admin');await p.locator('input[type=password]').fill('admin');await p.keyboard.press('Enter');await p.locator('header').first().waitFor();await p.keyboard.press('Control+k');const d=p.getByRole('dialog');await d.locator('input').first().fill('dcp-designer');await d.locator('button.group').first().click();
 const root=p.locator('[data-designer]:visible');await root.getByRole('button',{name:'Dropdown',exact:true}).click();
 const inspector=root.locator('aside').last();await inspector.evaluate(e=>e.scrollTop=0);
 for(const width of [1600,1280,960,768,390]){
  await p.setViewportSize({width,height:1000});await p.waitForTimeout(150);
  assert.equal(await root.evaluate(e=>e.scrollWidth<=e.clientWidth+1),true,'designer overflow at '+width);
  assert.equal(await root.locator('select').filter({has:p.locator('option[value=radio]')}).isDisabled(),false);
  await p.screenshot({path:'/tmp/dcp-style-browser/layout-'+width+'.png'});
 }
 await p.setViewportSize({width:1600,height:1000});
 const form=root.locator('select').filter({has:p.locator('option[value=radio]')});await form.selectOption('radio');
 await inspector.evaluate(e=>e.scrollTop=0);await root.getByLabel('Label',{exact:true}).fill('Test selection');
 await root.getByRole('button',{name:'Live preview',exact:true}).click();assert.equal(await root.getByRole('radio').count(),1);
 assert.deepEqual(errors,[]);console.log('PASS five viewport layouts, enabled inspector control and radio preview; isolated local Vite Chromium.');
}finally{await browser.close();await stop();}
