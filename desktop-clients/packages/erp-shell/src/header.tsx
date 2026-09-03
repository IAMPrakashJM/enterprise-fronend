"use client";

import React from "react";
import { Bell, BookOpen, Building2, ChevronDown, CircleUserRound, LogOut, Mail, MessageSquareText, Search, Settings, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import { BRANCHES, MODULES, PAGE_REGISTRY, ROLES } from "@pepbits/erp-config";
import { useNavigation } from "@pepbits/platform-ports";
import { useSession } from "@pepbits/auth";
import { dashboardPageId, useERP } from "./erp-context";
import type { ModuleKey } from "@pepbits/erp-config";
import { ActionMenu, DropdownSelect, MenuButton } from "@pepbits/ops-ui";
import { IconButton } from "@pepbits/ops-ui";
import { Badge } from "@pepbits/ops-ui";

export function Header() {
  const { currentModule, branch, setBranch, role, setRole, setCommandOpen, setDocumentationOpen, preferences } = useERP();
  const navigation = useNavigation();
  const { user, logout } = useSession();
  const activePageId = navigation.current.pageId;
  const openPage = (pageId: string, options?: { mode?: "view" | "edit" | "new"; recordId?: string; title?: string }) =>
    navigation.open({ pageId, ...options });
  /* The module switcher navigates to that module's dashboard and each shell applies
     its own semantics: web pushes the URL, desktop rebuilds its tab set. */
  const setModule = (value: ModuleKey) => navigation.open({ pageId: dashboardPageId(value) });
  const page = PAGE_REGISTRY[activePageId];
  const moduleOptions = Object.values(MODULES).map((item) => ({
    value: item.id,
    label: item.shortLabel,
    description: item.label,
    icon: <span className="flex size-7 items-center justify-center rounded-lg text-white" style={{ background: item.accent }}>{React.createElement(item.icon, { className: "size-3.5" })}</span>,
  }));

  return (
    <header className="no-print relative z-40 flex h-[var(--header-height)] shrink-0 items-center gap-1.5 border-b border-[var(--border)] bg-[var(--surface-translucent)] px-3 backdrop-blur-xl">
      <DropdownSelect
        value={currentModule}
        options={moduleOptions}
        onChange={(value) => setModule(value as ModuleKey)}
        menuClassName="w-64"
        className="shrink-0"
      />

      <div className="mx-1 h-7 w-px shrink-0 bg-[var(--border)]" />

      <div className="min-w-24 flex-1 px-1.5">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-[14px] font-black tracking-[-.025em] text-[var(--text)]">{page?.title ?? "Workspace"}</h1>
          {page?.kind ? <Badge tone="neutral" className="hidden xl:inline-flex">{page.kind}</Badge> : null}
        </div>
        <p className="hidden max-w-2xl truncate text-[9.5px] text-[var(--text-muted)] lg:block">{page?.subtitle}</p>
      </div>

      <button type="button" onClick={() => setCommandOpen(true)} className="focus-ring hidden h-9 w-36 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-2.5 text-left text-[10px] font-semibold text-[var(--text-subtle)] transition hover:border-[var(--border-strong)] xl:flex"><Search className="size-3.5" /><span className="flex-1">Search</span>{preferences.showKeyboardHints ? <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[8px]">⌘K</kbd> : null}</button>

      <ActionMenu trigger={<div className="relative"><IconButton label="Notifications"><Bell className="size-4" /></IconButton><span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-[var(--surface)] bg-[var(--danger)]" /></div>}>
        {(close) => <div className="w-80"><div className="flex items-center justify-between px-2 py-2"><div><div className="text-[12px] font-extrabold">Notifications</div><div className="text-[9px] text-[var(--text-muted)]">5 items need attention</div></div><Badge tone="brand">5 new</Badge></div><div className="my-1 h-px bg-[var(--border)]" />{[
          ["Invoice approval overdue", "INV-26-005184 • AED 184,200", "8 min"],
          ["Bank feed completed", "2,486 transactions imported", "22 min"],
          ["Payroll exception", "12 blocking records", "38 min"],
        ].map(([title, detail, time]) => <button key={title} type="button" onClick={close} className="w-full rounded-lg px-2.5 py-2 text-left hover:bg-[var(--surface-2)]"><div className="flex items-center justify-between gap-3"><span className="text-[10.5px] font-bold">{title}</span><span className="text-[8.5px] text-[var(--text-subtle)]">{time}</span></div><div className="mt-0.5 text-[9px] text-[var(--text-muted)]">{detail}</div></button>)}</div>}
      </ActionMenu>

      <ActionMenu trigger={<div className="relative"><IconButton label="Messages"><MessageSquareText className="size-4" /></IconButton><span className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[8px] font-black text-white">3</span></div>}>
        {(close) => <div className="w-72"><div className="px-2 py-2"><div className="text-[12px] font-extrabold">Messages</div><div className="text-[9px] text-[var(--text-muted)]">Collaboration inbox</div></div><div className="my-1 h-px bg-[var(--border)]" />{[
          ["Maya Thomas", "Can you review the billing batch?", "2m"],
          ["Omar Khan", "Supplier exception is resolved.", "18m"],
          ["HR Operations", "September roster is ready.", "1h"],
        ].map(([name, message, time], index) => <button key={name} type="button" onClick={close} className="flex w-full gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-[var(--surface-2)]"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[10px] font-black text-[var(--primary-strong)]">{index + 1}</span><span className="min-w-0 flex-1"><span className="flex justify-between gap-2 text-[10px] font-bold"><span>{name}</span><span className="text-[8px] font-medium text-[var(--text-subtle)]">{time}</span></span><span className="mt-0.5 block truncate text-[9px] text-[var(--text-muted)]">{message}</span></span></button>)}</div>}
      </ActionMenu>

      <DropdownSelect value={branch} options={BRANCHES} onChange={setBranch} label="Branch" compact className="hidden lg:block" leading={<Building2 className="size-3.5 shrink-0 text-[var(--text-muted)]" />} menuClassName="w-64" />
      <DropdownSelect value={role} options={ROLES} onChange={setRole} label="Role" compact className="hidden xl:block" leading={<ShieldCheck className="size-3.5 shrink-0 text-[var(--text-muted)]" />} menuClassName="w-64" />

      <div className="hidden min-w-0 items-center gap-2 px-1.5 2xl:flex">
        <div className="min-w-0 text-right"><div className="truncate text-[10.5px] font-black">{user?.name ?? "Signed out"}</div><div className="truncate text-[8.5px] text-[var(--text-muted)]">{user?.title ?? ""}</div></div>
      </div>

      <ActionMenu trigger={<button type="button" aria-label="Open profile menu" className="focus-ring flex h-10 items-center gap-1 rounded-xl p-1 transition hover:bg-[var(--surface-2)]"><span className="relative flex size-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-[10px] font-black text-white shadow-sm">{user?.initials ?? "--"}<span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[var(--surface)] bg-[var(--success)]" /></span><ChevronDown className="size-3 text-[var(--text-subtle)]" /></button>}>
        {(close) => <div className="w-64"><div className="flex items-center gap-3 rounded-lg bg-[var(--surface-2)] p-3"><span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-[12px] font-black text-white">{user?.initials ?? "--"}</span><span className="min-w-0"><span className="block truncate text-[11px] font-extrabold">{user?.name ?? "Signed out"}</span><span className="block truncate text-[9px] text-[var(--text-muted)]">{user?.email ?? ""}</span></span></div><div className="my-1.5 h-px bg-[var(--border)]" />
          <MenuButton icon={<Settings className="size-3.5" />} label="Settings" hint="Workspace and organization" onClick={() => { openPage("theme-studio"); close(); }} />
          <MenuButton icon={<UserRound className="size-3.5" />} label="My Profile" hint="Identity and contact details" onClick={() => { openPage("user-master", { mode: "view", recordId: user?.id ?? "USR-00301", title: "My Profile" }); close(); }} />
          <MenuButton icon={<SlidersHorizontal className="size-3.5" />} label="My Preferences" hint="Layout, theme and behavior" onClick={() => { openPage("preferences"); close(); }} />
          <div className="my-1.5 h-px bg-[var(--border)]" />
          <MenuButton icon={<LogOut className="size-3.5" />} label="Sign out" hint="End this secure session" tone="danger" onClick={() => { close(); void logout(); }} />
          <div className="my-1.5 h-px bg-[var(--border)]" />
          <button type="button" onClick={() => { setDocumentationOpen(true); close(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><BookOpen className="size-3.5" />Product documentation</button>
          <button type="button" onClick={close} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><Mail className="size-3.5" />Contact support</button>
        </div>}
      </ActionMenu>
    </header>
  );
}
