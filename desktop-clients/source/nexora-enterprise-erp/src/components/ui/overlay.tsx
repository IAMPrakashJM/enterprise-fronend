"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./button";

export function Modal({ open, onClose, title, subtitle, children, size = "lg", footer, className }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" | "full"; footer?: React.ReactNode; className?: string }) {
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose, open]);
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl", full: "max-w-[calc(100vw-40px)]" };
  return (
    <div className="animate-fade fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-5 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={cn("animate-slide-up flex max-h-[calc(100vh-40px)] w-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]", widths[size], className)}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
          <div><h2 className="text-[15px] font-extrabold tracking-[-.02em] text-[var(--text)]">{title}</h2>{subtitle ? <p className="mt-1 text-[11px] text-[var(--text-muted)]">{subtitle}</p> : null}</div>
          <IconButton label="Close" onClick={onClose}><X className="size-4" /></IconButton>
        </div>
        <div className="nex-scrollbar min-h-0 flex-1 overflow-auto">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-2)] px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, subtitle, children, side = "right", width = "md", footer }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; side?: "left" | "right"; width?: "sm" | "md" | "lg"; footer?: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose, open]);
  if (!open) return null;
  const widths = { sm: "w-[360px]", md: "w-[460px]", lg: "w-[620px]" };
  return (
    <div className="fixed inset-0 z-[115] bg-slate-950/35 backdrop-blur-[1px]" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className={cn("animate-slide-up absolute inset-y-0 flex max-w-[92vw] flex-col border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]", widths[width], side === "right" ? "right-0 border-l" : "left-0 border-r")}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4"><div><h2 className="text-[15px] font-extrabold tracking-[-.02em]">{title}</h2>{subtitle ? <p className="mt-1 text-[11px] text-[var(--text-muted)]">{subtitle}</p> : null}</div><IconButton label="Close" onClick={onClose}><X className="size-4" /></IconButton></div>
        <div className="nex-scrollbar min-h-0 flex-1 overflow-auto">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-2)] px-5 py-3">{footer}</div> : null}
      </aside>
    </div>
  );
}

export function CenterRecordCard({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/25 p-5 backdrop-blur-[1px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="animate-slide-up w-full max-w-xl rounded-[24px] border border-[color-mix(in_srgb,var(--primary)_25%,var(--border))] bg-[var(--surface)] p-2 shadow-[var(--shadow-lg)]">
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3"><h2 className="text-[13px] font-extrabold">{title}</h2><IconButton label="Close" onClick={onClose}><X className="size-4" /></IconButton></div>
          <div className="nex-scrollbar max-h-[65vh] overflow-auto p-4">{children}</div>
          {footer ? <div className="flex justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
