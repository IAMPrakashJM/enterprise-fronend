import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/pepadmin/.npm/_npx/f0a362733743bae2/node_modules/playwright');
const browser=await chromium.launch({chromiumSandbox:false});
try {
 for(const host of ['front-design.pepbits.com','desktop.front-design.pepbits.com']){
  const page=await browser.newPage({viewport:{width:1700,height:1050}});page.setDefaultTimeout(30000);
  const errors=[];const calls=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().endsWith('/op-registration'))calls.push(r.status());});
  await page.goto('https://'+host+'/library/op-registration');
  await page.locator('input').first().fill('admin');await page.locator('input[type=password]').fill('admin');await page.keyboard.press('Enter');await page.locator('header').first().waitFor();
  if(!await page.locator('[data-op-registration]').count()){
   await page.keyboard.press('Control+k');const d=page.getByRole('dialog');await d.locator('input').first().fill('op-registration');await d.locator('button.group').first().click();
  }
  const root=page.locator('[data-op-registration]');await root.waitFor();await root.locator('tbody button').first().click();
  await root.locator('[data-field=identityName] input').waitFor();
  assert.equal(await root.locator('nav button').count(),5);
  assert.ok(!(await root.innerText()).includes('registration.'));
  await root.locator('[data-field=identityName] input').check();await root.locator('[data-field=identityDob] input').check();
  await root.locator('[data-tour=op-registration-actions]').getByRole('button',{name:'Continue',exact:true}).click();
  await root.locator('[data-field=reason] input').waitFor();
  const footer=await root.locator('[data-tour=op-registration-actions]').boundingBox();assert.ok(footer.y+footer.height<=1050);
  await page.screenshot({path:'/tmp/op-live-'+host+'.png'});
  assert.ok(calls.length>=2);assert.ok(calls.every(s=>s===200));assert.deepEqual(errors,[]);
  console.log('PASS '+host+': authenticated registration route, five steps, API configuration/patient load, identity-to-visit transition, visible footer, no page errors. No records saved.');
  await page.close();
 }
}finally{await browser.close();}
