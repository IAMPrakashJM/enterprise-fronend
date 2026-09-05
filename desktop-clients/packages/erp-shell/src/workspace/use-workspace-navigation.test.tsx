import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { createWorkspace, type Workspace } from "@pepbits/workspace-core";
import { useWorkspaceNavigation } from "./use-workspace-navigation.tsx";

const session = { tenantId: "T1", userId: "dr-x" };
const newWorkspace = (modes: Array<"SINGLE" | "TAB"> = ["TAB"]) =>
  createWorkspace({ session, policy: { platform: { modes } } });

/* Renders the tab titles and exposes the port, so every assertion is about what
   a user would see rather than about hook internals. */
function Probe({ workspace }: { workspace: Workspace }) {
  const nav = useWorkspaceNavigation(workspace, { initialModule: "finance" });
  return (
    <div>
      <p data-testid="current">{nav.port.current.pageId}</p>
      <p data-testid="pending">{nav.pending ? nav.pending.label : "none"}</p>
      <ul>
        {nav.documents.map((doc) => (
          <li key={doc.documentId}>
            {doc.title}{doc.dirty ? " •" : ""}{doc.closable ? "" : " [fixed]"}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => nav.port.open({ pageId: "customer-master" })}>open customers</button>
      <button type="button" onClick={() => nav.port.open({ pageId: "customer-master", mode: "view", recordId: "C-1" })}>open C-1</button>
      <button type="button" onClick={() => nav.port.open({ pageId: "hr-dashboard" })}>go to HR</button>
      <button type="button" onClick={() => nav.dirtyActive()}>make dirty</button>
      <button type="button" onClick={() => nav.closeDocument(nav.documents.at(-1)!.documentId)}>close last</button>
      <button type="button" onClick={() => nav.confirmPending()}>confirm</button>
      <button type="button" onClick={() => nav.cancelPending()}>cancel</button>
    </div>
  );
}

const titles = () => screen.getAllByRole("listitem").map((li) => li.textContent);
const click = (name: string) => userEvent.click(screen.getByRole("button", { name }));

/* Rendered WITHOUT a WorkspaceProvider, deliberately. This hook produces the
   navigation port the providers consume, so in both shells it runs ABOVE the
   provider and cannot read it from context. Wrapping it here made every test
   pass against an arrangement the application never has: the desktop shell
   rendered a blank screen with "useWorkspace must be used within a
   WorkspaceProvider" while all twelve were green. */
function mount(modes?: Array<"SINGLE" | "TAB">) {
  const workspace = newWorkspace(modes);
  render(<Probe workspace={workspace} />);
  return workspace;
}

describe("useWorkspaceNavigation", () => {
  test("starts on the module dashboard, and that tab cannot be closed", () => {
    mount();
    expect(titles()).toEqual(["Finance Command Center [fixed]"]);
    expect(screen.getByTestId("current")).toHaveTextContent("finance-dashboard");
  });

  test("opening appends a tab and makes it current", async () => {
    mount();
    await click("open customers");
    expect(titles()).toHaveLength(2);
    expect(screen.getByTestId("current")).toHaveTextContent("customer-master");
  });

  test("opening the same target twice focuses the tab it already has", async () => {
    mount();
    await click("open customers");
    await click("open C-1");
    await click("open customers");
    expect(titles()).toHaveLength(3);
    expect(screen.getByTestId("current")).toHaveTextContent("customer-master");
  });

  /* Crossing modules replaces the tab set — the shell's existing behaviour. */
  test("crossing to another module rebuilds the tabs around its dashboard", async () => {
    mount();
    await click("open customers");
    await click("go to HR");
    expect(titles()).toEqual(["HR Command Center [fixed]"]);
  });

  /* And the bug that behaviour has today: it throws unsaved work away without
     asking. Nothing in the shell guards it, because tab state was a useState
     array with no idea what dirty meant. */
  test("crossing modules with unsaved work asks first and changes nothing yet", async () => {
    mount();
    await click("open customers");
    await click("make dirty");
    await click("go to HR");
    /* The module's name, not its key. "Leave hr?" is what the shell asked
       before this, which reads as a bug rather than a question. */
    expect(screen.getByTestId("pending")).toHaveTextContent("Leave Finance & Accounting?");
    expect(titles()).toHaveLength(2);
    expect(screen.getByTestId("current")).toHaveTextContent("customer-master");
  });

  test("confirming goes through with it", async () => {
    mount();
    await click("open customers");
    await click("make dirty");
    await click("go to HR");
    await click("confirm");
    expect(titles()).toEqual(["HR Command Center [fixed]"]);
    expect(screen.getByTestId("pending")).toHaveTextContent("none");
  });

  test("cancelling leaves the work exactly where it was", async () => {
    mount();
    await click("open customers");
    await click("make dirty");
    await click("go to HR");
    await click("cancel");
    expect(titles()).toEqual(["Finance Command Center [fixed]", "Customer Master •"]);
    expect(screen.getByTestId("current")).toHaveTextContent("customer-master");
    expect(screen.getByTestId("pending")).toHaveTextContent("none");
  });

  test("closing a clean tab just closes it", async () => {
    mount();
    await click("open customers");
    await click("close last");
    expect(titles()).toHaveLength(1);
  });

  test("closing a dirty tab asks first", async () => {
    mount();
    await click("open customers");
    await click("make dirty");
    await click("close last");
    expect(titles()).toHaveLength(2);
    expect(screen.getByTestId("pending")).not.toHaveTextContent("none");
    await click("confirm");
    expect(titles()).toHaveLength(1);
  });

  /* SINGLE is the framework's "one document at a time", and it is what the
     openRecordsInTabs preference turns the workspace into when it is off.
     Without this the preference governs nothing: the store dedupes by key
     either way, so every record already had its own tab. */
  test("in SINGLE mode opening a record replaces the last one", async () => {
    mount(["SINGLE"]);
    await click("open customers");
    expect(titles()).toEqual(["Finance Command Center [fixed]", "Customer Master"]);
    await click("open C-1");
    expect(titles()).toEqual(["Finance Command Center [fixed]", "Customer Master • C-1"]);
  });

  test("SINGLE still asks before dropping unsaved work", async () => {
    mount(["SINGLE"]);
    await click("open customers");
    await click("make dirty");
    await click("open C-1");
    expect(screen.getByTestId("pending")).not.toHaveTextContent("none");
    expect(titles()).toHaveLength(3);
    await click("confirm");
    expect(titles()).toEqual(["Finance Command Center [fixed]", "Customer Master • C-1"]);
  });

  /* hrefFor exists so every navigating row can be an anchor on web. On desktop
     there is no URL to copy, and returning a real-looking one would put a dead
     link in the status bar. */
  test("hrefFor is inert on desktop", () => {
    mount();
    expect(screen.getByTestId("current")).toBeVisible();
  });
});
