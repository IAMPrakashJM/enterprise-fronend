import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Input, Select, Textarea, Toggle } from "./form-controls";

describe("Input", () => {
  /* FieldShell wraps the control in a <label>, so the label text IS the
     accessible name. If that wrapping ever changes to a sibling <span>, every
     field silently becomes unlabelled — visually identical, and unusable with a
     screen reader. getByLabelText is what notices. */
  test("its label names the field", () => {
    render(<Input label="Customer name" />);
    expect(screen.getByLabelText(/Customer name/)).toBeInTheDocument();
  });

  test("types through to the handler", async () => {
    const onChange = vi.fn();
    render(<Input label="Reference" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText(/Reference/), "abc");
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  /* An error must REPLACE the hint. Showing both leaves the reader deciding
     which one is current, and the hint usually reads like reassurance. */
  test("an error replaces the hint rather than joining it", () => {
    const { rerender } = render(<Input label="Email" hint="We never share it" />);
    expect(screen.getByText("We never share it")).toBeVisible();

    rerender(<Input label="Email" hint="We never share it" error="That is not an email address" />);
    expect(screen.getByText("That is not an email address")).toBeVisible();
    expect(screen.queryByText("We never share it")).toBeNull();
  });
});

describe("Select", () => {
  test("offers every option, and the placeholder", () => {
    render(<Select label="Status" options={[{ label: "Active", value: "a" }, { label: "On hold", value: "h" }]} onChange={() => undefined} value="" />);
    expect(screen.getByRole("option", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "On hold" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Select…" })).toBeInTheDocument();
  });

  test("reports the chosen value", async () => {
    const onChange = vi.fn();
    render(<Select label="Status" options={[{ label: "Active", value: "a" }]} onChange={onChange} value="" />);
    await userEvent.selectOptions(screen.getByLabelText(/Status/), "a");
    expect(onChange).toHaveBeenCalledOnce();
  });
});

describe("Textarea", () => {
  test("shows what it was given", () => {
    render(<Textarea label="Notes" value="Seen in clinic" onChange={() => undefined} />);
    expect(screen.getByLabelText(/Notes/)).toHaveValue("Seen in clinic");
  });
});

describe("Toggle", () => {
  /* role="switch" with aria-checked is what makes this announce as on or off.
     Rebuilt as a styled div it would look identical and tell a screen-reader
     user nothing. */
  test("announces its state", () => {
    render(<Toggle label="Pinned" checked onChange={() => undefined} />);
    expect(screen.getByRole("switch", { name: /Pinned/ })).toBeChecked();
  });

  test("asks for the opposite of what it is", async () => {
    const onChange = vi.fn();
    render(<Toggle label="Pinned" checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test("a disabled toggle does not change", async () => {
    const onChange = vi.fn();
    render(<Toggle label="Pinned" checked={false} disabled onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
