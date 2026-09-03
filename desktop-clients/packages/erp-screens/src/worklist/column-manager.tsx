"use client";

import React from "react";
import { ArrowDown, ArrowUp, Check, GripVertical, RotateCcw } from "lucide-react";
import { Modal } from "@pepbits/ops-ui";
import { Button, IconButton } from "@pepbits/ops-ui";
import { cn } from "@pepbits/ops-ui";
import type { DataColumn } from "@pepbits/erp-config";

export function ColumnManager({ open, onClose, columns, visibleKeys, onChange, onReset }: { open: boolean; onClose: () => void; columns: DataColumn[]; visibleKeys: string[]; onChange: (keys: string[]) => void; onReset: () => void }) {
  const toggle = (key: string) => {
    if (visibleKeys.includes(key)) {
      if (visibleKeys.length === 1) return;
      onChange(visibleKeys.filter((item) => item !== key));
    } else {
      onChange([...visibleKeys, key]);
    }
  };
  const move = (key: string, direction: -1 | 1) => {
    const next = [...visibleKeys];
    const index = next.indexOf(key);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const ordered = [...visibleKeys.map((key) => columns.find((column) => column.key === key)).filter(Boolean), ...columns.filter((column) => !visibleKeys.includes(column.key))] as DataColumn[];
  return (
    <Modal open={open} onClose={onClose} title="Columns & layout" subtitle="Choose visible columns and save their order for this page." size="sm" footer={<><Button variant="ghost" leftIcon={<RotateCcw className="size-3.5" />} onClick={onReset}>Reset</Button><Button variant="primary" onClick={onClose}>Done</Button></>}>
      <div className="p-4">
        <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[length:calc(10px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">Column choices are stored per page. The same saved layout is used when you return to this worklist.</div>
        <div className="space-y-1.5">
          {ordered.map((column) => {
            const visible = visibleKeys.includes(column.key);
            const index = visibleKeys.indexOf(column.key);
            return <div key={column.key} className={cn("flex items-center gap-2 rounded-xl border px-2.5 py-2", visible ? "border-[var(--border)] bg-[var(--surface)]" : "border-transparent bg-[var(--surface-2)] opacity-65")}><GripVertical className="size-3.5 text-[var(--text-subtle)]" /><button type="button" onClick={() => toggle(column.key)} className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border", visible ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border-strong)]")}><Check className={cn("size-3", !visible && "opacity-0")} /></button><span className="min-w-0 flex-1 text-[length:calc(10.5px*var(--fs-scale))] font-bold">{column.label}</span>{visible ? <div className="flex"><IconButton label="Move up" className="size-7" disabled={index <= 0} onClick={() => move(column.key, -1)}><ArrowUp className="size-3" /></IconButton><IconButton label="Move down" className="size-7" disabled={index >= visibleKeys.length - 1} onClick={() => move(column.key, 1)}><ArrowDown className="size-3" /></IconButton></div> : null}</div>;
          })}
        </div>
      </div>
    </Modal>
  );
}
