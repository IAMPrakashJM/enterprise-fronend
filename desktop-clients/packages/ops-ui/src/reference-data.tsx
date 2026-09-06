"use client";

import React from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "./button";
import { cn } from "./cn";

export interface ReferenceFailure { key: string; code: string }

export interface ReferenceResponse {
  references: Record<string, Array<{ value: string; label: string }>>;
  failures: ReferenceFailure[];
  partial?: boolean;
}

/**
 * What an empty dropdown actually means.
 *
 * "This tenant configured nothing" and "this list is broken today" look
 * identical on screen and mean opposite things: one is a setup task and the
 * other is an incident. A user who cannot tell them apart raises a ticket for
 * the first and ignores the second.
 */
export type ReferenceState = "ready" | "empty" | "failed" | "unknown";

export function referenceStateOf(response: ReferenceResponse, key: string): ReferenceState {
  /* The failure flag wins over whatever values arrived. A failed list still
     comes back as [] so a client does not crash on .map, but a partial or
     cached list arriving alongside a failure must not be shown as current. */
  if (response.failures.some((failure) => failure.key === key)) return "failed";
  const list = response.references[key];
  if (!list) return "unknown";
  return list.length > 0 ? "ready" : "empty";
}

/**
 * "These lists are broken today", named.
 *
 * Naming them is the point. "Some reference data is unavailable" leaves the
 * user to work out which of eight dropdowns is lying, and they will assume it
 * is whichever one is empty — which may be the one that is genuinely empty.
 */
export function ReferenceDataWarning({ failures, labels, onRetry, className }: {
  failures: ReferenceFailure[];
  /** Key to human label. A key with no label is still reported, by key. */
  labels: Record<string, string>;
  onRetry?: () => void;
  className?: string;
}) {
  if (failures.length === 0) return null;
  const names = failures.map((failure) => labels[failure.key] ?? failure.key);

  return (
    /* status, not alert. The page works and part of it is degraded — an
       assertive interruption is for something that stops you. */
    <div
      role="status"
      className={cn("flex items-start gap-2.5 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] px-3 py-2.5", className)}
    >
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--warning-ink)]" />
      <div className="min-w-0 flex-1 text-[length:calc(10px*var(--fs-scale))] leading-relaxed">
        <b>{names.length === 1 ? "A reference list could not be loaded." : "Some reference lists could not be loaded."}</b>{" "}
        {names.join(", ")} {names.length === 1 ? "is" : "are"} unavailable, so {names.length === 1 ? "that field" : "those fields"} will look empty.
        Other fields are unaffected.
        {/* The machine code is deliberately absent — §6, it is for support, not
            for the user to decode. It stays in the response for logging. */}
      </div>
      {onRetry ? <Button size="sm" variant="secondary" onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}

/**
 * A select whose emptiness means something.
 *
 * The banner says which list is broken; this says it at the field. A user
 * looking at an empty dropdown is looking at the field, not at a banner three
 * sections above that may have scrolled away.
 *
 * A failed list DISABLES the control. Leaving it enabled invites someone to
 * conclude the value is genuinely absent and save the record without it — which
 * is a wrong record written because of a transient outage.
 */
export function ReferenceField({ label, state, options, value, onChange, required, className }: {
  label: string;
  state: ReferenceState;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}) {
  const id = React.useId();
  const noteId = `${id}-note`;
  const broken = state === "failed";
  const note = broken
    ? `${label} could not be loaded. Try again, or leave this for now.`
    : state === "empty"
      ? `None configured yet.`
      : undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1 text-[length:calc(11px*var(--fs-scale))] font-bold text-[var(--text-muted)]">
        {label}{required ? <span className="text-[var(--danger-ink)]">*</span> : null}
      </label>
      <select
        id={id}
        disabled={broken}
        aria-describedby={note ? noteId : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "focus-ring h-9 w-full rounded-[10px] border bg-[var(--surface)] px-3 text-[length:calc(12px*var(--fs-scale))] font-medium text-[var(--text)] outline-none transition disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--text-subtle)]",
          broken ? "border-[color-mix(in_srgb,var(--warning)_45%,var(--border))]" : "border-[var(--border)]",
        )}
      >
        <option value="">{broken ? "Unavailable" : "Select…"}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {note ? (
        <p id={noteId} className={cn("mt-1 text-[length:calc(9.5px*var(--fs-scale))]", broken ? "font-semibold text-[var(--warning-ink)]" : "text-[var(--text-subtle)]")}>{note}</p>
      ) : null}
    </div>
  );
}
