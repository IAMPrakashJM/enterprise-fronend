"use client";

import React from "react";
import { useERP } from "@/context/erp-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { WorkspaceTabs } from "./workspace-tabs";
import { Footer } from "./footer";

export function EnterpriseShell({ children }: { children: React.ReactNode }) {
  const { preferences } = useERP();
  return (
    <div className={`flex h-dvh w-full overflow-hidden ${preferences.sidebarPlacement === "right" ? "flex-row-reverse" : "flex-row"}`}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <WorkspaceTabs />
        <main className="nex-scrollbar relative min-h-0 flex-1 overflow-auto bg-[var(--bg)] p-3 md:p-4">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
