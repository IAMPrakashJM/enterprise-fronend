"use client";

import { useMemo } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { PAGE_REGISTRY } from "@pepbits/erp-config";
import type { NavigationPort, NavigationTarget } from "@pepbits/platform-ports";

/** The canonical module segment for a page. "shared" pages live under /shared. */
export function moduleSegmentFor(pageId: string): string {
  const page = PAGE_REGISTRY[pageId];
  return page ? page.module : "shared";
}

export function hrefFor(target: NavigationTarget): string {
  const base = `/${moduleSegmentFor(target.pageId)}/${target.pageId}`;
  if (target.mode === "new") return `${base}/new`;
  if (target.recordId) return target.mode === "edit" ? `${base}/${target.recordId}/edit` : `${base}/${target.recordId}`;
  return base;
}

export function useWebNavigation(): NavigationPort {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ module?: string; page?: string; recordId?: string }>();

  return useMemo(() => {
    const last = pathname.split("/").filter(Boolean).at(-1);
    const mode: NavigationTarget["mode"] | undefined =
      last === "new" ? "new" : last === "edit" ? "edit" : params.recordId ? "view" : undefined;

    const current: NavigationTarget = {
      pageId: params.page ?? "finance-dashboard",
      ...(mode ? { mode } : {}),
      ...(params.recordId ? { recordId: params.recordId } : {}),
    };

    return {
      current,
      open: (target) => router.push(hrefFor(target)),
      /* Always from a user gesture, so this is not popup-blocked. noopener because
         the new tab has no reason to reach back into this one. */
      openInNewContext: (target) => { window.open(hrefFor(target), "_blank", "noopener"); },
      hrefFor,
    };
  }, [params.page, params.recordId, pathname, router]);
}
