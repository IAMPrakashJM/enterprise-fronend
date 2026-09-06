/**
 * A saved view, end to end.
 *
 * The one feature whose whole purpose is to carry what a URL may not, which
 * means the round trip crosses three things no unit test sees at once: the
 * browser that creates it, the API that holds the values, and the redirect that
 * hands them back. It was broken in exactly the seam between them — the redirect
 * wrote the filters into sessionStorage and nothing anywhere read them, so the
 * view resolved, the worklist opened, and every row showed unfiltered while the
 * name it was filtered by stayed in the store.
 */
import { BASE, loadPlaywright, openViaPalette, reporter, requireShell, signIn } from "./harness.mjs";

const NAME = "Maya Thomas";
const LEAKS = [/Maya/i, /Thomas/i];
const API = process.env.E2E_API ?? "http://127.0.0.1:3200";

const { chromium } = loadPlaywright();
await requireShell(BASE);
const browser = await chromium.launch({ chromiumSandbox: false });
const { page, errors } = await signIn(browser, `${BASE}/finance/customer-master`);
const t = reporter("a saved view carries what a link cannot");

const store = (which) => page.evaluate((name) => {
  const target = name === "session" ? sessionStorage : localStorage;
  const out = {};
  for (let i = 0; i < target.length; i += 1) {
    const key = target.key(i);
    if (key) out[key] = target.getItem(key);
  }
  return JSON.stringify(out);
}, which);

/* The filter bar's own free-text field, not the page search above it. Both are
   classified `query`; this is the one the saved view has to hand back. */
const keyword = page.locator('main input[placeholder*="keyword" i]').first();
const records = async () => Number((/(\d+) records/.exec(await page.locator("body").innerText()) ?? [])[1] ?? -1);

const unfiltered = await records();
t.say(`the unfiltered list is countable (${unfiltered})`, unfiltered > 0);

await keyword.fill(NAME);
await page.waitForTimeout(1200);
const filtered = await records();
t.say(`typing a name narrows it (${filtered})`, filtered > 0 && filtered < unfiltered);

/* Created through the UI, not through the API. The point is the whole path. */
const shareRow = page.locator("section").filter({ hasText: /cannot be put in a link/i }).first();
await shareRow.getByRole("button", { name: /saved view/i }).click();
await page.waitForTimeout(1500);

/* The toast names the id. Nothing else on screen does, deliberately — the link
   goes to the clipboard, which a headless browser has no permission for. */
const toast = (await page.getByText(/^VW_[0-9A-F]{16}/).first().textContent().catch(() => "")) ?? "";
const id = (/VW_[0-9A-F]{16}/.exec(toast) ?? [])[0] ?? "";
t.say(`the view was created (${id || "none"})`, /^VW_[0-9A-F]{16}$/.test(id));
t.say("and the confirmation carries no filter value", !LEAKS.some((leak) => leak.test(toast)));

/* Redeeming it. */
await page.goto(`${BASE}/view/${id}`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

const landed = page.url();
t.say(`it lands on the worklist (${new URL(landed).pathname})`, /\/finance\/customer-master$/.test(new URL(landed).pathname));
t.say(`and the URL it lands on carries nothing (${new URL(landed).search || "no query"})`, !LEAKS.some((leak) => leak.test(landed)));
t.say("nor does the view link itself", !LEAKS.some((leak) => leak.test(id)));

/* The filters are actually applied. This is what the feature did not do: the
   redirect landed and every row showed unfiltered, because nothing read the
   handoff at all. */
t.say("the filter it held is back in the field it was typed into",
  (await page.locator('main input[placeholder*="keyword" i]').first().inputValue()) === NAME);

const redeemed = await records();
t.say(`and the list is narrowed the same way (${redeemed} of ${unfiltered})`, redeemed === filtered);

/* The handoff was a web store, not memory. Taken, not read. */
const session = await store("session");
t.say("the handoff is gone from sessionStorage", !/nexora-pending-view/.test(session));
t.say("and took the name with it", !LEAKS.some((leak) => leak.test(session)));
const local = await store("local");
t.say("localStorage never saw it either", !LEAKS.some((leak) => leak.test(local)));

/* Reloading is not a second redemption: the entry is consumed. */
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
t.say("a reload does not re-apply it from the store", (await page.locator('main input[placeholder*="keyword" i]').first().inputValue()) === "");

/* A view that is not yours, does not exist, or has expired: one answer for all
   three. A 403 on another tenant's id confirms the id is real, which is how you
   enumerate them. */
/* domcontentloaded, not networkidle: the refusal screen offers a retry and the
   page never goes quiet enough for networkidle inside the default timeout. */
await page.goto(`${BASE}/view/VW_0123456789ABCDEF`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
const refusal = (await page.locator("main").innerText().catch(() => "")) || (await page.locator("body").innerText());
t.say("an unknown id is refused", /not available|cannot be opened|not found/i.test(refusal));
t.say("and the refusal says nothing about which kind of 404 it was", !/expired|another tenant|belongs to|deleted/i.test(refusal));
t.say("nor prints the id back at the user", !/VW_0123456789ABCDEF/.test(refusal));

/* Malformed: refused without asking the server at all. */
const asked = [];
page.on("request", (request) => { if (request.url().includes("/views/")) asked.push(request.url()); });
await page.goto(`${BASE}/view/not-a-view-id`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
t.say("a malformed id is refused without asking the server", asked.length === 0);

await browser.close();
/* The unknown-id request is a 404 on purpose and the browser logs every failed
   fetch. Filtered here rather than by widening the reporter: a 404 from
   anywhere else in this suite is still a failure worth seeing. */
process.exit(t.finish(errors.filter((line) => !/status of 404/.test(line))) ? 0 : 1);
