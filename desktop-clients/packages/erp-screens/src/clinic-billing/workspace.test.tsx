import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  cleanup,
} from "@testing-library/react";
import { test, expect, vi, afterEach } from "vitest";
import {
  DEFAULT_PREFERENCES,
  type ClinicBillingView,
} from "@pepbits/erp-config";
import type {
  ClinicBillingAdapter,
  ClinicalTemplateAdapter,
} from "@pepbits/erp-data";
import { BillingClinicWorkspace } from "./workspace";
import fixtures from "../../../../../dummy-api/config/clinical-templates/patients.json";
afterEach(cleanup);
const view: ClinicBillingView = {
  patient: fixtures[0],
  context: [],
  state: {
    patientId: fixtures[0].id,
    version: 1,
    orders: [],
    invoices: [],
    payments: [],
    history: [],
  },
  services: [
    {
      id: "consultation",
      label: "template.clinic.service.consultation",
      category: "consultation",
      price: 10000,
      taxBps: 0,
      coverageBps: 8000,
    },
  ],
  currency: "AED",
  canWrite: true,
};
const patients = {
  search: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
} as unknown as ClinicalTemplateAdapter;
const props = (adapter: ClinicBillingAdapter) => ({
  adapter,
  patients,
  scopeKey: "tenant-app-user",
  patientId: view.patient.id,
  preferences: DEFAULT_PREFERENCES,
});
test("managed layouts update without losing input; failed requests retry the exact operation", async () => {
  const mutate = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Network failed"))
      .mockResolvedValue({ ...view, state: { ...view.state, version: 2 } }),
    adapter = { load: vi.fn().mockResolvedValue(view), mutate };
  const rendered = render(<BillingClinicWorkspace {...props(adapter)} />);
  await screen.findByRole("textbox", { name: "Ordering doctor" });
  fireEvent.change(screen.getByRole("textbox", { name: "Ordering doctor" }), {
    target: { value: "Doctor Example" },
  });
  rendered.rerender(
    <BillingClinicWorkspace
      {...props(adapter)}
      preferencePolicy={{
        revision: 1,
        rules: {
          formNavigation: { locked: true, value: "tabs" },
          density: { locked: true, value: "compact" },
        },
      }}
    />,
  );
  expect(rendered.container.querySelector('[data-layout="tabs"]')).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Ordering doctor" })).toHaveValue(
    "Doctor Example",
  );
  fireEvent.change(screen.getByRole("combobox", { name: "Service / item" }), {
    target: { value: "consultation" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add service order" }));
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Confirm" }),
  );
  await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("textbox", { name: "Ordering doctor" })).toHaveValue(
    "Doctor Example",
  );
  expect(
    screen.getByRole("textbox", { name: "Ordering doctor" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /Retry/i }));
  await waitFor(() => expect(mutate).toHaveBeenCalledTimes(2));
  expect(mutate.mock.calls[0][0]).toEqual(mutate.mock.calls[1][0]);
});
test("read-only API access disables financial writes", async () => {
  const adapter = {
    load: vi.fn().mockResolvedValue({ ...view, canWrite: false }),
    mutate: vi.fn(),
  };
  render(<BillingClinicWorkspace {...props(adapter)} />);
  await screen.findByRole("textbox", { name: "Ordering doctor" });
  expect(
    screen.getByRole("textbox", { name: "Ordering doctor" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Add service order" }),
  ).toBeDisabled();
  expect(adapter.mutate).not.toHaveBeenCalled();
});

test("cashier money and exports retain cents when general number preferences use whole units", async () => {
  const { createClinicFormatters } = await import("./format");
  const format = createClinicFormatters(
    { ...DEFAULT_PREFERENCES, decimalPlaces: 0, currencyCode: "USD" },
    "AED",
  );
  expect(format.money(76.5)).toContain("76.50");
  expect(
    format.cell({ key: "clinicNet", label: "Net", type: "money" }, 76.5),
  ).toContain("76.50");
  expect(format.money(76.5)).toContain("AED");
  expect(format.number(1)).toBe("1");
});
