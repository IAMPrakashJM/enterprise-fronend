import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { DEFAULT_PREFERENCES, createFormatters } from "@pepbits/erp-config";
import type { DataColumn } from "@pepbits/erp-config";
import { exportRows } from "./export-rows.ts";

/**
 * Export is an egress path.
 *
 * Whatever is on the worklist leaves the browser as a file the user then opens
 * in a spreadsheet — which is a program that executes some of what it reads.
 * These cover the two halves: that the file says what the table said, and that
 * opening it cannot do anything.
 */

const columns: DataColumn[] = [
  { key: "id", label: "Id", type: "text" },
  { key: "name", label: "Name", type: "text" },
  { key: "outstanding", label: "Outstanding", type: "money" },
];

const format = createFormatters(DEFAULT_PREFERENCES);

/* jsdom has no object URLs and no downloads. The Blob handed to
   createObjectURL is the file, so capturing it is capturing the export. */
let written: Blob[] = [];

beforeEach(() => {
  written = [];
  vi.stubGlobal("URL", Object.assign(Object.create(URL), {
    createObjectURL: (blob: Blob) => { written.push(blob); return "blob:test"; },
    revokeObjectURL: () => {},
  }));
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* jsdom's Blob has neither text() nor arrayBuffer(); FileReader is what it does
   implement. */
const blobText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

const blobBytes = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

const csv = async (rows: Array<Record<string, string | number | boolean>>) => {
  exportRows(rows, columns, format, "csv", "Customer Master");
  const text = await blobText(written[0]);
  /* The BOM is asserted separately; strip it so every other assertion reads the
     content rather than tripping over an invisible first character. */
  return text.replace(/^﻿/, "");
};

describe("the file", () => {
  test("is named after the list and the day it was taken", () => {
    const name = exportRows([], columns, format, "csv", "Customer Master");
    expect(name).toMatch(/^customer-master-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  test("has no spaces, capitals or punctuation left in its name", () => {
    expect(exportRows([], columns, format, "csv", "A/R Ageing — 90+ days")).toMatch(/^a-r-ageing-90-days-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  /* Excel reads a BOM-less file as Latin-1, which turns an Arabic name and the
     dirham sign into mojibake. */
  /* Read as bytes, not as text: readAsText decodes UTF-8 and strips the mark,
     so the string form cannot tell a file that carries one from a file that
     does not. */
  test("carries a UTF-8 byte order mark", async () => {
    exportRows([], columns, format, "csv", "Customer Master");
    const bytes = new Uint8Array(await blobBytes(written[0]));
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
  });

  test("says it is CSV, in UTF-8", () => {
    exportRows([], columns, format, "csv", "Customer Master");
    expect(written[0].type).toContain("text/csv");
    expect(written[0].type).toContain("utf-8");
  });

  test("ends its lines the way Excel on Windows expects", async () => {
    const text = await csv([{ id: "C-1", name: "Acme", outstanding: 100 }]);
    expect(text).toContain("\r\n");
    expect(text.split("\r\n")).toHaveLength(2);
  });
});

describe("what it contains", () => {
  test("a header of the column labels, in order", async () => {
    expect((await csv([])).split("\r\n")[0]).toBe("Id,Name,Outstanding");
  });

  test("only the columns given, not every key on the row", async () => {
    const text = await csv([{ id: "C-1", name: "Acme", outstanding: 100, mrn: "AV204581" }]);
    expect(text).not.toContain("AV204581");
  });

  /* Exported FORMATTED — the same text the table shows. A column headed
     "Outstanding" whose cells read 184200 is a support ticket about missing
     currency. */
  test("values as the table rendered them, not as the row held them", async () => {
    const text = await csv([{ id: "C-1", name: "Acme", outstanding: 184200 }]);
    expect(text).toContain(format.cell(columns[2], 184200));
    expect(text).not.toMatch(/,184200$/);
  });

  test("a row missing a column leaves the cell empty rather than shifting the rest", async () => {
    const text = await csv([{ id: "C-1", outstanding: 100 }]);
    expect(text.split("\r\n")[1].split(",")).toHaveLength(3);
  });
});

describe("quoting", () => {
  test("a value containing a comma is quoted", async () => {
    expect(await csv([{ id: "C-1", name: "Acme, Ltd", outstanding: 0 }])).toContain('"Acme, Ltd"');
  });

  test("a quote inside a value is doubled", async () => {
    expect(await csv([{ id: "C-1", name: 'Acme "the" Ltd', outstanding: 0 }])).toContain('"Acme ""the"" Ltd"');
  });

  test("a newline inside a value is quoted rather than breaking the row", async () => {
    const text = await csv([{ id: "C-1", name: "Acme\nLtd", outstanding: 0 }]);
    expect(text).toContain('"Acme\nLtd"');
    /* Two records, whatever the newline count. */
    expect(text.split("\r\n")).toHaveLength(2);
  });

  test("an ordinary value is not quoted for no reason", async () => {
    expect(await csv([{ id: "C-1", name: "Acme", outstanding: 0 }])).toContain(",Acme,");
  });
});

/**
 * A spreadsheet executes what it reads.
 *
 * A cell beginning `=`, `+`, `-` or `@` is a formula to Excel, LibreOffice and
 * Sheets alike — including `=cmd|'/c calc'!A0`, which is a shell command in a
 * file that looks like a customer list. The value gets there from any field a
 * person can type into, and nothing between the keyboard and here inspects it.
 */
describe("formula injection", () => {
  test.each([
    ["=1+1", "an equals sign"],
    ['=cmd|\' /C calc\'!A0', "a DDE payload"],
    ["@SUM(1:9)", "an at sign"],
    ["+HYPERLINK(\"http://x\")", "a leading plus"],
    ["-2+3+cmd|' /C calc'!A0", "a leading minus"],
  ])("neutralises %s", async (value) => {
    const text = await csv([{ id: "C-1", name: value, outstanding: 0 }]);
    const cell = text.split("\r\n")[1].split(",")[1] ?? "";
    expect(cell.replace(/^"/, "").startsWith("'")).toBe(true);
  });

  /* And does not corrupt the values that merely start the same way. A negative
     amount is a number, not a formula, and prefixing it would export a column
     of text nobody can total. */
  test("leaves a negative number alone", async () => {
    const negatives: DataColumn[] = [{ key: "delta", label: "Delta", type: "text" }];
    exportRows([{ delta: "-1500.25" }], negatives, format, "csv", "x");
    const text = (await blobText(written[0])).replace(/^\ufeff/, "");
    expect(text.split("\r\n")[1]).toBe("-1500.25");
  });

  test("leaves an international phone number alone", async () => {
    const phones: DataColumn[] = [{ key: "phone", label: "Phone", type: "text" }];
    exportRows([{ phone: "+971501234567" }], phones, format, "csv", "x");
    const text = (await blobText(written[0])).replace(/^\ufeff/, "");
    expect(text.split("\r\n")[1]).toBe("+971501234567");
  });
});

describe("the workbook", () => {
  test("is written as xlsx when asked for", () => {
    const name = exportRows([{ id: "C-1", name: "Acme", outstanding: 100 }], columns, format, "xlsx", "Customer Master");
    expect(name).toMatch(/\.xlsx$/);
    expect(written[0].type).toContain("spreadsheetml");
  });

  /* Excel caps a sheet name at 31 characters and refuses to open a file that
     breaks the rule. */
  test("truncates a long list name to a sheet name Excel will accept", () => {
    expect(() => exportRows([], columns, format, "xlsx", "A very long worklist name that Excel will not accept as a sheet")).not.toThrow();
    expect(written).toHaveLength(1);
  });
});
