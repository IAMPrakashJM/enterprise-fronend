import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { FilterDefinition } from "@pepbits/erp-config";
import { FilterBar } from "./filter-bar.tsx";

const definitions: FilterDefinition[] = [
  { key: "status", label: "Status", type: "select", options: ["All", "Waiting"], classification: "operational" },
  { key: "branch", label: "Branch", type: "select", options: ["All", "AD01"], classification: "operational" },
  { key: "patientName", label: "Patient name", type: "text", classification: "phi" },
];

const noop = () => undefined;
const render_ = (over: Partial<Parameters<typeof FilterBar>[0]> = {}) =>
  render(<FilterBar definitions={definitions} values={{}} sensitiveKeys={[]} onChange={noop} onReset={noop} {...over} />);

describe("FilterBar", () => {
  test("draws a control per filter, labelled", () => {
    render_();
    expect(screen.getByLabelText("Status")).toBeVisible();
    expect(screen.getByLabelText("Patient name")).toBeVisible();
  });

  test("changing one reports the key and the value", async () => {
    const onChange = vi.fn();
    render_({ onChange });
    await userEvent.type(screen.getByLabelText("Patient name"), "M");
    expect(onChange).toHaveBeenCalledWith("patientName", "M");
  });

  /* A sensitive field looks different, and says why. Without it a user cannot
     tell which of these will survive being shared, and finds out by sharing
     one that does not. */
  test("a sensitive filter is marked as staying out of the link", () => {
    render_();
    expect(screen.getByLabelText("Patient name")).toHaveAccessibleDescription(/not.*(link|url|shared)/i);
    expect(screen.getByLabelText("Status")).not.toHaveAccessibleDescription(/not.*(link|url)/i);
  });

  describe("sharing", () => {
    test("with only operational filters, copying the address is enough", async () => {
      const onCopyLink = vi.fn();
      render_({ values: { status: "Waiting" }, onCopyLink });
      await userEvent.click(screen.getByRole("button", { name: /copy link/i }));
      expect(onCopyLink).toHaveBeenCalledOnce();
      expect(screen.queryByRole("button", { name: /saved view/i })).toBeNull();
    });

    /* The branch in the diagram. Sensitive filters cannot travel in a URL, so
       the only honest share is a server-side view behind an opaque id — and
       offering "copy link" there would hand someone a link that silently drops
       half the filters. */
    test("with a sensitive filter, a saved view replaces the link", async () => {
      const onSaveView = vi.fn();
      render_({ values: { status: "Waiting", patientName: "Maya Thomas" }, sensitiveKeys: ["patientName"], onSaveView });
      expect(screen.queryByRole("button", { name: /copy link/i })).toBeNull();
      await userEvent.click(screen.getByRole("button", { name: /saved view/i }));
      expect(onSaveView).toHaveBeenCalledOnce();
    });

    test("and it says why, rather than just changing the button", () => {
      render_({ values: { patientName: "Maya Thomas" }, sensitiveKeys: ["patientName"], onSaveView: noop });
      expect(screen.getByText(/cannot be put in a link|not.*in a link/i)).toBeVisible();
    });

    test("nothing filtered, nothing to share", () => {
      render_({ onCopyLink: noop, onSaveView: noop });
      expect(screen.queryByRole("button", { name: /copy link|saved view/i })).toBeNull();
    });
  });

  test("reset clears everything", async () => {
    const onReset = vi.fn();
    render_({ values: { status: "Waiting" }, onReset });
    await userEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
