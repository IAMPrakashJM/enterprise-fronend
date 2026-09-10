import { loadPlaywright } from "./harness.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
const { chromium } = loadPlaywright();
const artifacts =
  process.env.E2E_ARTIFACTS ?? join(tmpdir(), "op-consultation-e2e");
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
    async function open(id = "op-consultation") {
      await p.keyboard.press("Control+k");
      const d = p.getByRole("dialog");
      await d.locator("input").first().fill(id);
      await d.locator("button.group").first().click();
    }
    await open();
    const root = p.locator("[data-op-consultation]");
    await root.waitFor();
    const patient = root.getByRole("combobox", { name: "Select patient" });
    await patient
      .locator("option")
      .filter({ hasText: "DEMO-000001" })
      .waitFor({ state: "attached" });
    const triageLoading = p.waitForResponse(
      (r) =>
        r.url().endsWith("/clinical-triage") &&
        r.request().postDataJSON()?.action === "load",
    );
    await patient.selectOption(
      await patient
        .locator("option")
        .evaluateAll((opts) => opts.find((o) => o.value)?.value),
    );
    await root.getByRole("textbox", { name: "Chief complaint" }).waitFor();
    const triageResponse = await triageLoading;
    const triage = await triageResponse.json();
    const assessment = structuredClone(triage.blank);
    Object.assign(assessment.values, {
      complaint: "Fictional OP context",
      priority: "standard",
      allergyStatus: "unknown",
      destination: "review",
      missingReason: "Fictional interface test",
    });
    assessment.values.vitals.pulse = "72";
    const triageSave = await p.request.post(triageResponse.url(), {
      headers: triageResponse.request().headers(),
      data: {
        action: "save",
        patientId: assessment.patientId,
        assessment,
        expectedVersion: 0,
        operationId: "op-context-fixture",
        complete: true,
      },
    });
    assert.equal(triageSave.status(), 200);
    await root
      .getByRole("button", { name: "Refresh triage", exact: true })
      .click();
    await root
      .locator("[data-op-patient]")
      .getByText(/Pulse: 72(?:\.0+)? \/min/)
      .waitFor();
    await root
      .getByRole("button", { name: "Latest completed triage", exact: true })
      .click();
    assert.ok(
      (await p.getByRole("dialog").innerText()).includes(
        "Fictional OP context",
      ),
    );
    await p.keyboard.press("Escape");

    await root
      .getByRole("button", { name: "New consultation", exact: true })
      .click();
    await p.screenshot({
      path: join(artifacts, "op-initial.png"),
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
    await root.getByRole("tab", { name: "Assessment", exact: true }).click();
    await root
      .getByRole("textbox", { name: "Examination findings" })
      .fill("Fictional findings");
    await root
      .getByRole("textbox", { name: "Clinical assessment / diagnosis" })
      .fill("Clinician-authored assessment");
    await root.getByRole("tab", { name: "Plan", exact: true }).click();
    await root
      .getByRole("textbox", { name: "Treatment / medication plan" })
      .fill("Documented plan for demo");
    await root
      .getByRole("textbox", { name: "Follow-up plan" })
      .fill("Review documented");
    await root.getByRole("tab", { name: "Assessment", exact: true }).click();
    await root
      .getByRole("combobox", { name: "Allergy information review" })
      .selectOption("reviewed");
    const expanded = [
      ["Background", "Past medical history", "Fictional background", "Visit"],
      ["Allergies", "Allergy details", "Reported information", "Visit"],
      [
        "Systems",
        "Heart / respiratory review",
        "Recorded review",
        "Assessment",
      ],
      [
        "Results",
        "Laboratory results review",
        "Documented result review",
        "Assessment",
      ],
      [
        "Procedures",
        "Procedure details / outcome",
        "Documented discussion",
        "Assessment",
      ],
      [
        "Medicines",
        "Prescription plan (notes only)",
        "Documented medication plan",
        "Plan",
      ],
      [
        "Referrals",
        "Reason for referral",
        "Documented referral reason",
        "Plan",
      ],
      [
        "Education",
        "Patient education / counselling",
        "Documented counselling",
        "Plan",
      ],
    ];
    for (const [tab, field, value, back] of expanded) {
      await root.getByRole("tab", { name: tab, exact: true }).click();
      await root.getByRole("textbox", { name: field, exact: true }).fill(value);
      const action = await root
        .getByRole("button", { name: "Complete consultation" })
        .boundingBox();
      if (!action || action.y + action.height > 870) {
        await p.screenshot({
          path: join(artifacts, "consultation-overflow.png"),
          fullPage: true,
        });
      }
      assert.ok(
        action && action.y + action.height <= 870,
        tab + " keeps final actions visible: " + JSON.stringify(action),
      );
      await root.getByRole("tab", { name: new RegExp("^" + back) }).click();
    }
    await root.getByRole("tab", { name: "Vitals", exact: true }).click();
    await root.getByRole("spinbutton", { name: "Pulse (/min)" }).fill("72");
    await p.screenshot({
      path: join(artifacts, "op-expanded.png"),
      fullPage: true,
    });
    await root.getByRole("tab", { name: /^Visit/ }).click();
    await root.getByRole("button", { name: "Review full note" }).click();
    const note = p.getByRole("dialog");
    assert.ok((await note.innerText()).includes("Fictional background"));
    assert.ok((await note.innerText()).includes("Documented referral reason"));
    await p.keyboard.press("Escape");
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
    assert.equal(saved.values.medicalHistory, "Fictional background");
    assert.equal(saved.values.pulse, "72");
    assert.equal(saved.values.referralReason, "Documented referral reason");
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
    await root.getByRole("tab", { name: /^Background/ }).click();
    assert.equal(
      await root
        .getByRole("textbox", { name: "Past medical history" })
        .inputValue(),
      "Fictional background",
    );
    await root.getByRole("tab", { name: /^Visit/ }).click();
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
      path: join(artifacts, "op-completed.png"),
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
        path: join(artifacts, "op-" + language + ".png"),
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
