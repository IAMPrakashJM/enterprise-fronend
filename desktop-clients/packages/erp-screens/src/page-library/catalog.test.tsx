import React from "react";
import { afterEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import {
  defineProduct,
  DEFAULT_PREFERENCES,
  createFormatters,
  CLINICAL_TEMPLATE_PAGES,
} from "@pepbits/erp-config";
import { pageLibraryEntries } from "./catalog";
import { PAGE_LIBRARY_RESOURCES } from "./resources";
import { PageLibraryCatalog } from "./index";
vi.mock("./billing-patient-launcher", () => ({ BillingPatientLauncher: () => null }));
const fresh = () =>
  defineProduct({
    id: "test",
    name: "Test",
    tagline: "Test catalog",
    defaultModule: "library",
    enabledModules: ["library"],
  });
let product = fresh();
const open = vi.fn();
vi.mock("@pepbits/erp-shell", () => ({
  DocumentationArticle: ({pageId}: {pageId: string}) => <div data-documentation-page={pageId}>API guide</div>,
  useProduct: () => product,
  useERP: () => ({ format: createFormatters(DEFAULT_PREFERENCES) }),
}));
vi.mock("@pepbits/platform-ports", () => ({
  useNavigation: () => ({ openInNewContext: open }),
}));
afterEach(() => {
  cleanup();
  product = fresh();
  open.mockReset();
});
test("catalog uses accessible navigation, excludes itself and ignores unrelated pages", () => {
  expect(pageLibraryEntries(product).map((p) => p.id)).toEqual(
    CLINICAL_TEMPLATE_PAGES.map((p) => p.id),
  );
  delete product.pages["billing-clinic"];
  expect(
    pageLibraryEntries(product).some((p) => p.id === "billing-clinic"),
  ).toBe(false);
  product.modules.library = { ...product.modules.library!, navigation: [] };
  expect(pageLibraryEntries(product)).toEqual([]);
});
test("all current pages retain public integration examples and dedicated guide content", () => {
  for (const page of CLINICAL_TEMPLATE_PAGES) {
    const resource = PAGE_LIBRARY_RESOURCES[page.id];
    expect(resource.source).toContain("from '@pepbits/erp-screens'");
    expect(resource.source).toContain("scopeKey");

  }
});
test("search, resources and page opening use current access; revoked resource closes", () => {
  const ui = render(<PageLibraryCatalog />);
  fireEvent.change(screen.getByRole("textbox", { name: "Search pages" }), {
    target: { value: "billing-clinic" },
  });
  const card = ui.container.querySelector(
    '[data-page-library-entry="billing-clinic"]',
  ) as HTMLElement;
  fireEvent.click(
    within(card).getByRole("button", { name: "TypeScript example" }),
  );
  expect(within(screen.getByRole("dialog")).getByRole("textbox")).toHaveValue(
    PAGE_LIBRARY_RESOURCES["billing-clinic"].source,
  );
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("tab", {
      name: "User and integration guide",
    }),
  );
  expect(within(screen.getByRole("dialog")).queryByRole("textbox")).toBeNull();
  expect(screen.getByText("API guide")).toBeTruthy();
  delete product.pages["billing-clinic"];
  ui.rerender(<PageLibraryCatalog />);
  expect(screen.queryByRole("dialog")).toBeNull();
  product = fresh();
  ui.rerender(<PageLibraryCatalog />);
  fireEvent.click(screen.getByRole("button", { name: "Open page" }));
  expect(open).toHaveBeenCalledWith({ pageId: "billing-clinic" });
});

test("a page without bundled code still opens its API guide", () => {
  const saved = PAGE_LIBRARY_RESOURCES["billing-clinic"];
  delete PAGE_LIBRARY_RESOURCES["billing-clinic"];
  try {
    const ui = render(<PageLibraryCatalog />);
    const card = ui.container.querySelector('[data-page-library-entry="billing-clinic"]') as HTMLElement;
    fireEvent.click(within(card).getByRole("button", { name: "User and integration guide", exact: true }));
    expect(screen.getByText("API guide")).toBeTruthy();
  } finally { PAGE_LIBRARY_RESOURCES["billing-clinic"] = saved; }
});
