import assert from 'node:assert/strict';import {loadPlaywright} from './harness.mjs';
const api=process.env.E2E_API??'http://127.0.0.1:3330',target=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false});
try{
 async function login(name){const context=await browser.newContext({viewport:{width:1700,height:1100}});const page=await context.newPage();await page.route('**/api/**',async route=>{const url=new URL(route.request().url());await route.fulfill({response:await route.fetch({url:api+url.pathname.slice(4)+url.search})});});await page.goto(target);await page.getByPlaceholder('user1').fill(name);await page.locator('input[type=password]').fill(name);await page.locator('button[type=submit]').click();await page.locator('header').first().waitFor();return {page,context};}
 const user=await login('user1');const packets=[];user.page.on('request',req=>{if(req.url().includes('/monitoring/events'))packets.push(req.postData());});
 const receipt=user.page.waitForResponse(r=>r.url().includes('/monitoring/events')&&r.status()===202);
 await user.page.evaluate(()=>{window.dispatchEvent(new ErrorEvent('error',{message:'PATIENT SECRET',filename:'https://example.com/token-secret',lineno:123,colno:9,error:new Error('PATIENT SECRET')}));window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection',{promise:Promise.resolve(),reason:'TOKEN SECRET'}));});await receipt;
 assert.ok(packets.length);assert.ok(!packets.join('').includes('SECRET'));assert.ok(!packets.join('').includes('example.com'));
 const admin=await login('admin');await admin.page.keyboard.press('Control+k');const dialog=admin.page.getByRole('dialog');await dialog.locator('input').first().fill('Error Monitor');await dialog.locator('button.group').first().click();const monitor=admin.page.locator('[data-error-monitor]');await monitor.waitFor();await monitor.getByRole('cell',{name:'Runtime error',exact:true}).waitFor();
 const row=monitor.getByRole('row').filter({has:admin.page.getByRole('cell',{name:'Runtime error',exact:true})});await row.getByRole('button',{name:'View details'}).click();await monitor.getByRole('button',{name:'Resolved',exact:true}).click();await monitor.getByRole('cell',{name:'Resolved',exact:true}).waitFor();
 const token=(await(await fetch(api+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'user1',password:'user1'})})).json()).token;
 assert.equal((await fetch(api+'/monitoring/incidents',{headers:{Authorization:`Bearer ${token}`}})).status,403);
 // Delivery must survive repeated failures and offline transport without
 // replaying business requests or changing the event identity.
 let attempts=0;const retries=[];
 await user.page.route('**/monitoring/events',async route=>{
  attempts++;retries.push(JSON.parse(route.request().postData()).events);
  if(attempts===1)return route.abort('internetdisconnected');
  if(attempts===2)return route.fulfill({status:503,body:'{}'});
  return route.fallback();
 });
 const recovered=user.page.waitForResponse(r=>r.url().includes('/monitoring/events')&&r.status()===202,{timeout:45000});
 await user.page.evaluate(()=>window.dispatchEvent(new ErrorEvent('error',{lineno:777,colno:1})));
 await recovered;assert.equal(attempts,3);assert.deepEqual(retries[0],retries[1]);assert.deepEqual(retries[1],retries[2]);
 assert.equal(await user.page.locator('header').first().isVisible(),true);
 await user.page.unroute('**/monitoring/events');
 let timeoutAttempts=0;const timeoutPackets=[];let aborted=false;
 const failedRequest=req=>{if(req.url().includes('/monitoring/events'))aborted=true;};
 user.page.on('requestfailed',failedRequest);
 await user.page.route('**/monitoring/events',async route=>{
  timeoutAttempts++;timeoutPackets.push(JSON.parse(route.request().postData()).events);
  if(timeoutAttempts===1){await new Promise(resolve=>setTimeout(resolve,12000));await route.abort().catch(()=>{});return;}
  return route.fallback();
 });
 const afterTimeout=user.page.waitForResponse(r=>r.url().includes('/monitoring/events')&&r.status()===202,{timeout:45000});
 await user.page.evaluate(()=>window.dispatchEvent(new ErrorEvent('error',{lineno:778,colno:1})));
 await afterTimeout;assert.ok(aborted,'Stalled upload must be aborted');assert.equal(timeoutAttempts,2);assert.deepEqual(timeoutPackets[0],timeoutPackets[1]);
 user.page.off('requestfailed',failedRequest);await user.page.unroute('**/monitoring/events');
 await user.page.route('**/monitoring/events',route=>route.fulfill({status:401,contentType:'application/json',body:'{"error":"Not signed in."}'}));
 const rejected=user.page.waitForResponse(r=>r.url().includes('/monitoring/events')&&r.status()===401);await user.page.evaluate(()=>window.dispatchEvent(new ErrorEvent('error',{message:'PRIVATE',lineno:999,colno:1})));await rejected;assert.equal(await user.page.locator('header').first().isVisible(),true);
 console.log('PASS Sentinel: runtime and promise capture, sanitized upload, administrator inbox, status update denied non-admin access offline/503/timeout recovery with stable event IDs and monitoring-auth failure isolation');
 await admin.context.close();await user.context.close();
}finally{await browser.close();}
