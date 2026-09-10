import type {
  MenuItem,
  PageDefinition,
  ProductDefinition,
} from "@pepbits/erp-config";

/** The authenticated product's navigation owns membership, order and access. */
export function pageLibraryEntries(
  product: ProductDefinition,
): PageDefinition[] {
  const section = product.modules.library?.navigation.find(
    (section) =>
      (section.labelKey ?? section.label) === "template.clinical.library" ||
      section.id === "section.library.clinical-templates" ||
      section.id === "lib-clinical-templates",
  );
  const result: PageDefinition[] = [],
    seen = new Set<string>();
  const visit = (items: MenuItem[]) =>
    items.forEach((item) => {
      if (
        item.pageId &&
        item.pageId !== "list-of-pages" &&
        !seen.has(item.pageId) &&
        product.pages[item.pageId]
      ) {
        seen.add(item.pageId);
        result.push(product.pages[item.pageId]);
      }
      if (item.children) visit(item.children);
    });
  visit(section?.items ?? []);
  return result;
}
