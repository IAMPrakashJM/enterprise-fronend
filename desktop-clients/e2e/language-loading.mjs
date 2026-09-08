import assert from 'node:assert/strict';
import {loadPlaywright} from './harness.mjs';
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false});
const target=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
try{
 const context=await browser.newContext({viewport:{width:1600,height:1000}}),page=await context.newPage(),requests=[],writes=[];
 page.on('request',request=>{if(new URL(request.url()).pathname.endsWith('/localization'))requests.push(new URL(request.url()).searchParams.get('language'));});
 await context.route('**/preferences',route=>{
  if(route.request().method()==='PUT')writes.push(route.request().postDataJSON().preferences);
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{language:'en',sidebarPinned:true,floatingWindows:false,reducedMotion:true}})});
 });
 await page.goto(target);await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').waitFor();
 assert.deepEqual(requests,['en'],'initial bootstrap loads only English');
 await page.keyboard.press('Control+k');await page.getByRole('dialog').locator('input').first().fill('preferences');await page.getByRole('dialog').locator('button.group').first().click();
 await page.getByRole('tab').filter({hasText:'Language & help'}).click();
 const language=page.locator('select').filter({has:page.locator('option[value=ar]')});
 await language.waitFor();
 let fail=true;
 await context.route(url=>url.pathname.endsWith('/localization')&&url.searchParams.get('language')==='ar',route=>fail?route.fulfill({status:503,body:'unavailable'}):route.continue());
 await language.selectOption('ar');await page.getByText('Could not load language',{exact:true}).waitFor();
 assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.ok(!writes.some(value=>value?.language==='ar'));
 fail=false;await language.selectOption('ar');
 await page.waitForFunction(()=>document.documentElement.lang==='ar');
 assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
 assert.ok(requests.includes('ar'));assert.ok(!requests.includes('hi')&&!requests.includes('ml'));
 console.log('PASS language loading: one initial catalog, failed switch preserves preference, successful retry applies RTL without unrelated language downloads');
 await context.close();
}finally{await browser.close();}
