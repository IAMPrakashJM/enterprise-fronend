// Use isolated API with /tmp/nexora-api-navigation-config overrides described in docs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ar=JSON.parse(readFileSync(new URL('../../dummy-api/config/localization/shared/ar.json',import.meta.url),'utf8')).messages;
const editLabel=ar['Edit {item}'].replace('{item}','CUS-02401');
import {loadPlaywright} from './harness.mjs';
const {chromium}=loadPlaywright(),browser=await chromium.launch({chromiumSandbox:false});
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\/(navigation|localization)\?/.test(r.url()))requests.push(r.url());});
 await context.route('**/preferences',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{language:'ar',sidebarPinned:true,reducedMotion:true,floatingWindows:false,openRecordsIn:'same-tab'}})}));
 await page.goto(process.env.E2E_DESKTOP??'http://127.0.0.1:3109');await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').waitFor();
 const open=async(query)=>{await page.keyboard.press('Control+k');await page.getByRole('dialog').locator('input').first().fill(query);await page.getByRole('dialog').locator('button.group').first().click();};
 await open('Customer Master');await page.getByRole('button',{name:editLabel,exact:true}).waitFor();
 assert.equal(await page.locator('header h1').innerText(),'صفحة العملاء من الخادم');
 await page.locator('thead th').filter({hasText:'المعرف من الخادم'}).waitFor({timeout:5000}).catch(async e=>{console.log((await page.locator('main').innerText()).slice(0,3500));await page.screenshot({path:'/tmp/backend-navigation-debug.png'});throw e;});
 const sidebar=page.locator('aside[data-tour=sidebar]');
 if(!await sidebar.getByText('عملاء من الخادم',{exact:true}).isVisible())await sidebar.getByRole('button').filter({hasText:'الأطراف'}).click();
 await sidebar.getByText('عملاء من الخادم',{exact:true}).waitFor();
 assert.equal(await sidebar.locator('a[href*="vendor-master"]').count(),0);
 await page.getByRole('button',{name:editLabel,exact:true}).click();
 await page.getByLabel(/^اسم المؤسسة من الخادم/).fill('Unchanged record value');
 assert.equal(await page.getByLabel(/^اسم المؤسسة من الخادم/).inputValue(),'Unchanged record value');
 assert.ok(requests.some(url=>url.includes('/navigation?')));assert.equal(new Set(requests.filter(url=>url.includes('/localization?')).map(url=>new URL(url).searchParams.get('language'))).size,1);
 assert.deepEqual(errors,[]);console.log('PASS backend menu removal, stable menu translation, page title, column and field overrides, unchanged form values and only the selected API catalog');
 await context.close();
 const retryContext=await browser.newContext({viewport:{width:1440,height:900}}),retryPage=await retryContext.newPage();let fail=true;
 await retryContext.route(url=>url.pathname==='/navigation',route=>fail?route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Test outage'})}):route.continue());
 await retryPage.goto(process.env.E2E_DESKTOP??'http://127.0.0.1:3109');await retryPage.getByPlaceholder('user1').fill('admin',{timeout:5000}).catch(async e=>{console.log((await retryPage.locator('body').innerText()).slice(0,2000));throw e;});await retryPage.locator('input[type=password]').fill('admin');await retryPage.locator('button[type=submit]').click();
 await retryPage.getByRole('button',{name:'Retry loading application'}).waitFor();assert.equal(await retryPage.locator('header').count(),0);
 fail=false;await retryPage.getByRole('button',{name:'Retry loading application'}).click();await retryPage.locator('header').waitFor();
 await retryContext.close();console.log('PASS API outage does not expose static menus; retry restores the application');

}finally{await browser.close();}
