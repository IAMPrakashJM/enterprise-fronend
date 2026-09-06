"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { authedFetch } from "@pepbits/auth";
import { PAGE_REGISTRY } from "@pepbits/erp-config";
import { SavedViewScreen, type SavedView } from "@pepbits/erp-screens";

export function SavedViewRoute({ viewId }: { viewId: string }) {
  const router = useRouter();

  const open = useCallback((view: SavedView) => {
    const page = PAGE_REGISTRY[view.pageId];
    if (!page) return;
    /* replace, not push: the /view link is a one-time redemption, and leaving
       it in the history means Back re-fetches it and Forward lands on a screen
       whose filters have already been applied elsewhere. */
    router.replace(`/${page.module}/${view.pageId}`);
    /* The filters travel out of band, never through the URL that receives them —
       which would undo the whole point of having been given an id. The page id
       travels with them so the worklist can check the handoff is meant for it,
       and the worklist TAKES the entry rather than reading it: sessionStorage is
       a web store, not memory, and a patient name must not sit in one for the
       life of the tab. */
    window.sessionStorage.setItem("nexora-pending-view", JSON.stringify({ pageId: view.pageId, filters: view.filters }));
  }, [router]);

  return (
    <SavedViewScreen
      viewId={viewId}
      fetchView={(id) => authedFetch(`/views/${encodeURIComponent(id)}`)}
      onOpen={open}
    />
  );
}
