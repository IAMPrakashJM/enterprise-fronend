import { loadPlaywright } from "./harness.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as XLSX from "xlsx";
import { join } from "node:path";
import { tmpdir } from "node:os";
const { chromium } = loadPlaywright();
const artifacts =
  process.env.E2E_ARTIFACTS ?? join(tmpdir(), "clinic-billing-e2e");
fs.mkdirSync(artifacts, { recursive: true });
// Run with a fresh managed demo API: seed rows are consumed by this workflow.
(async () => {
  const browser = await chromium.launch({ chromiumSandbox: false });
  try {
    const context = await browser.newContext({
        viewport: { width: 1800, height: 1100 },
        acceptDownloads: true,
      }),
      page = await context.newPage();
    page.setDefaultTimeout(30000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.E2E_DESKTOP ?? "http://127.0.0.1:3109");
    await page.locator("input").first().fill("admin");
    await page.locator("input[type=password]").fill("admin");
    await page.keyboard.press("Enter");
    await page.locator("header").first().waitFor();
    await page.keyboard.press("Control+k");
    const d = page.getByRole("dialog");
    await d.locator("input").first().fill("billing-clinic");
    await d.locator("button.group").first().click();
    const root = page.locator("[data-billing-clinic]");
    await root.waitFor();
    const select = root.getByRole("combobox", { name: "Select patient" });
    await select.locator("option").filter({hasText:"DEMO-000001"}).waitFor({state:"attached"});
    await select.selectOption(
      await select
        .locator("option")
        .evaluateAll((opts) => opts.find((o) => o.value)?.value),
    );
    await root
      .getByRole("checkbox", { name: "Demonstration pharmacy request" })
      .waitFor();
    let latest;
    async function confirm(action) {
      const response = page.waitForResponse(
        (r) =>
          r.url().endsWith("/clinic-billing") &&
          r.request().postDataJSON()?.action === action,
      );
      await page
        .getByRole("dialog")
        .filter({
          has: page.getByRole("heading", { name: "Confirm ledger action" }),
        })
        .getByRole("button", { name: "Confirm", exact: true })
        .click();
      const r = await response;
      assert.equal(r.status(), 200, await r.text());
      latest = await r.json();
      await page
        .getByRole("heading", { name: "Confirm ledger action" })
        .waitFor({ state: "hidden" });
    }
    await root
      .getByRole("checkbox", { name: "Demonstration pharmacy request" })
      .check();
    await root
      .getByRole("button", { name: "Convert selected prescriptions" })
      .click();
    await confirm("order");
    await root
      .getByRole("combobox", { name: "Service / item", exact: true })
      .selectOption("consultation");
    await root
      .getByRole("textbox", { name: "Ordering doctor" })
      .fill("Doctor Demo");
    await root.getByRole("button", { name: "Add service order" }).click();
    await confirm("add");
    for (const name of [
      "Demonstration pharmacy request",
      "Demo laboratory panel",
      "Consultation",
    ])
      await root.getByRole("checkbox", { name, exact: true }).check();
    await root.getByRole("button", { name: "Review selected orders" }).click();
    await root.getByRole("spinbutton", { name: "Discount (%)" }).fill("10");
    await root
      .getByRole("textbox", { name: "Billing notes" })
      .fill("Fictional browser workflow");
    await root.getByRole("button", { name: "Confirm & issue invoice" }).click();
    await confirm("invoice");
    assert.equal(latest.state.invoices.length, 1);
    const invoice = latest.state.invoices[0];
    assert.equal(invoice.total, 23400);
    await root.getByRole('button',{name:'Edit bill',exact:true}).click();
    const editScreen=root.locator('[data-clinic-bill-screen="edit"]');
    await editScreen.getByRole('textbox',{name:'Billing notes',exact:true}).fill('Corrected fictional note');
    await editScreen.getByRole('textbox',{name:/Reason for correction/}).fill('Demo correction');
    await page.screenshot({path:join(artifacts,'clinic-edit.png'),fullPage:true});
    await editScreen.getByRole('button',{name:'Save bill changes',exact:true}).click();
    await confirm('editInvoice');
    assert.equal(latest.state.invoices[0].note,'Corrected fictional note');
    assert.equal(latest.state.invoices[0].revisions[0].invoice.note,'Fictional browser workflow');
    await root.locator('[data-clinic-bill-screen="view"]').waitFor();
    await page.screenshot({path:join(artifacts,'clinic-view.png'),fullPage:true});
    await root.getByRole('button',{name:'Back to billing',exact:true}).click();
    await root.getByRole("spinbutton", { name: "Payment amount" }).fill("10");
    await root.getByRole("button", { name: "Record demo payment" }).click();
    await confirm("payment");
    assert.equal(latest.state.payments.length, 1);
    assert.equal(await root.getByRole("button",{name:"Edit bill",exact:true}).isDisabled(),true);
    assert.equal(latest.state.payments[0].amount, 1000);
    await root
      .getByRole("textbox", {
        name: "Reference / refund or cancellation reason",
      })
      .fill("Demo refund verification");
    await root
      .getByRole("button", { name: "Refund payment", exact: true })
      .click();
    await confirm("refund");
    assert.equal(
      latest.state.payments.reduce((s, p) => s + p.amount, 0),
      0,
    );
    await root
      .getByRole("button", { name: "View bill", exact: true })
      .click();
    assert.ok((await root.locator("[data-invoice-print]").innerText()).includes(invoice.id));
    const file = page.waitForEvent("download").catch(() => null);
    await root.locator('[data-clinic-bill-screen="view"]')
      .getByRole("button", { name: "Export", exact: true })
      .click();
    await confirm("export");
    const exported = await file;
    assert.ok(exported, "Invoice download should start");
    await exported.saveAs(
      join(artifacts, "clinic-invoice.") +
        (exported.suggestedFilename().endsWith(".xlsx") ? "xlsx" : "csv"),
    );
    const csv = fs.readFileSync(join(artifacts, "clinic-invoice.csv"), "utf8");
    assert.equal(csv.split("\r\n").length, 4);
    assert.ok(
      csv.includes("76.50") && csv.includes("22.50") && csv.includes("135.00"),
    );
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: join(artifacts, "clinic-invoice.pdf"),
      format: "A4",
      printBackground: true,
    });
    await page.emulateMedia({ media: "screen" });
    await root
      .getByRole("button", { name: "Back to billing", exact: true })
      .click();
    await page.keyboard.press("Control+k");
    let picker = page.getByRole("dialog");
    await picker.locator("input").first().fill("preferences");
    await picker.locator("button.group").first().click();
    await page.getByRole("tab", { name: "Behaviour", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Export format", exact: true })
      .selectOption("xlsx");
    await page.keyboard.press("Control+k");
    picker = page.getByRole("dialog");
    await picker.locator("input").first().fill("billing-clinic");
    await picker.locator("button.group").first().click();
    await root
      .getByRole("button", { name: "View bill", exact: true })
      .click();
    const workbookDownload = page.waitForEvent("download").catch(() => null);
    await root.locator('[data-clinic-bill-screen="view"]')
      .getByRole("button", { name: "Export", exact: true })
      .click();
    await confirm("export");
    const workbook = await workbookDownload;
    assert.ok(workbook?.suggestedFilename().endsWith(".xlsx"));
    await workbook.saveAs(join(artifacts, "clinic-invoice.xlsx"));
    const book = XLSX.read(
      fs.readFileSync(join(artifacts, "clinic-invoice.xlsx")),
      { type: "buffer" },
    );
    const cells = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], {
      header: 1,
    });
    assert.equal(cells.length, 4);
    assert.ok(JSON.stringify(cells).includes("76.50"));
    await root
      .getByRole("button", { name: "Back to billing", exact: true })
      .click();
    await page.screenshot({
      path: join(artifacts, "clinic-workflow.png"),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      join(artifacts, "clinic-flow-result.json"),
      JSON.stringify({
        patientId: latest.patient.id,
        invoiceId: invoice.id,
        version: latest.state.version,
      }),
    );
    console.log(
      "PASS real browser prescription/order/invoice/partial payment/refund/export/print flow; no page errors",
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
