import React from "react";
import { createRoot } from "react-dom/client";
import { NavigationProvider } from "@pepbits/platform-ports";
import { ERPProvider, EnterpriseShell, GlobalLayers, useERP } from "@pepbits/erp-shell";
import { PageRenderer } from "@pepbits/erp-screens";
import { useMdiNavigation } from "./mdi/use-mdi-navigation";
import { WorkspaceTabs } from "./mdi/workspace-tabs";
import "./globals.css";

/* Split out because the tab strip needs setCommandOpen, which only exists inside
   ERPProvider. */
function Workspace({ mdi }: { mdi: ReturnType<typeof useMdiNavigation> }) {
  const { setCommandOpen } = useERP();
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

function App() {
  const mdi = useMdiNavigation();
  return (
    <NavigationProvider value={mdi.port}>
      <ERPProvider>
        <Workspace mdi={mdi} />
        <GlobalLayers />
      </ERPProvider>
    </NavigationProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
