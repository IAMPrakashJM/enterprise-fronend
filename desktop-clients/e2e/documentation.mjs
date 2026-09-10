import assert from 'node:assert/strict';
import {loadPlaywright} from './harness.mjs';
const api=process.env.E2E_API??'http://127.0.0.1:3330',target=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
const release='2026-09-08-documentation';
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false});
try {
 const page=await browser.newPage({viewport:{width:1700,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async route=>{const url=new URL(route.request().url());await route.fulfill({response:await route.fetch({url:api+url.pathname.slice(4)+url.search})});});
 await page.goto(target);await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').first().waitFor();
 const initialIndex=page.waitForResponse(r=>r.url().includes('/documentation?')&&!r.url().includes('pageId='));
 await page.locator('header').getByRole('button',{name:'Documentation Center',exact:true}).click();
 const available=await(await initialIndex).json();
 const center=page.locator('[data-tour=documentation-center]');await center.waitFor();
 const search=center.getByRole('textbox',{name:'Search documentation'});await search.fill('Customer Master');
 await center.getByRole('button',{name:'Customer Master',exact:true}).first().click();await center.locator('[data-documentation-page=customer-master]').waitFor();
 await center.getByRole('button',{name:'Releases',exact:true}).click();await search.fill('');await center.getByRole('button',{name:'2026.09.08 / Preferences',exact:true}).click();await center.getByRole('heading',{name:'Tenant preference policies',exact:true}).waitFor();
 await center.getByRole('button',{name:'Patches',exact:true}).click();const patches=available.releases.filter(r=>r.type==='patch');if(patches.length)await center.getByRole('button',{name:patches[0].version,exact:true}).waitFor();else await center.getByText('No published patches for this version.',{exact:true}).waitFor();
 await center.getByRole('button',{name:"What's new",exact:true}).click();
 const notice=center.locator('section').filter({has:page.getByRole('heading',{name:'Administrator-managed preferences',exact:true})});await notice.getByRole('button',{name:'Read explanation'}).click();
 await center.locator('#doc-preferences-workflow').waitFor();
 const token=(await(await fetch(api+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'admin'})})).json()).token;
 const headers={Authorization:`Bearer ${token}`,'X-Product-Id':'nexora','Content-Type':'application/json'};
 const index=await(await fetch(`${api}/documentation?releaseId=${release}`,{headers})).json();assert.ok(index.changes.find(c=>c.id==='preference-policy-controls').readAt);assert.equal(index.changes[0].acknowledgedAt,null);
 for(const language of ['ar','hi','ml']) {
 const settings=await(await fetch(api+'/preferences',{headers})).json();await fetch(api+'/preferences',{method:'PUT',headers,body:JSON.stringify({preferences:{...settings.overrides,language},policyRevision:settings.policy.revision,userRevision:settings.userRevision})});
 await page.reload();await page.waitForFunction(lang=>document.documentElement.lang===lang,language);
 const localized=await(await fetch(`${api}/documentation?releaseId=${release}&pageId=patient-master&language=${language}`,{headers})).json();
 const catalog=await(await fetch(`${api}/localization?productId=nexora&language=${language}`,{headers})).json();
 await page.locator('header').getByRole('button',{name:catalog.messages['Documentation Center'],exact:true}).click();
 const root=page.locator('[data-tour=documentation-center]');await root.locator('input').first().fill(localized.guide.title);
 await root.getByRole('button',{name:localized.guide.title,exact:true}).first().click();
 const article=root.locator('[data-documentation-page=patient-master]');await article.waitFor();
 assert.ok((await article.innerText()).includes(localized.guide.sections[0].paragraphs[0]));
 assert.equal(await page.locator('html').getAttribute('dir'),language==='ar'?'rtl':'ltr');
 console.log('PASS documentation language',language);
 await page.screenshot({path:`/tmp/documentation-${language}.png`});
 }
 assert.deepEqual(errors,[]);console.log('PASS documentation: page guide, release archive, API-driven patch list/empty state, exact-section notice, durable read state Arabic, Hindi and Malayalam');
}finally{await browser.close();}
