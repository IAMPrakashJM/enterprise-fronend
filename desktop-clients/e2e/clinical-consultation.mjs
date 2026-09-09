import { loadPlaywright } from "./harness.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
const { chromium } = loadPlaywright();
const artifacts =
  process.env.E2E_ARTIFACTS ?? join(tmpdir(), "clinical-consultation-e2e");
fs.mkdirSync(artifacts, { recursive: true });
// Use the managed, disposable demo API; this test creates fictional consultations.

(async () => {
  const b = await chromium.launch({ chromiumSandbox: false });
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } }),
      errors = [];
    p.setDefaultTimeout(30000);
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.E2E_DESKTOP ?? "http://127.0.0.1:3109");
    await p.locator("input").first().fill("admin");
    await p.locator("input[type=password]").fill("admin");
    await p.keyboard.press("Enter");
    await p.locator("header").first().waitFor();
    async function open(id = "clinical-consultation") {
      await p.keyboard.press("Control+k");
      const d = p.getByRole("dialog");
      await d.locator("input").first().fill(id);
      await d.locator("button.group").first().click();
    }
    await open();
    const root = p.locator("[data-clinical-consultation]");
    await root.waitFor();
    const patient = root.getByRole("combobox", { name: "Select patient" });
    await patient
      .locator("option")
      .filter({ hasText: "DEMO-000001" })
      .waitFor({ state: "attached" });
    await patient.selectOption(
      await patient
        .locator("option")
        .evaluateAll((opts) => opts.find((o) => o.value)?.value),
    );
    await root.getByRole("textbox", { name: "Chief complaint" }).waitFor();
    await root
      .getByRole("button", { name: "New consultation", exact: true })
      .click();
    await p.screenshot({
      path: join(artifacts, "consultation-initial.png"),
      fullPage: true,
    });
    const box = await root
      .getByRole("button", { name: "Complete consultation" })
      .boundingBox();
    assert.ok(
      box && box.y + box.height <= 870,
      "All sections and completion action fit at 1600 × 900",
    );
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await root
      .getByRole("textbox", { name: "Chief complaint" })
      .fill("Fictional consultation for interface testing");
    await root
      .getByRole("combobox", { name: "Consulting clinician" })
      .selectOption("demo-clinician-1");
    await root
      .getByRole("combobox", { name: "Visit type" })
      .selectOption("new");
    await root
      .getByRole("textbox", { name: "Examination findings" })
      .fill("Fictional findings");
    await root
      .getByRole("textbox", { name: "Clinical assessment / diagnosis" })
      .fill("Clinician-authored assessment");
    await root
      .getByRole("textbox", { name: "Treatment / medication plan" })
      .fill("Documented plan for demo");
    await root
      .getByRole("textbox", { name: "Follow-up plan" })
      .fill("Review documented");
    await root
      .getByRole("combobox", { name: "Allergy information review" })
      .selectOption("reviewed");
    let waiting = p.waitForResponse(
      (r) =>
        r.url().endsWith("/clinical-consultation") &&
        r.request().postDataJSON()?.action === "save",
    );
    await root.getByRole("button", { name: "Save draft", exact: true }).click();
    let response = await waiting;
    assert.equal(response.status(), 200);
    const saved = await response.json();
    assert.ok(saved.id.startsWith("CON-"));
    await p.reload();
    await p.locator("header").first().waitFor();
    await open();
    const select = root.getByRole("combobox", { name: "Select patient" });
    await select
      .locator("option")
      .filter({ hasText: "DEMO-000001" })
      .waitFor({ state: "attached" });
    await select.selectOption(saved.patientId);
    await root.getByRole("textbox", { name: "Chief complaint" }).waitFor();
    assert.equal(
      await root.getByRole("textbox", { name: "Chief complaint" }).inputValue(),
      "Fictional consultation for interface testing",
    );
    await root.getByRole("button", { name: "Complete consultation" }).click();
    waiting = p.waitForResponse(
      (r) =>
        r.url().endsWith("/clinical-consultation") &&
        r.request().postDataJSON()?.complete === true,
    );
    await p
      .getByRole("dialog")
      .getByRole("button", { name: "Confirm", exact: true })
      .click();
    response = await waiting;
    assert.equal(response.status(), 200);
    assert.equal((await response.json()).status, "completed");
    await root.getByRole("textbox", { name: "Chief complaint" }).waitFor();
    assert.equal(
      await root.getByRole("textbox", { name: "Chief complaint" }).isDisabled(),
      true,
    );
    await root
      .getByRole("button", { name: "New consultation", exact: true })
      .click();
    assert.equal(
      await root.getByRole("textbox", { name: "Chief complaint" }).inputValue(),
      "",
    );
    await root.getByRole("button", { name: "Previous consultations" }).click();
    await p
      .getByRole("dialog")
      .getByRole("button", { name: "Open consultation" })
      .first()
      .click();
    assert.equal(
      await root.getByRole("textbox", { name: "Chief complaint" }).isDisabled(),
      true,
    );
    assert.deepEqual(errors, []);
    await p.screenshot({
      path: join(artifacts, "consultation-completed.png"),
      fullPage: true,
    });
    for (const language of ["ar", "hi", "ml", "en"]) {
      await open("preferences");
      await p
        .getByRole("tab")
        .filter({
          hasText:
            /Language & help|اللغة والمساعدة|भाषा और सहायता|ഭാഷയും സഹായവും/,
        })
        .click();
      await p.locator('[data-tour="prefs-lang"] select').selectOption(language);
      await p.waitForFunction(
        (l) => document.documentElement.lang === l,
        language,
      );
      await open();
      await root.waitFor();
      assert.ok(!/template\.consultation\./.test(await root.innerText()));
      assert.equal(
        await p.locator("html").getAttribute("dir"),
        language === "ar" ? "rtl" : "ltr",
      );
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await p.screenshot({
        path: join(artifacts, "consultation-" + language + ".png"),
        fullPage: true,
      });
      console.log(
        "PASS " + language + " catalog rendering, direction and desktop width",
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS real API draft/save/reload/complete/immutable history/new blank consultation; no page errors",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
