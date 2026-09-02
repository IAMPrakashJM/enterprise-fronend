"use client";

import React from "react";
import { ChevronDown, Filter, RotateCcw, SlidersHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-controls";
import { cn } from "@/lib/cn";
import type { WorklistConfig } from "@/types";

export function FilterPanel({ config, values, onChange, advancedOpen, onAdvancedToggle, onApply, onReset, activeFilterCount }: { config: WorklistConfig; values: Record<string, string>; onChange: (key: string, value: string) => void; advancedOpen: boolean; onAdvancedToggle: () => void; onApply: () => void; onReset: () => void; activeFilterCount: number }) {
  const renderFilter = (filter: WorklistConfig["basicFilters"][number] | WorklistConfig["advancedFilters"][number]) => {
    if (filter.type === "select") return <Select key={filter.key} label={filter.label} value={values[filter.key] ?? ""} placeholder="All" options={(filter.options ?? []).filter((option) => option !== "All").map((option) => ({ label: option, value: option }))} onChange={(event) => onChange(filter.key, event.target.value)} />;
    return <Input key={filter.key} label={filter.label} type={filter.type} value={values[filter.key] ?? ""} placeholder={filter.type === "date" ? undefined : `Enter ${filter.label.toLowerCase()}`} onChange={(event) => onChange(filter.key, event.target.value)} />;
  };
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="grid gap-3 p-3 md:grid-cols-3 xl:grid-cols-[minmax(180px,1.4fr)_repeat(2,minmax(150px,.75fr))_auto]">
        {config.basicFilters.map(renderFilter)}
        <div className="flex items-end gap-1.5">
          <Button variant="primary" size="md" leftIcon={<Filter className="size-3.5" />} onClick={onApply}>Apply</Button>
          <Button variant="ghost" size="md" leftIcon={<RotateCcw className="size-3.5" />} onClick={onReset}>Reset</Button>
        </div>
      </div>
      <div className="border-t border-[var(--border)] px-3 py-2">
        <button type="button" onClick={onAdvancedToggle} className="focus-ring flex w-full items-center justify-between rounded-lg text-left text-[10px] font-bold text-[var(--text-muted)] transition hover:text-[var(--text)]">
          <span className="flex items-center gap-2"><SlidersHorizontal className="size-3.5" />Advanced filters{activeFilterCount ? <span className="rounded-full bg-[var(--primary-soft)] px-1.5 py-0.5 text-[8px] font-black text-[var(--primary-strong)]">{activeFilterCount} active</span> : null}</span>
          <ChevronDown className={cn("size-3.5 transition", advancedOpen && "rotate-180")} />
        </button>
        {advancedOpen ? (
          <div className="animate-slide-up mt-3 border-t border-dashed border-[var(--border)] pt-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">{config.advancedFilters.map(renderFilter)}</div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2">
              <span className="text-[9px] text-[var(--text-muted)]">Advanced filters can be saved as a named personal or shared view.</span>
              <Button size="xs" variant="outline" leftIcon={<Star className="size-3" />}>Save current view</Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
