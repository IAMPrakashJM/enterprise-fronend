"use client";

import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, MoreHorizontal, Pencil, SquareArrowOutUpRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/cn";
import { StatusBadge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import { ActionMenu, MenuButton } from "@/components/ui/dropdown";
import type { DataColumn, Density } from "@/types";

function formatValue(column: DataColumn, value: unknown) {
  if (column.type === "money") return <span className="font-extrabold tabular-nums">{formatCurrency(Number(value))}</span>;
  if (column.type === "percent") return <span className="font-extrabold tabular-nums">{value}%</span>;
  if (column.type === "number") return <span className="font-bold tabular-nums">{String(value)}</span>;
  if (column.type === "status") return <StatusBadge value={value} />;
  if (typeof value === "boolean") return <StatusBadge value={value} />;
  return <span className="block max-w-[260px] truncate" title={String(value ?? "")}>{String(value ?? "—")}</span>;
}

export function DataTable({ rows, columns, primaryKey, displayKey, selected, onToggle, onToggleAll, sort, onSort, onPreview, onView, onEdit, density }: {
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
  density: Density;
}) {
  const padding = density === "compact" ? "py-1.5" : density === "spacious" ? "py-3.5" : "py-2.5";
  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(String(row[primaryKey])));
  return (
    <div className="nex-scrollbar min-h-0 overflow-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-[var(--surface-2)] shadow-[0_1px_0_var(--border)]">
          <tr>
            <th className="w-10 px-3 py-2"><input aria-label="Select all visible records" type="checkbox" checked={allSelected} onChange={onToggleAll} className="size-3.5 accent-[var(--primary)]" /></th>
            {columns.map((column) => {
              const active = sort?.key === column.key;
              return <th key={column.key} style={{ minWidth: column.width }} className="px-3 py-2 text-[8.5px] font-black uppercase tracking-[.08em] text-[var(--text-subtle)]"><button type="button" disabled={!column.sortable} onClick={() => onSort(column)} className="focus-ring inline-flex items-center gap-1 rounded-md transition hover:text-[var(--text)] disabled:cursor-default">{column.label}{column.sortable ? active ? sort?.direction === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-45" /> : null}</button></th>;
            })}
            <th className="sticky right-0 w-28 bg-[var(--surface-2)] px-3 py-2 text-right text-[8.5px] font-black uppercase tracking-[.08em] text-[var(--text-subtle)]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = String(row[primaryKey]);
            const checked = selected.includes(id);
            return (
              <tr key={id} onDoubleClick={() => onView(row)} className={cn("group border-b border-[var(--border)] transition hover:bg-[var(--surface-2)]", checked && "bg-[var(--primary-soft)]")}>
                <td className={cn("px-3", padding)} onClick={(event) => event.stopPropagation()}><input aria-label={`Select ${id}`} type="checkbox" checked={checked} onChange={() => onToggle(id)} className="size-3.5 accent-[var(--primary)]" /></td>
                {columns.map((column, index) => <td key={column.key} onClick={() => onPreview(row)} className={cn("cursor-pointer px-3 text-[10.5px] font-medium text-[var(--text-muted)]", padding, index === 0 && "font-extrabold text-[var(--primary)]", column.key === displayKey && "font-extrabold text-[var(--text)]")}>{formatValue(column, row[column.key])}</td>)}
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
