"use client";

import React, { useId, useState } from "react";
import { ChevronDown, Link2, Lock, RotateCcw, Share2, SlidersHorizontal } from "lucide-react";
import { Button, Input, Select, cn } from "@pepbits/ops-ui";
import { isUrlSafe, type FilterDefinition, type FilterValues } from "@pepbits/erp-config";

/**
 * One filter bar, driven by the registry.
 *
 * The classification does two visible things: it marks the fields that will not
 * travel in a link, and it decides which of the two share affordances is
 * offered. Both matter — a user who cannot tell which filters survive sharing
 * finds out by sharing one that does not.
 */
export function FilterBar({ definitions, advanced, values, sensitiveKeys, onChange, onReset, onApply, onCopyLink, onSaveView, className }: {
  definitions: FilterDefinition[];
  /** A second group, collapsed by default. Classified exactly like the first. */
  advanced?: FilterDefinition[];
  values: FilterValues;
  sensitiveKeys: string[];
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  onApply?: () => void;
  onCopyLink?: () => void;
  onSaveView?: () => void;
  className?: string;
}) {
  const base = useId();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const holdingBack = sensitiveKeys.length > 0;
  /* `holdingBack` counts too. A worklist's search box lives above this bar and
     is not one of `values`, so a name typed into it made the whole share row
     disappear — nothing to copy, and no offer to save the view that could
     carry it. Anything being held back is something to share. */
  const anyFilter = holdingBack || Object.values(values).some((value) => value.trim() !== "");
  /* Counted while collapsed: a filter set inside a closed section is a filtered
     list with nothing on screen saying why. */
  const advancedSet = (advanced ?? []).filter((definition) => (values[definition.key] ?? "").trim() !== "").length;

  const renderField = (definition: FilterDefinition) => {
    const sensitive = !isUrlSafe(definition);
    const noteId = `${base}-${definition.key}-note`;
    const common = {
      label: definition.label,
      value: values[definition.key] ?? "",
      "aria-describedby": sensitive ? noteId : undefined,
    };
    return (
      <div key={definition.key} className="min-w-0">
        {definition.type === "select" ? (
          <Select {...common} options={(definition.options ?? []).filter((o) => o !== "All").map((o) => ({ label: o, value: o }))} placeholder="All" onChange={(event) => onChange(definition.key, event.target.value)} />
        ) : (
          <Input {...common} type={definition.type === "date" ? "date" : "text"} placeholder={definition.type === "date" ? undefined : `Enter ${definition.label.toLowerCase()}`} onChange={(event) => onChange(definition.key, event.target.value)} />
        )}
        {sensitive ? (
          /* Described, not just tinted. Which fields survive a share is the one
             thing this bar has to communicate, and a colour communicates it to
             some people. */
          <p id={noteId} className="mt-1 flex items-center gap-1 text-[length:calc(9px*var(--fs-scale))] font-semibold text-[var(--text-subtle)]">
            <Lock aria-hidden className="size-3 shrink-0" />
            Kept out of the link — not included in the URL
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <section className={cn("rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]", className)}>
      <div className="grid gap-3 p-3 md:grid-cols-3">
        {definitions.map(renderField)}
      </div>

      {advanced?.length ? (
        <div className="border-t border-[var(--border)]">
          <button
            type="button"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((open) => !open)}
            className="focus-ring flex w-full items-center justify-between px-3 py-2 text-left"
          >
            <span className="flex items-center gap-2 text-[length:calc(10.5px*var(--fs-scale))] font-bold text-[var(--text-muted)]">
              <SlidersHorizontal aria-hidden className="size-3.5" />
              Advanced filters{advancedSet ? ` (${advancedSet} set)` : ""}
            </span>
            <ChevronDown aria-hidden className={cn("size-4 text-[var(--text-subtle)] transition", advancedOpen && "rotate-180")} />
          </button>
          {advancedOpen ? (
            <div className="grid gap-3 border-t border-[var(--border)] p-3 md:grid-cols-3">{advanced.map(renderField)}</div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-3 py-2">
        {holdingBack ? (
          <p className="mr-auto flex items-center gap-1.5 text-[length:calc(9.5px*var(--fs-scale))] font-semibold text-[var(--text-muted)]">
            <Lock aria-hidden className="size-3.5 shrink-0 text-[var(--warning)]" />
            {sensitiveKeys.length} filter{sensitiveKeys.length === 1 ? "" : "s"} cannot be put in a link. Save a view to share this.
          </p>
        ) : <span className="mr-auto" />}

        {/* One or the other, never both. Offering "copy link" beside a sensitive
            filter hands someone a link that silently drops half of what they
            are looking at. */}
        {anyFilter && holdingBack && onSaveView ? (
          <Button size="sm" variant="secondary" leftIcon={<Share2 className="size-3.5" />} onClick={onSaveView}>Create saved view</Button>
        ) : null}
        {anyFilter && !holdingBack && onCopyLink ? (
          <Button size="sm" variant="secondary" leftIcon={<Link2 className="size-3.5" />} onClick={onCopyLink}>Copy link</Button>
        ) : null}
        {onApply ? <Button size="sm" variant="primary" onClick={onApply}>Apply</Button> : null}
        <Button size="sm" variant="ghost" leftIcon={<RotateCcw className="size-3.5" />} onClick={onReset}>Reset</Button>
      </div>
    </section>
  );
}
