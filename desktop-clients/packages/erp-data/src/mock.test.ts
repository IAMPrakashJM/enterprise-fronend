import { describe, expect, test } from "vitest";
import { PAGE_REGISTRY, classificationFor } from "@pepbits/erp-config";
import { getWorklistConfig } from "./mock.ts";

/**
 * The row generator.
 *
 * The last piece of real logic here, and the one with a demonstrated failure:
 * it keys off TITLE and ENTITY as well as the page id, so the search API — which
 * called it with the id alone — built a different dataset from the one the table
 * was showing. 88 generic rows against 96 real ones, and a search that returned
 * nothing for a customer visibly on screen.
 */

const config = (pageId: string, title = pageId, entity = "record") => getWorklistConfig(pageId, title, entity);

describe("what identifies a worklist", () => {
  /* The bug, stated as a rule. Two of the three arguments used to be treated as
     decoration by every caller that was not the screen. */
  test("the entity chooses the dataset, not the page id", () => {
    const asRecord = config("customer-master", "Customer Master", "record");
    const asCustomer = config("customer-master", "Customer Master", "customer");
    expect(asCustomer.rows.length).not.toBe(asRecord.rows.length);
    expect(asCustomer.columns.map((column) => column.key)).not.toEqual(asRecord.columns.map((column) => column.key));
  });

  test("the same three arguments give the same worklist, every time", () => {
    const first = config("customer-master", "Customer Master", "customer");
    const second = config("customer-master", "Customer Master", "customer");
    expect(second.rows).toEqual(first.rows);
    expect(second.columns).toEqual(first.columns);
  });

  test("the title reaches the description a user reads", () => {
    expect(config("customer-master", "Customer Master", "customer").description).toContain("customer master");
  });

  test("and the id and entity are carried back, so a caller can echo them", () => {
    const worklist = config("customer-master", "Customer Master", "customer");
    expect(worklist.id).toBe("customer-master");
    expect(worklist.entity).toBe("customer");
    expect(worklist.title).toBe("Customer Master");
  });

  /* Some entities are chosen by the page id rather than the entity name — the
     order branch matches on either. Pinned because the search API passes both
     and a change to one of the two conditions would look harmless. */
  test("a page id can select a dataset the entity name did not", () => {
    const byPage = config("sales-order-worklist", "Sales Orders", "record");
    expect(byPage.entity).toBe("order");
    expect(byPage.displayKey).toBe("customer");
  });
});

describe("every worklist it can build", () => {
  const worklists = Object.values(PAGE_REGISTRY)
    .filter((page) => page.kind === "worklist")
    .map((page) => ({ page, config: getWorklistConfig(page.id, page.title, page.entity) }));

  test("there are some", () => {
    expect(worklists.length).toBeGreaterThan(20);
  });

  test.each(worklists.map(({ page }) => page.id))("%s has rows, columns and filters", (pageId) => {
    const { config: worklist } = worklists.find((item) => item.page.id === pageId)!;
    expect(worklist.rows.length).toBeGreaterThan(0);
    expect(worklist.columns.length).toBeGreaterThan(0);
    expect(worklist.basicFilters.length).toBeGreaterThan(0);
  });

  test("every column has a key and a label", () => {
    for (const { page, config: worklist } of worklists) {
      for (const column of worklist.columns) {
        expect(column.key, page.id).toBeTruthy();
        expect(column.label, `${page.id}.${column.key}`).toBeTruthy();
      }
    }
  });

  test("no worklist declares the same column twice", () => {
    for (const { page, config: worklist } of worklists) {
      const keys = worklist.columns.map((column) => column.key);
      expect(new Set(keys).size, page.id).toBe(keys.length);
    }
  });

  /* The table renders `row[column.key]`, so a column the rows do not carry is a
     column of dashes, and a screen that looks broken rather than empty. */
  test("every column is a key the rows actually have", () => {
    for (const { page, config: worklist } of worklists) {
      const present = new Set(Object.keys(worklist.rows[0] ?? {}));
      for (const column of worklist.columns) {
        expect(present.has(column.key), `${page.id}.${column.key}`).toBe(true);
      }
    }
  });

  test("the primary key is one of the columns, and unique across the rows", () => {
    for (const { page, config: worklist } of worklists) {
      expect(worklist.rows.every((row) => row[worklist.primaryKey] !== undefined), page.id).toBe(true);
      const ids = worklist.rows.map((row) => row[worklist.primaryKey]);
      expect(new Set(ids).size, page.id).toBe(ids.length);
    }
  });

  test("the display key is a column too", () => {
    for (const { page, config: worklist } of worklists) {
      expect(worklist.columns.some((column) => column.key === worklist.displayKey), `${page.id} -> ${worklist.displayKey}`).toBe(true);
    }
  });

  /* Every column this generator can produce has to be classified, because a
     worklist EXPORTS its columns and an unclassified one is dropped from the
     file. verify:export-safety enforces the same rule over the whole registry;
     this catches it in the suite, where it is cheaper to notice. */
  test("every column it can produce is classified", () => {
    const unclassified = new Set<string>();
    for (const { config: worklist } of worklists) {
      for (const column of worklist.columns) {
        if (classificationFor(column.key) === "unclassified") unclassified.add(column.key);
      }
    }
    expect([...unclassified]).toEqual([]);
  });
});

describe("the filters it offers", () => {
  const worklist = config("customer-master", "Customer Master", "customer");

  test("include the free-text box every list has", () => {
    expect(worklist.basicFilters.map((filter) => filter.key)).toContain("query");
  });

  test("and every filter key is classified, because it may reach a URL", () => {
    for (const filter of [...worklist.basicFilters, ...worklist.advancedFilters]) {
      expect(classificationFor(filter.key), filter.key).not.toBe("unclassified");
    }
  });

  test("a select filter offers options and a text one does not", () => {
    const status = worklist.basicFilters.find((filter) => filter.key === "status");
    const query = worklist.basicFilters.find((filter) => filter.key === "query");
    expect(status?.options?.length).toBeGreaterThan(0);
    expect(query?.options).toBeUndefined();
  });
});

describe("the datasets", () => {
  test.each([
    ["drug", "formulary"],
    ["prescription", "prescriber"],
    ["consultation", "specialty"],
    ["patient", "dob"],
    ["customer", "creditLimit"],
    ["invoice", "total"],
  ])("the %s worklist carries its own columns", (entity, key) => {
    const worklist = config(`${entity}-worklist`, `${entity} worklist`, entity);
    expect(worklist.columns.map((column) => column.key)).toContain(key);
  });

  /* An entity nobody has written a branch for still produces a usable list
     rather than throwing: the registry gains pages faster than this file does. */
  test("an entity nobody has heard of still produces a worklist", () => {
    const worklist = config("something-new", "Something New", "widget");
    expect(worklist.rows.length).toBeGreaterThan(0);
    expect(worklist.columns.length).toBeGreaterThan(0);
    expect(worklist.rows[0][worklist.primaryKey]).toBeTruthy();
  });

  test("and its rows are built from the title it was given", () => {
    const first = config("something-new", "Something New", "widget");
    const second = config("something-new", "Another Name", "widget");
    expect(second.rows).not.toEqual(first.rows);
  });
});
