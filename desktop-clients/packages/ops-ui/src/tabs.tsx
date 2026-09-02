"use client";

import React from "react";
import { cn } from "./cn";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export function Tabs({ items, value, onChange, variant = "line", className }: { items: TabItem[]; value: string; onChange: (value: string) => void; variant?: "line" | "pills" | "segmented"; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center", variant === "line" && "gap-0 border-b border-[var(--border)]", variant === "pills" && "gap-1", variant === "segmented" && "gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1", className)} role="tablist">
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button key={item.id} type="button" role="tab" aria-selected={active} disabled={item.disabled} onClick={() => onChange(item.id)} className={cn(
            "focus-ring relative inline-flex h-9 shrink-0 items-center gap-2 px-3 text-[11px] font-bold transition disabled:opacity-40",
            variant === "line" && (active ? "text-[var(--primary)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"),
            variant === "pills" && "rounded-lg border border-transparent",
            variant === "pills" && (active ? "border-[var(--border)] bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-muted)] hover:bg-[var(--surface-2)]"),
            variant === "segmented" && "h-8 rounded-lg",
            variant === "segmented" && (active ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text)]"),
          )}>
            {item.icon}{item.label}{item.badge !== undefined ? <span className="rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 text-[9px] text-[var(--text-muted)]">{item.badge}</span> : null}
            {variant === "line" && active ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--primary)]" /> : null}
          </button>
        );
      })}
    </div>
  );
}
