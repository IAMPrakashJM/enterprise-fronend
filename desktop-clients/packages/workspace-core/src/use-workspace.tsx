"use client";

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import type { Workspace } from "./document-manager.ts";
import type { WorkspaceDocument } from "./types.ts";

const WorkspaceContext = createContext<Workspace | null>(null);

export function WorkspaceProvider({ workspace, children }: { workspace: Workspace; children: React.ReactNode }) {
  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>;
}

/**
 * Throws when unprovided, deliberately -- the same choice as `useNavigation`.
 * A silent fallback to an empty workspace produces a shell that renders
 * correctly, opens nothing, and reports no error anywhere.
 */
export function useWorkspace(): Workspace {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return workspace;
}

/**
 * The workspace if there is one, null if there is not.
 *
 * Shared screens render in both shells, and only one of them has a workspace
 * today. A screen that reached for `useWorkspace()` would work on the desktop
 * and take out every page on the web.
 */
export function useOptionalWorkspace(): Workspace | null {
  return useContext(WorkspaceContext);
}

/**
 * Tell the workspace this screen has unsaved work.
 *
 * The active document, because the shell renders exactly one at a time — the
 * screen calling this IS the open document. No cleanup on unmount: switching
 * away from a tab does not save it, so the flag has to survive the unmount that
 * switching causes.
 *
 * A limitation worth naming: form state itself is still local to the screen, so
 * leaving a tab and returning gives a fresh form and clears the flag with it.
 * Moving draft state into the document is a later phase. What this protects is
 * the case that loses work today — closing the tab, or crossing to another
 * module, with something typed and unsaved.
 */
export function useReportDirty(dirty: boolean): void {
  const workspace = useOptionalWorkspace();
  useEffect(() => {
    const active = workspace?.getActiveDocument();
    if (!active) return;
    if (dirty) workspace!.markDirty(active.documentId);
    else workspace!.markClean(active.documentId);
  }, [workspace, dirty]);
}

/**
 * The open documents, kept in step with the store.
 *
 * useSyncExternalStore rather than an effect subscribing into state: the store
 * changes from outside React -- a keyboard shortcut, a restore on login, a
 * second window -- and an effect-based subscription would miss anything that
 * happened between render and effect. It also compares snapshots by identity,
 * which is why the store replaces documents instead of mutating them.
 */
/**
 * The explicit form, for code that HOLDS a workspace rather than finding one.
 *
 * The shells build their navigation port from a workspace and then feed that
 * port to the providers, so that code runs ABOVE WorkspaceProvider and has no
 * context to read. Reaching for `useWorkspace()` there throws at runtime while
 * every test that wrapped it in a provider stays green — which is exactly what
 * happened, and is why both forms exist.
 */
export function useDocumentsIn(workspace: Workspace): WorkspaceDocument[] {
  return useSyncExternalStore(
    workspace.subscribeToChanges,
    workspace.getOpenDocuments,
    /* Server render: the same getter. The store is empty until the shell opens
       something on the client, so this is the honest answer rather than a
       second code path that could disagree with it. */
    workspace.getOpenDocuments,
  );
}

export function useActiveDocumentIn(workspace: Workspace): WorkspaceDocument | null {
  return useSyncExternalStore(
    workspace.subscribeToChanges,
    workspace.getActiveDocument,
    workspace.getActiveDocument,
  );
}

/** The context forms, for components rendered inside the provider. */
export function useWorkspaceDocuments(): WorkspaceDocument[] {
  return useDocumentsIn(useWorkspace());
}

export function useActiveDocument(): WorkspaceDocument | null {
  return useActiveDocumentIn(useWorkspace());
}
