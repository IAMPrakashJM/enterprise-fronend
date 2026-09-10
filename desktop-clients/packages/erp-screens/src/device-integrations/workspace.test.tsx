import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { test, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  DEFAULT_PREFERENCES,
  type IntegrationLibrary,
} from "@pepbits/erp-config";
import {
  ClinicalRequestFailure,
  type IntegrationAdapter,
} from "@pepbits/erp-data";
import { DeviceIntegrationWorkspace } from "./workspace";
const base: IntegrationLibrary = {
  ...JSON.parse(
    readFileSync(
      process.cwd() + "/../dummy-api/config/device-integrations/devices.json",
      "utf8",
    ),
  ),
  records: [
    { id: "ITEM-1", code: "CODE-1", title: "Synthetic item", context: "pos" },
  ],
  jobs: [],
  defaultDevice: "browser",
  stationId: "demo-station",
  canManage: false,
};
test("effective tenant lock disables device preference and unsupported output is filtered", async () => {
  render(
    <DeviceIntegrationWorkspace
      pageId="device-integrations"
      scopeKey="a"
      preferences={DEFAULT_PREFERENCES}
      adapter={{
        library: async () => ({
          ...base,
          policy: { ...base.policy, lockedDevice: "demo-label" },
        }),
        command: vi.fn(),
      }}
    />,
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Device / destination")).toHaveValue(
      "demo-label",
    ),
  );
  expect(screen.getByLabelText("Device / destination")).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Save workstation default" }),
  ).toBeDisabled();
  expect(screen.getByLabelText("Output type")).toHaveValue("label");
});
test("recoverable queue failure retries exactly the same operation and selected source", async () => {
  const command = vi
    .fn()
    .mockRejectedValueOnce(
      new ClinicalRequestFailure(503, { form: "devices.storage" }),
    )
    .mockResolvedValue({ id: "job" });
  render(
    <DeviceIntegrationWorkspace
      pageId="device-integrations"
      scopeKey="b"
      preferences={DEFAULT_PREFERENCES}
      adapter={{ library: async () => base, command } as IntegrationAdapter}
    />,
  );
  await screen.findByLabelText("Source record");
  fireEvent.change(screen.getByLabelText("Source record"), {
    target: { value: "ITEM-1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create device job" }));
  await screen.findByText(
    "Device service could not save the request. Retry with the same operation.",
  );
  expect(screen.getByLabelText("Source record")).toHaveValue("ITEM-1");
  fireEvent.click(screen.getByRole("button", { name: /^Retry$/ }));
  await waitFor(() => expect(command).toHaveBeenCalledTimes(2));
  expect(command.mock.calls[1][0]).toEqual(command.mock.calls[0][0]);
});
