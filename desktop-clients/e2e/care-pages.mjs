import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { loadPlaywright } from "./harness.mjs";
const browser = await loadPlaywright().chromium.launch({
    chromiumSandbox: false,
  }),
  dir = process.env.E2E_ARTIFACTS ?? "/tmp/care-browser";
mkdirSync(dir, { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
  });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error("Browser error:", e.message);
  });
  page.on("requestfailed", (r) =>
    console.error("Request failed:", r.url(), r.failure()?.errorText),
  );
  await page.goto(process.env.E2E_DESKTOP ?? "http://127.0.0.1:3109");
  await page.locator("input").first().fill("admin");
  await page.locator("input[type=password]").fill("admin");
  await page.keyboard.press("Enter");
  await page.locator("header").first().waitFor();
  const root = page.locator("[data-care-page]:visible");
  async function open(id) {
    await page.keyboard.press("Control+k");
    const d = page.getByRole("dialog");
    await d.locator("input").first().fill(id);
    await d.locator("button.group").first().click();
    await root.getByRole("heading", { level: 1 }).waitFor();
  }
  async function create() {
    const reply = page.waitForResponse(
      (r) =>
        r.url().endsWith("/care-pages") &&
        r.request().postDataJSON()?.action === "create",
    );
    await root.getByRole("button", { name: /Amina Mohammed/ }).click();
    assert.equal((await reply).status(), 200);
    await root
      .getByRole("button", { name: "Save draft", exact: true })
      .waitFor();
  }
  for (const id of [
    "emergency-registration",
    "inpatient-admission",
    "consultation-entry-design",
    "consultation-entry-v2",
  ]) {
    await open(id);
    await create();
    assert.equal(
      await root.locator('nav[aria-label="Main navigation"]').count(),
      0,
    );
    if (id === "emergency-registration") {
      await root
        .getByRole("button", { name: "Open ED encounter", exact: true })
        .click();
      await root.getByRole("button", { name: "Continue", exact: true }).click();
      await root
        .getByText("Clinician triage & priority", { exact: true })
        .waitFor();
    }
    if(id==='emergency-registration'){
      await root.getByRole('button',{name:'Trauma',exact:true}).click();
      await root.getByRole('button',{name:'Pediatric',exact:true}).click();
      await root.getByLabel('Mechanism',{exact:true}).waitFor();
      await root.getByLabel('Accompanying adult',{exact:true}).waitFor();
      await root.getByRole('button',{name:'Save draft',exact:true}).click();
    }
    if(id==='inpatient-admission'){
      await root.getByRole('button',{name:'ED',exact:true}).click();
      await root.getByLabel('ED encounter',{exact:true}).fill('DEMO-ED-1');
      await root.getByRole('button',{name:'Surgical',exact:true}).click();
      await root.getByLabel('Surgeon',{exact:true}).fill('Demo surgeon');
      await root.getByLabel('Identifier 1',{exact:true}).selectOption('MRN');
      await root.getByLabel('Identifier 2',{exact:true}).selectOption('Date of birth');
      await root.getByLabel('Verification source',{exact:true}).selectOption('Patient stated');
      await root.getByLabel('Reason for admission',{exact:true}).fill('Synthetic admission');
      await root.getByRole('button',{name:'Continue',exact:true}).click();
      await root.getByLabel('Specialty / service',{exact:true}).selectOption('General Medicine');
      await root.getByLabel('Admitting doctor',{exact:true}).fill('Demo doctor');
      await root.getByLabel('Attending / responsible doctor',{exact:true}).fill('Demo doctor');
      await root.getByRole('button',{name:'Continue',exact:true}).click();
      await root.getByRole('button',{name:'Continue',exact:true}).click();
      await root.getByRole('button',{name:'Reserve bed',exact:true}).first().click();
      await root.getByRole('button',{name:'Continue',exact:true}).click();
      await root.getByLabel('Two patient identifiers verified',{exact:true}).check();
      await root.getByLabel('Consent or documented care basis reviewed',{exact:true}).check();
      await root.getByRole('button',{name:'Admit patient',exact:true}).click();
      await page.getByRole('dialog').getByRole('button',{name:'Confirm',exact:true}).click();
      await root.getByRole('tab',{name:'Nursing admission',exact:true}).waitFor();
    }
    if (id === "consultation-entry-v2") {
      await root
        .getByRole("button", { name: "Add order", exact: true })
        .first()
        .click();
      const modal = page.getByRole("dialog");
      await modal
        .getByLabel("Order name", { exact: true })
        .fill("DEMO laboratory request");
      await modal
        .getByLabel("Instructions", { exact: true })
        .fill("Preserved order instructions");
      const reply = page.waitForResponse(
        (r) =>
          r.url().endsWith("/care-pages") &&
          r.request().postDataJSON()?.action === "order",
      );
      await modal.getByRole("button", { name: "Confirm", exact: true }).click();
      const result = await (await reply).json();
      assert.equal(
        result.record.orders.at(-1).values.instructions,
        "Preserved order instructions",
      );
      await root
        .getByText("DEMO laboratory request", { exact: true })
        .first()
        .waitFor();
    }
    assert.ok(!/care\.(?:text|extra|help)/.test(await root.innerText()));
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({ path: dir + "/" + id + ".png" });
  }
  for (const lang of ["ar", "hi", "ml"]) {
    await page.keyboard.press("Control+k");
    const d = page.getByRole("dialog");
    await d.locator("input").first().fill("preferences");
    await d.locator("button.group").first().click();
    await page
      .getByRole("tab")
      .filter({
        hasText:
          /Language & help|اللغة والمساعدة|भाषा और सहायता|ഭാഷയും സഹായവും/,
      })
      .click();
    await page
      .locator("[data-tour=prefs-lang] select:visible")
      .selectOption(lang);
    await page.waitForFunction(
      (l) => document.documentElement.lang === l,
      lang,
    );
    await open("consultation-entry-v2");
    assert.ok(!/care\.(?:text|extra|help)/.test(await root.innerText()));
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({ path: dir + "/" + lang + ".png" });
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS four care pages, API record creation, ED transition, full order-detail persistence and four-language desktop layout; Chromium with isolated demo API.",
  );
} catch (e) {
  const p = browser.contexts()[0]?.pages()[0];
  if (p) await p.screenshot({ path: dir + "/failure.png" });
  throw e;
} finally {
  await browser.close();
}
