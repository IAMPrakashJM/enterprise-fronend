// Read-only browser checks against an isolated local API. Preferences are intercepted.
import assert from 'node:assert/strict';
import {loadPlaywright} from './harness.mjs';
const target=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
assert.ok(['localhost','127.0.0.1'].includes(new URL(target).hostname),'Use an isolated local environment.');
const {chromium}=loadPlaywright(),browser=await chromium.launch({chromiumSandbox:false});
try {
 for(const [language,numberLocale,currencyCode] of [['ar','de-DE','EUR'],['hi','en-IN','INR']]) {
  const context=await browser.newContext({viewport:{width:1600,height:1000},locale:'en-US'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route(url=>url.pathname==='/preferences',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{language,numberLocale,currencyCode,currencyDisplay:'code',decimalPlaces:2,negativeStyle:'parentheses',sidebarPinned:true,reducedMotion:true,floatingWindows:false}})}));
  await page.goto(target);await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').waitFor();
  await page.keyboard.press('Control+k');const dialog=page.getByRole('dialog');await dialog.locator('input').first().fill('spreadsheet-studio');await dialog.locator('button.group').first().click();
  const expected=new Intl.NumberFormat(numberLocale,{style:'currency',currency:currencyCode,currencyDisplay:'code',minimumFractionDigits:2,maximumFractionDigits:2}).format(10362.26);
  await page.locator('tfoot').getByText(expected,{exact:true}).waitFor();
  assert.equal(await page.locator('[data-tour=sheet-tools]').getByText(expected,{exact:true}).count(),1,'toolbar and footer use the same configured formatter');
  assert.equal(await page.locator('[data-tour=sheet] tbody tr').first().locator('input').first().inputValue(),'ITM-1001');
  assert.equal(await page.locator('[data-tour=sheet] tbody tr').first().locator('input').nth(6).inputValue(),'2052.27','formatting leaves the editable numeric value unchanged');
  assert.deepEqual(errors,[]);console.log(`PASS ${language}: ${numberLocale}/${currencyCode} overrides browser en-US; totals agree; cells unchanged`);await context.close();
 }
} finally {await browser.close();}
