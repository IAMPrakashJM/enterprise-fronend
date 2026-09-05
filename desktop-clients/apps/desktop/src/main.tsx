import React, { useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { NavigationProvider, WindowPortProvider } from "@pepbits/platform-ports";
import { SessionProvider, useSession } from "@pepbits/auth";
import type { SessionUser } from "@pepbits/auth";
import { targetFromDocument, useDetachedWindows } from "@pepbits/erp-shell";
import { ERPProvider, EnterpriseShell, GlobalLayers, WorkspaceCanvas, WorkspaceTabs, useERP, useWorkspaceNavigation, skeletonsPreferred } from "@pepbits/erp-shell";
import { LoginScreen, PageRenderer, SessionSplash, ShellSkeleton } from "@pepbits/erp-screens";
import { createWorkspace, parseDocumentKey, WorkspaceProvider } from "@pepbits/workspace-core";
import { createTauriWindowPort, detachedDocumentKey } from "./platform/tauri-windows";
import { ConfirmDialog } from "@pepbits/ops-ui";
import { AiSourcesProvider } from "@pepbits/ai-client";
import { AssistantPanel } from "@pepbits/ai-ui";
import "./globals.css";

/* Split out because the tab strip needs setCommandOpen, which only exists inside
   ERPProvider. */
function Workspace({ nav }: { nav: ReturnType<typeof useWorkspaceNavigation> }) {
  const { setCommandOpen, preferences, toast } = useERP();
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
      platform: {
        modes: ["SINGLE", "TAB", "SPLIT", "WINDOW"],
        allowDetach: true,
        /* Three off-screen documents stay mounted, so switching back to
           something recent is instant and nothing typed into it is lost.
           Everything past that is released. A desktop shell can afford a few
           live screens; it cannot afford twelve. */
        limits: { maxWarmDocuments: 3 },
      },
      /* SPLIT survives either way: it is a thing you do to two documents, not a
         preference about how many tabs there are. Turning tabs off and then
         being unable to compare two records would read as a bug. */
      user: { modes: preferences.openRecordsInTabs ? ["TAB", "SPLIT", "WINDOW"] : ["SINGLE", "SPLIT", "WINDOW"] },
    });
  }, [workspace, preferences.openRecordsInTabs]);

  const split = nav.splitPanes.length >= 2;

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
            onSplit={() => { const result = nav.splitCurrent("right"); if (result.reason) toast({ type: "warning", title: result.reason }); }}
            onSwap={nav.swapSplit}
            onExitSplit={nav.exitSplit}
            isSplit={split}
            onDetach={windowPort.available ? (documentId) => { const result = nav.detach(documentId); if (result.reason) toast({ type: "warning", title: result.reason }); } : undefined}
            detachedIds={nav.detachedIds}
          />
        }
      >
        <WorkspaceCanvas
          documents={nav.localDocuments}
          splitIds={nav.splitIds}
          activeDocumentId={nav.activeDocument?.documentId ?? null}
          onFocusPane={nav.focusDocument}
          onClosePane={nav.closeDocument}
          onSwap={nav.swapSplit}
          onExitSplit={nav.exitSplit}
          renderDocument={(document) => <PageRenderer target={targetFromDocument(document)} />}
        />
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
  /* A detached window signs in like any other: the session is per process, and
     a second window that skipped the gate would be a way around it. */
  const detached = detachedDocumentKey();
  return detached ? <DetachedWindow documentKey={detached} /> : <Authenticated user={user} />;
}

/**
 * A window showing exactly one record.
 *
 * It is told a document KEY and derives the rest — the key carries the tenant,
 * the type and the record id, and nothing else travels in a URL. No tab strip,
 * because there is nothing to switch between: closing the window is how this
 * document goes back to the workspace that opened it.
 */
function DetachedWindow({ documentKey }: { documentKey: string }) {
  const parts = parseDocumentKey(documentKey);
  if (!parts) return <SessionSplash />;
  const target = targetFromDocument({ documentType: parts.documentType, entityId: parts.entityId });
  return (
    <ERPProvider fallback={skeletonsPreferred() ? <ShellSkeleton /> : <SessionSplash />}>
      <AiSourcesProvider>
        <EnterpriseShell>
          <PageRenderer target={target} />
        </EnterpriseShell>
        <GlobalLayers />
        <AssistantPanel />
      </AiSourcesProvider>
    </ERPProvider>
  );
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
  /* Opens and closes the real windows to match what the store says is detached,
     and brings a document home when its window is closed from the outside. */
  useDetachedWindows(workspace);
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

/* One port for the process. Created outside React so a re-render never builds a
   second one holding a second map of windows. */
const windowPort = createTauriWindowPort();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SessionProvider>
      <WindowPortProvider value={windowPort}>
        <Gate />
      </WindowPortProvider>
    </SessionProvider>
  </React.StrictMode>,
);
