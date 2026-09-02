"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { Badge, IconButton, cn } from "@pepbits/ops-ui";
import type { BadgeTone } from "@pepbits/ops-ui";
import type { ToastPosition } from "@pepbits/erp-config";
import { useERP } from "../erp-context";

const toastPositionClass: Record<ToastPosition, string> = {
  "top-left": "left-4 top-4 items-start",
  "top-center": "left-1/2 top-4 -translate-x-1/2 items-center",
  "top-right": "right-4 top-4 items-end",
  "bottom-left": "bottom-12 left-4 items-start",
  "bottom-center": "bottom-12 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-12 right-4 items-end",
};

export function ToastViewport() {
  const { toasts, dismissToast, preferences } = useERP();
  const tone: Record<string, BadgeTone> = { success: "success", error: "danger", warning: "warning", info: "info" };
  const icons = { success: CheckCircle2, error: AlertCircle, warning: AlertCircle, info: Info };
  return (
    <div className={cn("pointer-events-none fixed z-[180] flex max-w-[calc(100vw-2rem)] flex-col gap-2", toastPositionClass[preferences.toastPosition])}>
      {toasts.map((item) => { const Icon = icons[item.type]; return <div key={item.id} className="pointer-events-auto animate-slide-up flex w-[360px] max-w-full items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-md)]"><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)]"><Icon className={cn("size-4", item.type === "success" && "text-[var(--success)]", item.type === "error" && "text-[var(--danger)]", item.type === "warning" && "text-[var(--warning)]", item.type === "info" && "text-[var(--info)]")} /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-[11px] font-extrabold">{item.title}</span><Badge tone={tone[item.type]}>{item.type}</Badge></span>{item.message ? <span className="mt-1 block text-[9.5px] leading-relaxed text-[var(--text-muted)]">{item.message}</span> : null}</span><IconButton label="Dismiss" className="size-7" onClick={() => dismissToast(item.id)}><X className="size-3.5" /></IconButton></div>; })}
    </div>
  );
}
