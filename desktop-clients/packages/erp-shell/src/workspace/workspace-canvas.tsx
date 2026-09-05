"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Maximize2, X } from "lucide-react";
import { IconButton, cn } from "@pepbits/ops-ui";
import { DocumentProvider, type WorkspaceDocument } from "@pepbits/workspace-core";

const MIN_PERCENT = 20;
const MAX_PERCENT = 80;
const STEP = 2;

/**
 * Where documents are drawn.
 *
 * Every warm document is mounted here at once and all but the visible ones are
 * hidden, because unmounting a screen throws away its scroll position, its
 * filters and its half-typed form — and switching tabs is the most ordinary
 * thing a user does. Suspended documents are not mounted at all; that is what
 * the warm limit is for, and why twelve open tabs are not twelve live
 * applications.
 *
 * They all live in ONE flex row, keyed by document id, with visibility and
 * order set by style. Moving a screen between two containers — a "split" tree
 * and a "single" tree, say — is a remount to React, which loses exactly the
 * state this exists to keep. So the split is CSS order on the same children,
 * not a different parent.
 */
export function WorkspaceCanvas({ documents, splitIds, activeDocumentId, onFocusPane, onClosePane, onSwap, onExitSplit, renderDocument }: {
  documents: WorkspaceDocument[];
  splitIds: string[];
  activeDocumentId: string | null;
  onFocusPane: (documentId: string) => void;
  onClosePane: (documentId: string) => void;
  onSwap: () => void;
  onExitSplit: () => void;
  renderDocument: (document: WorkspaceDocument) => React.ReactNode;
}) {
  const [percent, setPercent] = useState(50);
  const rowRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const clamp = (value: number) => Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, value));

  /* Bound to the window, not the divider: once the pointer is down the user is
     allowed to move faster than a 4px handle, and a listener on the handle
     alone drops the drag the moment the cursor outruns it. */
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current || !rowRef.current) return;
      const box = rowRef.current.getBoundingClientRect();
      if (box.width === 0) return;
      setPercent(clamp(((event.clientX - box.left) / box.width) * 100));
    };
    const up = () => { dragging.current = false; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  const onDividerKey = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); setPercent((p) => clamp(p - STEP)); }
    else if (event.key === "ArrowRight") { event.preventDefault(); setPercent((p) => clamp(p + STEP)); }
    else if (event.key === "Home") { event.preventDefault(); setPercent(50); }
  }, []);

  const split = splitIds.length >= 2;
  const mounted = documents.filter((doc) => doc.state !== "SUSPENDED");
  const visible = split ? splitIds : activeDocumentId ? [activeDocumentId] : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {split ? (
        /* Once for the arrangement, not once per pane: swapping and collapsing
           are operations on the split, and offering them twice invites the
           question of which one you pressed. */
        <div className="flex h-8 shrink-0 items-center justify-end gap-1 border-b border-[var(--border)] bg-[var(--surface-2)] px-2">
          <span className="mr-auto text-[length:calc(9px*var(--fs-scale))] font-bold uppercase tracking-[.06em] text-[var(--text-subtle)]">Split view</span>
          <IconButton label="Swap the panes" className="size-7" onClick={onSwap}><ArrowLeftRight className="size-3.5" /></IconButton>
          <IconButton label="Make full screen" className="size-7" onClick={onExitSplit}><Maximize2 className="size-3.5" /></IconButton>
        </div>
      ) : null}

      <div ref={rowRef} className="flex min-h-0 flex-1">
        {mounted.map((document) => {
          const at = visible.indexOf(document.documentId);
          const shown = at >= 0;
          const focused = document.documentId === activeDocumentId;
          const width = !shown ? undefined : !split ? "100%" : at === 0 ? `${percent}%` : `${100 - percent}%`;
          return (
            <div
              key={document.documentId}
              /* inert, not just hidden: display:none already takes it out of
                 the tab order, but a screen reader or a stray programmatic
                 focus should not reach a document nobody is looking at. */
              inert={!shown}
              aria-hidden={!shown || undefined}
              style={{ display: shown ? "flex" : "none", order: shown ? at * 2 : 99, width }}
              className="min-w-0 flex-col overflow-hidden bg-[var(--surface)]"
            >
              {/* The SAME tree whether split or not — only attributes change.
                  Wrapping the document in a <section> just for the split moved
                  it a level deeper, which React reconciles as a remount, and
                  entering a split lost the very form the split was opened to
                  compare. The header renders as null rather than being absent,
                  so the content keeps its position among its siblings. */}
              <section
                role={split ? "region" : undefined}
                aria-label={split ? (document.dirty ? `${document.title} — unsaved changes` : document.title) : undefined}
                aria-current={split && focused ? "true" : undefined}
                onFocusCapture={() => onFocusPane(document.documentId)}
                onMouseDown={() => onFocusPane(document.documentId)}
                className="flex min-h-0 flex-1 flex-col"
              >
                {split ? (
                  <header className={cn("flex h-8 shrink-0 items-center gap-2 border-b px-3 transition", focused ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--surface-2)]")}>
                    {document.dirty ? <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[var(--warning)]" /> : null}
                    <span className={cn("min-w-0 flex-1 truncate text-[length:calc(10px*var(--fs-scale))] font-bold", focused ? "text-[var(--primary-strong)]" : "text-[var(--text-muted)]")}>{document.title}</span>
                    {document.closable ? <IconButton label={`Close ${document.title}`} className="size-6" onClick={() => onClosePane(document.documentId)}><X className="size-3" /></IconButton> : null}
                  </header>
                ) : null}
                <div className={cn("min-h-0 flex-1", split ? "nex-scrollbar overflow-auto" : "flex flex-col")}>
                  <DocumentProvider documentId={document.documentId}>{renderDocument(document)}</DocumentProvider>
                </div>
              </section>
            </div>
          );
        })}

        {split ? (
          <div
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Resize the split"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={MIN_PERCENT}
            aria-valuemax={MAX_PERCENT}
            style={{ order: 1 }}
            onPointerDown={(event) => { dragging.current = true; event.preventDefault(); }}
            onKeyDown={onDividerKey}
            className="focus-ring relative w-1 shrink-0 cursor-col-resize bg-[var(--border)] transition hover:bg-[var(--primary)]"
          >
            <span aria-hidden className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
