import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { NavigationProvider, WindowPortProvider } from "@pepbits/platform-ports";
import type { NavigationPort, NavigationTarget } from "@pepbits/platform-ports";
import { SessionProvider, useSession } from "@pepbits/auth";
import type { SessionUser } from "@pepbits/auth";
import { MdiTaskbar, targetFromDocument, useDetachedWindows, useMdiWorkspace } from "@pepbits/erp-shell";
import { ERPProvider, EnterpriseShell, GlobalLayers, WorkspaceCanvas, WorkspaceTabs, useERP, useWorkspaceNavigation, skeletonsPreferred } from "@pepbits/erp-shell";
import { LoginScreen, PageRenderer, SessionSplash, ShellSkeleton } from "@pepbits/erp-screens";
import { createWorkspace, parseDocumentKey, WorkspaceProvider } from "@pepbits/workspace-core";
import { createTauriWindowPort, detachedDocumentKey } from "./platform/tauri-windows";
import { AccessDenied, ConfirmDialog, ErrorState } from "@pepbits/ops-ui";
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
  /* Off unless the user asked for it, and null when off — the arrangement the
     shell has always had is what everyone else keeps. */
  const mdi = useMdiWorkspace(workspace, preferences.floatingWindows);

  return (
    <>
      <EnterpriseShell
        /* The taskbar replaces the tab strip rather than joining it. Two rows
           listing the same open documents, one of which cannot minimise them,
           is a question the user has to answer before every click. */
        tabs={mdi ? undefined : (
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
        )}
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
          mdi={mdi ?? undefined}
        />
        {mdi ? (
          <MdiTaskbar
            documents={nav.localDocuments}
            frames={mdi.frames}
            activeDocumentId={nav.activeDocument?.documentId ?? null}
            onSelect={mdi.onSelect}
          />
        ) : null}
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
  return detached ? <DetachedWindow documentKey={detached} tenantId={user.tenantId} /> : <Authenticated user={user} />;
}

/**
 * A window showing exactly one record.
 *
 * It is told a document KEY and derives the rest — the key carries the tenant,
 * the type and the record id, and nothing else travels in a URL. No tab strip,
 * because there is nothing to switch between: closing the window is how this
 * document goes back to the workspace that opened it.
 */
function DetachedWindow({ documentKey, tenantId }: { documentKey: string; tenantId: string }) {
  const parts = parseDocumentKey(documentKey);
  /**
   * The tenant in the key is a claim, and the key arrives in a URL.
   *
   * §17.2: a document from another tenant must never remain visible. Nothing
   * checked this before — the window parsed whatever it was given and rendered
   * it, and the address bar of a detached window is as editable as any other.
   * The session's tenant is the server's answer; the URL's is an assertion.
   */
  const foreignTenant = parts !== null && parts.tenantId !== tenantId;
  const [target, setTarget] = useState<NavigationTarget | null>(
    () => (parts ? targetFromDocument({ documentType: parts.documentType, entityId: parts.entityId }) : null),
  );

  /* Its own navigation, and not optional: PageRenderer and everything under it
     calls useNavigation, which throws rather than falling back — so a window
     without this renders nothing at all and says so only in the console. It was
     missing, and the window was blank.

     Navigating inside this window replaces what it shows rather than opening a
     tab: there is no tab strip here, and a second document in a window opened
     to hold one record is a workspace by accident. */
  const port: NavigationPort = useMemo(() => ({
    current: target ?? { pageId: "finance-dashboard" },
    open: setTarget,
    openInNewContext: setTarget,
    hrefFor: () => "#",
  }), [target]);

  if (foreignTenant) {
    return (
      <div className="grid h-screen place-items-center bg-[var(--surface-2)] p-8">
        <AccessDenied
          title="This window belongs to another tenant"
          description="It was opened against a different organisation than the one you are signed in to. Close it and open the record from your own workspace."
          detail={`signed in as ${tenantId} · window asked for ${parts?.tenantId}`}
        />
      </div>
    );
  }

  if (!target) {
    /* Not the session splash. A window that sits for ever on "Restoring your
       session…" is a support call; a window that says what went wrong is a
       window the user closes. */
    return (
      <div className="grid h-screen place-items-center bg-[var(--surface-2)] p-8">
        <ErrorState
          title="This window could not be opened"
          description="Close it and open the record again from the tab strip."
          detail={documentKey}
        />
      </div>
    );
  }

  return (
    <NavigationProvider value={port}>
      <ERPProvider fallback={skeletonsPreferred() ? <ShellSkeleton /> : <SessionSplash />}>
        <AiSourcesProvider>
          <EnterpriseShell>
            <PageRenderer target={target} />
          </EnterpriseShell>
          <GlobalLayers />
          <AssistantPanel />
        </AiSourcesProvider>
      </ERPProvider>
    </NavigationProvider>
  );
}

function Authenticated({ user }: { user: SessionUser }) {
  /* Keyed on the account, so signing in as someone else builds a new store
     rather than inheriting the previous user's documents. The tenant is the
     server's answer, never a claim from this client. */
  const workspace = useMemo(
    () => createWorkspace({
      session: { tenantId: user.tenantId, userId: user.id, roleId: user.role, branchId: user.branch },
      policy: { platform: { modes: ["SINGLE", "TAB", "SPLIT", "WINDOW"], allowDetach: true } },
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
