import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { test, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { DEFAULT_PREFERENCES, type IdentityLibrary } from "@pepbits/erp-config";
import { IdentityDeviceWorkspace } from "./workspace";
const base: IdentityLibrary = {
  ...JSON.parse(
    readFileSync(
      process.cwd() + "/../dummy-api/config/identity-devices/devices.json",
      "utf8",
    ),
  ),
  patients: [
    { id: "DEMO-P1", name: "Synthetic patient", birthDate: "1985-03-12" },
  ],
  attempts: [],
  defaultDevice: "demo-card",
  canManage: false,
};
test("biometrics disabled still allows separate manual review and never implies authentication", async () => {
  const command = vi.fn().mockResolvedValue({
    id: "manual",
    status: "manual-review",
    authenticated: false,
    patientId: "DEMO-P1",
    expiresAt: "2026-09-10",
    createdAt: "2026-09-10",
  });
  render(
    <IdentityDeviceWorkspace
      pageId="patient-biometric-verification"
      scopeKey="u"
      preferences={DEFAULT_PREFERENCES}
      adapter={{ library: async () => base, command }}
    />,
  );
  await screen.findByLabelText("Selected patient");
  fireEvent.change(screen.getByLabelText("Selected patient"), {
    target: { value: "DEMO-P1" },
  });
  expect(
    screen.getByRole("button", { name: "Start demo identity request" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Route to manual review" }),
  ).not.toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Route to manual review" }),
  );
  await waitFor(() => expect(command).toHaveBeenCalled());
  expect(command.mock.calls[0][0]).toMatchObject({
    action: "manual",
    patientId: "DEMO-P1",
  });
  expect(
    screen.getByText(
      "Demo results never authenticate a patient, grant access or update the patient record.",
    ),
  ).toBeVisible();
});
test("incompatible tenant reader lock is not overridden on passport page", async () => {
  render(
    <IdentityDeviceWorkspace
      pageId="passport-scanner"
      scopeKey="v"
      preferences={DEFAULT_PREFERENCES}
      adapter={{
        library: async () => ({
          ...base,
          policy: { ...base.policy, lockedDevice: "demo-eid" },
        }),
        command: vi.fn(),
      }}
    />,
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Identity reader / method")).toHaveValue(
      "demo-eid",
    ),
  );
  expect(screen.getByLabelText("Identity reader / method")).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Start demo identity request" }),
  ).toBeDisabled();
});
test("active card request keeps its actual device when another reader page opens", async () => {
  const pending = {
    id: "pending",
    patientId: "DEMO-P1",
    deviceId: "demo-eid",
    stationId: "demo-station",
    status: "pending" as const,
    authenticated: false as const,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 120000).toISOString(),
  };
  render(
    <IdentityDeviceWorkspace
      pageId="passport-scanner"
      scopeKey="cross-page"
      preferences={DEFAULT_PREFERENCES}
      adapter={{
        library: async () => ({ ...base, attempts: [pending] }),
        command: vi.fn(),
      }}
    />,
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Identity reader / method")).toHaveValue(
      "demo-eid",
    ),
  );
  expect(
    screen.getByRole("button", { name: "Simulate reader result" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Cancel request" }),
  ).not.toBeDisabled();
});
