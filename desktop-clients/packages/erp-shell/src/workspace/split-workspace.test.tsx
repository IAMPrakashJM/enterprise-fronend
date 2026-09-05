import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { WorkspaceDocument } from "@pepbits/workspace-core";
import { SplitWorkspace } from "./split-workspace.tsx";

const doc = (id: string, title: string): WorkspaceDocument => ({
  documentId: id, documentKey: `T1:PAGE:${id}`, module: "finance", documentType: "PAGE", entityId: id,
  title, presentation: "SPLIT", state: "ACTIVE", dirty: false, closable: true,
  security: { tenantId: "T1", userId: "u", documentId: id, documentKey: `T1:PAGE:${id}` },
  openedAt: "", lastActivatedAt: "",
});

const left = doc("w1", "Invoice INV-2201");
const right = doc("w2", "Purchase Order PO-88");
const noop = () => undefined;

const render_ = (over: Partial<Parameters<typeof SplitWorkspace>[0]> = {}) =>
  render(<SplitWorkspace
    panes={[left, right]} activeDocumentId="w2"
    onFocusPane={noop} onClosePane={noop} onSwap={noop} onExit={noop}
    renderDocument={(d) => <p>body of {d.title}</p>}
    {...over}
  />);

describe("SplitWorkspace", () => {
  test("draws both documents side by side", () => {
    render_();
    expect(screen.getByText("body of Invoice INV-2201")).toBeVisible();
    expect(screen.getByText("body of Purchase Order PO-88")).toBeVisible();
  });

  /* Two regions that both announce as "region" are two regions a screen-reader
     user cannot tell apart, in a layout whose entire point is comparing them. */
  test("each pane is a named region", () => {
    render_();
    expect(screen.getByRole("region", { name: /Invoice INV-2201/ })).toBeVisible();
    expect(screen.getByRole("region", { name: /Purchase Order PO-88/ })).toBeVisible();
  });

  /* Which pane an action applies to is the thing you must never have to guess. */
  test("exactly one pane is marked as the focused one", () => {
    render_();
    const focused = screen.getAllByRole("region").filter((r) => r.getAttribute("aria-current") === "true");
    expect(focused).toHaveLength(1);
    expect(focused[0]).toHaveAccessibleName(/Purchase Order/);
  });

  test("clicking into a pane focuses it", async () => {
    const onFocusPane = vi.fn();
    render_({ onFocusPane });
    await userEvent.click(screen.getByText("body of Invoice INV-2201"));
    expect(onFocusPane).toHaveBeenCalledWith("w1");
  });

  test("each pane closes itself, not the other", async () => {
    const onClosePane = vi.fn();
    render_({ onClosePane });
    await userEvent.click(screen.getByRole("button", { name: /Close Invoice INV-2201/ }));
    expect(onClosePane).toHaveBeenCalledWith("w1");
  });

  test("swap and full screen are offered once, not per pane", async () => {
    const onSwap = vi.fn();
    const onExit = vi.fn();
    render_({ onSwap, onExit });
    await userEvent.click(screen.getByRole("button", { name: /Swap/ }));
    expect(onSwap).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: /full screen|Exit split/i }));
    expect(onExit).toHaveBeenCalledOnce();
  });

  test("an unsaved pane says so", () => {
    render_({ panes: [{ ...left, dirty: true }, right] });
    expect(screen.getByRole("region", { name: /Invoice INV-2201/ })).toHaveAccessibleName(/unsaved/i);
  });

  /* A divider that only responds to a drag is a divider keyboard users cannot
     move, in the one layout where the split point matters. */
  test("the divider is a separator that reports where it is", () => {
    render_();
    const divider = screen.getByRole("separator");
    expect(divider).toHaveAttribute("aria-orientation", "vertical");
    expect(divider).toHaveAttribute("aria-valuenow", "50");
  });

  test("arrow keys move it and it stays inside its limits", async () => {
    render_();
    const divider = screen.getByRole("separator");
    divider.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(divider).toHaveAttribute("aria-valuenow", "52");
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(divider).toHaveAttribute("aria-valuenow", "48");
    for (let i = 0; i < 40; i += 1) await userEvent.keyboard("{ArrowLeft}");
    expect(Number(divider.getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(20);
  });

  test("Home puts it back in the middle", async () => {
    render_();
    const divider = screen.getByRole("separator");
    divider.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{Home}");
    expect(divider).toHaveAttribute("aria-valuenow", "50");
  });

  test("one pane is not a split", () => {
    const { container } = render_({ panes: [left] });
    expect(container).toBeEmptyDOMElement();
  });
});
