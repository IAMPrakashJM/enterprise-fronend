"use client";

import { CircleCheck, Cloud, Database, LockKeyhole } from "lucide-react";
import { useERP } from "@/context/erp-context";

export function Footer() {
  const { module, branch, role } = useERP();
  return (
    <footer className="no-print flex h-[var(--footer-height)] shrink-0 items-center justify-between border-t border-[var(--border)] bg-[var(--surface)] px-3 text-[8.5px] font-semibold text-[var(--text-muted)]">
      <div className="flex items-center gap-3"><span className="flex items-center gap-1 text-[var(--success)]"><CircleCheck className="size-3" />All systems operational</span><span className="hidden items-center gap-1 md:flex"><Database className="size-3" />Mock tenant • NEX-AE-001</span><span className="hidden items-center gap-1 lg:flex"><Cloud className="size-3" />Region UAE North</span></div>
      <div className="flex items-center gap-3"><span className="hidden lg:inline">{module.shortLabel} • {branch} • {role}</span><span className="flex items-center gap-1"><LockKeyhole className="size-3" />Secure session</span><span>v1.0.0-prototype</span></div>
    </footer>
  );
}
