import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/home/pepadmin/.npm/_npx/f0a362733743bae2/node_modules/playwright');
const dir='/tmp/dcp-preview-live';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({chromiumSandbox:false});
try {
 for(const host of ['front-design.pepbits.com','desktop.front-design.pepbits.com']){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://'+host+'/library/dcp-designer');
  const release=await page.request.get('https://'+host+'/__nexora-release.json');
  assert.equal((await release.json()).id,process.env.EXPECTED_RELEASE);
  await page.locator('input').first().fill('admin');await page.locator('input[type=password]').fill('admin');await page.keyboard.press('Enter');await page.locator('header').first().waitFor();
  for(const id of ['dcp-designer']){
   const response=page.waitForResponse(r=>r.url().endsWith('/dcp-designer')&&r.request().postDataJSON()?.action==='load');
   await page.keyboard.press('Control+k');const d=page.getByRole('dialog');await d.locator('input').first().fill(id);await d.locator('button.group').first().click();
   const api=await response;assert.equal(api.status(),200);const body=await api.json();assert.ok(body);
   const root=page.locator('[data-designer]:visible');await root.getByRole('heading',{level:1}).waitFor();await root.getByRole('button',{name:'Text',exact:true}).waitFor();assert.ok(Array.isArray(body.types));
   let writes=0;page.on('request',r=>{if(r.url().endsWith('/dcp-designer')&&r.method()==='POST'&&r.postDataJSON()?.action==='save')writes++;});
   await root.getByLabel('Form title').fill('Preview acceptance form');
   await root.getByRole('button',{name:'Live preview',exact:true}).click();
   const preview=root.locator('[data-designer-preview]');await preview.getByRole('heading',{name:'Preview acceptance form'}).waitFor();
   assert.equal(await root.getByLabel('Form title').count(),0);assert.equal(await root.getByRole('button',{name:'Save design draft'}).count(),0);
   const input=preview.locator('input[type=text]').first();await input.fill('Synthetic preview answer');
   await preview.getByRole('button',{name:'Validate preview'}).click();
   await root.getByRole('button',{name:'Design',exact:true}).click();assert.equal(await root.getByLabel('Form title').inputValue(),'Preview acceptance form');
   await root.getByRole('button',{name:'Live preview',exact:true}).click();assert.equal(await input.inputValue(),'Synthetic preview answer');
   await preview.getByRole('button',{name:'Reset preview'}).click();assert.equal(await input.inputValue(),'');assert.equal(writes,0);

   assert.ok(!/\bdesigner\.[A-Za-z]/.test(await root.innerText()));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:dir+'/'+host+'-'+id+'.png'});
   console.log('PASS '+host+'/'+id+': release identity, authenticated API load, unsaved form preview, hidden authoring controls, validation, return-to-design preservation, test answer reset and desktop layout. No designs or business records mutated.');
  }
  assert.deepEqual(errors,[]);await page.close();
 }
}finally{await browser.close();}
