/**
 * Two people, one cell.
 *
 * The gap analysis raised this against inline editing and said the conflict
 * decision had to be made before the component was written rather than after.
 * The component was written first; the decision is that the second write is
 * REFUSED — not merged, not overwritten. Last-write-wins loses somebody's work
 * silently, which is the one outcome nobody can detect afterwards.
 *
 * Only a browser can show this: it needs a real second writer changing the cell
 * behind a page that is still displaying the old value.
 */
import { API, BASE, loadPlaywright, reporter, requireShell, signIn } from "./harness.mjs";


const { chromium } = loadPlaywright();
await requireShell(BASE);
const browser = await chromium.launch({ chromiumSandbox: false });
const { page, errors } = await signIn(browser, `${BASE}/finance/customer-master`);
const t = reporter("one cell, two writers");

await page.waitForTimeout(2000);

/* The one column the customer list marks editable. */
const headers = await page.locator("main thead th").allInnerTexts();
const index = headers.findIndex((header) => /credit limit/i.test(header));
t.say(`the editable column is on screen (${index})`, index > 0);

const firstRow = page.locator("main tbody tr").first();
const recordId = (await firstRow.locator("td").nth(1).innerText()).trim();
const cell = firstRow.locator("td").nth(index);
const before = (await cell.innerText()).trim();
t.say(`a record to edit (${recordId})`, recordId.length > 0);

/* The server keeps cell edits in memory for the life of the process, so a
   second run of this suite would start against whatever the first one left.
   Put the cell back to what the generator produces before anything else — and
   again at the end, so the next run starts where this one did. */
const generated = before.replace(/[^0-9.]/g, "");
const patch = (value, seen) => page.evaluate(async ({ api, id, value, seen }) => {
  const token = localStorage.getItem("nexora-session-token");
  const response = await fetch(`${api}/worklists/customer-master/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ column: "creditLimit", value, seen, title: "Customer Master", entity: "customer" }),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}, { api: API, id: recordId, value, seen });

const held = await patch(generated, generated);
if (held.status === 409) await patch(generated, String(held.body?.current?.value ?? ""));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
t.say("the cell starts where the generator left it", (await page.locator("main tbody tr").first().locator("td").nth(index).innerText()).trim() === before);

const edit = async (value) => {
  await cell.click();
  await page.waitForTimeout(400);
  const input = page.locator("main tbody tr").first().locator("input").last();
  await input.fill(value);
  await input.press("Enter");
  await page.waitForTimeout(1400);
};

/* An ordinary edit, from what the page is showing. */
await edit("123456");
t.say("an edit from the current value is accepted", (await page.getByText(/was changed by someone else/).count()) === 0);
t.say("and the cell shows it", (await cell.innerText()).includes("123,456") || (await cell.innerText()).includes("123456"));

/* Somebody else, changing the same cell. The page does not know. */
const other = await patch("999999", "123456");
t.say(`someone else changes it (${other.status})`, other.status === 200);

/* Now the page writes over a value it has not seen. */
await edit("500000");

/* Located by what it says, not by role: the shell keeps an empty live region
   with role="alert" for toasts, so counting alerts counts that too. */
const panel = page.locator("section, div").filter({ hasText: /was changed by someone else/ }).last();
t.say("the second write is refused", (await page.getByText(/was changed by someone else/).count()) === 1);
const text = (await panel.innerText().catch(() => "")) ?? "";
t.say("and says what was typed", /500000/.test(text.replace(/[,\s]/g, "")));
t.say("and what it says now", /999999/.test(text.replace(/[,\s]/g, "")));
t.say("and names the record", text.includes(recordId));
t.say("and does not claim the change was saved", /not saved/i.test(text));

/* The rest of the list is unaffected — one cell lost a race. */
t.say("the list is still there", (await page.locator("main tbody tr").count()) > 1);

/* Reload adopts their value rather than leaving the user to compare by eye. */
await panel.getByRole("button", { name: "Reload" }).click();
await page.waitForTimeout(900);
t.say("reloading clears the refusal", (await page.getByText(/was changed by someone else/).count()) === 0);
const after = (await cell.innerText()).replace(/[,\s]/g, "");
t.say(`and shows their value (${after})`, after.includes("999999"));
t.say("which is not what this browser typed", !after.includes("500000") && after !== before.replace(/[,\s]/g, ""));

/**
 * And the bar the worklist uses is now the bar the reports screen uses. It had
 * its own: the same filters, the same collapsible advanced section, the same
 * chevron — and no idea the classification registry existed.
 */
await page.goto(`${BASE}/finance/profit-loss-report`, { waitUntil: "domcontentloaded" }).catch(() => undefined);
await page.waitForTimeout(2500);
const onReports = /report/i.test(new URL(page.url()).pathname);
t.say(`a report screen loaded (${new URL(page.url()).pathname})`, onReports);
if (onReports) {
  t.say("it draws the shared filter bar", (await page.getByRole("button", { name: /Advanced filters/i }).count()) === 1);
  t.say("with the report's own filters in it", (await page.getByLabel("From date").count()) === 1 && (await page.getByLabel("Report view").count()) === 1);
  t.say("and an Apply that runs the report", (await page.getByRole("button", { name: "Apply" }).count()) === 1);
}

/* Put it back, so this suite can be run twice. */
await patch(generated, "999999");

await browser.close();
/* The refused write is a 409 on purpose, and the browser logs every failed
   fetch. Filtered here rather than by widening the reporter: a 409 anywhere
   else in this suite is still worth seeing. */
process.exit(t.finish(errors.filter((line) => !/status of 409/.test(line))) ? 0 : 1);
