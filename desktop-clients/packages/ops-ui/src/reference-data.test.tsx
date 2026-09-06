import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { ReferenceDataWarning, ReferenceField, referenceStateOf } from "./reference-data";

const labels = { insuranceNetworks: "Insurance networks", branches: "Branches" };

describe("referenceStateOf", () => {
  /* The whole point in one function. An empty list means two opposite things,
     and only `failures` tells them apart. */
  test("empty and configured is not the same as empty and broken", () => {
    const failed = { references: { branches: [] }, failures: [{ key: "branches", code: "REFERENCE_LOAD_FAILED" }] };
    const configured = { references: { branches: [] }, failures: [] };
    expect(referenceStateOf(failed, "branches")).toBe("failed");
    expect(referenceStateOf(configured, "branches")).toBe("empty");
  });

  test("a list with values is ready", () => {
    expect(referenceStateOf({ references: { branches: [{ value: "hq", label: "HQ" }] }, failures: [] }, "branches")).toBe("ready");
  });

  /* A list that failed still arrives as [] so a client does not crash on .map —
     so a non-empty list that is ALSO named in failures should still be treated
     as failed. Trusting the array over the flag would show stale values as if
     they were current. */
  test("a failure wins over whatever values arrived", () => {
    const stale = { references: { branches: [{ value: "old", label: "Old" }] }, failures: [{ key: "branches", code: "X" }] };
    expect(referenceStateOf(stale, "branches")).toBe("failed");
  });

  test("a key nobody asked for is unknown, not ready", () => {
    expect(referenceStateOf({ references: {}, failures: [] }, "branches")).toBe("unknown");
  });
});

describe("ReferenceDataWarning", () => {
  const render_ = (over: Partial<Parameters<typeof ReferenceDataWarning>[0]> = {}) =>
    render(<ReferenceDataWarning failures={[{ key: "insuranceNetworks", code: "REFERENCE_LOAD_FAILED" }]} labels={labels} {...over} />);

  test("nothing failed, nothing drawn", () => {
    const { container } = render(<ReferenceDataWarning failures={[]} labels={labels} />);
    expect(container).toBeEmptyDOMElement();
  });

  /* It has to name the list. "Some reference data is unavailable" leaves the
     user to work out which dropdown is lying to them. */
  test("names the list that failed", () => {
    render_();
    expect(screen.getByText(/Insurance networks/)).toBeVisible();
  });

  test("and says the others are fine, so the form is still usable", () => {
    render_();
    expect(screen.getByText(/other/i)).toBeVisible();
  });

  test("names each of several", () => {
    render_({ failures: [{ key: "insuranceNetworks", code: "X" }, { key: "branches", code: "X" }] });
    expect(screen.getByText(/Insurance networks/)).toBeVisible();
    expect(screen.getByText(/Branches/)).toBeVisible();
  });

  /* A key with no label still has to be reported. Falling back to the raw key
     is uglier than a label and far better than silence. */
  test("reports a key it has no label for", () => {
    render_({ failures: [{ key: "somethingNew", code: "X" }], labels: {} });
    expect(screen.getByText(/somethingNew/)).toBeVisible();
  });

  test("offers a retry when there is one", async () => {
    const onRetry = vi.fn();
    render_({ onRetry });
    await userEvent.click(screen.getByRole("button", { name: /try again|retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  /* A warning, not an error: the page works, some of it is degraded. Announcing
     it as an alert would interrupt for something the user can carry on past. */
  test("announces as a status rather than interrupting", () => {
    render_();
    expect(screen.getByRole("status")).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  /* §6 again. A reference code is for support, not for the user to decode. */
  test("does not show the machine code", () => {
    render_();
    expect(document.body.textContent).not.toContain("REFERENCE_LOAD_FAILED");
  });
});

/* The banner says WHICH list is broken; the field has to say it too. A user
   looking at an empty Insurance Network dropdown is looking at the field, not
   at a banner three sections up — and the banner may have scrolled away. */
describe("ReferenceField", () => {
  const options = [{ value: "daman", label: "Daman" }];

  test("a ready list renders its options", () => {
    render(<ReferenceField label="Insurance network" state="ready" options={options} value="" onChange={() => undefined} />);
    expect(screen.getByRole("option", { name: "Daman" })).toBeInTheDocument();
  });

  /* Genuinely empty: nothing is configured. That is a setup task, and saying
     "unavailable" would send someone chasing an incident that is not happening. */
  test("an empty list says nothing is configured, and stays usable", () => {
    render(<ReferenceField label="Insurance network" state="empty" options={[]} value="" onChange={() => undefined} />);
    expect(screen.getByLabelText("Insurance network")).toBeEnabled();
    expect(screen.getByText(/none configured/i)).toBeVisible();
  });

  /* Broken: the list exists somewhere and could not be fetched. Leaving the
     control enabled invites someone to conclude the value is genuinely absent
     and save the record without it. */
  test("a failed list says so, and does not pretend to be choosable", () => {
    render(<ReferenceField label="Insurance network" state="failed" options={[]} value="" onChange={() => undefined} />);
    const field = screen.getByLabelText("Insurance network");
    expect(field).toBeDisabled();
    expect(field).toHaveAccessibleDescription(/could not be loaded|unavailable/i);
  });

  test("the two empties are described differently", () => {
    const { unmount } = render(<ReferenceField label="X" state="empty" options={[]} value="" onChange={() => undefined} />);
    const configured = document.body.textContent ?? "";
    unmount();
    render(<ReferenceField label="X" state="failed" options={[]} value="" onChange={() => undefined} />);
    expect(document.body.textContent).not.toBe(configured);
  });

  test("choosing reports the value", async () => {
    const onChange = vi.fn();
    render(<ReferenceField label="Insurance network" state="ready" options={options} value="" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText("Insurance network"), "daman");
    expect(onChange).toHaveBeenCalledWith("daman");
  });
});
