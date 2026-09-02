"use client";

import React from "react";
import { NavigationProvider } from "@pepbits/platform-ports";
import { ERPProvider, EnterpriseShell, GlobalLayers } from "@pepbits/erp-shell";
import { useWebNavigation } from "./web-navigation";

/* No `tabs` prop: the workspace tab strip is desktop-only. On web a second open
   record is a second browser tab. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const navigation = useWebNavigation();
  return (
    <NavigationProvider value={navigation}>
      <ERPProvider>
        <EnterpriseShell>{children}</EnterpriseShell>
        <GlobalLayers />
      </ERPProvider>
    </NavigationProvider>
  );
}
