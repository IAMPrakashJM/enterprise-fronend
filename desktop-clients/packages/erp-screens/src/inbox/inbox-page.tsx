"use client";

import React, { useMemo, useState } from "react";
import { ArrowRight, Bell, Check, CheckCheck, Inbox, MessageSquareText, Search } from "lucide-react";
import type { MessageItem, NotificationItem, NotificationKind, PageDefinition } from "@pepbits/erp-config";
import { MESSAGES, MODULES, NOTIFICATIONS, PAGE_REGISTRY } from "@pepbits/erp-config";
import { useERP } from "@pepbits/erp-shell";
import { Badge, Button, Input, cn } from "@pepbits/ops-ui";
import { useNavigation } from "@pepbits/platform-ports";

/**
 * The full inbox, behind the header's bell and messages menu.
 *
 * ONE component for both because they are the same screen with different rows:
 * a filtered list, a reading pane, and a way to get to the record the item is
 * about. Two components would drift, and the drift would land on whichever of
 * the two nobody opened.
 *
 * The dropdown and this page read the SAME fixtures, so a notification cannot
 * appear in one and not the other, and "5 unread" in the header cannot disagree
 * with what is listed here.
 *
 * Read state is per-session and deliberately local: there is no per-user inbox
 * on the server, and persisting it to preferences would make a demo look like
 * it had an inbox service behind it.
 */

const KIND_DOT: Record<NotificationKind, string> = {
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--danger)]",
  success: "bg-[var(--success)]",
  info: "bg-[var(--primary)]",
};

const KIND_TONE: Record<NotificationKind, "warning" | "danger" | "success" | "info"> = {
  warning: "warning", danger: "danger", success: "success", info: "info",
};

type Row = {
  id: string;
  title: string;
  preview: string;
  detail: string;
  time: string;
  unread: boolean;
  kind?: NotificationKind;
  initials?: string;
  role?: string;
  module?: string;
  target?: { pageId: string; recordId?: string };
};

const fromNotification = (n: NotificationItem): Row => ({
  id: n.id, title: n.title, preview: n.body, detail: n.detail ?? n.body, time: n.time,
  unread: n.unread ?? false, kind: n.kind, module: n.module, target: n.target,
});

const fromMessage = (m: MessageItem): Row => ({
  id: m.id, title: m.from, preview: m.body, detail: m.detail ?? m.body, time: m.time,
  unread: m.unread ?? false, initials: m.initials, role: m.role, target: m.target,
});

export function InboxPage({ page }: { page: PageDefinition }) {
  const messages = page.id === "messages";
  const navigation = useNavigation();
  const { toast } = useERP();

  const all = useMemo<Row[]>(
    () => (messages ? MESSAGES.map(fromMessage) : NOTIFICATIONS.map(fromNotification)),
    [messages],
  );

  /* Ids that have been read in THIS session, layered over the fixture. Storing
     the negative -- what changed -- rather than a copy of every row keeps the
     fixture the single source of what exists. */
  const [readIds, setReadIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(all[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const isUnread = (row: Row) => row.unread && !readIds.includes(row.id);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all.filter((row) => {
      if (filter === "unread" && !isUnread(row)) return false;
      if (!needle) return true;
      return `${row.title} ${row.preview} ${row.detail}`.toLowerCase().includes(needle);
    });
    // readIds matters: clearing one while filtering by unread must drop it.
  }, [all, filter, query, readIds]);

  const selected = shown.find((row) => row.id === selectedId) ?? shown[0] ?? null;
  const unreadCount = all.filter(isUnread).length;

  const open = (row: Row) => {
    setSelectedId(row.id);
    if (row.unread) setReadIds((previous) => (previous.includes(row.id) ? previous : [...previous, row.id]));
  };

  const go = (row: Row) => {
    if (!row.target) return;
    /* A target naming a page that is not registered would navigate into a 404.
       Checked here rather than trusted, because the fixture is hand-written. */
    if (!PAGE_REGISTRY[row.target.pageId]) {
      toast({ title: "That record is not available", message: `${row.target.pageId} is not a registered page in this build.`, type: "warning" });
      return;
    }
    navigation.open(row.target);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[length:calc(11px*var(--fs-scale))] font-extrabold">
          {messages ? <MessageSquareText className="size-4 text-[var(--primary)]" /> : <Bell className="size-4 text-[var(--primary)]" />}
          {messages ? "Messages" : "Notifications"}
        </span>
        <Badge tone={unreadCount ? "info" : "neutral"}>{unreadCount} unread</Badge>

        <div className="ms-auto flex items-center gap-2">
          <div className="w-56">
            <Input placeholder={messages ? "Search people and messages…" : "Search notifications…"}
              value={query} onChange={(event) => setQuery(event.target.value)} prefix={<Search className="size-3.5" />} />
          </div>
          <div className="flex overflow-hidden rounded-lg border border-[var(--border)]">
            {(["all", "unread"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setFilter(value)}
                className={cn("focus-ring px-2.5 py-1.5 text-[length:calc(9.5px*var(--fs-scale))] font-bold capitalize transition",
                  filter === value ? "bg-[var(--primary)] text-white" : "bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]")}>
                {value}
              </button>
            ))}
          </div>
          <Button size="sm" variant="secondary" leftIcon={<CheckCheck className="size-3.5" />}
            disabled={!unreadCount}
            onClick={() => { setReadIds(all.map((row) => row.id)); toast({ title: messages ? "All messages marked as read" : "All notifications marked as read", type: "info" }); }}>
            Mark all read
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(300px,380px)_1fr]">
        {/* list */}
        <div className="nex-scrollbar min-h-0 overflow-y-auto border-b border-[var(--border)] lg:border-b-0 lg:border-e">
          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <Inbox className="size-6 text-[var(--text-subtle)]" />
              <span className="text-[length:calc(10.5px*var(--fs-scale))] font-bold">Nothing here</span>
              <span className="text-[length:calc(9.5px*var(--fs-scale))] text-[var(--text-muted)]">
                {filter === "unread" ? "Everything has been read." : "No item matches that search."}
              </span>
            </div>
          ) : shown.map((row) => (
            <button key={row.id} type="button" onClick={() => open(row)}
              className={cn("flex w-full gap-2.5 border-b border-[var(--border)] px-3 py-2.5 text-left transition last:border-0",
                selected?.id === row.id ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--surface-2)]")}>
              {row.initials ? (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[length:calc(9.5px*var(--fs-scale))] font-black text-[var(--primary-strong)]">{row.initials}</span>
              ) : (
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", KIND_DOT[row.kind ?? "info"])} />
              )}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={cn("truncate text-[length:calc(10.5px*var(--fs-scale))]", isUnread(row) ? "font-black" : "font-bold text-[var(--text-muted)]")}>{row.title}</span>
                <span className="truncate text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{row.preview}</span>
              </span>
              <span className="ms-auto flex shrink-0 flex-col items-end gap-1">
                <span className="text-[length:calc(9px*var(--fs-scale))] text-[var(--text-subtle)]">{row.time}</span>
                {isUnread(row) ? <span className="size-1.5 rounded-full bg-[var(--primary)]" /> : null}
              </span>
            </button>
          ))}
        </div>

        {/* reading pane */}
        <div className="nex-scrollbar min-h-0 overflow-y-auto p-4">
          {selected ? (
            <div className="mx-auto max-w-2xl">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[length:calc(15px*var(--fs-scale))] font-black tracking-[-.01em]">{selected.title}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[length:calc(9.5px*var(--fs-scale))] text-[var(--text-muted)]">
                    <span>{selected.role ?? (selected.module ? MODULES[selected.module as keyof typeof MODULES]?.label ?? selected.module : "System")}</span>
                    <span aria-hidden>•</span>
                    <span>{selected.time} ago</span>
                  </div>
                </div>
                {selected.kind ? <Badge tone={KIND_TONE[selected.kind]}>{selected.kind}</Badge> : null}
                {isUnread(selected) ? <Badge tone="info">unread</Badge> : null}
              </div>

              <p className="mt-4 text-[length:calc(11px*var(--fs-scale))] leading-relaxed">{selected.detail}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {selected.target ? (
                  <Button size="sm" variant="primary" rightIcon={<ArrowRight className="size-3.5" />} onClick={() => go(selected)}>
                    {messages ? "Open what this is about" : "Open the record"}
                  </Button>
                ) : null}
                {isUnread(selected) ? (
                  <Button size="sm" variant="secondary" leftIcon={<Check className="size-3.5" />}
                    onClick={() => setReadIds((previous) => [...previous, selected.id])}>Mark as read</Button>
                ) : null}
              </div>

              {selected.target ? (
                <p className="mt-3 text-[length:calc(9px*var(--fs-scale))] text-[var(--text-subtle)]">
                  Goes to <span className="font-mono">{selected.target.pageId}</span>
                  {PAGE_REGISTRY[selected.target.pageId] ? "" : " — not registered in this build"}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <Inbox className="size-7 text-[var(--text-subtle)]" />
              <span className="text-[length:calc(10.5px*var(--fs-scale))] font-bold">Nothing selected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
