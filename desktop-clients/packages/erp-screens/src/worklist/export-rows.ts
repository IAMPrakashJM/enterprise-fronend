import * as XLSX from "xlsx";
import type { DataColumn, ExportFormat, Formatters } from "@pepbits/erp-config";

type Row = Record<string, string | number | boolean>;

/* Values are exported FORMATTED -- the same text the table shows -- rather than
   raw. A CSV that says "AED 184,200" where the screen said "AED 184,200" is what
   people expect; one that says 184200 next to a column header of "Credit limit"
   is a support ticket about missing currency. */
function toGrid(rows: Row[], columns: DataColumn[], format: Formatters): string[][] {
  const header = columns.map((column) => column.label);
  const body = rows.map((row) => columns.map((column) => format.cell(column, row[column.key])));
  return [header, ...body];
}

function csvOf(grid: string[][]): string {
  const cell = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  // \r\n so Excel on Windows opens it without a "line ending" prompt.
  return grid.map((line) => line.map(cell).join(",")).join("\r\n");
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // Revoked on a tick: revoking synchronously races the click in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Download the given rows in the user's chosen format. Returns the filename. */
export function exportRows(rows: Row[], columns: DataColumn[], format: Formatters, kind: ExportFormat, baseName: string): string {
  const grid = toGrid(rows, columns, format);
  const stamp = new Date().toISOString().slice(0, 10);
  const safe = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (kind === "xlsx") {
    const sheet = XLSX.utils.aoa_to_sheet(grid);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, baseName.slice(0, 31)); // Excel caps sheet names at 31
    const out = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    const name = `${safe}-${stamp}.xlsx`;
    save(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name);
    return name;
  }
  const name = `${safe}-${stamp}.csv`;
  // BOM so Excel reads UTF-8 (Arabic names, the dirham sign) instead of Latin-1.
  save(new Blob(["﻿" + csvOf(grid)], { type: "text/csv;charset=utf-8" }), name);
  return name;
}
