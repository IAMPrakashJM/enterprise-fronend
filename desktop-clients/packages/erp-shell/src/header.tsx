"use client";

import React, { useState } from "react";
import { Bell, BookOpen, Building2, ChevronDown, CircleUserRound, LogOut, Mail, MessageSquareText, Search, Settings, SlidersHorizontal, UserRound } from "lucide-react";
import { BRANCHES, MESSAGES, MODULES, NOTIFICATIONS, PAGE_REGISTRY } from "@pepbits/erp-config";
import { useNavigation } from "@pepbits/platform-ports";
import { useSession } from "@pepbits/auth";
import { dashboardPageId, useERP } from "./erp-context";
import { HeaderClock } from "./header-clock";
import type { ModuleKey, NotificationKind } from "@pepbits/erp-config";
import { ActionMenu, DropdownSelect, MenuButton, cn } from "@pepbits/ops-ui";
import { Badge } from "@pepbits/ops-ui";

/** Semantic token per kind, so the dot means something rather than matching a
    palette. Tailwind cannot see a class built by string concatenation, so these
    are written out in full. */
const KIND_DOT: Record<NotificationKind, string> = {
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--danger)]",
  success: "bg-[var(--success)]",
  info: "bg-[var(--info)]",
};

/* Vantage's inbox trigger: a bordered box whose border picks up the accent on
   hover, with the count overflowing the top corner. Nexora's IconButton is
   borderless by design, so this is its own control rather than a variant --
   the header's other icon buttons should stay borderless.

   The corner is min(--radius, 10px), not --radius: at the default 14px on a
   36px box the "rounded square" reads as a circle, and at cornerRadius 0 it
   still squares off exactly as Vantage's does.

   -end-1.5, not -right-1.5: the badge has to sit on the outer corner in Arabic
   too, and the shell flips to RTL. */
function InboxTrigger({ label, count, tone, children }: { label: string; count: number; tone: "danger" | "primary"; children: React.ReactNode }) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={`${label}${count ? ` (${count} unread)` : ""}`}
        title={label}
        className="focus-ring grid size-[30px] place-items-center rounded-[min(var(--radius),9px)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:border-[var(--primary)] hover:text-[var(--text)]"
      >
        {children}
      </button>
      {count ? (
        <span
          className="pointer-events-none absolute -top-1.5 -end-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[length:calc(9px*var(--fs-scale))] font-black tabular-nums text-white"
          style={{ background: `var(--${tone === "danger" ? "danger" : "primary"})` }}
        >
          {count}
        </span>
      ) : null}
    </div>
  );
}

export function Header() {
  const { currentModule, branch, setBranch, setCommandOpen, setDocumentationOpen, preferences, toast, t } = useERP();
  /* Component state, not a preference: "I have read these" is per session in a
     mock with no server-side read state, and persisting it to the account would
     imply the notifications themselves are per-account, which they are not. */
  const [unreadNotifications, setUnreadNotifications] = useState(NOTIFICATIONS.length);
  const [unreadMessages, setUnreadMessages] = useState(MESSAGES.filter((item) => item.unread).length);
  const markNotificationsRead = () => setUnreadNotifications(0);
  const markMessagesRead = () => setUnreadMessages(0);
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
    /* size-5, not size-7. The button is 30px with a 1px border, so its content
       box is 28px -- a 28px tile filled it edge to edge and made the module
       control read as taller than the 30px branch control beside it, even
       though both are the same height. 20px leaves 4px of air top and bottom,
       matching the optical weight of branch's bare 14px glyph. */
    icon: <span className="flex size-5 shrink-0 items-center justify-center rounded-md text-white" style={{ background: item.accent }}>{React.createElement(item.icon, { className: "size-3" })}</span>,
  }));

  return (
    <header className="no-print relative z-40 flex h-[var(--header-height)] shrink-0 items-center gap-1.5 border-b border-[var(--border)] bg-[var(--surface-translucent)] px-3 backdrop-blur-xl">
      <div data-tour="module" className="shrink-0">
      <DropdownSelect
        value={currentModule}
        options={moduleOptions}
        onChange={(value) => setModule(value as ModuleKey)}
        menuClassName="w-64"
        className="shrink-0"
      />
      </div>

      <div className="mx-1 h-7 w-px shrink-0 bg-[var(--border)]" />

      {/* One row, on a shared baseline -- Vantage's title + crumb. items-baseline
          is what makes a 15px title and an 11px subtitle sit on the same line
          of text rather than being centred against each other; the badge is
          self-center because a pill has no meaningful baseline.
          Both halves truncate and neither is shrink-0, so flexbox takes the
          space back from whichever is longer -- usually the subtitle, which is
          a full sentence where Vantage's crumb is two words. */}
      <div className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden px-1.5">
        <h1 className="truncate text-[length:calc(15px*var(--fs-scale))] font-black tracking-[-.025em] text-[var(--text)]">{page?.title ?? "Workspace"}</h1>
        {page?.subtitle ? <span className="hidden truncate text-[length:calc(11px*var(--fs-scale))] text-[var(--text-muted)] lg:inline">{page.subtitle}</span> : null}
        {page?.kind ? <Badge tone="neutral" className="hidden shrink-0 self-center xl:inline-flex">{page.kind}</Badge> : null}
      </div>

      <button type="button" onClick={() => setCommandOpen(true)} className="focus-ring hidden h-[30px] w-36 items-center gap-2 rounded-[9px] border border-[var(--border)] bg-[var(--surface-2)] px-2.5 text-left text-[length:calc(10px*var(--fs-scale))] font-semibold text-[var(--text-subtle)] transition hover:border-[var(--border-strong)] xl:flex"><Search className="size-3.5" /><span className="flex-1">Search</span>{preferences.showKeyboardHints ? <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[length:calc(8px*var(--fs-scale))]">⌘K</kbd> : null}</button>

      {/* Vantage's inbox popovers: a count badge on the trigger, a titled head
          with a "Mark all read" action, then rows of coloured dot + title +
          body + age. The dot is a semantic token, so a notification is coloured
          by what it MEANS rather than by a hex picked at the call site. */}
      <ActionMenu trigger={<InboxTrigger label={t("notifications")} count={unreadNotifications} tone="danger"><Bell className="size-3.5" /></InboxTrigger>}>
        {(close) => (
          <div className="-m-1.5 w-[340px] overflow-hidden rounded-xl">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2.5">
              <span className="text-[length:calc(12px*var(--fs-scale))] font-extrabold">{t("notifications")}</span>
              <button type="button" onClick={() => { markNotificationsRead(); close(); toast({ title: "All notifications marked as read", type: "info" }); }} className="focus-ring rounded-md px-1 text-[length:calc(9.5px*var(--fs-scale))] font-bold text-[var(--primary)] hover:underline">Mark all read</button>
            </div>
            <div className="nex-scrollbar max-h-[min(60vh,380px)] overflow-y-auto">
              {NOTIFICATIONS.map((item) => (
                <button key={item.id} type="button" onClick={close} className="flex w-full gap-2.5 border-b border-[var(--border)] px-3 py-2.5 text-left transition last:border-0 hover:bg-[var(--surface-2)]">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", KIND_DOT[item.kind])} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[length:calc(10.5px*var(--fs-scale))] font-bold">{item.title}</span>
                    <span className="text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{item.body}</span>
                  </span>
                  <span className="ms-auto shrink-0 text-[length:calc(9px*var(--fs-scale))] text-[var(--text-subtle)]">{item.time}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </ActionMenu>

      <ActionMenu trigger={<InboxTrigger label={t("messages")} count={unreadMessages} tone="primary"><MessageSquareText className="size-3.5" /></InboxTrigger>}>
        {(close) => (
          <div className="-m-1.5 w-[340px] overflow-hidden rounded-xl">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2.5">
              <span className="text-[length:calc(12px*var(--fs-scale))] font-extrabold">{t("messages")}</span>
              <button type="button" onClick={() => { markMessagesRead(); close(); toast({ title: "All messages marked as read", type: "info" }); }} className="focus-ring rounded-md px-1 text-[length:calc(9.5px*var(--fs-scale))] font-bold text-[var(--primary)] hover:underline">Mark all read</button>
            </div>
            <div className="nex-scrollbar max-h-[min(60vh,380px)] overflow-y-auto">
              {MESSAGES.map((item) => (
                <button key={item.id} type="button" onClick={close} className="flex w-full gap-2.5 border-b border-[var(--border)] px-3 py-2.5 text-left transition last:border-0 hover:bg-[var(--surface-2)]">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[length:calc(9.5px*var(--fs-scale))] font-black text-[var(--primary-strong)]">{item.initials}</span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[length:calc(10.5px*var(--fs-scale))] font-bold">{item.from}</span>
                    <span className="truncate text-[length:calc(9.5px*var(--fs-scale))] text-[var(--text-muted)]">{item.body}</span>
                  </span>
                  <span className="ms-auto shrink-0 text-[length:calc(9px*var(--fs-scale))] text-[var(--text-subtle)]">{item.time}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </ActionMenu>

      <DropdownSelect value={branch} options={BRANCHES} onChange={setBranch} label="Branch" compact className="hidden lg:block" leading={<Building2 className="size-3.5 shrink-0 text-[var(--text-muted)]" />} menuClassName="w-64" />

      <div className="hidden min-w-0 items-center gap-2 px-1.5 2xl:flex">
        <div className="min-w-0 text-right"><div className="truncate text-[length:calc(10.5px*var(--fs-scale))] font-black">{user?.name ?? "Signed out"}</div><div className="truncate text-[length:calc(8.5px*var(--fs-scale))] text-[var(--text-muted)]">{user?.title ?? ""}</div></div>
      </div>

      <ActionMenu trigger={<button type="button" data-tour="profile" aria-label="Open profile menu" className="focus-ring flex h-8 items-center gap-1 rounded-[10px] p-0.5 transition hover:bg-[var(--surface-2)]"><span className="relative flex size-7 items-center justify-center rounded-[9px] bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-[length:calc(9.5px*var(--fs-scale))] font-black text-white shadow-sm">{user?.initials ?? "--"}<span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[var(--surface)] bg-[var(--success)]" /></span><ChevronDown className="size-3 text-[var(--text-subtle)]" /></button>}>
        {(close) => <div className="w-64"><div className="flex items-center gap-3 rounded-lg bg-[var(--surface-2)] p-3"><span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-[length:calc(12px*var(--fs-scale))] font-black text-white">{user?.initials ?? "--"}</span><span className="min-w-0"><span className="block truncate text-[length:calc(11px*var(--fs-scale))] font-extrabold">{user?.name ?? "Signed out"}</span><span className="block truncate text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]">{user?.email ?? ""}</span></span></div><div className="my-1.5 h-px bg-[var(--border)]" />
          <MenuButton icon={<Settings className="size-3.5" />} label="Settings" hint="Workspace and organization" onClick={() => { openPage("theme-studio"); close(); }} />
          <MenuButton icon={<UserRound className="size-3.5" />} label="My Profile" hint="Identity and contact details" onClick={() => { openPage("user-master", { mode: "view", recordId: user?.id ?? "USR-00301", title: "My Profile" }); close(); }} />
          <MenuButton icon={<SlidersHorizontal className="size-3.5" />} label="My Preferences" hint="Layout, theme and behavior" onClick={() => { openPage("preferences"); close(); }} />
          <div className="my-1.5 h-px bg-[var(--border)]" />
          <MenuButton icon={<LogOut className="size-3.5" />} label="Sign out" hint="End this secure session" tone="danger" onClick={() => { close(); void logout(); }} />
          <div className="my-1.5 h-px bg-[var(--border)]" />
          <button type="button" onClick={() => { setDocumentationOpen(true); close(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[length:calc(10px*var(--fs-scale))] font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><BookOpen className="size-3.5" />Product documentation</button>
          <button type="button" onClick={close} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[length:calc(10px*var(--fs-scale))] font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><Mail className="size-3.5" />Contact support</button>
        </div>}
      </ActionMenu>
    </header>
  );
}
