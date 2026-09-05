import React from "react";
import { Inbox, ShieldOff, TriangleAlert } from "lucide-react";
import { Button } from "./button";
import { cn } from "./cn";

/**
 * The three things a screen can have instead of content.
 *
 * One shell, three meanings, so a user can tell which they are looking at
 * without reading the words: nothing here yet, something broke, you are not
 * allowed. Before this, a failed page looked different depending on which page
 * failed, because every screen handled its own.
 */
function StatePanel({ icon, tone, title, description, detail, action, alert }: {
  icon: React.ReactNode;
  tone: "neutral" | "danger" | "warning";
  title: string;
  description: string;
  detail?: React.ReactNode;
  action?: React.ReactNode;
  alert?: boolean;
}) {
  const badge = tone === "danger"
    ? "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]"
    : tone === "warning"
      ? "bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]"
      : "bg-[var(--surface-3)] text-[var(--text-muted)]";
  return (
    /* role=alert on the two that report a problem: a failure a screen reader
       never hears is a screen that looks like it is still loading. An empty
       result is not an event and does not interrupt. */
    <div role={alert ? "alert" : undefined} className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <div className={cn("mb-3 flex size-12 items-center justify-center rounded-2xl", badge)}>{icon}</div>
      <h3 className="text-[length:calc(13px*var(--fs-scale))] font-extrabold">{title}</h3>
      <p className="mt-1 max-w-sm text-[length:calc(11px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{description}</p>
      {/* The slot the whole component turns on. A shared panel that swallows the
          specific message is worse than the twenty bespoke ones it replaced,
          because it takes away the only line that said what actually broke. */}
      {detail ? (
        <p className="mt-3 max-w-md break-words rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left font-mono text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{detail}</p>
      ) : null}
      {action ? <div className="mt-4 flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ title = "No records found", description = "Try changing the search or filters.", action }: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return <StatePanel icon={<Inbox className="size-5" />} tone="neutral" title={title} description={description} action={action} />;
}

/**
 * Something failed and trying again might work.
 *
 * `onRetry` is why this beats a sentence: without one, reloading the whole page
 * is the user's only move, and they lose everything else on screen doing it.
 */
export function ErrorState({ title = "Something went wrong", description = "The page could not finish loading. This is usually temporary.", detail, onRetry, action }: {
  title?: string;
  description?: string;
  /** The specific message. Shown verbatim, monospaced, and never summarised. */
  detail?: React.ReactNode;
  onRetry?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <StatePanel
      alert
      icon={<TriangleAlert className="size-5" />}
      tone="danger"
      title={title}
      description={description}
      detail={detail}
      action={<>{action}{onRetry ? <Button variant="secondary" onClick={onRetry}>Try again</Button> : null}</>}
    />
  );
}

/**
 * The user is not allowed to see this.
 *
 * Deliberately without a retry: pressing it again changes nothing, and offering
 * it suggests the refusal was a glitch. What helps is knowing WHAT was refused,
 * which is what `detail` carries — "ask someone" is only actionable if it says
 * what to ask for.
 */
export function AccessDenied({ title = "You do not have access", description = "This is not available to your account. Someone with the right permission can open it for you.", detail, action }: {
  title?: string;
  description?: string;
  detail?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return <StatePanel alert icon={<ShieldOff className="size-5" />} tone="warning" title={title} description={description} detail={detail} action={action} />;
}
