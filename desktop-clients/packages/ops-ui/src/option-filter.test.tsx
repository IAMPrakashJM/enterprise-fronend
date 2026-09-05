import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Highlight, filterOptions, nextEnabledIndex } from "./option-filter";

const modules = [
  { value: "fin", label: "FIN", description: "Finance" },
  { value: "hr", label: "HR", description: "People and payroll" },
  { value: "inv", label: "INV", description: "Inventory" },
];

describe("filterOptions", () => {
  test("a blank query keeps every option", () => {
    expect(filterOptions(modules, "")).toHaveLength(3);
    expect(filterOptions(modules, "   ")).toHaveLength(3);
  });

  test("matches the label whatever the case", () => {
    expect(filterOptions(modules, "fin").map((o) => o.value)).toEqual(["fin"]);
    expect(filterOptions(modules, "FIN").map((o) => o.value)).toEqual(["fin"]);
  });

  /* Modules are stored by short code. Nobody types "INV" looking for stock --
     they type "inventory", which only ever appears in the description. */
  test("matches the description, not just the label", () => {
    expect(filterOptions(modules, "inventory").map((o) => o.value)).toEqual(["inv"]);
    expect(filterOptions(modules, "payroll").map((o) => o.value)).toEqual(["hr"]);
  });

  /* The regression this function exists for. Searching a concatenated
     "FIN Finance" lets a query straddle the join, so the row survives with
     nothing highlightable in it and the filter looks broken. */
  test("a query straddling label and description matches nothing", () => {
    expect(filterOptions(modules, "fin fi")).toHaveLength(0);
  });
});

describe("nextEnabledIndex", () => {
  const plain = [{ value: "a", label: "A" }, { value: "b", label: "B" }, { value: "c", label: "C" }];

  test("steps forward and wraps at the end", () => {
    expect(nextEnabledIndex(plain, 0, 1)).toBe(1);
    expect(nextEnabledIndex(plain, 2, 1)).toBe(0);
  });

  /* Arrow-up from the top is the wrap that gets the arithmetic wrong: the
     intermediate index is negative, and a negative index reads as undefined. */
  test("steps back and wraps at the start", () => {
    expect(nextEnabledIndex(plain, 2, -1)).toBe(1);
    expect(nextEnabledIndex(plain, 0, -1)).toBe(2);
    expect(nextEnabledIndex(plain, -1, -1)).toBe(2);
  });

  test("skips over disabled options", () => {
    const some = [{ value: "a", label: "A" }, { value: "b", label: "B", disabled: true }, { value: "c", label: "C" }];
    expect(nextEnabledIndex(some, 0, 1)).toBe(2);
    expect(nextEnabledIndex(some, 2, -1)).toBe(0);
  });

  test("reports -1 when there is nothing to land on", () => {
    expect(nextEnabledIndex([{ value: "a", label: "A", disabled: true }], -1, 1)).toBe(-1);
    expect(nextEnabledIndex([], -1, 1)).toBe(-1);
  });
});

describe("Highlight", () => {
  test("marks the part that matched", () => {
    render(<Highlight text="Inventory" query="vent" />);
    expect(screen.getByText("vent").tagName).toBe("MARK");
  });

  /* The whole string must still read correctly. Splitting it into three nodes
     is invisible to a sighted user and invisible to getByText's default
     matcher too -- hence the container check rather than a text query. */
  test("leaves the surrounding text intact", () => {
    const { container } = render(<Highlight text="Inventory" query="vent" />);
    expect(container.textContent).toBe("Inventory");
  });

  /* Rendering the QUERY rather than the matched slice is the easy mistake:
     it passes every test where the two happen to be identical, and turns
     "Finance" into "finance" the moment someone types in lower case. */
  test("keeps the original casing of the match", () => {
    const { container } = render(<Highlight text="Finance" query="fin" />);
    expect(screen.getByText("Fin").tagName).toBe("MARK");
    expect(container.textContent).toBe("Finance");
  });

  test("renders plain text when nothing matches", () => {
    const { container } = render(<Highlight text="Finance" query="zz" />);
    expect(container.querySelector("mark")).toBeNull();
    expect(container.textContent).toBe("Finance");
  });

  test("an empty query marks nothing", () => {
    const { container } = render(<Highlight text="Finance" query="" />);
    expect(container.querySelector("mark")).toBeNull();
  });
});
