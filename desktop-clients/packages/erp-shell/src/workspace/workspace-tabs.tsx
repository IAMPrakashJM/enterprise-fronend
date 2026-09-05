"use client";

import { Ellipsis, ExternalLink, Plus, X } from "lucide-react";
import { ActionMenu, IconButton, MenuButton, cn } from "@pepbits/ops-ui";
import type { WorkspaceDocument } from "@pepbits/workspace-core";

/**
 * The workspace tab strip.
 *
 * Moved out of apps/desktop so both shells draw the same thing, and made a
 * `tablist` rather than a row of buttons: the active tab used to be a coloured
 * underline and nothing else, so a screen reader announced several identical
 * tabs with no way to tell which one was open.
 *
 * Deliberately dumb -- it takes documents and callbacks. The store, the policy
 * and the unsaved-changes question all live above it.
 */
export function WorkspaceTabs({ documents, activeDocumentId, onActivate, onClose, onCloseOthers, onOpenCommand, onSplit, onSwap, onExitSplit, isSplit, onDetach, detachedIds }: {
  documents: WorkspaceDocument[];
  activeDocumentId: string | null;
  onActivate: (documentId: string) => void;
  onClose: (documentId: string) => void;
  onCloseOthers: (documentId: string) => void;
  onOpenCommand: () => void;
  /** Split actions. Omitted where the shell cannot split. */
  onSplit?: () => void;
  onSwap?: () => void;
  onExitSplit?: () => void;
  isSplit?: boolean;
  /** Omitted where the shell cannot open windows. */
  onDetach?: (documentId: string) => void;
  detachedIds?: string[];
}) {
  const activeId = documents.some((doc) => doc.documentId === activeDocumentId) ? activeDocumentId : documents[0]?.documentId ?? null;
  return (
    <div className="no-print flex h-[var(--tabbar-height)] shrink-0 items-end border-b border-[var(--border)] bg-[var(--surface-2)] px-2">
      {/* Named, because a page can have tablists of its own — a billing record has
          six — and "tablist" on its own does not say which one holds the open
          documents. */}
      <div role="tablist" aria-label="Open documents" className="nex-scrollbar flex min-w-0 flex-1 items-end gap-1 overflow-x-auto overflow-y-hidden pt-1.5">
        {documents.map((doc) => {
          const active = doc.documentId === activeId;
          const detached = detachedIds?.includes(doc.documentId) ?? false;
          return (
            <button
              key={doc.documentId}
              type="button"
              role="tab"
              aria-selected={active}
              /* The dot is a dot. The word is what a screen reader gets, and it
                 is the only warning before the close button is pressed. */
              aria-label={[doc.title, detached ? "in its own window" : null, doc.dirty ? "unsaved changes" : null].filter(Boolean).join(" — ")}
              onClick={() => onActivate(doc.documentId)}
              className={cn("focus-ring group relative flex h-9 max-w-56 shrink-0 items-center gap-2 rounded-t-[11px] border px-3 text-left transition", active ? "border-[var(--border)] border-b-[var(--surface)] bg-[var(--surface)] text-[var(--text)]" : "border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-3)]")}
            >
              {detached
                ? <ExternalLink aria-hidden className="size-3 shrink-0 text-[var(--text-subtle)]" />
                : <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", doc.dirty ? "bg-[var(--warning)]" : active ? "bg-[var(--primary)]" : "bg-[var(--text-subtle)]")} />}
              <span className="min-w-0 flex-1 truncate text-[length:calc(10.5px*var(--fs-scale))] font-bold">{doc.title}</span>
              {doc.closable ? (
                /* A nested button would be invalid inside the tab, so this is a
                   span with a role. stopPropagation, or closing also activates
                   the tab being removed and the shell paints a page on its way
                   out. */
                <span role="button" tabIndex={0} aria-label={`Close ${doc.title}`}
                  onClick={(event) => { event.stopPropagation(); onClose(doc.documentId); }}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onClose(doc.documentId); } }}
                  className="flex size-5 shrink-0 items-center justify-center rounded-md opacity-0 transition hover:bg-[var(--surface-3)] group-hover:opacity-100 focus:opacity-100">
                  <X className="size-3" />
                </span>
              ) : null}
              {active ? <span aria-hidden className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-[var(--primary)]" /> : null}
            </button>
          );
        })}
      </div>
      <div className="mb-1 flex shrink-0 items-center gap-0.5 border-l border-[var(--border)] pl-1.5">
        <IconButton label="Open page" className="size-8" onClick={() => onOpenCommand()}><Plus className="size-3.5" /></IconButton>
        <ActionMenu trigger={<IconButton label="Tab options" className="size-8"><Ellipsis className="size-3.5" /></IconButton>}>
          {(close) => <>
            {onDetach && activeId && !detachedIds?.includes(activeId) ? <MenuButton label="Open in its own window" onClick={() => { onDetach(activeId); close(); }} /> : null}
            {onSplit && !isSplit ? <MenuButton label="Split with the last document" hint="Alt+\\" onClick={() => { onSplit(); close(); }} /> : null}
            {isSplit && onSwap ? <MenuButton label="Swap the panes" onClick={() => { onSwap(); close(); }} /> : null}
            {isSplit && onExitSplit ? <MenuButton label="Make full screen" hint="Alt+Shift+\\" onClick={() => { onExitSplit(); close(); }} /> : null}
            <MenuButton label="Close other tabs" onClick={() => { if (activeId) onCloseOthers(activeId); close(); }} />
            <MenuButton label="Open command palette" onClick={() => { onOpenCommand(); close(); }} />
          </>}
        </ActionMenu>
      </div>
    </div>
  );
}
