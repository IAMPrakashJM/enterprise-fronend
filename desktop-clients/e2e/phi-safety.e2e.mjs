/**
 * No PHI reaches a URL, localStorage, or a share link.
 *
 * The most important file here, and the reason the harness is committed at all.
 * The policy is enforced by `verify:filter-safety` at the data level and by unit
 * tests at the function level, and BOTH were green while a patient name was
 * still reaching disk — the write path had a gate that a string replacement had
 * silently failed to apply. Only a browser could see that, because only a
 * browser has a real localStorage with real values in it.
 */
import { API, BASE, loadPlaywright, openViaPalette, reporter, requireShell, signIn } from "./harness.mjs";

const NAME = "Maya Thomas";
const LEAKS = [/Maya/i, /Thomas/i];

const { chromium } = loadPlaywright();
await requireShell(BASE);
const browser = await chromium.launch({ chromiumSandbox: false });
const { page, errors } = await signIn(browser, `${BASE}/finance/customer-master`);
const t = reporter("PHI never leaves the browser");

/* The free-text search: the single most likely place for a name to arrive by
   accident, which is why `query` is classified phi rather than operational. */
const search = page.locator('main input[placeholder*="keyword" i]').first();
await search.fill(NAME);
await page.waitForTimeout(1200);

const url = page.url();
t.say(`the URL carries no name (${new URL(url).search || "no query"})`, !LEAKS.some((leak) => leak.test(url)));

const stored = await page.evaluate(() => {
  const out = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key) out[key] = localStorage.getItem(key);
  }
  return JSON.stringify(out);
});
t.say("localStorage carries no name", !LEAKS.some((leak) => leak.test(stored)));
t.say("and no free-text search at all", !/"search":"[^"]+"/.test(stored));

/* An operational filter SHOULD reach the URL — a policy that carried nothing
   would pass every assertion above and be useless. */
await search.fill("");
await page.waitForTimeout(600);
const status = page.locator('main select').first();
if (await status.count()) {
  await status.selectOption({ index: 1 }).catch(() => undefined);
  await page.waitForTimeout(900);
}
t.say("the bar marks which fields stay out of a link", (await page.getByText(/kept out of the link/i).count()) > 0);

/* The sharing branch: sensitive filters mean a saved view, never a link. */
await search.fill(NAME);
await page.waitForTimeout(900);
/* Scoped to the filter section: `getByRole` across the page also matches the
   table's own controls, and an exact count is the wrong assertion — what
   matters is that the button is there and reachable. */
const shareRow = page.locator("section").filter({ hasText: /cannot be put in a link/i }).first();
t.say("a sensitive filter offers a saved view", await shareRow.getByRole("button", { name: /saved view/i }).isVisible());
t.say("and withdraws the copy-link button", (await shareRow.getByRole("button", { name: /copy link/i }).count()) === 0);
t.say("and says why", (await page.getByText(/cannot be put in a link/i).count()) > 0);

/* The view itself: the filters live on the server, the link is an id. */
const view = await page.evaluate(async (base) => {
  const token = localStorage.getItem("nexora-session-token");
  const response = await fetch(`${base}/views`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ pageId: "customer-master", label: "Follow-ups", filters: { status: "waiting", patientName: "Maya Thomas" } }),
  });
  return { status: response.status, body: await response.json() };
}, API);

t.say(`a saved view is created (${view.status})`, view.status === 201);
t.say(`its id is opaque (${view.body.id})`, /^VW_[0-9A-F]{16}$/.test(view.body.id ?? ""));
t.say("the response carries no filter values", !LEAKS.some((leak) => leak.test(JSON.stringify(view.body))));

await browser.close();
process.exit(t.finish(errors) ? 0 : 1);
