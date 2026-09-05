"use client";

import React, { useMemo, useState } from "react";
import { ArrowRight, Bell, Check, CheckCheck, CircleAlert, CircleCheck, Inbox, Info, MessageSquareText, Search, Send, TriangleAlert } from "lucide-react";
import type { MessageItem, NotificationItem, NotificationKind, PageDefinition } from "@pepbits/erp-config";
import { MESSAGES, MODULES, NOTIFICATIONS, PAGE_REGISTRY } from "@pepbits/erp-config";
import { useERP } from "@pepbits/erp-shell";
import { Avatar, Badge, Button, Input, Textarea, cn } from "@pepbits/ops-ui";
import { useNavigation } from "@pepbits/platform-ports";
import { usePublishAiSources } from "@pepbits/ai-client";
import { InlineAiAction } from "@pepbits/ai-ui";

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

/* The severity as a shape as well as a colour. A palette alone excludes anyone
   who cannot separate the hues, and a red dot beside a green one is the exact
   pair that goes. */
const KIND_ICON: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  warning: TriangleAlert, danger: CircleAlert, success: CircleCheck, info: Info,
};

const KIND_WASH: Record<NotificationKind, string> = {
  warning: "bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]",
  danger: "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[var(--danger)]",
  success: "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]",
  info: "bg-[var(--primary-soft)] text-[var(--primary)]",
};


/* "2m", "1d" -> a bucket. The fixtures carry humanised ages rather than dates,
   so this reads the unit off the end instead of doing arithmetic on a clock
   that does not exist. */
const bucketOf = (time: string) => (/[dw]$/.test(time.trim()) ? "Earlier" : "Today");

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
  const [reply, setReply] = useState("");

  const isUnread = (row: Row) => row.unread && !readIds.includes(row.id);

  /* Only the unread ones, which is the whole point of the use case that reads
     them. Recomputed as they are read, so a summary asked for after clearing
     three items covers what is actually left rather than what was waiting when
     the page opened. */
  usePublishAiSources(`inbox:${page.id}`, {
    "inbox-unread": all.filter(isUnread).map((row) => ({
      title: row.title, preview: row.preview, time: row.time,
      ...(row.kind ? { kind: row.kind } : {}),
      ...(row.role ? { role: row.role } : {}),
    })),
  });

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
          <div className="w-72">
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
          <InlineAiAction useCaseId="inbox.summarise-unread" label="Summarise unread" />
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
          ) : shown.map((row, index) => {
            const bucket = bucketOf(row.time);
            const newBucket = index === 0 || bucketOf(shown[index - 1].time) !== bucket;
            const Icon = row.kind ? KIND_ICON[row.kind] : null;
            return (
              <React.Fragment key={row.id}>
                {newBucket ? (
                  <div className="sticky top-0 z-[1] border-b border-[var(--border)] bg-[var(--surface-2)]/95 px-3 py-1 text-[length:calc(8.5px*var(--fs-scale))] font-black uppercase tracking-[.1em] text-[var(--text-subtle)] backdrop-blur">
                    {bucket}
                  </div>
                ) : null}
                <button type="button" onClick={() => open(row)}
                  className={cn(
                    /* The unread accent is a border on the leading edge rather
                       than a background: a filled row competes with selection,
                       and then neither state is legible when both are true. */
                    "relative flex w-full gap-2.5 border-b border-s-2 border-[var(--border)] px-3 py-2.5 text-left transition",
                    isUnread(row) ? "border-s-[var(--primary)]" : "border-s-transparent",
                    selected?.id === row.id ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--surface-2)]")}>
                  {row.initials ? (
                    <Avatar name={row.initials ?? ""} initials={row.initials} size="sm" decorative />
                  ) : Icon ? (
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", KIND_WASH[row.kind ?? "info"])}>
                      <Icon className="size-4" />
                    </span>
                  ) : null}

                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-baseline gap-2">
                      <span className={cn("min-w-0 flex-1 truncate text-[length:calc(10.5px*var(--fs-scale))]",
                        isUnread(row) ? "font-black text-[var(--text)]" : "font-bold text-[var(--text-muted)]")}>{row.title}</span>
                      <span className="shrink-0 text-[length:calc(9px*var(--fs-scale))] tabular-nums text-[var(--text-subtle)]">{row.time}</span>
                    </span>
                    {row.role ? (
                      <span className="truncate text-[length:calc(8.5px*var(--fs-scale))] font-bold uppercase tracking-[.06em] text-[var(--text-subtle)]">{row.role}</span>
                    ) : null}
                    <span className="line-clamp-2 text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{row.preview}</span>
                  </span>

                  {isUnread(row) ? <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--primary)]" /> : null}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* reading pane */}
        <div className="nex-scrollbar min-h-0 overflow-y-auto p-4">
          {selected ? (
            <div className="mx-auto max-w-2xl">
              {/* A header block rather than a line of text: the sender is the
                  first thing you look for, so it gets the weight. */}
              <div className="flex items-start gap-3 border-b border-[var(--border)] pb-4">
                {selected.initials ? (
                  <Avatar name={selected.initials ?? ""} initials={selected.initials} size="lg" decorative />
                ) : selected.kind ? (
                  <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", KIND_WASH[selected.kind])}>
                    {React.createElement(KIND_ICON[selected.kind], { className: "size-5" })}
                  </span>
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[length:calc(15px*var(--fs-scale))] font-black tracking-[-.01em]">{selected.title}</h2>
                    {selected.kind ? <Badge tone={KIND_TONE[selected.kind]}>{selected.kind}</Badge> : null}
                    {isUnread(selected) ? <Badge tone="info">unread</Badge> : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[length:calc(9.5px*var(--fs-scale))] text-[var(--text-muted)]">
                    <span className="font-bold">{selected.role ?? (selected.module ? MODULES[selected.module as keyof typeof MODULES]?.label ?? selected.module : "System")}</span>
                    <span aria-hidden>•</span>
                    <span>{selected.time} ago</span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-[length:calc(11.5px*var(--fs-scale))] leading-[1.75]">{selected.detail}</p>

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

              {/* Reply exists only on messages: a notification has no one to
                  answer. It is a compose box over a mock, and says so on send
                  rather than pretending something was delivered. */}
              {messages ? (
                <div className="mt-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <div className="mb-2 text-[length:calc(9.5px*var(--fs-scale))] font-black">Reply to {selected.title.split(" ")[0]}</div>
                  <Textarea rows={3} placeholder="Write a reply…" value={reply} onChange={(event) => setReply(event.target.value)} />
                  <div className="mt-2 flex items-center gap-2">
                    <Button size="sm" variant="primary" leftIcon={<Send className="size-3.5" />} disabled={!reply.trim()}
                      onClick={() => { setReply(""); toast({ title: "Reply not sent", message: "There is no messaging service behind this screen — the draft was discarded.", type: "warning" }); }}>
                      Send
                    </Button>
                    <span className="text-[length:calc(8.5px*var(--fs-scale))] text-[var(--text-subtle)]">Nothing is delivered; this is a prototype.</span>
                  </div>
                </div>
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
