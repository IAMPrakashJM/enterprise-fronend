"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authedFetch, useSession } from "@pepbits/auth";
import type { ColumnLayoutScope, DataColumn } from "@pepbits/erp-config";

export interface ColumnLayout {
  columns: string[];
  sort: { key: string; direction: "asc" | "desc" } | null;
}

/* One in-memory copy of the account-scoped layouts, shared by every worklist in
   the session. Without it, each page switch refetches /layouts and the table
   renders once with defaults before the response lands -- a visible flash of the
   wrong columns on every navigation.
   TAGGED WITH THE USER ID, and dropped when it changes: a module-level cache
   outlives sign-out, so an untagged one would show the previous account's
   columns to the next person who signs in on this browser. */
let cacheOwner: string | null = null;
let accountCache: Record<string, ColumnLayout> | null = null;
let accountInflight: Promise<Record<string, ColumnLayout>> | null = null;

async function loadAccountLayouts(userId: string): Promise<Record<string, ColumnLayout>> {
  if (cacheOwner !== userId) {
    cacheOwner = userId;
    accountCache = null;
    accountInflight = null;
  }
  if (accountCache) return accountCache;
  if (!accountInflight) {
    accountInflight = (async () => {
      try {
        const response = await authedFetch("/layouts");
        const body = response.ok ? ((await response.json()) as { layouts?: Record<string, ColumnLayout> }) : {};
        accountCache = body.layouts ?? {};
      } catch {
        // API unreachable: behave as "nothing saved" rather than blocking the table.
        accountCache = {};
      } finally {
        accountInflight = null;
      }
      return accountCache;
    })();
  }
  return accountInflight;
}

function readBrowser(pageId: string): ColumnLayout | null {
  try {
    const columns = window.localStorage.getItem(`nexora-columns:${pageId}`);
    const sort = window.localStorage.getItem(`nexora-sort:${pageId}`);
    if (!columns && !sort) return null;
    return { columns: columns ? (JSON.parse(columns) as string[]) : [], sort: sort ? JSON.parse(sort) : null };
  } catch {
    return null;
  }
}

function writeBrowser(pageId: string, layout: ColumnLayout) {
  try {
    window.localStorage.setItem(`nexora-columns:${pageId}`, JSON.stringify(layout.columns));
    if (layout.sort) window.localStorage.setItem(`nexora-sort:${pageId}`, JSON.stringify(layout.sort));
    else window.localStorage.removeItem(`nexora-sort:${pageId}`);
  } catch {
    // Private browsing: the layout simply will not survive a reload.
  }
}

/**
 * Worklist column visibility and sort, kept per page in whichever store the
 * `columnLayoutScope` preference names.
 *
 * The two stores are NOT synchronised on purpose. Switching scope changes where
 * this page looks, and each store keeps whatever it already had -- copying one
 * into the other would silently overwrite a layout the user built on their other
 * machine, which is the more expensive mistake.
 */
export function useColumnLayout(pageId: string, scope: ColumnLayoutScope, columns: DataColumn[], defaults: string[]) {
  const { user } = useSession();
  const userId = user?.id ?? "anonymous";
  const [visibleKeys, setVisibleKeys] = useState<string[]>(defaults);
  const [sort, setSort] = useState<ColumnLayout["sort"]>(null);
  /* Suppresses the save that the load itself would otherwise trigger: without
     it, mounting writes back exactly what it just read, and for the account
     scope that is a PUT per page view. */
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    hydrated.current = false;

    const apply = (layout: ColumnLayout | null) => {
      if (cancelled) return;
      // A saved key that no longer exists in the schema is dropped rather than
      // rendering an empty column, which is what a renamed field would produce.
      const valid = (layout?.columns ?? []).filter((key) => columns.some((column) => column.key === key));
      setVisibleKeys(valid.length ? valid : defaults);
      setSort(layout?.sort ?? null);
      hydrated.current = true;
    };

    if (scope === "browser") apply(readBrowser(pageId));
    else void loadAccountLayouts(userId).then((all) => apply(all[pageId] ?? null));

    return () => { cancelled = true; };
  }, [columns, defaults, pageId, scope, userId]);

  useEffect(() => {
    if (!hydrated.current) return;
    const layout: ColumnLayout = { columns: visibleKeys, sort };
    if (scope === "browser") { writeBrowser(pageId, layout); return; }

    accountCache = { ...(accountCache ?? {}), [pageId]: layout };
    /* Debounced for the same reason preferences are: dragging through a column
       list would otherwise fire a request per checkbox. */
    const timer = window.setTimeout(() => {
      void authedFetch("/layouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, layout }),
      }).catch(() => {
        // A failed save is not worth interrupting the user over in a demo.
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [pageId, scope, sort, visibleKeys]);

  const reset = useCallback(() => { setVisibleKeys(defaults); setSort(null); }, [defaults]);

  return { visibleKeys, setVisibleKeys, sort, setSort, reset };
}
