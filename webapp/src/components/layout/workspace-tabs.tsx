"use client";

import { Ellipsis, Plus, X } from "lucide-react";
import { useERP } from "@/context/erp-context";
import { cn } from "@/lib/cn";
import { ActionMenu, MenuButton } from "@/components/ui/dropdown";
import { IconButton } from "@/components/ui/button";

export function WorkspaceTabs() {
  const { tabs, activeTab, activateTab, closeTab, closeOtherTabs, setCommandOpen } = useERP();
  return (
    <div className="no-print flex h-[var(--tabbar-height)] shrink-0 items-end border-b border-[var(--border)] bg-[var(--surface-2)] px-2">
      <div className="nex-scrollbar flex min-w-0 flex-1 items-end gap-1 overflow-x-auto overflow-y-hidden pt-1.5">
        {tabs.map((tab) => {
          const active = activeTab.id === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => activateTab(tab.id)} className={cn("focus-ring group relative flex h-9 max-w-56 shrink-0 items-center gap-2 rounded-t-[11px] border px-3 text-left transition", active ? "border-[var(--border)] border-b-[var(--surface)] bg-[var(--surface)] text-[var(--text)]" : "border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-3)]")}>
              <span className={cn("size-1.5 shrink-0 rounded-full", active ? "bg-[var(--primary)]" : "bg-[var(--text-subtle)]")} />
              <span className="min-w-0 flex-1 truncate text-[10.5px] font-bold">{tab.title}</span>
              {tab.closable ? <span role="button" tabIndex={0} aria-label={`Close ${tab.title}`} onClick={(event) => { event.stopPropagation(); closeTab(tab.id); }} className="flex size-5 shrink-0 items-center justify-center rounded-md opacity-0 transition hover:bg-[var(--surface-3)] group-hover:opacity-100"><X className="size-3" /></span> : null}
              {active ? <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-[var(--primary)]" /> : null}
            </button>
          );
        })}
      </div>
      <div className="mb-1 flex shrink-0 items-center gap-0.5 border-l border-[var(--border)] pl-1.5">
        <IconButton label="Open page" className="size-8" onClick={() => setCommandOpen(true)}><Plus className="size-3.5" /></IconButton>
        <ActionMenu trigger={<IconButton label="Tab options" className="size-8"><Ellipsis className="size-3.5" /></IconButton>}>
          {(close) => <><MenuButton label="Close other tabs" onClick={() => { closeOtherTabs(activeTab.id); close(); }} /><MenuButton label="Open command palette" onClick={() => { setCommandOpen(true); close(); }} /></>}
        </ActionMenu>
      </div>
    </div>
  );
}
