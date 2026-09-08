// Writes one comment and one approval fixture. Use an isolated API data directory.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadPlaywright} from './harness.mjs';
const api=process.env.E2E_API??'http://127.0.0.1:3330',target=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
for(const url of [api,target])assert.ok(['localhost','127.0.0.1'].includes(new URL(url).hostname),'Isolated local fixtures only.');
const session=await fetch(api+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'admin'})}).then(r=>r.json());
const headers={'Content-Type':'application/json',Authorization:`Bearer ${session.token}`};
const call=async(path,body)=>{const response=await fetch(api+path,{method:'POST',headers,body:JSON.stringify(body)});return {response,data:await response.json()};};
const id=crypto.randomUUID(),comment='Localization test content A-19';
const panel=await call('/record-panels',{scope:['nexora','customer-master','CUS-02401'],action:'comment',text:comment,operationId:id});assert.ok(panel.response.ok);assert.ok(panel.data.activity[0].messageKey);
const approval=await call('/approvals',{scope:['nexora','customer-master'],action:'read'});assert.ok(approval.response.ok);
if(!approval.data.items.some(item=>item.recordId==='CUS-02401'))assert.ok((await call('/approvals',{scope:['nexora','customer-master'],action:'submit',recordId:'CUS-02401',version:0,comment,operationId:crypto.randomUUID()})).response.ok);
const notice=(await call('/approvals',{scope:['nexora','customer-master'],action:'read'})).data.notifications.find(item=>item.recordId==='CUS-02401');assert.ok(notice.messageKey);
const failed=await call('/record-panels',{});assert.equal(failed.response.status,400);assert.ok(failed.data.errorMessage.messageKey);
const en=JSON.parse(readFileSync(new URL('../../dummy-api/config/localization/shared/en.json',import.meta.url))).messages;
const keys=new Map(Object.entries(en).map(([key,value])=>[value,key]));
const {chromium}=loadPlaywright(),browser=await chromium.launch({chromiumSandbox:false});
async function open(page){await page.keyboard.press('Control+k');const dialog=page.getByRole('dialog');await dialog.locator('input').first().fill('customer-master');await dialog.locator('button.group').first().click();}
try{for(const language of ['en','ar','hi','ml']){
 const messages=JSON.parse(readFileSync(new URL(`../../dummy-api/config/localization/shared/${language}.json`,import.meta.url))).messages;
 const t=(key,values={})=>(messages[key]??messages[keys.get(key)]??key).replace(/\{(\w+)\}/g,(match,name)=>values[name]??match);
 const context=await browser.newContext({viewport:{width:1600,height:1000}}),page=await context.newPage();
 await context.route(url=>url.pathname==='/preferences',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{language,sidebarPinned:true,reducedMotion:true,floatingWindows:false}})}));
 await page.goto(target);await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').waitFor();await open(page);
 await page.getByRole('button',{name:t('Approval inbox'),exact:true}).click();const summary=page.locator('summary').filter({hasText:t('My approval notifications · Unread: {count}',{count:1})});await summary.click();
 await page.getByText(t(notice.messageKey,notice.messageValues),{exact:false}).and(page.locator(':visible')).first().waitFor();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:t('Edit {item}',{item:'CUS-02401'}),exact:true}).click();
 const supporting=page.getByRole('region',{name:t('Record supporting information'),exact:true});await supporting.waitFor();
 await supporting.getByRole('button',{name:t('Activity'),exact:true}).click();await supporting.getByText(t(panel.data.activity[0].messageKey),{exact:true}).first().waitFor();
 await supporting.getByRole('button',{name:t('Comments'),exact:true}).click();await supporting.getByText(comment,{exact:true}).first().waitFor();
 await context.route(url=>url.pathname==='/record-panels',route=>route.fulfill({status:400,contentType:'application/json',body:JSON.stringify(failed.data)}));
 await supporting.getByRole('button',{name:t('Refresh panels'),exact:true}).click();await page.getByText(t(failed.data.errorMessage.messageKey,failed.data.errorMessage.messageValues),{exact:false}).and(page.locator(':visible')).first().waitFor();
 await context.close();console.log(`PASS ${language}: actual API error descriptor, notification, activity, unchanged comment`);
}}finally{await browser.close();await fetch(api+'/auth/logout',{method:'POST',headers});}
