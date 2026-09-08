import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { BillingPage } from "../billing/billing-page";
import { ConsultationPage } from "../consultation/consultation-page";
import { RecordAdapterProvider } from "./use-record-editor";
import type { RecordAdapter } from "@pepbits/erp-data";
import type { PageDefinition } from "@pepbits/erp-config";
vi.mock("@pepbits/erp-shell", () => ({ useERP: () => ({ preferences: { billingLayout: "workspace" }, toast: () => {}, updatePreference: () => {}, format: { money: (n: number) => `AED ${n}` } }), useProduct: () => ({ id: "test" }) }));
vi.mock("@pepbits/auth", () => ({ useSession: () => ({ user: { id: "u", tenantId: "t" } }), readToken: () => "token", authedFetch: vi.fn() }));
vi.mock("@pepbits/ai-client", () => ({ usePublishAiSources: () => undefined }));
vi.mock("@pepbits/ai-ui", () => ({ InlineAiAction: () => null, TransparencyPanel: () => null, useAssistant: () => ({ useCases: [], allowed: false }) }));
vi.mock("../consultation/recorder", () => ({ ConsultationRecorder: () => null }));
function adapter() {
  return { list: vi.fn().mockResolvedValue([]), create: vi.fn(), load: vi.fn().mockResolvedValue({ record: null, draft: null, draftVersion: 0 }),
    save: vi.fn().mockImplementation(async (_key, values) => ({ record: { values, version: 1, savedAt: new Date().toISOString() }, draft: null, draftVersion: 1 })),
    draft: vi.fn().mockImplementation(async (_key, values, baseVersion, version) => ({ values, baseVersion, version: version + 1, savedAt: new Date().toISOString() })), discard: vi.fn().mockResolvedValue(undefined) };
}
test("billing fields survive tab changes and are included with line items in a real save", async () => {
  const service = adapter();
  render(<RecordAdapterProvider value={service as RecordAdapter}><BillingPage page={{ id: "invoice", title: "Invoice" } as PageDefinition} /></RecordAdapterProvider>);
  const remarks = screen.getByLabelText("Invoice remarks"); await waitFor(() => expect(remarks).toBeEnabled());
  fireEvent.change(remarks, { target: { value: "Revised contract" } });
  fireEvent.click(screen.getByRole("tab", { name: "Customer" }));
  fireEvent.change(screen.getByLabelText("Primary contact"), { target: { value: "New contact" } });
  fireEvent.click(screen.getByRole("tab", { name: "Billing details" }));
  expect(screen.getByLabelText("Invoice remarks")).toHaveValue("Revised contract");
  fireEvent.click(screen.getByRole("button", { name: "Save invoice" }));
  await waitFor(() => expect(service.save).toHaveBeenCalledTimes(1));
  expect(service.save.mock.calls[0][1].fields).toMatchObject({ "Invoice remarks": "Revised contract", "Primary contact": "New contact", Currency: "AED" });
  expect(service.save.mock.calls[0][1].lines).toHaveLength(4);
  fireEvent.click(screen.getByRole("tab", { name: "Customer" }));
  fireEvent.change(screen.getByLabelText("Customer"), { target: { value: "bluecrest" } });
  expect(screen.getByLabelText("Primary contact")).toHaveValue("");
  expect(screen.getByLabelText("Billing address")).toHaveValue("");
});
test("consultation recovers composition, narrative, codes, orders and review checkboxes", async () => {
  const service = adapter();
  const saved = { selection: { type: "new", specialty: "cardiology", condition: "acute", context: "adult" }, step: 3, built: true, chosenPrompts: [], values: { hpi: "Recovered narrative" }, coding: "none", em: { problems: "moderate", data: "moderate", risk: "moderate", patient: "new", minutes: "", basis: "mdm" }, codes: ["I10"], orders: [], checks: { "I reviewed the clinical content": true } };
  service.load.mockResolvedValue({ record: null, draft: { values: saved, version: 1, baseVersion: 0, savedAt: new Date().toISOString() }, draftVersion: 1 });
  render(<RecordAdapterProvider value={service as RecordAdapter}><ConsultationPage page={{ id: "consult", title: "Consultation" } as PageDefinition} /></RecordAdapterProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Restore draft" }));
  expect(screen.getByLabelText("Clinician narrative")).toHaveValue("Recovered narrative");
  expect(screen.getByLabelText("I reviewed the clinical content")).toBeChecked();
  fireEvent.change(screen.getByLabelText("Clinician narrative"), { target: { value: "Revised narrative" } });
  fireEvent.click(screen.getByRole("button", { name: "Save consultation" }));
  await waitFor(() => expect(service.save).toHaveBeenCalledTimes(1));
  expect(service.save.mock.calls[0][1]).toMatchObject({ codes: ["I10"], values: { hpi: "Revised narrative" }, checks: saved.checks });
});
