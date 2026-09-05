import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { WorkspaceDocument } from "@pepbits/workspace-core";
import { WorkspaceCanvas } from "./workspace-canvas.tsx";

const doc = (id: string, title: string, over: Partial<WorkspaceDocument> = {}): WorkspaceDocument => ({
  documentId: id, documentKey: `T1:PAGE:${id}`, module: "finance", documentType: "PAGE", entityId: id,
  title, presentation: "TAB", state: "BACKGROUND", dirty: false, closable: true,
  security: { tenantId: "T1", userId: "u", documentId: id, documentKey: `T1:PAGE:${id}` },
  openedAt: "", lastActivatedAt: "", ...over,
});

const a = doc("w1", "Invoice INV-2201", { state: "ACTIVE" });
const b = doc("w2", "Purchase Order PO-88");
const cold = doc("w3", "Budget 2026", { state: "SUSPENDED" });
const noop = () => undefined;

const render_ = (over: Partial<Parameters<typeof WorkspaceCanvas>[0]> = {}) =>
  render(<WorkspaceCanvas
    documents={[a, b, cold]} splitIds={[]} activeDocumentId="w1"
    onFocusPane={noop} onClosePane={noop} onSwap={noop} onExitSplit={noop}
    renderDocument={(d) => <p>body of {d.title}</p>}
    {...over}
  />);

/* getByText finds display:none content, which is exactly what has to be
   distinguished here — mounted and hidden is the whole point. */
const mounted = (title: string) => screen.queryByText(`body of ${title}`);

describe("WorkspaceCanvas", () => {
  test("shows the active document", () => {
    render_();
    expect(mounted("Invoice INV-2201")).toBeVisible();
  });

  /* The reason this component exists. A warm document stays mounted so its
     scroll position, its filters and its half-typed form survive a trip to
     another tab; hidden, so it is not on screen and not in the tab order. */
  test("keeps a warm document mounted but out of sight", () => {
    render_();
    const warm = mounted("Purchase Order PO-88");
    expect(warm).not.toBeNull();
    expect(warm).not.toBeVisible();
  });

  test("does not mount a suspended one at all", () => {
    render_();
    expect(mounted("Budget 2026")).toBeNull();
  });

  /* What all of it is for. Switching tabs must not throw the screen away and
     build a new one, or every filter and every unsaved field resets. */
  test("switching away and back keeps what was typed", async () => {
    function Editor({ id }: { id: string }) {
      const [value, setValue] = React.useState("");
      return <input aria-label={`draft ${id}`} value={value} onChange={(e) => setValue(e.target.value)} />;
    }
    const { rerender } = render(<WorkspaceCanvas
      documents={[a, b]} splitIds={[]} activeDocumentId="w1"
      onFocusPane={noop} onClosePane={noop} onSwap={noop} onExitSplit={noop}
      renderDocument={(d) => <Editor id={d.documentId} />} />);

    await userEvent.type(screen.getByLabelText("draft w1"), "half a sentence");
    rerender(<WorkspaceCanvas
      documents={[a, b]} splitIds={[]} activeDocumentId="w2"
      onFocusPane={noop} onClosePane={noop} onSwap={noop} onExitSplit={noop}
      renderDocument={(d) => <Editor id={d.documentId} />} />);
    rerender(<WorkspaceCanvas
      documents={[a, b]} splitIds={[]} activeDocumentId="w1"
      onFocusPane={noop} onClosePane={noop} onSwap={noop} onExitSplit={noop}
      renderDocument={(d) => <Editor id={d.documentId} />} />);

    expect(screen.getByLabelText("draft w1")).toHaveValue("half a sentence");
  });

  test("a hidden document is not reachable by keyboard", () => {
    render_();
    const hidden = mounted("Purchase Order PO-88")?.closest("[inert]");
    expect(hidden).not.toBeNull();
  });
});

describe("WorkspaceCanvas — split", () => {
  const split = (over: Partial<Parameters<typeof WorkspaceCanvas>[0]> = {}) =>
    render_({ splitIds: ["w1", "w2"], activeDocumentId: "w2", ...over });

  test("draws both panes", () => {
    split();
    expect(mounted("Invoice INV-2201")).toBeVisible();
    expect(mounted("Purchase Order PO-88")).toBeVisible();
  });

  test("each pane is a named region and one is marked focused", () => {
    split();
    expect(screen.getByRole("region", { name: /Invoice INV-2201/ })).toBeVisible();
    const focused = screen.getAllByRole("region").filter((r) => r.getAttribute("aria-current") === "true");
    expect(focused).toHaveLength(1);
    expect(focused[0]).toHaveAccessibleName(/Purchase Order/);
  });

  /* `split` is a property of the arrangement, so every mounted document carries
     the role while a split is on — including the warm ones behind it. What
     keeps that honest is aria-hidden and inert, which take those elements out
     of the accessibility tree: three region ELEMENTS exist, two are announced.
     Both halves are asserted, because a raw DOM count of three looks like a bug
     and is not one. */
  test("a warm document behind the split is mounted but not announced", () => {
    render_({
      documents: [a, b, doc("w4", "Payroll Run")],
      splitIds: ["w1", "w2"],
      activeDocumentId: "w2",
    });
    expect(screen.getAllByRole("region")).toHaveLength(2);
    expect(screen.getAllByRole("region", { hidden: true })).toHaveLength(3);
    expect(mounted("Payroll Run")).not.toBeVisible();
  });

  test("an unsaved pane says so in its name", () => {
    render_({ splitIds: ["w1", "w2"], activeDocumentId: "w2", documents: [{ ...a, dirty: true }, b, cold] });
    expect(screen.getByRole("region", { name: /Invoice INV-2201/ })).toHaveAccessibleName(/unsaved/i);
  });

  test("clicking a pane focuses it", async () => {
    const onFocusPane = vi.fn();
    split({ onFocusPane });
    await userEvent.click(screen.getByText("body of Invoice INV-2201"));
    expect(onFocusPane).toHaveBeenCalledWith("w1");
  });

  test("each pane closes itself", async () => {
    const onClosePane = vi.fn();
    split({ onClosePane });
    await userEvent.click(screen.getByRole("button", { name: /Close Invoice INV-2201/ }));
    expect(onClosePane).toHaveBeenCalledWith("w1");
  });

  test("swap and full screen are offered once for the arrangement", async () => {
    const onSwap = vi.fn();
    const onExitSplit = vi.fn();
    split({ onSwap, onExitSplit });
    await userEvent.click(screen.getByRole("button", { name: /Swap/ }));
    expect(onSwap).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: /full screen/i }));
    expect(onExitSplit).toHaveBeenCalledOnce();
  });

  test("the divider is a separator that reports where it is", () => {
    split();
    const divider = screen.getByRole("separator");
    expect(divider).toHaveAttribute("aria-orientation", "vertical");
    expect(divider).toHaveAttribute("aria-valuenow", "50");
  });

  test("arrow keys move it and it stays inside its limits", async () => {
    split();
    const divider = screen.getByRole("separator");
    divider.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(divider).toHaveAttribute("aria-valuenow", "52");
    for (let i = 0; i < 40; i += 1) await userEvent.keyboard("{ArrowLeft}");
    expect(Number(divider.getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(20);
  });

  test("Home puts it back in the middle", async () => {
    split();
    const divider = screen.getByRole("separator");
    divider.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{Home}");
    expect(divider).toHaveAttribute("aria-valuenow", "50");
  });

  test("no divider and no pane chrome when not split", () => {
    render_();
    expect(screen.queryByRole("separator")).toBeNull();
    expect(screen.queryByRole("region")).toBeNull();
  });

  /* Entering a split must not rebuild the documents either — the whole point is
     that these two screens are the ones you were already looking at. */
  test("entering a split keeps what was typed", async () => {
    function Editor({ id }: { id: string }) {
      const [value, setValue] = React.useState("");
      return <input aria-label={`draft ${id}`} value={value} onChange={(e) => setValue(e.target.value)} />;
    }
    const props = { documents: [a, b], onFocusPane: noop, onClosePane: noop, onSwap: noop, onExitSplit: noop, renderDocument: (d: WorkspaceDocument) => <Editor id={d.documentId} /> };
    const { rerender } = render(<WorkspaceCanvas {...props} splitIds={[]} activeDocumentId="w1" />);
    await userEvent.type(screen.getByLabelText("draft w1"), "kept");
    rerender(<WorkspaceCanvas {...props} splitIds={["w1", "w2"]} activeDocumentId="w2" />);
    expect(screen.getByLabelText("draft w1")).toHaveValue("kept");
  });
});
