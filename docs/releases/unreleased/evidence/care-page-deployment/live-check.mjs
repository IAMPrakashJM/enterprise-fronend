import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/home/pepadmin/.npm/_npx/f0a362733743bae2/node_modules/playwright');
const dir='/tmp/care-live';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({chromiumSandbox:false});
try {
 for(const host of ['front-design.pepbits.com','desktop.front-design.pepbits.com']){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://'+host+'/library/emergency-registration');
  const release=await page.request.get('https://'+host+'/__nexora-release.json');
  assert.equal((await release.json()).id,process.env.EXPECTED_RELEASE);
  await page.locator('input').first().fill('admin');await page.locator('input[type=password]').fill('admin');await page.keyboard.press('Enter');await page.locator('header').first().waitFor();
  for(const id of ['emergency-registration','inpatient-admission','consultation-entry-design','consultation-entry-v2']){
   const response=page.waitForResponse(r=>r.url().endsWith('/care-pages')&&r.request().postDataJSON()?.pageId===id);
   await page.keyboard.press('Control+k');const d=page.getByRole('dialog');await d.locator('input').first().fill(id);await d.locator('button.group').first().click();
   const api=await response;assert.equal(api.status(),200);const body=await api.json();assert.ok(body);
   const root=page.locator('[data-care-page]:visible');await root.getByRole('heading',{level:1}).waitFor();await root.getByRole('button',{name:/Amina Mohammed/}).waitFor();
   assert.ok(!/\bcare\.[A-Za-z]/.test(await root.innerText()));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:dir+'/'+host+'-'+id+'.png'});
   console.log('PASS '+host+'/'+id+': release identity, authenticated API load, patient choices, localized labels and desktop layout. No care records mutated.');
  }
  assert.deepEqual(errors,[]);await page.close();
 }
}finally{await browser.close();}
