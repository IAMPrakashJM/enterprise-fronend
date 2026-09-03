"use client";

import React from "react";
import { Check, Eye, MoreHorizontal, Pencil, SquareArrowOutUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import { ActionMenu, MenuButton } from "@/components/ui/dropdown";
import { cn, formatCurrency } from "@/lib/cn";
import type { DataColumn, Density } from "@/types";

function display(column: DataColumn, value: unknown) {
  if (column.type === "money") return formatCurrency(Number(value));
  if (column.type === "percent") return `${value}%`;
  return String(value ?? "—");
}

export function CardGrid({ rows, columns, primaryKey, displayKey, selected, onToggle, onPreview, onView, onEdit, density }: {
  rows: Array<Record<string, string | number | boolean>>;
  columns: DataColumn[];
  primaryKey: string;
  displayKey: string;
  selected: string[];
  onToggle: (id: string) => void;
  onPreview: (row: Record<string, string | number | boolean>) => void;
  onView: (row: Record<string, string | number | boolean>) => void;
  onEdit: (row: Record<string, string | number | boolean>) => void;
  density: Density;
}) {
  const detailCount = density === "compact" ? 3 : density === "spacious" ? 7 : 5;
  const detailColumns = columns.filter((column) => column.key !== primaryKey && column.key !== displayKey && column.key !== "status").slice(0, detailCount);
  return (
    <div className={cn("grid gap-3 p-3", density === "compact" ? "md:grid-cols-3 xl:grid-cols-5" : density === "spacious" ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4")}>
      {rows.map((row) => {
        const id = String(row[primaryKey]);
        const checked = selected.includes(id);
        return (
          <Card key={id} className={cn("group relative overflow-hidden transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary)_24%,var(--border))] hover:shadow-[var(--shadow-md)]", checked && "border-[var(--primary)] ring-2 ring-[var(--primary-soft)]")}>
            <button type="button" aria-label={`Select ${id}`} onClick={() => onToggle(id)} className={cn("absolute left-3 top-3 z-10 flex size-5 items-center justify-center rounded-md border bg-[var(--surface)] transition", checked ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border-strong)] text-transparent hover:text-[var(--text-subtle)]")}><Check className="size-3" /></button>
            <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-3 pb-3 pt-10" onClick={() => onPreview(row)}>
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate text-[9px] font-black uppercase tracking-[.08em] text-[var(--primary)]">{id}</div><h3 className="mt-1 truncate text-[12px] font-black tracking-[-.02em]">{String(row[displayKey] ?? id)}</h3></div>{row.status !== undefined ? <StatusBadge value={row.status} /> : null}</div>
            </div>
            <button type="button" onClick={() => onPreview(row)} className="block w-full p-3 text-left">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                {detailColumns.map((column) => <div key={column.key} className="min-w-0"><div className="truncate text-[8px] font-bold uppercase tracking-[.07em] text-[var(--text-subtle)]">{column.label}</div><div className="mt-0.5 truncate text-[10px] font-bold text-[var(--text-muted)]">{column.type === "status" ? <Badge>{display(column, row[column.key])}</Badge> : display(column, row[column.key])}</div></div>)}
              </div>
            </button>
            <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5"><span className="px-1 text-[8px] font-semibold text-[var(--text-subtle)]">Updated recently</span><div className="flex"><IconButton label="Preview" className="size-7" onClick={() => onPreview(row)}><Eye className="size-3.5" /></IconButton><IconButton label="Edit" className="size-7" onClick={() => onEdit(row)}><Pencil className="size-3.5" /></IconButton><ActionMenu trigger={<IconButton label="More" className="size-7"><MoreHorizontal className="size-3.5" /></IconButton>}>{(close) => <><MenuButton icon={<SquareArrowOutUpRight className="size-3.5" />} label="Open full record" onClick={() => { onView(row); close(); }} /><MenuButton label="View audit history" onClick={close} /></>}</ActionMenu></div></div>
          </Card>
        );
      })}
    </div>
  );
}
