import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { test, expect, vi } from "vitest";
import metadataFixture from "../../../../../dummy-api/config/clinical-templates/metadata.json";
import patientFixtures from "../../../../../dummy-api/config/clinical-templates/patients.json";
import {
  DEFAULT_PREFERENCES,
  createFormatters,
  type PatientMetadata,
  type PatientRecord,
  type PatientSummary,
} from "@pepbits/erp-config";
import {
  ClinicalRequestFailure,
  type ClinicalTemplateAdapter,
} from "@pepbits/erp-data";
import { PatientQueryTemplate } from "./patient-query";
import { querySignature } from "./query-model";
const fixture = patientFixtures[0] as PatientRecord;
const row: PatientSummary = {
  id: fixture.id,
  mrn: fixture.mrn,
  internalCode: fixture.internalCode,
  name: "Alex Morgan",
  birthDate: String(fixture.values.birthDate),
  gender: "male",
  mobile: String(fixture.values.mobile),
  email: String(fixture.values.email),
  nationality: "uae",
  status: "active",
  registeredAt: fixture.activity[0].at,
  version: 1,
};
function setup() {
  const adapter = {
    search: vi
      .fn()
      .mockResolvedValue({ rows: [row], total: 1, page: 1, pageSize: 20 }),
    savedSearches: vi.fn().mockResolvedValue([]),
    load: vi.fn().mockResolvedValue(fixture),
    saveSearch: vi.fn().mockResolvedValue([]),
  } as unknown as ClinicalTemplateAdapter;
  const onOpen = vi.fn();
  render(
    <PatientQueryTemplate
      adapter={adapter}
      metadata={{ ...metadataFixture, canWrite: true } as PatientMetadata}
      preferences={DEFAULT_PREFERENCES}
      format={createFormatters(DEFAULT_PREFERENCES)}
      onOpen={onOpen}
    />,
  );
  return { adapter, onOpen };
}
test("query waits for criteria and preserves filters after a failed search", async () => {
  const { adapter } = setup();
  vi.mocked(adapter.search)
    .mockRejectedValueOnce(new ClinicalRequestFailure(503))
    .mockResolvedValue({ rows: [row], total: 1, page: 1, pageSize: 20 });
  expect(
    screen.getByRole("button", { name: "Search", exact: true }),
  ).toBeDisabled();
  expect(adapter.search).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("First name", { exact: true }), {
    target: { value: " Alex " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Search", exact: true }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("First name", { exact: true })).toHaveValue(
    "Alex",
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByRole("button", { name: "Alex Morgan" });
  expect(vi.mocked(adapter.search).mock.calls[0][0]).toMatchObject({
    firstName: "Alex",
    page: 1,
  });
  fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
  expect(
    screen.getByRole("heading", { name: "Search the patient registry" }),
  ).toBeInTheDocument();
  expect(adapter.search).toHaveBeenCalledTimes(2);
});
test("inline details belong to the selected row and record actions use navigation", async () => {
  const { onOpen } = setup();
  fireEvent.change(screen.getByLabelText("First name", { exact: true }), {
    target: { value: "Alex" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Search", exact: true }));
  await screen.findByRole("button", { name: "Alex Morgan" });
  fireEvent.click(screen.getByRole("tab", { name: "Inline", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Alex Morgan" }));
  await screen.findByRole("heading", { name: "Alex Morgan" });
  const detail = document.querySelector("[data-query-detail]")!;
  expect(detail.closest("tr")).not.toBeNull();
  fireEvent.click(
    within(detail as HTMLElement).getByRole("button", {
      name: "Edit",
      exact: true,
    }),
  );
  expect(onOpen).toHaveBeenCalledWith({
    view: "record",
    patientId: fixture.id,
    mode: "edit",
  });
});
test("recent search signatures ignore case, whitespace and unattached country codes", () => {
  expect(querySignature({ firstName: " Alex ", mobileCode: "+971" })).toBe(
    querySignature({ firstName: "alex" }),
  );
  expect(querySignature({ mobile: "123", mobileCode: "+971" })).not.toBe(
    querySignature({ mobile: "123", mobileCode: "+91" }),
  );
});
