import React, { useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { NavigationProvider } from "@pepbits/platform-ports";
import { SessionProvider, useSession } from "@pepbits/auth";
import type { SessionUser } from "@pepbits/auth";
import { ERPProvider, EnterpriseShell, GlobalLayers, WorkspaceTabs, useERP, useWorkspaceNavigation, skeletonsPreferred } from "@pepbits/erp-shell";
import { LoginScreen, PageRenderer, SessionSplash, ShellSkeleton } from "@pepbits/erp-screens";
import { createWorkspace, WorkspaceProvider } from "@pepbits/workspace-core";
import { ConfirmDialog } from "@pepbits/ops-ui";
import { AiSourcesProvider } from "@pepbits/ai-client";
import { AssistantPanel } from "@pepbits/ai-ui";
import "./globals.css";

/* Split out because the tab strip needs setCommandOpen, which only exists inside
   ERPProvider. */
function Workspace({ nav }: { nav: ReturnType<typeof useWorkspaceNavigation> }) {
  const { setCommandOpen, preferences } = useERP();
  const workspace = nav.workspace;

  /* Where openRecordsInTabs actually reaches the workspace. The navigation hook
     lives above the provider and cannot read preferences; this component lives
     below it and can.

     Off means SINGLE -- one document at a time, the next one replacing the
     last. It used to mean "openInNewContext may append a duplicate", which stopped
     meaning anything once the store began deduplicating by document key: two tabs
     of one encounter are two unsaved drafts of the same record. */
  useEffect(() => {
    workspace.setPolicy({
      platform: { modes: ["SINGLE", "TAB"] },
      user: { modes: preferences.openRecordsInTabs ? ["TAB"] : ["SINGLE"] },
    });
  }, [workspace, preferences.openRecordsInTabs]);

  return (
    <>
      <EnterpriseShell
        tabs={
          <WorkspaceTabs
            documents={nav.documents}
            activeDocumentId={nav.activeDocument?.documentId ?? null}
            onActivate={nav.focusDocument}
            onClose={nav.closeDocument}
            onCloseOthers={nav.closeOthers}
            onOpenCommand={() => setCommandOpen(true)}
          />
        }
      >
        <PageRenderer target={nav.port.current} />
      </EnterpriseShell>
      {/* Every destructive path in the workspace routes through here. Before
          this, crossing from Finance to HR rebuilt the tab set and threw away
          every half-filled form in it without asking. */}
      <ConfirmDialog
        open={nav.pending !== null}
        title={nav.pending?.label ?? ""}
        message={nav.pending?.message ?? ""}
        confirmLabel={nav.pending?.confirmLabel ?? "Continue"}
        tone="danger"
        onConfirm={nav.confirmPending}
        onCancel={nav.cancelPending}
      />
    </>
  );
}

/* The same gate the web shell uses, in the same order, so a session behaves
   identically in both. Mounting the workspace below the gate means a fresh sign-in
   starts on a clean tab set rather than the previous user's. */
function Gate() {
  const { status, login, user } = useSession();
  if (status === "loading") return <SessionSplash />;
  if (status === "anonymous" || !user) return <LoginScreen onSubmit={login} />;
  return <Authenticated user={user} />;
}

function Authenticated({ user }: { user: SessionUser }) {
  /* Keyed on the account, so signing in as someone else builds a new store
     rather than inheriting the previous user's documents. The tenant is the
     server's answer, never a claim from this client. */
  const workspace = useMemo(
    () => createWorkspace({
      session: { tenantId: user.tenantId, userId: user.id, roleId: user.role, branchId: user.branch },
      policy: { platform: { modes: ["SINGLE", "TAB"] } },
    }),
    [user.tenantId, user.id, user.role, user.branch],
  );
  const nav = useWorkspaceNavigation(workspace);
  return (
    <WorkspaceProvider workspace={workspace}>
      <NavigationProvider value={nav.port}>
        <ERPProvider fallback={skeletonsPreferred() ? <ShellSkeleton /> : <SessionSplash />}>
          {/* See apps/web/src/platform/providers.tsx for why this is mounted in
              the app rather than in erp-shell's GlobalLayers. */}
          <AiSourcesProvider>
            <Workspace nav={nav} />
            <GlobalLayers />
            <AssistantPanel />
          </AiSourcesProvider>
        </ERPProvider>
      </NavigationProvider>
    </WorkspaceProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SessionProvider>
      <Gate />
    </SessionProvider>
  </React.StrictMode>,
);
