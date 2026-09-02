"use client";

import React from "react";
import { useERP } from "./erp-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Footer } from "./footer";

/* Structurally identical to the original shell, with one substitution: the workspace
   tab strip was mounted here directly and is now the `tabs` prop, because it exists
   only on desktop. The desktop app passes <WorkspaceTabs/>; the web app passes
   nothing and the band collapses. Everything else is shared and unchanged. */
export function EnterpriseShell({ tabs, children }: { tabs?: React.ReactNode; children: React.ReactNode }) {
  const { preferences } = useERP();
  return (
    /* relative: the sidebar is absolutely positioned inside this box so that hover
         expansion floats over the page instead of pushing it. */
    <div className={`relative flex h-dvh w-full overflow-hidden ${preferences.sidebarPlacement === "right" ? "flex-row-reverse" : "flex-row"}`}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        {tabs}
        <main className="nex-scrollbar relative min-h-0 flex-1 overflow-auto bg-[var(--bg)] p-3 md:p-4">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
