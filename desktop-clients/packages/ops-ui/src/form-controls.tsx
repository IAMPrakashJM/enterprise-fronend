"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "./cn";

/** Structurally identical to erp-config's Option. Declared locally so ops-ui
    depends on nothing and stays a generic interaction surface. */
export interface Option { label: string; value: string }

interface BaseFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FieldShell({ label, hint, error, required, className, children }: BaseFieldProps & { children: React.ReactNode }) {
  return (
    <label className={cn("block min-w-0", className)}>
      {label ? <span className="mb-1.5 flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)]">{label}{required ? <span className="text-[var(--danger)]">*</span> : null}</span> : null}
      {children}
      {error ? <span className="mt-1 block text-[10px] font-semibold text-[var(--danger)]">{error}</span> : hint ? <span className="mt-1 block text-[10px] text-[var(--text-subtle)]">{hint}</span> : null}
    </label>
  );
}

const inputClass = "focus-ring h-9 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[12px] font-medium text-[var(--text)] shadow-[inset_0_1px_1px_rgba(15,23,42,.02)] outline-none transition placeholder:text-[var(--text-subtle)] hover:border-[var(--border-strong)] focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--text-subtle)]";

/* Omit the native `prefix` (and `suffix`) before intersecting: HTML defines prefix as
   an RDFa string attribute, so the intersection collapsed this prop to `string & ReactNode`
   and rejected an icon element. Strings still pass, since ReactNode includes them. */
export function Input({ label, hint, error, required, className, prefix, suffix, ...props }: BaseFieldProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix"> & { prefix?: React.ReactNode; suffix?: React.ReactNode }) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      <div className="relative">
        {prefix ? <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[11px] font-bold text-[var(--text-muted)]">{prefix}</div> : null}
        <input className={cn(inputClass, prefix ? "pl-11" : undefined, suffix ? "pr-10" : undefined)} {...props} />
        {suffix ? <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-bold text-[var(--text-muted)]">{suffix}</div> : null}
      </div>
    </FieldShell>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search records, IDs, names…", className, onClear }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string; onClear?: () => void }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-subtle)]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(inputClass, "pl-9 pr-8")}
      />
      {value ? <button type="button" onClick={() => { onChange(""); onClear?.(); }} className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]"><X className="size-3.5" /></button> : null}
    </div>
  );
}

export function Textarea({ label, hint, error, required, className, ...props }: BaseFieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      <textarea className={cn(inputClass, "h-auto min-h-24 resize-y py-2.5 leading-relaxed")} {...props} />
    </FieldShell>
  );
}

export function Select({ label, hint, error, required, className, options, placeholder = "Select…", ...props }: BaseFieldProps & React.SelectHTMLAttributes<HTMLSelectElement> & { options: Option[]; placeholder?: string }) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      <div className="relative">
        <select className={cn(inputClass, "appearance-none pr-9")} {...props}>
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
      </div>
    </FieldShell>
  );
}

export function MultiSelect({ label, hint, required, options, value, onChange, placeholder = "Select values…", className, disabled }: BaseFieldProps & { options: Option[]; value: string[]; onChange: (value: string[]) => void; placeholder?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selectedLabels = value.map((selected) => options.find((option) => option.value === selected)?.label).filter(Boolean) as string[];
  const filtered = options.filter((option) => option.label.toLowerCase().includes(filter.toLowerCase()));
  const toggle = (optionValue: string) => onChange(value.includes(optionValue) ? value.filter((item) => item !== optionValue) : [...value, optionValue]);

  return (
    <FieldShell label={label} hint={hint} required={required} className={className}>
      <div className="relative" ref={ref}>
        <button type="button" disabled={disabled} onClick={() => setOpen((previous) => !previous)} className={cn(inputClass, "flex min-h-9 h-auto items-center justify-between gap-2 py-1.5 text-left disabled:opacity-60")}>
          <span className="flex min-w-0 flex-1 flex-wrap gap-1">
            {selectedLabels.length ? selectedLabels.slice(0, 3).map((selected) => <span key={selected} className="rounded-md bg-[var(--primary-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary-strong)]">{selected}</span>) : <span className="text-[var(--text-subtle)]">{placeholder}</span>}
            {selectedLabels.length > 3 ? <span className="rounded-md bg-[var(--surface-3)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">+{selectedLabels.length - 3}</span> : null}
          </span>
          <ChevronDown className={cn("size-3.5 shrink-0 text-[var(--text-muted)] transition", open && "rotate-180")} />
        </button>
        {open ? (
          <div className="animate-slide-up absolute z-50 mt-1.5 w-full min-w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
            <div className="border-b border-[var(--border)] p-2">
              <div className="relative"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-subtle)]" /><input autoFocus value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter options" className={cn(inputClass, "h-8 pl-8 text-[11px]")} /></div>
            </div>
            <div className="nex-scrollbar max-h-52 overflow-auto p-1.5">
              {filtered.map((option) => {
                const selected = value.includes(option.value);
                return <button key={option.value} type="button" onClick={() => toggle(option.value)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium hover:bg-[var(--surface-2)]"><span className={cn("flex size-4 items-center justify-center rounded border", selected ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border-strong)]")}><Check className={cn("size-3", !selected && "opacity-0")} /></span><span className="flex-1">{option.label}</span></button>;
              })}
              {!filtered.length ? <div className="px-3 py-5 text-center text-[11px] text-[var(--text-subtle)]">No matching options</div> : null}
            </div>
          </div>
        ) : null}
      </div>
    </FieldShell>
  );
}

export function Toggle({ label, description, checked, onChange, disabled, className }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; className?: string }) {
  return (
    <label className={cn("flex min-h-10 items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2", className)}>
      <span className="min-w-0"><span className="block text-[11px] font-bold text-[var(--text)]">{label}</span>{description ? <span className="mt-0.5 block text-[10px] leading-relaxed text-[var(--text-muted)]">{description}</span> : null}</span>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={cn("focus-ring relative h-5 w-9 shrink-0 rounded-full border transition", checked ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--border-strong)] bg-[var(--surface-3)]", disabled && "opacity-50")}>
        <span className={cn("absolute top-0.5 size-3.5 rounded-full bg-white shadow-sm transition", checked ? "left-[18px]" : "left-0.5")} />
      </button>
    </label>
  );
}

export { inputClass };
