/**
 * Tabs, split view and the warm lifecycle, in a real browser.
 *
 * Everything here failed at least once while the unit suite was green, and each
 * failure was of a kind jsdom cannot reach: a ref attached to one component of
 * three, a callback nothing called, a flex container with no height, and a
 * screen that was rebuilt rather than re-rendered.
 */
import { DESKTOP, loadPlaywright, openViaPalette, reporter, requireShell, setPreference, signIn } from "./harness.mjs";

const { chromium } = loadPlaywright();
await requireShell(DESKTOP);
const browser = await chromium.launch({ chromiumSandbox: false });
const { page, errors } = await signIn(browser, DESKTOP, { width: 1600, height: 950 });
const t = reporter("the workspace, in a real browser");

/* Tabs, not floating windows. The preference persists per account, so without
   this the suite asserts against whatever the last run left switched on. */
t.say("floating windows are off for this run", await setPreference(page, /Floating windows/i, false));

const strip = () => page.locator('[role="tablist"][aria-label="Open documents"]');
const tabs = () => strip().locator('[role="tab"]');
const panes = () => page.locator('[role="region"]:visible');
const shown = () => page.locator("main:visible");

/* Asserted as an invariant rather than a starting count: setPreference has
   already navigated, so "one tab" would be testing the route this suite took
   to get here rather than the rule. Exactly one tab is fixed, always. */
const fixed = async () => (await tabs().count()) - (await page.locator('[role="tab"] [role="button"]').count());
t.say(`exactly one tab is fixed (${(await tabs().allTextContents()).map((each) => each.trim()).join(", ")})`, (await fixed()) === 1);
t.say("and it is the module dashboard", /Command Center|Dashboard|Library/i.test((await tabs().first().innerText()).trim()));

await openViaPalette(page, "customer master");
t.say(`opening appends a tab (${await tabs().count()})`, (await tabs().count()) === 2);
await openViaPalette(page, "customer master");
t.say("reopening focuses rather than duplicating", (await tabs().count()) === 2);

/* State that survives leaving the tab: the whole point of the warm lifecycle,
   and impossible to assert without a real DOM that persists between renders. */
const summary = async () => (await shown().getByText(/Showing/).first().innerText().catch(() => "?")).trim();
await shown().locator('input[type="text"]').first().fill("atlas");
await page.waitForTimeout(1000);
const filtered = await summary();
t.say(`filtering narrows the list (${filtered})`, /of \d+$/.test(filtered));

await openViaPalette(page, "billing worklist");
t.say(`a warm document stays mounted but inert (${await page.evaluate(() => document.querySelectorAll("[inert]").length)})`,
  (await page.evaluate(() => document.querySelectorAll("[inert]").length)) >= 1);
t.say("and only one document is visible", (await shown().count()) === 1);

await tabs().filter({ hasText: "Customer Master" }).first().click();
await page.waitForTimeout(1400);
t.say(`the filter survived the round trip (${await summary()})`, (await summary()) === filtered);
t.say("and so did the typed value", (await shown().locator('input[type="text"]').first().inputValue()) === "atlas");

/* Split view. The divider is the part a keyboard user needs and a mouse-only
   test would never touch. */
/* Blur first. The shortcut dispatcher ignores keys while the caret is in a
   field — deliberately, so a bare "?" cannot open help mid-sentence — and the
   previous step left the focus in a search box. */
await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
await page.locator('[role="tablist"]').first().click({ position: { x: 5, y: 5 } });
await page.keyboard.press("Alt+Backslash");
await page.waitForTimeout(1200);
t.say(`Alt+\\ splits (${await panes().count()} panes)`, (await panes().count()) === 2);
const divider = page.locator('[role="separator"]');
const before = Number(await divider.getAttribute("aria-valuenow"));
await divider.focus();
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(300);
t.say(`arrow keys move the divider (${before} → ${await divider.getAttribute("aria-valuenow")})`,
  Number(await divider.getAttribute("aria-valuenow")) > before);
t.say("each pane draws its own document",
  new Set(await panes().evaluateAll((els) => els.map((e) => e.innerText.slice(0, 40)))).size === 2);

await page.keyboard.press("Alt+Shift+Backslash");
await page.waitForTimeout(1000);
t.say("Alt+Shift+\\ collapses it", (await panes().count()) === 0);
t.say("with both documents still open", (await tabs().count()) === 3);

await browser.close();
process.exit(t.finish(errors) ? 0 : 1);
