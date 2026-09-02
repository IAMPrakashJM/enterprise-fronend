"use client";

import React, { useMemo, useState } from "react";
import { ChevronRight, LayoutDashboard, Search } from "lucide-react";
import { Badge, Modal } from "@pepbits/ops-ui";
import { MODULES, PAGE_REGISTRY } from "@pepbits/erp-config";
import { useNavigation } from "@pepbits/platform-ports";
import { useERP } from "../erp-context";

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useERP();
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const pages = useMemo(() => {
    const term = query.trim().toLowerCase();
    return Object.values(PAGE_REGISTRY)
      .filter((page) => !term || `${page.title} ${page.subtitle} ${page.module}`.toLowerCase().includes(term))
      .slice(0, 18);
  }, [query]);
  return (
    <Modal open={commandOpen} onClose={() => { setCommandOpen(false); setQuery(""); }} title="Open page or command" subtitle="Search every configured module, master, transaction, report and utility." size="md">
      <div className="p-3">
        <div className="flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3"><Search className="size-4 text-[var(--text-subtle)]" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages, modules and actions…" className="h-full min-w-0 flex-1 bg-transparent text-[12px] outline-none" /><kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[8px] text-[var(--text-muted)]">ESC</kbd></div>
        <div className="mt-2 max-h-[55vh] overflow-auto">{pages.map((page) => { const module = page.module === "shared" ? null : MODULES[page.module]; return <button key={page.id} type="button" onClick={() => { navigation.open({ pageId: page.id }); setCommandOpen(false); setQuery(""); }} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[var(--surface-2)]"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">{page.kind === "dashboard" ? <LayoutDashboard className="size-4" /> : <ChevronRight className="size-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-extrabold">{page.title}</span><span className="mt-0.5 block truncate text-[9px] text-[var(--text-muted)]">{page.subtitle}</span></span><Badge tone="neutral">{module?.shortLabel ?? "Shared"}</Badge></button>; })}</div>
      </div>
    </Modal>
  );
}
