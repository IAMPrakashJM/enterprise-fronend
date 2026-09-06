/**
 * A file is the one destination this application cannot take back.
 *
 * No retention rule reaches it, no revocation does, and nobody is asked again
 * when it is forwarded. The unit tests check that the policy classifies
 * correctly and that the writer drops what may never go; this checks the part
 * only a browser has: that the user is actually told before the file is
 * written, that refusing writes nothing, and that the export is recorded by
 * column rather than by value.
 */
import { BASE, loadPlaywright, reporter, requireShell, signIn } from "./harness.mjs";

const { chromium } = loadPlaywright();
await requireShell(BASE);
const browser = await chromium.launch({ chromiumSandbox: false });
const { page, errors } = await signIn(browser, `${BASE}/finance/customer-master`);
const t = reporter("an export says what it will contain");

/* Downloads are captured rather than saved: what matters is whether one was
   started at all, and under what name. */
const downloads = [];
page.on("download", (download) => downloads.push(download.suggestedFilename()));

const audits = [];
page.on("request", (request) => {
  if (!request.url().endsWith("/exports")) return;
  try { audits.push(JSON.parse(request.postData() ?? "{}")); } catch { audits.push({ unparseable: true }); }
});

const exportMenu = async () => {
  await page.getByRole("button", { name: /More actions|Actions/i }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Export visible records/i }).click();
  await page.waitForTimeout(900);
};

/* A finance worklist: every visible column is operational, so nothing needs
   saying and the file is written straight away. */
await exportMenu();
t.say("an ordinary list exports without a question", (await page.getByRole("dialog").count()) === 0);
await page.waitForTimeout(1500);
t.say(`and the file was written (${downloads[0] ?? "none"})`, downloads.length === 1);
t.say("and it was recorded", audits.length === 1);
t.say("by column, and by count", (audits[0]?.columns ?? []).length > 0 && typeof audits[0]?.rows === "number");
t.say("with nothing sensitive to declare", (audits[0]?.declared ?? []).length === 0);

/* The pharmacy queue: its columns include an MRN, a prescriber and a drug. */
await page.goto(`${BASE}/pharmacy/prescription-queue`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

const beforeDownloads = downloads.length;
await exportMenu();

const dialog = page.getByRole("dialog");
t.say("a list holding an MRN asks first", (await dialog.count()) === 1);
const asked = await dialog.innerText();
t.say("and names what the file will contain", /MRN/.test(asked) && /Prescriber/.test(asked));
t.say("and says the file leaves the application", /outside this application|no retention/i.test(asked));
t.say("and that the export is recorded", /recorded against your account/i.test(asked));
t.say("by column, never by value", /never by value/i.test(asked));

await dialog.getByRole("button", { name: "Cancel" }).click();
await page.waitForTimeout(1200);
t.say("declining writes no file", downloads.length === beforeDownloads);
t.say("and records nothing", audits.length === 1);

await exportMenu();
await dialog.getByRole("button", { name: "Export" }).click();
await page.waitForTimeout(2500);
t.say(`accepting writes it (${downloads.at(-1) ?? "none"})`, downloads.length === beforeDownloads + 1);
t.say("and records it", audits.length === 2);

const audit = audits[1] ?? {};
t.say("the record names the sensitive columns", (audit.declared ?? []).some((note) => note.key === "patient"));
t.say("and classifies them", (audit.declared ?? []).some((note) => note.classification === "phi"));

/* The audit is built from columns and never sees a row. Nothing that appears in
   the table may appear in the record of the export. */
const onScreen = (await page.locator("main tbody tr").first().innerText()).split(/\s{2,}|\n/).map((cell) => cell.trim()).filter((cell) => cell.length > 3);
t.say(`no cell value reaches the record (${onScreen.length} checked)`,
  onScreen.length > 0 && !onScreen.some((value) => JSON.stringify(audit).includes(value)));

await browser.close();
process.exit(t.finish(errors) ? 0 : 1);
