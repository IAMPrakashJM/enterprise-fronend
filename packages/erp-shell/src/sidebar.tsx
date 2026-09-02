"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Command, PanelLeftClose, PanelLeftOpen, Pin, PinOff, SlidersHorizontal } from "lucide-react";
import { NavLink, cn } from "@pepbits/ops-ui";
import { useNavigation } from "@pepbits/platform-ports";
import { useERP } from "./erp-context";
import type { MenuItem } from "@pepbits/erp-config";

function SidebarLeaf({ item, expanded, active, href, onSelect }: { item: MenuItem; expanded: boolean; active: boolean; href: string; onSelect: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      href={href}
      title={!expanded ? item.label : undefined}
      onClick={(event) => { event.preventDefault(); onSelect(); }}
      className={cn(
        "focus-ring group relative flex h-9 w-full items-center rounded-[10px] border text-left transition",
        expanded ? "gap-2.5 px-2.5" : "justify-center px-1",
        active
          ? "border-[color-mix(in_srgb,var(--primary)_20%,transparent)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
          : "border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
      )}
    >
      <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg transition", active ? "bg-[var(--surface)] shadow-sm" : "group-hover:bg-[var(--surface)]")}>{Icon ? <Icon className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current opacity-55" />}</span>
      {expanded ? <span className="min-w-0 flex-1 truncate text-[11px] font-bold">{item.label}</span> : null}
      {expanded && item.badge ? <span className="rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 text-[9px] font-extrabold text-[var(--text-muted)]">{item.badge}</span> : null}
      {active ? <span className={cn("absolute inset-y-2 w-0.5 rounded-full bg-[var(--primary)]", "left-0")} /> : null}
    </NavLink>
  );
}

function SidebarGroup({ item, expanded, activePageId, hrefFor, onSelect }: { item: MenuItem; expanded: boolean; activePageId: string; hrefFor: (pageId: string) => string; onSelect: (pageId: string) => void }) {
  const childActive = item.children?.some((child) => child.pageId === activePageId) ?? false;
  const [open, setOpen] = useState(childActive || item.id === "billing" || item.id === "fin-parties");
  const Icon = item.icon;

  if (!item.children?.length && item.pageId) return <SidebarLeaf item={item} expanded={expanded} active={item.pageId === activePageId} href={hrefFor(item.pageId)} onSelect={() => onSelect(item.pageId!)} />;
  return (
    <div>
      <button
        type="button"
        title={!expanded ? item.label : undefined}
        onClick={() => setOpen((previous) => !previous)}
        className={cn("focus-ring group flex h-9 w-full items-center rounded-[10px] border border-transparent text-left text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]", expanded ? "gap-2.5 px-2.5" : "justify-center px-1", childActive && "text-[var(--primary-strong)]")}
      >
        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg", childActive && "bg-[var(--primary-soft)]")}>{Icon ? <Icon className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}</span>
        {expanded ? <><span className="min-w-0 flex-1 truncate text-[11px] font-bold">{item.label}</span>{open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}</> : null}
      </button>
      {expanded && open ? (
        <div className="relative ml-[21px] mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-3">
          {item.children?.map((child) => {
            const active = child.pageId === activePageId;
            return (
              <NavLink key={child.id} href={child.pageId ? hrefFor(child.pageId) : "#"} onClick={(event) => { event.preventDefault(); if (child.pageId) onSelect(child.pageId); }} className={cn("focus-ring group relative flex min-h-8 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[10.5px] font-semibold transition", active ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]")}>
                <span className={cn("absolute -left-[14px] top-1/2 h-px w-3 bg-[var(--border)]", active && "bg-[var(--primary)]")} />
                {child.icon ? React.createElement(child.icon, { className: "size-3.5 shrink-0" }) : <span className="size-1.5 shrink-0 rounded-full bg-current opacity-40" />}
                <span className="min-w-0 flex-1 truncate">{child.label}</span>
                {child.badge ? <span className="rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 text-[8px]">{child.badge}</span> : null}
              </NavLink>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar() {
  const { module, preferences, updatePreference } = useERP();
  const navigation = useNavigation();
  const activePageId = navigation.current.pageId;
  const openPage = (pageId: string) => navigation.open({ pageId });
  const hrefForPage = (pageId: string) => navigation.hrefFor({ pageId });
  const [hovered, setHovered] = useState(false);
  const expanded = preferences.sidebarPinned || hovered;
  const isRight = preferences.sidebarPlacement === "right";
  const SideIcon = isRight ? ChevronsLeft : ChevronsRight;
  const brandLetters = useMemo(() => module.shortLabel.slice(0, 2).toUpperCase(), [module.shortLabel]);

  return (
    <aside
      aria-label="Primary navigation"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "no-print relative z-50 flex h-dvh shrink-0 flex-col bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-[width] duration-200",
        isRight ? "border-l border-[var(--border)]" : "border-r border-[var(--border)]",
        expanded ? "w-[var(--sidebar-expanded)]" : "w-[var(--sidebar-collapsed)]",
      )}
    >
      <div className="flex h-[var(--header-height)] shrink-0 items-center gap-3 border-b border-[var(--border)] px-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-[var(--primary)] text-white shadow-md">
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,.38),transparent_42%)]" />
          <Command className="relative size-5" />
        </div>
        {expanded ? <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-black tracking-[-.04em]">NEXORA <span className="text-[var(--primary)]">ONE</span></div><div className="truncate text-[9px] font-bold uppercase tracking-[.15em] text-[var(--text-subtle)]">Enterprise ERP</div></div> : null}
        {expanded ? <button type="button" title={preferences.sidebarPinned ? "Unpin sidebar" : "Pin sidebar"} onClick={() => updatePreference("sidebarPinned", !preferences.sidebarPinned)} className={cn("focus-ring flex size-8 items-center justify-center rounded-lg border transition", preferences.sidebarPinned ? "border-[color-mix(in_srgb,var(--primary)_25%,transparent)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]")}>{preferences.sidebarPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}</button> : null}
      </div>

      <div className="shrink-0 border-b border-[var(--border)] px-3 py-3">
        <div className={cn("flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)]", expanded ? "gap-2 px-2.5 py-2" : "justify-center p-1.5")}>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white" style={{ background: module.accent }}>{brandLetters}</div>
          {expanded ? <div className="min-w-0"><div className="truncate text-[11px] font-extrabold">{module.label}</div><div className="truncate text-[9px] text-[var(--text-muted)]">Module navigation</div></div> : null}
        </div>
      </div>

      <nav className={cn("nex-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-3", expanded ? "px-3" : "px-2")}>
        {module.navigation.map((section, sectionIndex) => (
          <div key={section.id} className={cn(sectionIndex > 0 && "mt-4")}>
            {expanded ? <div className="mb-1.5 flex items-center gap-2 px-2 text-[8.5px] font-black uppercase tracking-[.16em] text-[var(--text-subtle)]"><span>{section.label}</span><span className="h-px flex-1 bg-[var(--border)]" /></div> : <div className="mx-auto mb-1.5 h-px w-7 bg-[var(--border)]" />}
            <div className="space-y-0.5">
              {section.items.map((item) => <SidebarGroup key={item.id} item={item} expanded={expanded} activePageId={activePageId} hrefFor={hrefForPage} onSelect={openPage} />)}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[var(--border)] p-2">
        <button type="button" title="My Preferences" onClick={() => openPage("preferences")} className={cn("focus-ring flex h-9 w-full items-center rounded-[10px] text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]", expanded ? "gap-2.5 px-2.5" : "justify-center")}><span className="flex size-6 items-center justify-center"><SlidersHorizontal className="size-3.5" /></span>{expanded ? <span className="text-[11px] font-bold">My Preferences</span> : null}</button>
        <button type="button" title={preferences.sidebarPinned ? "Sidebar is fixed" : "Sidebar expands on hover"} onClick={() => updatePreference("sidebarPinned", !preferences.sidebarPinned)} className={cn("focus-ring mt-0.5 flex h-9 w-full items-center rounded-[10px] text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]", expanded ? "gap-2.5 px-2.5" : "justify-center")}>
          <span className="flex size-6 items-center justify-center">{preferences.sidebarPinned ? <PanelLeftClose className="size-3.5" /> : <PanelLeftOpen className="size-3.5" />}</span>
          {expanded ? <span className="min-w-0 flex-1 text-left text-[10px] font-semibold">{preferences.sidebarPinned ? "Unfix sidebar" : "Fix sidebar open"}</span> : null}
          {expanded ? <SideIcon className="size-3 text-[var(--text-subtle)]" /> : null}
        </button>
      </div>
    </aside>
  );
}
