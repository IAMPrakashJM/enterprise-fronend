import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { NavigationProvider } from "@pepbits/platform-ports";
import { SessionProvider, useSession } from "@pepbits/auth";
import { ERPProvider, EnterpriseShell, GlobalLayers, useERP } from "@pepbits/erp-shell";
import { LoginScreen, PageRenderer, SessionSplash } from "@pepbits/erp-screens";
import { AiSourcesProvider } from "@pepbits/ai-client";
import { AssistantPanel } from "@pepbits/ai-ui";
import { useMdiNavigation } from "./mdi/use-mdi-navigation";
import { WorkspaceTabs } from "./mdi/workspace-tabs";
import "./globals.css";

/* Split out because the tab strip needs setCommandOpen, which only exists inside
   ERPProvider. */
function Workspace({ mdi }: { mdi: ReturnType<typeof useMdiNavigation> }) {
  const { setCommandOpen, preferences } = useERP();
  /* This is where openRecordsInTabs actually reaches the tab logic. The hook
     lives above the provider and cannot read preferences; this component lives
     below it and can. */
  useEffect(() => { mdi.setTabsEnabled(preferences.openRecordsInTabs); }, [mdi.setTabsEnabled, preferences.openRecordsInTabs]);
  return (
    <EnterpriseShell
      tabs={
        <WorkspaceTabs
          tabs={mdi.tabs}
          activeTabId={mdi.activeTabId}
          onActivate={mdi.setActiveTabId}
          onClose={mdi.closeTab}
          onCloseOthers={mdi.closeOtherTabs}
          onOpenCommand={() => setCommandOpen(true)}
        />
      }
    >
      <PageRenderer target={mdi.activeTab.target} />
    </EnterpriseShell>
  );
}

/* The same gate the web shell uses, in the same order, so a session behaves
   identically in both. Mounting the MDI hook below the gate means a fresh sign-in
   starts on a clean tab set rather than the previous user's. */
function Gate() {
  const { status, login } = useSession();
  if (status === "loading") return <SessionSplash />;
  if (status === "anonymous") return <LoginScreen onSubmit={login} />;
  return <Authenticated />;
}

function Authenticated() {
  const mdi = useMdiNavigation();
  return (
    <NavigationProvider value={mdi.port}>
      <ERPProvider fallback={<SessionSplash />}>
        {/* See apps/web/src/platform/providers.tsx for why this is mounted in
            the app rather than in erp-shell's GlobalLayers. */}
        <AiSourcesProvider>
          <Workspace mdi={mdi} />
          <GlobalLayers />
          <AssistantPanel />
        </AiSourcesProvider>
      </ERPProvider>
    </NavigationProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SessionProvider>
      <Gate />
    </SessionProvider>
  </React.StrictMode>,
);
