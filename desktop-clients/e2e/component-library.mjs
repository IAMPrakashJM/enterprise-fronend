import assert from 'node:assert/strict';
import {loadPlaywright} from './harness.mjs';
import {audit} from './a11y.mjs';
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false});
try {
 const context=await browser.newContext({viewport:{width:1700,height:1100}}),page=await context.newPage(),errors=[];
 page.setDefaultTimeout(30000);page.on('pageerror',error=>errors.push(error.message));
 await context.route('**/preferences',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{sidebarPinned:true,reducedMotion:true,floatingWindows:false,openRecordsIn:'same-tab'}})}));
 await page.goto(process.env.E2E_DESKTOP??'http://127.0.0.1:3109');await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').first().waitFor();
 const writes=[];page.on('request',request=>{if(['POST','PUT','PATCH','DELETE'].includes(request.method())&&/\/(records|drafts|imports|approvals|record-panels)(\/|$)/.test(new URL(request.url()).pathname))writes.push(request.url());});
 async function open(id){console.log(`Opening Library page: ${id}`);if(await page.getByRole('tab').count()>=10){await page.getByRole('button',{name:'Tab options',exact:true}).click();await page.getByRole('button',{name:'Close other tabs',exact:true}).click();}if(id==='localization'){await page.locator('[data-component-catalog]:visible').getByRole('button',{name:'Localization',exact:true}).click();await page.locator('[data-component-catalog="localization"]').waitFor();return;}await page.keyboard.press('Control+k');const dialog=page.getByRole('dialog');await dialog.locator('input').first().fill(id);await dialog.locator('button.group').first().click();await page.locator(`[data-component-catalog="${id}"]`).waitFor();}
 await open('form-controls');let root=page.locator('[data-component-catalog="form-controls"]');
 const text=root.locator('[data-catalog-example="TextDemo"]');await text.getByRole('textbox',{name:/^Name/}).fill('Local example');await text.getByRole('button',{name:'Reset demo'}).click();assert.equal(await text.getByRole('textbox',{name:/^Name/}).inputValue(),'');
 await root.getByLabel('Search component names or source files').fill('MultiSelect');assert.equal(await root.locator('[data-catalog-example]').count(),1);assert.ok((await root.getByRole('textbox',{name:'React integration code'}).inputValue()).includes('import { useState } from "react"'));
 await root.getByRole('button',{name:'Copy code'}).click();await root.getByText(/Code copied\.|Clipboard unavailable\./).waitFor();
 await root.getByLabel('Search component names or source files').fill('Input');assert.deepEqual((await audit(page,{include:'[data-component-catalog]'})).filter(v=>['critical','serious'].includes(v.impact)),[]);
 await page.screenshot({path:'/tmp/component-library-forms.png'});
 await root.getByRole('button',{name:'Dates & Calendars',exact:true}).click();await page.locator('[data-component-catalog="date-components"]').waitFor();
 await open('feedback-components');root=page.locator('[data-component-catalog="feedback-components"]');await root.getByLabel('Search component names or source files').fill('Modal');await root.getByRole('button',{name:'Modal',exact:true}).click();await page.getByRole('dialog',{name:'Details',exact:true}).waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog',{name:'Details',exact:true}).count(),0);
 await open('data-patterns');root=page.locator('[data-component-catalog="data-patterns"]');assert.equal(await root.locator('tbody tr').count(),2);await root.getByRole('button',{name:'Amount',exact:true}).click();await root.getByRole('button',{name:'Amount',exact:true}).click();assert.ok((await root.locator('tbody tr').first().textContent()).includes('Example B'));
 await root.getByRole('button',{name:'Amount: 240',exact:true}).click();await root.getByRole('textbox',{name:'Amount',exact:true}).fill('360');await root.getByRole('textbox',{name:'Amount',exact:true}).press('Enter');await root.getByRole('button',{name:'Amount: 360',exact:true}).waitFor();
 for(const id of ['component-library','card-components','table-components','navigation-components','inline-components','form-patterns','billing-patterns','localization']){await open(id);assert.ok(await page.locator(`[data-component-catalog="${id}"] [data-catalog-example]`).count());}
 assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);console.log('PASS component groups, live state/reset, source code, clipboard fallback, API navigation, overlays, table, accessibility and zero business writes');
} finally {await browser.close();}
