"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MODULES } from "@pepbits/erp-config";
import type { ModuleKey } from "@pepbits/erp-config";
import { dashboardPageId, useERP } from "@pepbits/erp-shell";
import { SessionSplash } from "@pepbits/erp-screens";
import { LAST_PAGE_KEY, hrefFor } from "./web-navigation";

function read(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

/** Where "/" goes, decided by the landingPage preference. */
export function LandingRedirect() {
  const router = useRouter();
  const { preferences } = useERP();

  useEffect(() => {
    if (preferences.landingPage === "last-visited") {
      const last = read(LAST_PAGE_KEY);
      // Only an in-app path: a stored value is user-writable, and a bare
      // "/" would loop straight back here.
      if (last && last.startsWith("/") && last !== "/" && !last.startsWith("//")) {
        router.replace(last);
        return;
      }
    }
    /* nexora-module is what ERPProvider writes on every module change; falling
       back to finance keeps the historical behaviour for a fresh browser. */
    const stored = read("nexora-module");
    const module: ModuleKey = stored && stored in MODULES ? (stored as ModuleKey) : "finance";
    router.replace(hrefFor({ pageId: dashboardPageId(module) }));
  }, [preferences.landingPage, router]);

  return <SessionSplash />;
}
