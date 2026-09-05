import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { WorkspaceDocument } from "@pepbits/workspace-core";
import { WorkspaceTabs } from "./workspace-tabs.tsx";

const doc = (over: Partial<WorkspaceDocument> & { documentId: string; title: string }): WorkspaceDocument => ({
  documentKey: `T1:PAGE:${over.documentId}`, module: "finance", documentType: "PAGE", entityId: over.documentId,
  presentation: "TAB", state: "BACKGROUND", dirty: false, closable: true,
  security: { tenantId: "T1", userId: "u", documentId: over.documentId, documentKey: `T1:PAGE:${over.documentId}` },
  openedAt: "", lastActivatedAt: "", ...over,
});

const documents = [
  doc({ documentId: "w1", title: "Finance Command Center", closable: false }),
  doc({ documentId: "w2", title: "Customer Master", state: "ACTIVE" }),
  doc({ documentId: "w3", title: "Journal Entry", dirty: true }),
];

const noop = () => undefined;
const render_ = (over: Partial<Parameters<typeof WorkspaceTabs>[0]> = {}) =>
  render(<WorkspaceTabs documents={documents} activeDocumentId="w2" onActivate={noop} onClose={noop} onCloseOthers={noop} onOpenCommand={noop} {...over} />);

describe("WorkspaceTabs", () => {
  test("shows a tab per open document", () => {
    render_();
    expect(screen.getByRole("tab", { name: /Finance Command Center/ })).toBeVisible();
    expect(screen.getByRole("tab", { name: /Customer Master/ })).toBeVisible();
    expect(screen.getByRole("tab", { name: /Journal Entry/ })).toBeVisible();
  });

  /* A coloured underline is what a sighted user reads. aria-selected is what
     everyone else gets, and without it the strip announces three identical tabs. */
  test("exactly one tab reports as selected", () => {
    render_();
    expect(screen.getByRole("tab", { name: /Customer Master/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("tab").filter((t) => t.getAttribute("aria-selected") === "true")).toHaveLength(1);
  });

  test("activating asks for that document", async () => {
    const onActivate = vi.fn();
    render_({ onActivate });
    await userEvent.click(screen.getByRole("tab", { name: /Journal Entry/ }));
    expect(onActivate).toHaveBeenCalledWith("w3");
  });

  /* Unsaved work has to be visible before the close button is pressed, not
     after — a dot on the tab is the only warning a user gets. */
  test("an unsaved document is marked, and says so in words", () => {
    render_();
    expect(screen.getByRole("tab", { name: /Journal Entry/ })).toHaveAccessibleName(/unsaved/i);
    expect(screen.getByRole("tab", { name: /Customer Master/ })).not.toHaveAccessibleName(/unsaved/i);
  });

  test("a fixed tab offers no close button", () => {
    render_();
    expect(screen.queryByRole("button", { name: /Close Finance Command Center/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Close Customer Master/ })).toBeVisible();
  });

  test("closing asks for that document and not the tab under it", async () => {
    const onClose = vi.fn();
    const onActivate = vi.fn();
    render_({ onClose, onActivate });
    await userEvent.click(screen.getByRole("button", { name: /Close Journal Entry/ }));
    expect(onClose).toHaveBeenCalledWith("w3");
    expect(onActivate).not.toHaveBeenCalled();
  });

  test("close others works on the active tab", async () => {
    const onCloseOthers = vi.fn();
    render_({ onCloseOthers });
    await userEvent.click(screen.getByRole("button", { name: "Tab options" }));
    await userEvent.click(screen.getByText("Close other tabs"));
    expect(onCloseOthers).toHaveBeenCalledWith("w2");
  });

  /* The split lives in the tab strip's menu because that is where "what do I
     do with this tab" already is. Offering it on every tab would mean choosing
     which tab you meant before choosing the action. */
  test("offers to split the current tab", async () => {
    const onSplit = vi.fn();
    render_({ onSplit });
    await userEvent.click(screen.getByRole("button", { name: "Tab options" }));
    await userEvent.click(screen.getByText(/Split/));
    expect(onSplit).toHaveBeenCalledOnce();
  });

  test("offers swap and full screen only while split", async () => {
    render_({ onSwap: noop, onExitSplit: noop, isSplit: false });
    await userEvent.click(screen.getByRole("button", { name: "Tab options" }));
    expect(screen.queryByText(/Swap/)).toBeNull();
  });

  test("and offers them when it is", async () => {
    const onSwap = vi.fn();
    render_({ onSwap, onExitSplit: noop, isSplit: true });
    await userEvent.click(screen.getByRole("button", { name: "Tab options" }));
    await userEvent.click(screen.getByText(/Swap/));
    expect(onSwap).toHaveBeenCalledOnce();
  });

  test("the plus opens the command palette", async () => {
    const onOpenCommand = vi.fn();
    render_({ onOpenCommand });
    await userEvent.click(screen.getByRole("button", { name: "Open page" }));
    expect(onOpenCommand).toHaveBeenCalledOnce();
  });

  test("it is a tablist", () => {
    render_();
    expect(screen.getByRole("tablist")).toBeVisible();
  });
});
