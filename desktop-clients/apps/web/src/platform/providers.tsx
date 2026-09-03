"use client";

import React from "react";
import { NavigationProvider } from "@pepbits/platform-ports";
import { SessionProvider, useSession } from "@pepbits/auth";
import { ERPProvider, EnterpriseShell, GlobalLayers } from "@pepbits/erp-shell";
import { LoginScreen, SessionSplash } from "@pepbits/erp-screens";
import { useWebNavigation } from "./web-navigation";

/* The gate is client-side rather than a /login route, because the token lives in
   localStorage — the only store the web and desktop shells can both use. Next
   middleware cannot read it, and a cookie cannot reach the packaged Tauri app, which
   is a different origin. One mechanism, identical in both shells.
   The cost, accepted: signed out on web you stay at the current URL and see the login
   screen there, rather than being bounced to /login and back. */
function Gate({ children }: { children: React.ReactNode }) {
  const { status, login } = useSession();
  const navigation = useWebNavigation();

  if (status === "loading") return <SessionSplash />;
  if (status === "anonymous") return <LoginScreen onSubmit={login} />;

  return (
    <NavigationProvider value={navigation}>
      <ERPProvider>
        <EnterpriseShell>{children}</EnterpriseShell>
        <GlobalLayers />
      </ERPProvider>
    </NavigationProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Gate>{children}</Gate>
    </SessionProvider>
  );
}
