import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { test, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  DEFAULT_PREFERENCES,
  type RegistrationConfig,
  type RegistrationView,
  type PatientRecord,
  type PreferencePolicy,
} from "@pepbits/erp-config";
import type {
  RegistrationAdapter,
  ClinicalTemplateAdapter,
} from "@pepbits/erp-data";
import { RegistrationWorkspace } from "./workspace";
const config = {
  ...JSON.parse(
    readFileSync(
      process.cwd() + "/../dummy-api/config/op-registration/form.json",
      "utf8",
    ),
  ),
  providers: [
    {
      id: "P1",
      name: "Synthetic clinician",
      room: "Clinic 01",
      specialty: "Demo",
      fee: 250,
    },
  ],
  services: [],
  today: "2026-09-10",
  canWrite: true,
} as RegistrationConfig;
function setup() {
  const patient = {
    id: "PT-1",
    mrn: "DEMO-1",
    internalCode: "1",
    version: 1,
    values: {
      firstName: "Synthetic",
      lastName: "Patient",
      birthDate: "1980-01-01",
      gender: "female",
    },
    collections: {},
    activity: [],
  } as PatientRecord;
  const view: RegistrationView = {
    patient,
    config,
    appointments: [],
    record: {
      id: "",
      patientId: patient.id,
      owner: "u",
      version: 0,
      status: "draft",
      values: config.defaults,
      orders: [],
      payments: [],
      signedAt: "",
      signedBy: "",
      addenda: [],
      events: [],
      updatedAt: "2026-09-10T10:00:00Z",
    },
  };
  const adapter = {
    config: vi.fn().mockResolvedValue(config),
    load: vi.fn().mockResolvedValue(view),
    command: vi.fn().mockResolvedValue(view),
    worklist: vi.fn().mockResolvedValue({ records: [], appointments: [] }),
  } satisfies RegistrationAdapter;
  const patients = {
    search: vi
      .fn()
      .mockResolvedValue({
        rows: [
          {
            id: "PT-1",
            mrn: "DEMO-1",
            name: "Synthetic Patient",
            birthDate: "1980-01-01",
            mobile: "000",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      }),
  } as unknown as ClinicalTemplateAdapter;
  return { adapter, patients, view };
}
test("effective tenant page size wins and unavailable preferences disable registration writes", async () => {
  const { adapter, patients } = setup();
  render(
    <RegistrationWorkspace
      adapter={adapter}
      patients={patients}
      scopeKey="tenant/app/user"
      preferences={DEFAULT_PREFERENCES}
      preferencePolicy={
        {
          revision: 1,
          rules: { pageSize: { value: 50, locked: true } },
        } as unknown as PreferencePolicy
      }
      preferencesAvailable={false}
    />,
  );
  await screen.findByText("Synthetic Patient");
  expect(patients.search).toHaveBeenCalledWith(
    expect.objectContaining({ pageSize: 50 }),
  );
  expect(screen.getByRole("button", { name: "New patient" })).toBeDisabled();
});
test("patient verification cannot be skipped and scope change clears the selected patient", async () => {
  const { adapter, patients } = setup();
  const props = { adapter, patients, preferences: DEFAULT_PREFERENCES };
  const rendered = render(
    <RegistrationWorkspace {...props} scopeKey="tenant/app/user1" />,
  );
  await screen.findByText("Synthetic Patient");
  fireEvent.click(screen.getByRole("button", { name: "Select" }));
  await screen.findByLabelText("Full name confirmed");
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Complete the required item.",
  );
  rendered.rerender(
    <RegistrationWorkspace {...props} scopeKey="tenant/app/user2" />,
  );
  await waitFor(() =>
    expect(
      screen.queryByLabelText("Full name confirmed"),
    ).not.toBeInTheDocument(),
  );
});
test("unsaved identity blocks accidental patient switching", async () => {
  const { adapter, patients } = setup();
  render(
    <RegistrationWorkspace
      adapter={adapter}
      patients={patients}
      preferences={DEFAULT_PREFERENCES}
      scopeKey="tenant/app/user"
    />,
  );
  await screen.findByText("Synthetic Patient");
  fireEvent.click(screen.getByRole("button", { name: "Select" }));
  fireEvent.click(await screen.findByLabelText("Full name confirmed"));
  fireEvent.click(screen.getByLabelText("Date of birth confirmed"));
  fireEvent.click(screen.getByRole("button", { name: "Select" }));
  expect(adapter.load).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("alert")).toHaveTextContent("Save or discard");
});
