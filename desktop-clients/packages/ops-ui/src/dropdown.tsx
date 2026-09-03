"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "./cn";

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function DropdownSelect({ value, options, onChange, label, hideLabel, compact, align = "left", className, triggerClassName, menuClassName, leading }: { value: string; options: DropdownOption[]; onChange: (value: string) => void; label?: string; hideLabel?: boolean; compact?: boolean; align?: "left" | "right"; className?: string; triggerClassName?: string; menuClassName?: string; leading?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button type="button" aria-label={label} onClick={() => setOpen((previous) => !previous)} className={cn("focus-ring group flex h-[30px] items-center gap-2 rounded-[10px] border border-transparent px-2 text-left transition hover:border-[var(--border)] hover:bg-[var(--surface-2)]", compact ? "max-w-40" : "min-w-40", triggerClassName)}>
        {leading ?? selected.icon}
        {/* Label and value sit side by side, as Vantage's "Branch  Dubai HQ"
            does. Stacked, an 8px label over a 10px value needs ~27px of line
            boxes, which in a 30px button leaves the text touching the border.
            Inline, both fit on one line with room to spare. */}
        <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
          {/* hideLabel drops the TEXT, not the label -- it stays on the button
              as aria-label, so the control is still announced as "Branch"
              rather than as whichever place name happens to be selected. */}
          {label && !hideLabel ? <span className="shrink-0 text-[length:calc(9px*var(--fs-scale))] font-semibold text-[var(--text-subtle)]">{label}</span> : null}
          <span className={cn("min-w-0 truncate font-bold text-[var(--text)]", label && !hideLabel ? "text-[length:calc(10.5px*var(--fs-scale))]" : "text-[length:calc(11px*var(--fs-scale))]")}>{selected.label}</span>
        </span>
        <ChevronDown className={cn("size-3.5 shrink-0 text-[var(--text-subtle)] transition", open && "rotate-180")} />
      </button>
      {open ? (
        <div className={cn("animate-slide-up absolute z-[80] mt-1.5 min-w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-md)]", align === "right" ? "right-0" : "left-0", menuClassName)}>
          {options.map((option) => (
            <button key={option.value} type="button" disabled={option.disabled} onClick={() => { onChange(option.value); setOpen(false); }} className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-[var(--surface-2)] disabled:opacity-40", option.value === value && "bg-[var(--primary-soft)]")}>
              {option.icon ? <span className="text-[var(--text-muted)]">{option.icon}</span> : null}
              <span className="min-w-0 flex-1"><span className="block whitespace-nowrap text-[length:calc(11px*var(--fs-scale))] font-bold text-[var(--text)]">{option.label}</span>{option.description ? <span className="mt-0.5 block whitespace-nowrap text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]">{option.description}</span> : null}</span>
              <Check className={cn("size-3.5 text-[var(--primary)]", option.value !== value && "opacity-0")} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ActionMenu({ trigger, children, align = "right", className }: { trigger: React.ReactNode; children: (close: () => void) => React.ReactNode; align?: "left" | "right"; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div className={cn("relative", className)} ref={ref}>
      <div onClick={() => setOpen((previous) => !previous)}>{trigger}</div>
      {open ? <div className={cn("animate-slide-up absolute z-[90] mt-1.5 min-w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-md)]", align === "right" ? "right-0" : "left-0")}>{children(() => setOpen(false))}</div> : null}
    </div>
  );
}

export function MenuButton({ icon, label, hint, tone = "default", onClick }: { icon?: React.ReactNode; label: string; hint?: string; tone?: "default" | "danger"; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-[var(--surface-2)]", tone === "danger" && "text-[var(--danger)]")}><span className="flex size-7 items-center justify-center rounded-lg bg-[var(--surface-2)]">{icon}</span><span className="min-w-0 flex-1"><span className="block text-[length:calc(11px*var(--fs-scale))] font-bold">{label}</span>{hint ? <span className="block text-[length:calc(9px*var(--fs-scale))] text-[var(--text-subtle)]">{hint}</span> : null}</span></button>;
}
