"use client";

import React, { useId } from "react";
import { Link2, Lock, RotateCcw, Share2 } from "lucide-react";
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
export function FilterBar({ definitions, values, sensitiveKeys, onChange, onReset, onCopyLink, onSaveView, className }: {
  definitions: FilterDefinition[];
  values: FilterValues;
  sensitiveKeys: string[];
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  onCopyLink?: () => void;
  onSaveView?: () => void;
  className?: string;
}) {
  const base = useId();
  const holdingBack = sensitiveKeys.length > 0;
  const anyFilter = Object.values(values).some((value) => value.trim() !== "");

  return (
    <section className={cn("rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]", className)}>
      <div className="grid gap-3 p-3 md:grid-cols-3">
        {definitions.map((definition) => {
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
                /* Described, not just tinted. Which fields survive a share is
                   the one thing this bar has to communicate, and a colour
                   communicates it to some people. */
                <p id={noteId} className="mt-1 flex items-center gap-1 text-[length:calc(9px*var(--fs-scale))] font-semibold text-[var(--text-subtle)]">
                  <Lock aria-hidden className="size-3 shrink-0" />
                  Kept out of the link — not included in the URL
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-3 py-2">
        {holdingBack ? (
          <p className="mr-auto flex items-center gap-1.5 text-[length:calc(9.5px*var(--fs-scale))] font-semibold text-[var(--text-muted)]">
            <Lock aria-hidden className="size-3.5 shrink-0 text-[var(--warning)]" />
            {sensitiveKeys.length} filter{sensitiveKeys.length === 1 ? "" : "s"} cannot be put in a link. Save a view to share this.
          </p>
        ) : <span className="mr-auto" />}

        {/* One or the other, never both. Offering "copy link" beside a
            sensitive filter hands someone a link that silently drops half of
            what they are looking at. */}
        {anyFilter && holdingBack && onSaveView ? (
          <Button size="sm" variant="secondary" leftIcon={<Share2 className="size-3.5" />} onClick={onSaveView}>Create saved view</Button>
        ) : null}
        {anyFilter && !holdingBack && onCopyLink ? (
          <Button size="sm" variant="secondary" leftIcon={<Link2 className="size-3.5" />} onClick={onCopyLink}>Copy link</Button>
        ) : null}
        <Button size="sm" variant="ghost" leftIcon={<RotateCcw className="size-3.5" />} onClick={onReset}>Reset</Button>
      </div>
    </section>
  );
}
