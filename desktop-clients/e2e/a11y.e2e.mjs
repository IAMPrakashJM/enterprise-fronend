/**
 * axe-core over the screens people actually spend the day in.
 *
 * The unit suite can assert that a component renders a role and a label. What
 * it cannot assert is anything that only exists once the page is assembled:
 * whether a control ends up with an accessible name after its label rendered
 * three components away, whether two ids collided, whether the heading order
 * makes sense with a shell around it, or what colour anything actually came out
 * — jsdom has no computed style and no layout at all.
 *
 * Held to WCAG 2.1 A and AA. axe's "best-practice" pack is deliberately left
 * out: it mixes advice with obligation, and the first person to silence one
 * would silence both.
 */
import { BASE, loadPlaywright, openViaPalette, reporter, requireShell, signIn } from "./harness.mjs";
import { audit, report } from "./a11y.mjs";

/**
 * What is known, still failing, and not yet fixed.
 *
 * A FIXED LIST of rule ids per screen, never a count and never a regenerated
 * snapshot. A baseline that rewrites itself records whatever the code does
 * today and calls it correct; this one fails the moment something new appears,
 * and every entry is printed on every run so it cannot quietly become
 * furniture.
 *
 * `color-contrast` is here for ONE cause: white text on a solid accent fill —
 * the completed-step markers and the success button. The accent is light enough
 * that white on it lands at 4.25:1 in the default theme and as low as 1.92:1 in
 * the dark ones. Fixing it means either darkening every accent in fourteen
 * palettes or introducing a separate fill token, both of which change how the
 * product looks; that is a decision to take deliberately rather than a defect to
 * quietly patch. Every other contrast failure axe found — 23 of the original 24
 * nodes — is fixed.
 */
const BASELINE = {
  /* Preferences is not listed: it has none, and an entry nothing fires is the
     beginning of a list nobody reads. */
  "worklist": ["color-contrast"],
  "record": ["color-contrast"],
  "consultation": ["color-contrast"],
  "assistant": [],
  "sign-in": [],
  "command palette": [],
};

const { chromium } = loadPlaywright();
await requireShell(BASE);
const browser = await chromium.launch({ chromiumSandbox: false });
const t = reporter("every screen against WCAG 2.1 AA");

/* Signed out first: the sign-in form is the one screen every user meets and the
   only one nobody can navigate away from. */
const anonymous = await browser.newPage({ viewport: { width: 1500, height: 950 } });
await anonymous.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
await anonymous.waitForTimeout(1200);
report(t, "sign-in", await audit(anonymous), BASELINE["sign-in"]);
await anonymous.close();

const { page, errors } = await signIn(browser, `${BASE}/finance/customer-master`);
await page.waitForTimeout(2000);

/**
 * Navigate, prove it arrived, then audit.
 *
 * The first version of this file used the command palette and a double-click
 * and checked neither. Two of the four screens never loaded, so the suite
 * audited the previous page twice and reported two passes for one screen — the
 * same shape of mistake as an assertion that was already true before the test
 * ran.
 */
const screen = async (label, path, marker) => {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2200);
  const arrived = new URL(page.url()).pathname === path && (await page.locator(marker).count()) > 0;
  t.say(`${label}: the screen loaded`, arrived, arrived ? "" : `at ${new URL(page.url()).pathname}`);
  if (!arrived) return;
  report(t, label, await audit(page), BASELINE[label] ?? []);
};

await screen("worklist", "/finance/customer-master", "main tbody tr");

/* A record: the screen where the form controls live, and the one whose labels
   are furthest from the inputs they name. */
const recordId = await page.locator("main tbody tr").first().locator("td").nth(1).innerText();
await screen("record", `/finance/customer-master/${recordId.trim()}`, "main");

await screen("preferences", "/library/preferences", "main");
await screen("consultation", "/healthcare/consultation-entry", "main");

/* Overlays are audited on their own. A dialog is where a name, a role and a
   focus order matter most, and auditing one inside the whole page buries its
   findings among the shell's. */
const assistant = page.getByRole("button", { name: "Open the AI assistant" });
t.say("the assistant is reachable here", (await assistant.count()) === 1);
if (await assistant.count()) {
  await assistant.click();
  await page.waitForTimeout(900);
  report(t, "assistant", await audit(page, { include: '[role="dialog"]' }), BASELINE.assistant);
  await page.getByRole("button", { name: "Close" }).first().click().catch(() => undefined);
  await page.waitForTimeout(400);
}

await page.keyboard.press("Control+k");
await page.waitForTimeout(1000);
const palette = page.locator('[role="dialog"]');
t.say("the command palette opened", (await palette.count()) > 0);
if (await palette.count()) {
  report(t, "command palette", await audit(page, { include: '[role="dialog"]' }), BASELINE["command palette"]);
  await page.keyboard.press("Escape");
}

await browser.close();
process.exit(t.finish(errors) ? 0 : 1);
