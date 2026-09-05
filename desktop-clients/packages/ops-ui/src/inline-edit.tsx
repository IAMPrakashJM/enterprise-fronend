"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { cn } from "./cn";

/**
 * Edit one value in place.
 *
 * For small safe changes — a credit limit, a status, a due date — not for
 * anything a form exists to do. The three things that make an inline editor
 * either useful or dangerous are all answered here rather than left to callers:
 *
 * WHERE THE ERROR GOES. A table cell has no room for a message under it, which
 * is the reason inline editing usually ships without validation. This stays in
 * edit mode and puts the message beside the field, so a rejected value is never
 * silently discarded.
 *
 * WHEN IT WRITES. Enter and blur commit, Escape cancels — what every grid
 * anyone has used already does. An unchanged value writes NOTHING: a save that
 * bumps a version and lands in the audit log because someone tabbed through a
 * cell is noise in both, and a conflict for whoever else holds that version.
 *
 * WHAT HAPPENS WHEN TWO PEOPLE EDIT ONE CELL. `onCommit` may reject, which is
 * how the framework's §20 answer arrives: the server refuses a write against a
 * stale version and the reason comes back here. The typed value stays on screen
 * so it can be retried or copied out — an edit that vanishes because someone
 * else was faster is the failure this has to avoid.
 */
export function InlineEdit({ label, value, display, onCommit, validate, disabled, className, inputMode }: {
  /** Names the cell for a screen reader — "Credit limit", not "50,000". */
  label: string;
  /** The raw value, as it should appear in the input. */
  value: string;
  /** How it reads when not being edited. Defaults to the raw value. */
  display?: React.ReactNode;
  /** May be async, and may reject with the reason a write was refused. */
  onCommit: (next: string) => void | Promise<void>;
  /** Returns a message to show, or null to accept. Runs before any write. */
  validate?: (next: string) => string | null;
  disabled?: boolean;
  className?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const base = useId();
  const problemId = `${base}-problem`;

  /* focus THEN select. select() alone leaves the caret wherever it was, so
     clicking a cell opened an editor the keyboard could not reach — Enter went
     to the document and nothing happened. Found by breaking the unchanged-value
     rule and watching its test stay green: it had never got as far as a
     commit. */
  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const open = () => { setDraft(value); setProblem(null); setEditing(true); };
  const cancel = () => { setEditing(false); setProblem(null); setDraft(value); };

  const commit = async () => {
    /* Nothing changed, so nothing is written. Closing quietly is the whole
       behaviour — there is no edit to save and no conflict to risk. */
    if (draft === value) { cancel(); return; }
    const rejected = validate?.(draft) ?? null;
    if (rejected) { setProblem(rejected); inputRef.current?.focus(); return; }
    setSaving(true);
    setProblem(null);
    try {
      await onCommit(draft);
      setEditing(false);
    } catch (error) {
      /* Still editing, still holding what was typed. */
      setProblem(error instanceof Error ? error.message : "That change could not be saved.");
      inputRef.current?.focus();
    } finally {
      setSaving(false);
    }
  };

  if (disabled) return <span className={cn("block truncate", className)}>{display ?? value}</span>;

  if (!editing) {
    return (
      <button
        type="button"
        /* The value is the content; the label is what it IS. Without both, a
           screen reader in a wide table reads two hundred numbers and no
           column names. */
        aria-label={`${label}: ${typeof display === "string" ? display : value}`}
        onClick={open}
        onKeyDown={(event) => { if (event.key === "F2") { event.preventDefault(); open(); } }}
        className={cn("focus-ring -mx-1 flex w-full min-w-0 items-center gap-1 rounded-md px-1 text-left transition hover:bg-[var(--surface-3)]", className)}
      >
        <span className="min-w-0 flex-1 truncate">{display ?? value}</span>
      </button>
    );
  }

  return (
    <span className={cn("relative -mx-1 flex min-w-0 items-center gap-1", className)}>
      <input
        ref={inputRef}
        aria-label={label}
        aria-invalid={problem ? true : undefined}
        aria-describedby={problem ? problemId : undefined}
        inputMode={inputMode}
        value={draft}
        disabled={saving}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") { event.preventDefault(); void commit(); }
          /* stopPropagation, or Escape closes the drawer or modal the table is
             sitting in and takes the rest of the row's edits with it. */
          else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancel(); }
        }}
        onBlur={() => { if (!saving) void commit(); }}
        className={cn(
          "focus-ring h-6 w-full min-w-0 rounded-md border bg-[var(--surface)] px-1 text-[length:inherit] font-[inherit] text-[var(--text)] outline-none",
          problem ? "border-[var(--danger)]" : "border-[var(--primary)]",
        )}
      />
      {saving ? <span role="status" className="sr-only">Saving {label}</span> : null}
      {problem ? (
        /* Above the cell rather than inside it. A table row cannot grow to fit
           a message without shifting every row below it, and a message that
           moves the thing you are pointing at is worse than none. */
        <span
          id={problemId}
          role="alert"
          className="absolute left-0 top-full z-[70] mt-1 w-max max-w-64 rounded-md border border-[var(--danger)] bg-[var(--surface)] px-2 py-1 text-[length:calc(9.5px*var(--fs-scale))] font-semibold text-[var(--danger)] shadow-[var(--shadow-md)]"
        >
          {problem}
        </span>
      ) : null}
    </span>
  );
}
