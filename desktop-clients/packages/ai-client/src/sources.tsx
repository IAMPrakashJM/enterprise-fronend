"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AiSources } from "./assemble.ts";

/**
 * What the current page is willing to hand the assistant.
 *
 * A page PUBLISHES; the assistant reads. The inversion matters: if the panel
 * reached into pages for data it would need a way to find it, and a general
 * finder is exactly the "fetches related records" widening the design forbids
 * (spec D5). Here a page can only offer what it already has on screen, and the
 * use case still filters that down.
 */
const SourcesContext = createContext<{
  sources: AiSources;
  publish: (owner: string, sources: AiSources) => void;
  retract: (owner: string) => void;
} | null>(null);

export function AiSourcesProvider({ children }: { children: React.ReactNode }) {
  /* Keyed by owner so an unmounting page removes exactly its own contribution.
     A single flat object would let a stale worklist selection survive into the
     next page, which is precisely the kind of leak nobody notices. */
  const [byOwner, setByOwner] = useState<Record<string, AiSources>>({});

  const value = useMemo(() => ({
    sources: Object.values(byOwner).reduce<AiSources>((all, one) => ({ ...all, ...one }), {}),
    publish: (owner: string, sources: AiSources) =>
      setByOwner((previous) => (JSON.stringify(previous[owner]) === JSON.stringify(sources) ? previous : { ...previous, [owner]: sources })),
    retract: (owner: string) =>
      setByOwner((previous) => {
        if (!(owner in previous)) return previous;
        const next = { ...previous };
        delete next[owner];
        return next;
      }),
  }), [byOwner]);

  return <SourcesContext.Provider value={value}>{children}</SourcesContext.Provider>;
}

/** Read-only view, for the assistant. Empty when no provider is mounted, which
    is a page with nothing to offer rather than an error. */
export function useAiSources(): AiSources {
  return useContext(SourcesContext)?.sources ?? {};
}

/**
 * Publish this page's data for as long as the component is mounted.
 *
 * The compare in `publish` is what keeps this from looping: callers pass a
 * freshly built object every render, and without it each publish would set
 * state, re-render, and publish again.
 */
export function usePublishAiSources(owner: string, sources: AiSources): void {
  const context = useContext(SourcesContext);
  const serialised = JSON.stringify(sources);
  const latest = useRef(sources);
  latest.current = sources;

  useEffect(() => {
    if (!context) return;
    context.publish(owner, latest.current);
    return () => context.retract(owner);
    // serialised, not `sources`: a new object with identical content is not a change.
  }, [context, owner, serialised]);
}
