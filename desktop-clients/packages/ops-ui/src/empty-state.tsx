import React from "react";
import { Inbox } from "lucide-react";

export function EmptyState({ title = "No records found", description = "Try changing the search or filters.", action }: { title?: string; description?: string; action?: React.ReactNode }) {
  return <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-3)] text-[var(--text-muted)]"><Inbox className="size-5" /></div><h3 className="text-[length:calc(13px*var(--fs-scale))] font-extrabold">{title}</h3><p className="mt-1 max-w-sm text-[length:calc(11px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{description}</p>{action ? <div className="mt-4">{action}</div> : null}</div>;
}
