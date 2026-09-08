import {createFormatters} from "../../../erp-config/src/format";
import {DEFAULT_PREFERENCES} from "../../../erp-config/src/preference-defaults";
import React, { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { createWorkspace, DocumentProvider, WorkspaceProvider } from "@pepbits/workspace-core";
import type { PageDefinition } from "@pepbits/erp-config";
import { DynamicRecordForm } from "./dynamic-record-form";
import { RecordAdapterProvider } from "../records/use-record-editor";
import { RecordRejected } from "@pepbits/erp-data";
import type { RecordAdapter } from "@pepbits/erp-data";
const { toast, schema } = vi.hoisted(() => ({ toast: vi.fn(), schema: { singular: "Customer", sections: [{ id: "details", title: "Details", fields: [{ id: "name", label: "Name", type: "text", required: true, defaultValue: "Alice" }] }] } }));
vi.mock("@pepbits/erp-shell", () => ({ useERP: () => ({ preferences: { formNavigation: "tabs" }, toast, format:createFormatters(DEFAULT_PREFERENCES) }), useProduct: () => ({ id: "test" }) }));
vi.mock("@pepbits/auth", () => ({ useSession: () => ({ user: { id: "u", tenantId: "t" } }), readToken: () => "token", authedFetch: vi.fn() }));
vi.mock("@pepbits/erp-config", async () => ({ ...await import("../../../erp-config/src/form-rules"), ...await import("../../../erp-config/src/draft-policy"), ...await import("../../../erp-config/src/i18n"), getEntitySchema: () => schema }));
vi.mock("@pepbits/erp-data", async () => ({ ...await import("../../../erp-data/src/records"), getWorklistConfig: () => ({ rows: [], primaryKey: "id" }) }));
vi.mock("@pepbits/ai-client", () => ({ usePublishAiSources: () => undefined }));
vi.mock("@pepbits/ai-ui", () => ({ InlineAiAction: () => null }));
vi.mock("@pepbits/platform-ports", () => ({ useNavigation: () => ({ open: vi.fn() }) }));
vi.mock("./form-navigation", () => ({ FormNavigationControl: () => null }));
const page = { id: "customers", title: "Customers", entity: "customer", kind: "worklist" } as PageDefinition;
const adapter = { list: vi.fn().mockResolvedValue([]), create: vi.fn(), load: vi.fn(), save: vi.fn(), draft: vi.fn(), discard: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks();
  adapter.load.mockResolvedValue({ record: null, draft: null, draftVersion: 0 });
  adapter.save.mockImplementation(async (_key, values) => ({ record: { values, version: 1, savedAt: new Date().toISOString() }, draft: null, draftVersion: 1 }));
  adapter.draft.mockImplementation(async (_key, values, baseVersion, version) => ({ values, baseVersion, version: version + 1, savedAt: new Date().toISOString() }));
  adapter.discard.mockResolvedValue(undefined);
});
const form = (id = "A") => <RecordAdapterProvider value={adapter as RecordAdapter}><DynamicRecordForm page={page} target={{ pageId: page.id, mode: "edit", recordId: id }} /></RecordAdapterProvider>;
async function ready() { await waitFor(() => expect(screen.getByRole("textbox", { name: /Name/ })).toBeEnabled()); }
test("StrictMode loads safely and reports only acknowledged saves", async () => {
  render(<StrictMode>{form()}</StrictMode>); await ready();
  fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), { target: { value: "Edited" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Changes saved" })));
  expect(adapter.save).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Saved", { exact: true })).toBeVisible();
});
test("failed save keeps edits and exposes retry", async () => {
  adapter.save.mockRejectedValueOnce(new Error("Service unavailable"));
  render(form()); await ready();
  fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), { target: { value: "Keep me" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the service");
  expect(screen.getByRole("textbox", { name: /Name/ })).toHaveValue("Keep me");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(screen.getByText("Saved", { exact: true })).toBeVisible());
});
test("recovery requires a choice before editing", async () => {
  adapter.load.mockResolvedValue({ record: null, draft: { values: { name: "Recovered" }, version: 1, baseVersion: 0, savedAt: new Date().toISOString() }, draftVersion: 1 });
  const workspace = createWorkspace({ session: { tenantId: "t", userId: "u" }, policy: { platform: { modes: ["TAB"] } } });
  const doc = workspace.openDocument({ module: "M", documentType: "CUSTOMER", entityId: "A", title: "A" }).document!;
  render(<WorkspaceProvider workspace={workspace}><DocumentProvider documentId={doc.documentId}>{form()}</DocumentProvider></WorkspaceProvider>);
  const restore = await screen.findByRole("button", { name: "Restore draft" });
  expect(workspace.closeDocument(doc.documentId).ok).toBe(false);
  fireEvent.click(restore);
  expect(screen.getByRole("textbox", { name: /Name/ })).toHaveValue("Recovered");
  act(() => { workspace.closeAll({ discardChanges: true }); });
});
test("suspension retains edits and explicit discard reloads the baseline", async () => {
  const workspace = createWorkspace({ session: { tenantId: "t", userId: "u" }, policy: { platform: { modes: ["TAB"] } } });
  const doc = workspace.openDocument({ module: "M", documentType: "CUSTOMER", entityId: "A", title: "A" }).document!;
  const tree = (visible: boolean) => <WorkspaceProvider workspace={workspace}><DocumentProvider documentId={doc.documentId}>{visible && form()}</DocumentProvider></WorkspaceProvider>;
  const { rerender } = render(tree(true)); await ready();
  fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), { target: { value: "Retained" } });
  expect(workspace.getDocument(doc.documentId)?.dirty).toBe(true);
  rerender(tree(false)); rerender(tree(true)); await ready();
  expect(screen.getByRole("textbox", { name: /Name/ })).toHaveValue("Retained");
  expect(JSON.stringify(workspace.restoreMetadata())).not.toContain("Retained");
  fireEvent.click(screen.getByRole("button", { name: "Discard" }));
  await waitFor(() => expect(screen.getByRole("textbox", { name: /Name/ })).toHaveValue("Alice"));
  act(() => { workspace.closeDocument(doc.documentId); });
});
test("Alt+S saves only the focused split pane", async () => {
  const workspace = createWorkspace({ session: { tenantId: "t", userId: "u" }, policy: { platform: { modes: ["TAB", "SPLIT"] } } });
  const a = workspace.openDocument({ module: "M", documentType: "CUSTOMER", entityId: "A", title: "A" }).document!;
  const b = workspace.openDocument({ module: "M", documentType: "CUSTOMER", entityId: "B", title: "B" }).document!;
  workspace.moveToSplit(a.documentId); workspace.focusDocument(b.documentId);
  render(<WorkspaceProvider workspace={workspace}><DocumentProvider documentId={a.documentId}>{form("A")}</DocumentProvider><DocumentProvider documentId={b.documentId}>{form("B")}</DocumentProvider></WorkspaceProvider>);
  await waitFor(() => expect(screen.getAllByRole("textbox", { name: /Name/ }).every(input => !(input as HTMLInputElement).disabled)).toBe(true));
  fireEvent.keyDown(window, { key: "s", altKey: true });
  await waitFor(() => expect(adapter.save).toHaveBeenCalledTimes(1));
  expect(adapter.save.mock.calls[0][0]).toContain("B");
  act(() => { workspace.closeAll({ discardChanges: true }); });
});

test("server field errors attach to the input and allow correction", async () => {
  adapter.save.mockRejectedValueOnce(new RecordRejected("Check the highlighted fields", {name:"This name already exists"}));
  render(form()); await ready();
  fireEvent.click(screen.getByRole("button", {name:"Save"}));
  expect(await screen.findByText("This name already exists")).toBeVisible();
  expect(screen.getByRole("textbox",{name:/Name/})).toHaveAttribute("aria-invalid","true");
  fireEvent.change(screen.getByRole("textbox",{name:/Name/}),{target:{value:"Unique"}});
  fireEvent.click(screen.getByRole("button",{name:"Save"}));
  await waitFor(()=>expect(screen.getByText("Saved",{exact:true})).toBeVisible());
});

test('permission failure keeps edits and does not offer a mutation retry',async()=>{
 const {RecordRequestFailure}=await import('@pepbits/erp-data');adapter.save.mockRejectedValueOnce(new RecordRequestFailure(403,'trace-form'));render(form());await ready();
 fireEvent.change(screen.getByRole('textbox',{name:/Name/}),{target:{value:'Retain denied edits'}});fireEvent.click(screen.getByRole('button',{name:'Save'}));expect(await screen.findByRole('alert')).toHaveTextContent('Access not permitted');expect(screen.queryByRole('button',{name:'Retry'})).toBeNull();expect(screen.getByRole('textbox',{name:/Name/})).toHaveValue('Retain denied edits');
});
