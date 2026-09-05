"use client";

import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, MoreHorizontal, Pencil, SquareArrowOutUpRight } from "lucide-react";
import { cn, InlineEdit } from "@pepbits/ops-ui";
import { StatusBadge } from "@pepbits/ops-ui";
import { IconButton } from "@pepbits/ops-ui";
import { ActionMenu, MenuButton } from "@pepbits/ops-ui";
import type { DataColumn, Density, Formatters } from "@pepbits/erp-config";

/**
 * What a correction typed into a cell has to satisfy before it is written.
 *
 * Per type rather than per column, because the wrongness is in the type: a
 * money column takes a number and no currency symbol, and a percent cannot pass
 * a hundred. Anything a specific column needs beyond this belongs on the column.
 */
function validateCell(column: DataColumn, next: string): string | null {
  if (next.trim() === "") return `${column.label} cannot be empty.`;
  if (column.type === "money" || column.type === "number" || column.type === "percent") {
    const parsed = Number(next.replace(/[\s,]/g, ""));
    if (!Number.isFinite(parsed)) return `${column.label} must be a number.`;
    if (parsed < 0) return `${column.label} cannot be negative.`;
    if (column.type === "percent" && parsed > 100) return "A percentage cannot be above 100.";
  }
  return null;
}

/* The status/boolean branches come FIRST and never reach the formatter: they
   render a badge, not text, and are the reason this stays a component rather
   than becoming a call to format.cell() at the call site. */
function formatValue(column: DataColumn, value: unknown, format: Formatters, wrap: boolean) {
  if (column.type === "status") return <StatusBadge value={value} />;
  if (typeof value === "boolean") return <StatusBadge value={value} />;
  if (column.type === "money") return <span className="font-extrabold tabular-nums">{format.cell(column, value)}</span>;
  if (column.type === "percent") return <span className="font-extrabold tabular-nums">{format.cell(column, value)}</span>;
  if (column.type === "number") return <span className="font-bold tabular-nums">{format.cell(column, value)}</span>;
  const text = format.cell(column, value);
  if (wrap) return <span className="block max-w-[360px] whitespace-normal break-words">{text}</span>;
  return <span className="block max-w-[260px] truncate" title={text}>{text}</span>;
}

export function DataTable({ rows, columns, primaryKey, displayKey, selected, onToggle, onToggleAll, sort, onSort, onPreview, onView, onEdit, onCellCommit, density, format, stickyHeader = true, zebra = false, wrap = false }: {
  rows: Array<Record<string, string | number | boolean>>;
  columns: DataColumn[];
  primaryKey: string;
  displayKey: string;
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  sort: { key: string; direction: "asc" | "desc" } | null;
  onSort: (column: DataColumn) => void;
  onPreview: (row: Record<string, string | number | boolean>) => void;
  onView: (row: Record<string, string | number | boolean>) => void;
  onEdit: (row: Record<string, string | number | boolean>) => void;
  /** Present only where a shell can persist a correction. Absent means read-only. */
  onCellCommit?: (row: Record<string, string | number | boolean>, column: DataColumn, next: string) => void | Promise<void>;
  density: Density;
  format: Formatters;
  stickyHeader?: boolean;
  zebra?: boolean;
  wrap?: boolean;
}) {
  /* Padding comes from --row-py, which ERPProvider sets from the density
     preference. The old py-1.5/2.5/3.5 ternary was duplicated here and in
     CardGrid, and the two had already drifted by a step. `density` stays in the
     signature because CardGrid still uses it for column count. */
  void density;
  const padding = "py-[var(--row-py)]";
  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(String(row[primaryKey])));
  return (
    <div className="nex-scrollbar min-h-0 overflow-auto" style={{ "--fs-scale": "var(--fs-result)" } as React.CSSProperties}>
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead className={cn("z-10 bg-[var(--surface-2)] shadow-[0_1px_0_var(--border)]", stickyHeader && "sticky top-0")}>
          <tr>
            <th className="w-10 px-3 py-2"><input aria-label="Select all visible records" type="checkbox" checked={allSelected} onChange={onToggleAll} className="size-3.5 accent-[var(--primary)]" /></th>
            {columns.map((column) => {
              const active = sort?.key === column.key;
              return <th key={column.key} style={{ minWidth: column.width }} className="px-3 py-2 text-[length:calc(8.5px*var(--fs-scale))] font-black uppercase tracking-[.08em] text-[var(--text-subtle)]"><button type="button" disabled={!column.sortable} onClick={() => onSort(column)} className="focus-ring inline-flex items-center gap-1 rounded-md transition hover:text-[var(--text)] disabled:cursor-default">{column.label}{column.sortable ? active ? sort?.direction === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-45" /> : null}</button></th>;
            })}
            <th className="sticky right-0 w-28 bg-[var(--surface-2)] px-3 py-2 text-right text-[length:calc(8.5px*var(--fs-scale))] font-black uppercase tracking-[.08em] text-[var(--text-subtle)]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const id = String(row[primaryKey]);
            const checked = selected.includes(id);
            /* Zebra on odd rows, but selection wins: a selected row must read as
               selected whichever stripe it landed on. */
            const stripe = zebra && rowIndex % 2 === 1 && !checked ? "bg-[color-mix(in_srgb,var(--surface-2)_60%,transparent)]" : undefined;
            return (
              <tr key={id} onDoubleClick={() => onView(row)} className={cn("group border-b border-[var(--border)] transition hover:bg-[var(--surface-2)]", stripe, checked && "bg-[var(--primary-soft)]")}>
                <td className={cn("px-3", padding)} onClick={(event) => event.stopPropagation()}><input aria-label={`Select ${id}`} type="checkbox" checked={checked} onChange={() => onToggle(id)} className="size-3.5 accent-[var(--primary)]" /></td>
                {columns.map((column, index) => <td key={column.key} onClick={() => onPreview(row)} className={cn("cursor-pointer px-3 text-[length:calc(10.5px*var(--fs-scale))] font-medium text-[var(--text-muted)]", padding, index === 0 && "font-extrabold text-[var(--primary)]", column.key === displayKey && "font-extrabold text-[var(--text)]")}>{onCellCommit && column.editable
                    /* stopPropagation: the cell opens the record preview, and
                       clicking into an editor must not also open a drawer over
                       the thing being edited. */
                    ? <span onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
                        <InlineEdit
                          label={column.label}
                          value={String(row[column.key] ?? "")}
                          display={formatValue(column, row[column.key], format, wrap)}
                          inputMode={column.type === "money" || column.type === "number" || column.type === "percent" ? "decimal" : undefined}
                          validate={(next) => validateCell(column, next)}
                          onCommit={(next) => onCellCommit(row, column, next)}
                        />
                      </span>
                      : formatValue(column, row[column.key], format, wrap)}</td>)}
                <td className={cn("sticky right-0 bg-[var(--surface)] px-2 text-right transition group-hover:bg-[var(--surface-2)]", checked && "bg-[var(--primary-soft)]", padding)}>
                  <div className="flex justify-end gap-0.5">
                    <IconButton label={`Preview ${id}`} className="size-7" onClick={() => onPreview(row)}><Eye className="size-3.5" /></IconButton>
                    <IconButton label={`Edit ${id}`} className="size-7" onClick={() => onEdit(row)}><Pencil className="size-3.5" /></IconButton>
                    <ActionMenu trigger={<IconButton label={`More actions for ${id}`} className="size-7"><MoreHorizontal className="size-3.5" /></IconButton>}>
                      {(close) => <><MenuButton icon={<SquareArrowOutUpRight className="size-3.5" />} label="Open full record" onClick={() => { onView(row); close(); }} /><MenuButton icon={<Pencil className="size-3.5" />} label="Edit record" onClick={() => { onEdit(row); close(); }} /><MenuButton label="Duplicate record" onClick={close} /><MenuButton label="View audit history" onClick={close} /></>}
                    </ActionMenu>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
