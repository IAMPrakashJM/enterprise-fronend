import { loadPlaywright } from './harness.mjs';
const { chromium } = loadPlaywright();
const base = process.env.E2E_DESKTOP ?? 'http://127.0.0.1:3109';
const api = process.env.E2E_API ?? 'http://localhost:3330';
import assert from 'node:assert/strict';
const browser=await chromium.launch({chromiumSandbox:false});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
await context.route('**/preferences',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{sidebarPinned:true,reducedMotion:true,floatingWindows:false,openRecordsInTabs:true}})}));
const page=await context.newPage();
async function openPage(p,name) {
 await p.getByRole('button',{name:'Open page',exact:true}).click();
 await p.getByPlaceholder('Search pages, modules and actions…').fill(name);
 await p.getByRole('dialog').getByRole('button').filter({hasText:name}).first().click();
}
try {
 await page.goto(base);
 await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();
 await page.locator('header').waitFor();
 await openPage(page,'Customer Master');
 await page.getByRole('button',{name:'Edit CUS-02401',exact:true}).click();
 const legal=page.getByRole('textbox',{name:/Legal name/});
 await legal.fill('Recovery browser check');
 await page.getByText('Recovery draft saved · record has unsaved changes',{exact:true}).waitFor();
 await page.reload();
 await openPage(page,'Customer Master');
 await page.getByRole('button',{name:'Edit CUS-02401',exact:true}).click();
 await page.getByRole('button',{name:'Restore draft',exact:true}).click();
 assert.equal(await legal.inputValue(),'Recovery browser check');
 console.log('PASS refresh/reopen recovery');
 // Restore the baseline to leave no persisted demo record changes.
 await page.getByRole('button',{name:'Discard',exact:true}).click();
 await page.getByText('No changes saved',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS discard and no runtime errors');
 await openPage(page,'Customer Master');
 await page.getByRole('button',{name:/^New/}).first().click();
 await page.getByText('Loading saved record and recovery draft…',{exact:true}).waitFor({state:'hidden'});
 const restore = page.getByRole('button',{name:'Restore draft',exact:true});
 if(await restore.isVisible()) await restore.click();
 const name = `Created browser record ${Date.now()}`;
 await page.getByRole('textbox',{name:/Customer code/}).fill(`CUS-TEST-${Date.now()}`);
 await page.getByRole('textbox',{name:/Legal name/}).fill(name);
 await page.getByLabel('Customer type',{exact:false}).locator('visible=true').selectOption('Corporate');
 await page.locator('[data-tour=form-nav]:visible').getByRole('button').filter({hasText:'Contacts'}).click();
 await page.getByRole('textbox',{name:/Primary contact/}).fill('Demo contact');
 await page.getByRole('textbox',{name:/Email/,exact:false}).fill('demo@example.test');
 await page.locator('[data-tour=form-nav]:visible').getByRole('button').filter({hasText:'Address'}).click();
 await page.getByRole('textbox',{name:/Address line 1/}).fill('Demo address');
 await page.getByRole('textbox',{name:/City/}).fill('Abu Dhabi');
 await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.getByText('Saved',{exact:true}).locator('visible=true').waitFor();
 await openPage(page,'Customer Master');
 await page.getByPlaceholder('Search customer master by ID, name or any visible value…').fill(name);
 await page.getByText(name,{exact:true}).locator('visible=true').first().waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS create, confirmed save and worklist discovery; no runtime errors');

} finally {
 try { const token=await page.evaluate(()=>localStorage.getItem('nexora-session-token')); if(token) await fetch(api+'/auth/logout',{method:'POST',headers:{Authorization:`Bearer ${token}`}}); }
 finally { await browser.close(); }
}
