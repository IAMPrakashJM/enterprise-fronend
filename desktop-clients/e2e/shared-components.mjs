// Local component-gallery interaction check. Does not write saved preferences.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { loadPlaywright } from './harness.mjs';
const target=process.env.E2E_DESKTOP??'http://127.0.0.1:3109';
assert.ok(['127.0.0.1','localhost'].includes(new URL(target).hostname),'Use an isolated local frontend and API');
const browser=await loadPlaywright().chromium.launch({chromiumSandbox:false});
const artifacts=process.env.E2E_ARTIFACTS??'/tmp/shared-components-artifacts';mkdirSync(artifacts,{recursive:true});
try { for (const language of ['en','ar','hi','ml']) {
  const messages=JSON.parse(readFileSync(new URL(`../../dummy-api/config/localization/shared/${language}.json`,import.meta.url),'utf8')).messages;
  const context=await browser.newContext({viewport:{width:1600,height:1100}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route(url=>url.pathname==='/preferences',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{language,sidebarPinned:true,reducedMotion:true,floatingWindows:false}})}));
  await page.goto(target);await page.getByPlaceholder('user1').fill('admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();await page.locator('header').waitFor();
  await page.keyboard.press('Control+k');const dialog=page.getByRole('dialog');await dialog.locator('input').first().fill('component-library');await dialog.locator('button.group').first().click();
  await page.getByText(messages['ui.components.cards'],{exact:true}).waitFor();
  const calendar=page.getByRole('group',{name:messages['ui.start.date.81696931'],exact:true});
  const dateInput=page.locator('input[type=date]');
  await calendar.locator('[data-date="2026-09-09"]').click();
  assert.equal(await dateInput.inputValue(),'2026-09-09');
  await calendar.locator('[data-date="2026-09-09"]').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  assert.equal(await calendar.locator('[data-date="2026-09-16"]').getAttribute('aria-pressed'),'true');
  await page.getByLabel(messages['ui.delivery.time.2898c4bc'],{exact:true}).fill('13:45');
  assert.equal(await page.getByLabel(messages['ui.delivery.time.2898c4bc'],{exact:true}).inputValue(),'13:45');
  await calendar.getByRole('button',{name:messages['ui.next.1ff57a29'],exact:true}).click();
  await calendar.locator('[data-date="2026-10-15"]').click();
  assert.equal(await calendar.locator('[data-date="2026-10-15"]').getAttribute('aria-pressed'),'true');
  assert.equal(await calendar.getAttribute('dir'),language==='ar'?'rtl':'ltr');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`${artifacts}/gallery-${language}.png`,fullPage:true});
  await context.close();console.log(`PASS ${language}: gallery, calendar selection, keyboard, month navigation, ISO date/time and direction`);
}} finally {await browser.close();}
