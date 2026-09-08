import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { DEFAULT_PREFERENCES, LEDGER_PRODUCT } from "@pepbits/erp-config";
import { ProductProvider, useProduct } from "./product-context";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./layers/command-palette";

const open = vi.fn();
vi.mock("@pepbits/platform-ports", () => ({ useNavigation: () => ({ current: { pageId: "finance-dashboard" }, open, hrefFor: () => "#" }) }));
vi.mock("./erp-context", () => ({ useERP: () => ({ module: LEDGER_PRODUCT.modules.finance, preferences: { ...DEFAULT_PREFERENCES, sidebarPinned: true }, updatePreference: vi.fn(), commandOpen: true, setCommandOpen: vi.fn() }) }));

describe("product composition", () => {
  test("unconfigured consumers retain Nexora", () => {
    function Probe() { return <p>{useProduct().name}</p>; }
    render(<Probe />);
    expect(screen.getByText("NEXORA")).toBeVisible();
  });
  test("a second product brands the existing sidebar", () => {
    render(<ProductProvider product={LEDGER_PRODUCT}><Sidebar /></ProductProvider>);
    expect(screen.getByText("LEDGER")).toBeVisible();
    expect(screen.getByText("Finance workspace")).toBeVisible();
    expect(screen.queryByText("NEXORA")).toBeNull();
  });
  test("command search cannot offer pages from disabled modules", () => {
    render(<ProductProvider product={LEDGER_PRODUCT}><CommandPalette /></ProductProvider>);
    fireEvent.change(screen.getByPlaceholderText("Search pages, modules and actions…"), { target: { value: "hr" } });
    expect(screen.queryByRole("button", { name: /HR Dashboard/i })).toBeNull();
    fireEvent.change(screen.getByPlaceholderText("Search pages, modules and actions…"), { target: { value: "Finance" } });
    expect(screen.getAllByRole("button").length).toBeGreaterThan(1);
  });
});
