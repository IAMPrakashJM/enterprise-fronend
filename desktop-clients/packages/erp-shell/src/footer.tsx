"use client";

import { CircleCheck, Clock3, Cloud, Database, LockKeyhole } from "lucide-react";
import { useERP } from "./erp-context";
import { useClock } from "./use-clock";

export function Footer() {
  const { module, branch, role, format } = useERP();
  /* 15s, not 1s: this one shows no seconds, so a per-second timer would be 59
     wasted renders a minute. The header clock does show them and ticks at 1s. */
  const now = useClock(15_000);
  return (
    <footer className="no-print flex h-[var(--footer-height)] shrink-0 items-center justify-between border-t border-[var(--border)] bg-[var(--surface)] px-3 text-[length:calc(8.5px*var(--fs-scale))] font-semibold text-[var(--text-muted)]">
      <div className="flex items-center gap-3"><span className="flex items-center gap-1 text-[var(--success)]"><CircleCheck className="size-3" />All systems operational</span><span className="hidden items-center gap-1 md:flex"><Database className="size-3" />Mock tenant • NEX-AE-001</span><span className="hidden items-center gap-1 lg:flex"><Cloud className="size-3" />Region UAE North</span></div>
      <div className="flex items-center gap-3"><span className="hidden lg:inline">{module.shortLabel} • {branch} • {role}</span><span className="flex items-center gap-1"><LockKeyhole className="size-3" />Secure session</span><span className="flex items-center gap-1 tabular-nums"><Clock3 className="size-3" />{now ? format.time(now) : "--:--"}</span><span>v1.0.0-prototype</span></div>
    </footer>
  );
}
