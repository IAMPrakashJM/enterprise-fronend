"use client";

import React from "react";
import { ExternalLink, Pencil, ShieldCheck } from "lucide-react";
import { useERP } from "@/context/erp-context";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { CenterRecordCard, Drawer, Modal } from "@/components/ui/overlay";
import { formatCurrency } from "@/lib/cn";
import type { DataColumn, WorklistConfig } from "@/types";

function PreviewContent({ row, config }: { row: Record<string, string | number | boolean>; config: WorklistConfig }) {
  const columnMap = Object.fromEntries(config.columns.map((column) => [column.key, column])) as Record<string, DataColumn>;
  const primary = String(row[config.primaryKey]);
  const display = String(row[config.displayKey] ?? primary);
  const entries = Object.entries(row).slice(0, 12);
  return (
    <div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <div className="flex items-start justify-between gap-3"><div><Badge tone="brand">{primary}</Badge><h3 className="mt-2 text-[16px] font-black tracking-[-.025em]">{display}</h3><p className="mt-1 text-[10px] text-[var(--text-muted)]">Limited record preview • full details open in a workspace tab</p></div>{row.status !== undefined ? <StatusBadge value={row.status} /> : null}</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4">
        {entries.filter(([key]) => key !== config.displayKey && key !== config.primaryKey && key !== "status").map(([key, value]) => {
          const column = columnMap[key];
          const output = column?.type === "money" ? formatCurrency(Number(value)) : column?.type === "percent" ? `${value}%` : typeof value === "boolean" ? (value ? "Enabled" : "Disabled") : String(value);
          return <div key={key} className="min-w-0"><div className="truncate text-[8.5px] font-black uppercase tracking-[.09em] text-[var(--text-subtle)]">{column?.label ?? key.replace(/([A-Z])/g, " $1")}</div><div className="mt-1 truncate text-[10.5px] font-bold text-[var(--text)]" title={output}>{output}</div></div>;
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-[9.5px] text-[var(--text-muted)]"><ShieldCheck className="size-4 shrink-0 text-[var(--success)]" /><span>Visibility is filtered by your current role, branch and field-level permissions.</span></div>
    </div>
  );
}

export function RecordPreview({ row, config, onClose, onView, onEdit }: { row: Record<string, string | number | boolean> | null; config: WorklistConfig; onClose: () => void; onView: () => void; onEdit: () => void }) {
  const { preferences } = useERP();
  const open = Boolean(row);
  if (!row) return null;
  const title = `${config.title} preview`;
  const footer = <><Button variant="ghost" onClick={onClose}>Close</Button><Button variant="secondary" leftIcon={<ExternalLink className="size-3.5" />} onClick={onView}>Open full record</Button><Button variant="primary" leftIcon={<Pencil className="size-3.5" />} onClick={onEdit}>Edit</Button></>;
  const content = <PreviewContent row={row} config={config} />;
  if (preferences.previewMode === "left-drawer" || preferences.previewMode === "right-drawer") return <Drawer open={open} onClose={onClose} title={title} subtitle="Contextual limited-data preview" side={preferences.previewMode === "left-drawer" ? "left" : "right"} footer={footer}><div className="p-5">{content}</div></Drawer>;
  if (preferences.previewMode === "center-modal") return <Modal open={open} onClose={onClose} title={title} subtitle="Contextual limited-data preview" size="md" footer={footer}><div className="p-5">{content}</div></Modal>;
  return <CenterRecordCard open={open} onClose={onClose} title={title} footer={footer}>{content}</CenterRecordCard>;
}
