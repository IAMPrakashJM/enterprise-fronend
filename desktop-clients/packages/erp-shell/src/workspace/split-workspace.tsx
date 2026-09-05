"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Maximize2, X } from "lucide-react";
import { IconButton, cn } from "@pepbits/ops-ui";
import type { WorkspaceDocument } from "@pepbits/workspace-core";

const MIN_PERCENT = 20;
const MAX_PERCENT = 80;
const STEP = 2;

/**
 * Two documents side by side, with the divider between them.
 *
 * Renders nothing for fewer than two panes: a split of one is a document, and
 * drawing a divider with nothing on the far side of it is worse than not
 * splitting at all. The store already collapses to that state; this refuses to
 * draw the impossible one either way.
 *
 * The documents themselves arrive through `renderDocument` rather than being
 * imported. erp-screens depends on this package, so reaching the other way
 * would be a cycle.
 */
export function SplitWorkspace({ panes, activeDocumentId, onFocusPane, onClosePane, onSwap, onExit, renderDocument }: {
  panes: WorkspaceDocument[];
  activeDocumentId: string | null;
  onFocusPane: (documentId: string) => void;
  onClosePane: (documentId: string) => void;
  onSwap: () => void;
  onExit: () => void;
  renderDocument: (document: WorkspaceDocument) => React.ReactNode;
}) {
  const [percent, setPercent] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const clamp = (value: number) => Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, value));

  /* Bound to the window, not the divider: once the pointer is down the user is
     allowed to move faster than the 6px handle, and a listener on the handle
     alone drops the drag the moment the cursor outruns it. */
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const box = containerRef.current.getBoundingClientRect();
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

  if (panes.length < 2) return null;
  const [left, right] = panes;

  const pane = (document: WorkspaceDocument, side: "left" | "right") => {
    const focused = document.documentId === activeDocumentId;
    return (
      <section
        role="region"
        /* The name carries the unsaved state, because the amber dot beside the
           title is not available to everyone. */
        aria-label={document.dirty ? `${document.title} — unsaved changes` : document.title}
        aria-current={focused ? "true" : undefined}
        onFocusCapture={() => onFocusPane(document.documentId)}
        onMouseDown={() => onFocusPane(document.documentId)}
        className={cn("flex min-w-0 flex-col overflow-hidden bg-[var(--surface)]", side === "left" ? "border-r border-[var(--border)]" : null)}
        style={{ width: `${side === "left" ? percent : 100 - percent}%` }}
      >
        <header className={cn("flex h-8 shrink-0 items-center gap-2 border-b px-3 transition", focused ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--surface-2)]")}>
          {document.dirty ? <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[var(--warning)]" /> : null}
          <span className={cn("min-w-0 flex-1 truncate text-[length:calc(10px*var(--fs-scale))] font-bold", focused ? "text-[var(--primary-strong)]" : "text-[var(--text-muted)]")}>{document.title}</span>
          {document.closable ? (
            <IconButton label={`Close ${document.title}`} className="size-6" onClick={() => onClosePane(document.documentId)}><X className="size-3" /></IconButton>
          ) : null}
        </header>
        <div className="nex-scrollbar min-h-0 flex-1 overflow-auto">{renderDocument(document)}</div>
      </section>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Once for the split, not once per pane: swapping and collapsing are
          operations on the arrangement, and offering them twice invites the
          question of which one you pressed. */}
      <div className="flex h-8 shrink-0 items-center justify-end gap-1 border-b border-[var(--border)] bg-[var(--surface-2)] px-2">
        <span className="mr-auto text-[length:calc(9px*var(--fs-scale))] font-bold uppercase tracking-[.06em] text-[var(--text-subtle)]">Split view</span>
        <IconButton label="Swap the panes" className="size-7" onClick={onSwap}><ArrowLeftRight className="size-3.5" /></IconButton>
        <IconButton label="Make full screen" className="size-7" onClick={onExit}><Maximize2 className="size-3.5" /></IconButton>
      </div>
      <div ref={containerRef} className="flex min-h-0 flex-1">
        {pane(left, "left")}
        {/* A separator with a value, and arrow keys that move it. A divider that
            answers only to a drag is one a keyboard user cannot touch, in the
            single layout where where the split sits is the whole point. */}
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label="Resize the split"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={MIN_PERCENT}
          aria-valuemax={MAX_PERCENT}
          onPointerDown={(event) => { dragging.current = true; event.preventDefault(); }}
          onKeyDown={onDividerKey}
          className="focus-ring group relative w-1 shrink-0 cursor-col-resize bg-[var(--border)] transition hover:bg-[var(--primary)]"
        >
          <span aria-hidden className="absolute inset-y-0 -left-1 -right-1" />
        </div>
        {pane(right, "right")}
      </div>
    </div>
  );
}
