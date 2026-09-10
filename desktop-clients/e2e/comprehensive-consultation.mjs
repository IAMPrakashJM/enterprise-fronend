import { loadPlaywright } from "./harness.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import { join } from "node:path";
const { chromium } = loadPlaywright();
const artifacts = process.env.E2E_ARTIFACTS ?? "/tmp/comprehensive-artifacts";
fs.mkdirSync(artifacts, { recursive: true });
const browser = await chromium.launch({ chromiumSandbox: false });
try {
  const p = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  p.setDefaultTimeout(20000);
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(process.env.E2E_DESKTOP ?? "http://127.0.0.1:3109");
  await p.locator("input").first().fill("admin");
  await p.locator("input[type=password]").fill("admin");
  await p.keyboard.press("Enter");
  await p.locator("header").first().waitFor();
  async function open(id = "comprehensive-consultation") {
    await p.keyboard.press("Control+k");
    const d = p.getByRole("dialog");
    await d.locator("input").first().fill(id);
    await d.locator("button.group").first().click();
  }
  await open();
  const root = p.locator("[data-comprehensive-consultation]:visible");
  await root.waitFor();
  const patient = root.getByRole("combobox", { name: "Select patient" });
  await patient
    .locator("option")
    .filter({ hasText: "DEMO-000001" })
    .waitFor({ state: "attached" });
  let loading = p.waitForResponse(
    (r) =>
      r.url().endsWith("/comprehensive-consultation") &&
      r.request().postDataJSON()?.action === "load",
  );
  await patient.selectOption(
    await patient
      .locator("option")
      .evaluateAll((opts) => opts.find((o) => o.value)?.value),
  );
  const response = await loading;
  assert.equal(response.status(), 200);
  const config = (await response.json()).config;
  assert.equal(config.specialties.length, 17);
  assert.equal(config.services.length, 8);
  const tab = async (name) =>
    root.getByRole("tab", { name, exact: true }).click();
  await root
    .getByRole("combobox", { name: "Specialty template" })
    .selectOption("cardiology");
  await root
    .getByRole("combobox", { name: "Patient context", exact: true })
    .selectOption("adult");
  await root
    .getByRole("textbox", { name: "Cardiac history and findings" })
    .fill("Fictional cardiac assessment");
  await root
    .getByRole("combobox", { name: "Specialty template" })
    .selectOption("general");
  await root
    .getByRole("textbox", { name: "Functional assessment" })
    .fill("Fictional functional assessment");
  await tab("History & visit");
  await root
    .getByRole("combobox", { name: "Consulting clinician" })
    .selectOption(config.clinicians[0].value);
  await root.getByRole("combobox", { name: "Visit type" }).selectOption("new");
  await root
    .getByRole("textbox", { name: "Chief complaint" })
    .fill("Fictional consultation concern");
  await root
    .getByRole("textbox", { name: "History & current medicines" })
    .fill("Clinician-authored history");
  await tab("Examination & assessment");
  await root
    .getByRole("textbox", { name: "Examination findings" })
    .fill("Documented findings");
  await root
    .getByRole("textbox", { name: "Clinical assessment / diagnosis" })
    .fill("Authored diagnosis");
  await root
    .getByRole("combobox", { name: "Allergy information review" })
    .selectOption("reviewed");
  await tab("Care plan");
  await root
    .getByRole("textbox", { name: "Treatment / medication plan" })
    .fill("Authored treatment plan");
  await root
    .getByRole("textbox", { name: "Follow-up plan" })
    .fill("Planned follow-up");
  await tab("Diagnosis & coding");
  await root
    .getByRole("combobox", { name: "Code system" })
    .selectOption("LOCAL");
  await root
    .getByRole("textbox", { name: "Code", exact: true })
    .fill("DEMO-DX");
  await root
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Fictional diagnosis");
  await root
    .getByRole("button", { name: "Add diagnosis", exact: true })
    .click();
  await tab("Today's orders");
  for (const [kind, label, id] of [
    ["medication", "Medication", "med-1"],
    ["lab", "Laboratory", "lab-1"],
    ["imaging", "Imaging", "image-1"],
    ["procedure", "Procedure", "proc-1"],
  ]) {
    await root.getByRole("button", { name: "+ " + label, exact: true }).click();
    const d = p.getByRole("dialog");
    await d.getByRole("combobox", { name: "Service / item" }).selectOption(id);
    await d.getByRole("combobox", { name: "Linked diagnosis" }).selectOption(
      await d
        .getByRole("combobox", { name: "Linked diagnosis" })
        .locator("option")
        .evaluateAll((opts) => opts.find((o) => o.value)?.value),
    );
    await d
      .getByRole("textbox", { name: "Clinical indication" })
      .fill("Fictional indication");
    for (const field of kind === "medication"
      ? ["Dose", "Route", "Frequency", "Duration", "Timing"]
      : kind === "lab"
        ? ["Specimen", "Collection method"]
        : ["Laterality", "Contrast details"])
      await d
        .getByRole("textbox", { name: field, exact: true })
        .fill("Demo " + field);
    if (kind === "medication") await d.getByRole("checkbox").check();
    await d.getByRole("button", { name: "Apply changes" }).click();
  }
  await root.getByRole("button", { name: "Edit", exact: true }).first().click();
  await p
    .getByRole("dialog")
    .getByRole("textbox", { name: "Dose", exact: true })
    .fill("Edited demo dose");
  await p
    .getByRole("dialog")
    .getByRole("button", { name: "Apply changes" })
    .click();
  await p.screenshot({ path: join(artifacts, "orders.png"), fullPage: true });
  await tab("Clinical score hub");
  await root.getByRole("button", { name: "Add assessment" }).click();
  let d = p.getByRole("dialog");
  await d.getByRole("combobox", { name: "Instrument" }).selectOption("gcs");
  await d.locator('input[type="datetime-local"]').fill("2026-09-10T10:00");
  for (const [name, value] of [
    ["Eye response", "4"],
    ["Verbal response", "5"],
    ["Motor response", "6"],
  ])
    await d
      .getByRole("combobox", { name: new RegExp(name) })
      .selectOption(value);
  await d.getByRole("button", { name: "Apply changes" }).click();
  assert.ok((await root.innerText()).includes("15"));
  await tab("E/M review");
  for (const [name, value] of [
    ["Problems level", "3"],
    ["Data level", "1"],
    ["Risk level", "2"],
  ])
    await root.getByRole("combobox", { name }).selectOption(value);
  await root
    .getByRole("spinbutton", { name: "Qualifying practitioner minutes" })
    .fill("30");
  await root
    .getByRole("textbox", { name: "Coding rationale / time activities" })
    .fill("Documented example rationale");
  assert.ok((await root.innerText()).includes("99204"));
  await tab("Reporting readiness");
  await root
    .getByRole("combobox", { name: "Jurisdiction profile" })
    .selectOption("doh");
  await root.getByRole("checkbox").check();
  await tab("E/M review");
  await root
    .getByRole("textbox", { name: "Coding rationale / time activities" })
    .fill("Reviewed coding rationale");
  await tab("Reporting readiness");
  assert.equal(await root.getByRole("checkbox").isChecked(), false);
  await root.getByRole("checkbox").check();
  await root
    .getByRole("button", { name: "Review consultation", exact: true })
    .click();
  d = p.getByRole("dialog");
  for (const text of [
    "Fictional cardiac assessment",
    "Fictional functional assessment",
    "Edited demo dose",
    "Fictional diagnosis",
  ])
    assert.ok((await d.innerText()).includes(text));
  await p.keyboard.press("Escape");
  // Recoverable failure: retain payload and operation identity across retry.
  let firstPayload;
  await p.route("**/comprehensive-consultation", async (route) => {
    const body = route.request().postDataJSON();
    if (body.action === "save" && !firstPayload) {
      firstPayload = body;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":"template.comprehensive.storage"}',
      });
    } else {
      if (body.action === "save") assert.deepEqual(body, firstPayload);
      await route.continue();
    }
  });
  await root.getByRole("button", { name: "Save draft", exact: true }).click();
  await root.getByRole("button", { name: "Retry", exact: true }).waitFor();
  loading = p.waitForResponse(
    (r) =>
      r.url().endsWith("/comprehensive-consultation") &&
      r.request().postDataJSON()?.action === "save" &&
      r.status() === 200,
  );
  await root.getByRole("button", { name: "Retry", exact: true }).click();
  let saved = await (await loading).json();
  assert.equal(saved.values.orders.length, 4);
  assert.equal(saved.values.scores.length, 1);
  await p.unroute("**/comprehensive-consultation");
  // Read-only and unauthenticated API access controls use the actual server.
  assert.equal(
    (
      await p.request.post(response.url(), {
        data: { action: "load", patientId: saved.patientId },
      })
    ).status(),
    401,
  );
  loading = p.waitForResponse(
    (r) =>
      r.url().endsWith("/comprehensive-consultation") &&
      r.request().postDataJSON()?.action === "save" &&
      r.request().postDataJSON()?.complete === true,
  );
  await root
    .getByRole("button", { name: "Validate & sign demo record" })
    .click();
  await p
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  saved = await (await loading).json();
  assert.equal(saved.status, "completed");
  assert.equal(saved.actor, "Prakash Mathew");
  assert.equal(await root.getByRole("checkbox").isDisabled(), true);
  await p.reload();
  await p.locator("header").first().waitFor();
  await open();
  await root.waitFor();
  const choose = root.getByRole("combobox", { name: "Select patient" });
  await choose
    .locator("option")
    .filter({ hasText: "DEMO-000001" })
    .waitFor({ state: "attached" });
  await choose.selectOption(saved.patientId);
  await root.getByRole("combobox", { name: "Specialty template" }).waitFor();
  assert.equal(
    await root
      .getByRole("combobox", { name: "Specialty template" })
      .isDisabled(),
    true,
  );
  await tab("Today's orders");
  assert.ok((await root.innerText()).includes("Edited demo dose"));
  await p.screenshot({ path: join(artifacts, "signed.png"), fullPage: true });
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
    assert.ok(
      !/template\.(comprehensive|consultation)\./.test(await root.innerText()),
    );
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
      path: join(artifacts, language + ".png"),
      fullPage: true,
    });
    console.log("PASS " + language + " catalog and desktop layout");
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS comprehensive real API configuration, specialty preservation, diagnosis/order links, four order types, edit, score, E/M, full preview, retry identity, CSV save/reload/sign and immutable controls",
  );
} finally {
  await browser.close();
}
