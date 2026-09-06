/**
 * Paper, which is the one document nothing here can recall.
 *
 * Two paths reach it and they need different controls. "Print this list" is
 * deliberate and is governed like an export: same review, same confirmation.
 * Ctrl+P is not — a browser-initiated print cannot be cancelled, `beforeprint`
 * fires and nothing it does stops the page coming out. So what governs THAT is
 * the document itself: a stylesheet that removes a class outright, and a banner
 * that is already there.
 *
 * All of which is invisible to jsdom, which has no stylesheets, no computed
 * styles and no print media at all.
 */
import { BASE, loadPlaywright, reporter, requireShell, signIn } from "./harness.mjs";

const { chromium } = loadPlaywright();
await requireShell(BASE);
const browser = await chromium.launch({ chromiumSandbox: false });
const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });

/* Stubbed so the suite is deterministic and so the deliberate path can be
   followed to the end. The browser is what fires `beforeprint` for a real
   print; what this proves is that the listener is bound and posts the right
   thing when it does. */
await context.addInitScript(() => {
  window.__printed = 0;
  window.print = () => { window.__printed += 1; window.dispatchEvent(new Event("beforeprint")); };
});

const { page, errors } = await signIn(browser, `${BASE}/pharmacy/prescription-queue`, undefined, context);
const t = reporter("a printed sheet says whose it is");

const audits = [];
page.on("request", (request) => {
  if (!request.url().endsWith("/exports")) return;
  try { audits.push(JSON.parse(request.postData() ?? "{}")); } catch { audits.push({ unparseable: true }); }
});

await page.waitForTimeout(1500);
const displayOf = (selector) => page.locator(selector).first().evaluate((element) => getComputedStyle(element).display);

/* The banner is in the document at all times, and invisible until it is not. */
t.say("the banner exists before anyone asks to print", (await page.locator(".print-only").count()) > 0);
t.say("and is not on the screen", (await displayOf(".print-only")) === "none");

await page.emulateMedia({ media: "print" });
await page.waitForTimeout(300);

t.say("under print, it appears", (await displayOf(".print-only")) !== "none");
const banner = await page.locator(".print-only").first().innerText();
t.say("naming who printed it", /Printed by/i.test(banner) && /@/.test(banner));
t.say("and which tenant they belong to", /tenant /i.test(banner));
t.say("and how many records are on it", /\d+ records/.test(banner));
t.say("and what kind of data it holds", /Contains .*MRN/i.test(banner));
t.say("and says plainly when that is patient-identifying", /patient-identifying/i.test(banner));

/* The chrome does not print. A sheet with a sidebar on it is a screenshot. */
t.say("the header does not print", (await displayOf("header")) === "none");
t.say("nor does the footer", (await displayOf("footer")) === "none");

/**
 * The refusal, in CSS.
 *
 * No worklist has an unclassified column any more — that is what
 * verify:export-safety enforces — so the rule is exercised against a cell put
 * there for the purpose. It exists for the column somebody adds next month, and
 * the only way to know it still works is to give it one.
 */
const refused = await page.evaluate(() => {
  const row = document.querySelector("main tbody tr");
  if (!row) return null;
  const cell = document.createElement("td");
  cell.setAttribute("data-classification", "unclassified");
  cell.textContent = "SHOULD-NOT-PRINT";
  row.appendChild(cell);
  const credential = document.createElement("td");
  credential.setAttribute("data-classification", "credential");
  credential.textContent = "sk-should-not-print";
  row.appendChild(credential);
  const ordinary = document.createElement("td");
  ordinary.setAttribute("data-classification", "operational");
  ordinary.textContent = "fine";
  row.appendChild(ordinary);
  return {
    unclassified: getComputedStyle(cell).display,
    credential: getComputedStyle(credential).display,
    operational: getComputedStyle(ordinary).display,
  };
});

t.say("an unclassified column is removed from the page", refused?.unclassified === "none");
t.say("so is a credential", refused?.credential === "none");
t.say("an operational one is not", refused?.operational !== "none");

/* Removed, not merely invisible: a cell that is only transparent is still on
   the paper for anything that reads the file rather than looking at it. */
t.say("removed rather than hidden", refused?.unclassified === "none" && refused?.credential === "none");

await page.emulateMedia({ media: "screen" });
await page.waitForTimeout(300);

/* The unannounced path: nothing can stop it, so it is recorded. */
const before = audits.length;
await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
await page.waitForTimeout(1500);
t.say(`an unannounced print is recorded (${audits.length - before})`, audits.length === before + 1);
const record = audits.at(-1) ?? {};
t.say("as a print, not as a file", record.via === "print");
t.say("naming the sensitive columns", (record.declared ?? []).some((note) => note.key === "patient"));
t.say("and carrying no value from any row", !/AV\d{6}|Maya|Thomas/.test(JSON.stringify(record)));

/* The deliberate path: governed like an export. */
await page.getByRole("button", { name: /More actions|Actions/i }).first().click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: /Print this list/i }).click();
await page.waitForTimeout(900);

const dialog = page.getByRole("dialog");
t.say("choosing to print asks first", (await dialog.count()) === 1);
const asked = await dialog.innerText();
t.say("and says it is a printout rather than a file", /printout/i.test(asked));
t.say("and that it leaves the building", /carried out of the building/i.test(asked));

const printedBefore = await page.evaluate(() => window.__printed);
await dialog.getByRole("button", { name: "Cancel" }).click();
await page.waitForTimeout(800);
t.say("declining prints nothing", (await page.evaluate(() => window.__printed)) === printedBefore);

await page.getByRole("button", { name: /More actions|Actions/i }).first().click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: /Print this list/i }).click();
await page.waitForTimeout(700);
await dialog.getByRole("button", { name: "Print" }).click();
await page.waitForTimeout(1500);
t.say("accepting prints it", (await page.evaluate(() => window.__printed)) === printedBefore + 1);
t.say("and that print is recorded too", audits.at(-1)?.via === "print");

await browser.close();
process.exit(t.finish(errors) ? 0 : 1);
