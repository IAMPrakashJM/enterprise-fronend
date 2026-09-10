import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {loadPlaywright} from './harness.mjs';
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false});
const artifacts=process.env.E2E_ARTIFACTS??'/tmp/unified-help';mkdirSync(artifacts,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1700,height:1050}});page.setDefaultTimeout(25000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.E2E_DESKTOP??'http://127.0.0.1:3109');await page.locator('input').first().fill('admin');await page.locator('input[type=password]').fill('admin');await page.keyboard.press('Enter');await page.locator('header').first().waitFor();
 async function open(id){await page.keyboard.press('Control+k');const d=page.getByRole('dialog');await d.locator('input').first().fill(id);await d.locator('button.group').first().click();}
 for(const language of ['en','ar','hi','ml']){
 if(language!=='en'){await open('preferences');await page.getByRole('tab').filter({hasText:/Language & help|اللغة والمساعدة|भाषा और सहायता|ഭാഷയും സഹായവും/}).click();await page.locator('[data-tour="prefs-lang"] select').selectOption(language);await page.waitForFunction(l=>document.documentElement.lang===l,language);}
 await open('list-of-pages');const response=page.waitForResponse(r=>r.url().includes('/documentation?')&&r.url().includes('pageId=billing-clinic'));
 await page.locator('[data-page-library-entry="billing-clinic"] button').last().click();const body=await(await response).json();const article=page.locator('[data-documentation-page="billing-clinic"]');await article.waitFor();
 assert.equal(body.guide.requestedLanguage,language);assert.ok(body.guide.sourceHash);assert.ok(body.guide.translationStatus);const paragraph=body.guide.sections[0].paragraphs[0];await article.getByText(paragraph,{exact:true}).waitFor();
 await page.screenshot({path:artifacts+'/'+language+'-guide.png'});await page.keyboard.press('Escape');
 // Escape is the common modal-close contract, independent of translated labels.
 if(await article.count())await page.keyboard.press('Escape');
 await open('billing-clinic');await page.locator('header button').filter({has:page.locator('svg.lucide-circle-help')}).click();
 const helper=page.getByRole('dialog');await helper.locator('[data-documentation-page="billing-clinic"]').getByText(paragraph,{exact:true}).waitFor();
 assert.equal(await page.locator('html').getAttribute('dir'),language==='ar'?'rtl':'ltr');await page.keyboard.press('Escape');
 }
 assert.deepEqual(errors,[]);console.log('PASS unified API article in catalog and contextual Help, matching content, four preferred languages and RTL, revision metadata; no page errors');
}finally{await browser.close();}
