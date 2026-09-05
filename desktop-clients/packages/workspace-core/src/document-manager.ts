import { documentKey } from "./document-key.ts";
import { resolveWorkspacePolicy, type WorkspacePolicyLevel, type WorkspacePolicyRule } from "./policy.ts";
import type { WorkspaceDocument, WorkspacePresentation, WorkspaceSecurityContext } from "./types.ts";

/** Derived from the authenticated session by the shell. Never accepted from a URL. */
export interface WorkspaceSession {
  tenantId: string;
  userId: string;
  roleId?: string;
  branchId?: string;
}

export interface OpenRequest {
  module: string;
  documentType: string;
  entityId: string;
  title: string;
  subtitle?: string;
  route?: string;
  patientId?: string;
  encounterId?: string;
  episodeId?: string;
  /** A request, not a grant: policy still decides. */
  presentation?: WorkspacePresentation;
  /** Defaults to true. False for a module dashboard or another fixed tab. */
  closable?: boolean;
}

export interface OpenResult { ok: boolean; reused?: boolean; document?: WorkspaceDocument; reason?: string }
export interface CloseResult { ok: boolean; reason?: string; dirtyDocumentIds?: string[] }
export interface ResumeResult { ok: boolean; revalidationRequired?: boolean; reason?: string }

export type WorkspaceEventType = "open" | "focus" | "close" | "suspend" | "resume";
export interface WorkspaceEvent { type: WorkspaceEventType; document: WorkspaceDocument; at: string }

/**
 * What may be written to disk between sessions.
 *
 * Keys and ids only. A title is the patient's name, and §17.6/17.7 keep those
 * out of localStorage, desktop files, window titles and OS thumbnails -- all of
 * which a persisted title reaches. The real title arrives when the document
 * loads its own data.
 */
export interface RestoreEntry {
  tenantId: string;
  userId: string;
  documentKey: string;
  module: string;
  documentType: string;
  entityId: string;
  route?: string;
  presentation: WorkspacePresentation;
}

export interface Workspace {
  openDocument(request: OpenRequest): OpenResult;
  focusDocument(documentId: string): boolean;
  closeDocument(documentId: string, options?: { discardChanges?: boolean }): CloseResult;
  /** `includeUnclosable` is for replacing the workspace, as a module switch does. */
  closeAll(options?: { discardChanges?: boolean; includeUnclosable?: boolean }): CloseResult;
  closeOthers(documentId: string, options?: { discardChanges?: boolean }): CloseResult;

  markDirty(documentId: string): void;
  markClean(documentId: string): void;

  suspendDocument(documentId: string): void;
  resumeDocument(documentId: string, options?: { authorised?: boolean }): ResumeResult;

  isAlreadyOpen(what: { documentType: string; entityId: string }): boolean;
  getDocument(documentId: string): WorkspaceDocument | null;
  getOpenDocuments(): WorkspaceDocument[];
  getActiveDocument(): WorkspaceDocument | null;

  switchTenant(tenantId: string): void;
  logout(): void;

  restoreMetadata(): RestoreEntry[];
  restore(entries: RestoreEntry[], options?: { authorise?: (entry: RestoreEntry) => boolean }): { restored: number; skipped: number };

  /** Access events, for audit. Focus and open are events; typing is not. */
  subscribe(listener: (event: WorkspaceEvent) => void): () => void;
  /** Snapshot invalidation, for rendering. Fires for every change, audit-worthy or not. */
  subscribeToChanges(listener: () => void): () => void;

  /**
   * Replace the policy in place.
   *
   * The shell resolves policy from preferences, and preferences live below the
   * point where the workspace is created; rebuilding the store on every toggle
   * would drop every open tab. Applies from the next open onwards -- a tab does
   * not change shape under the user because a setting moved.
   */
  setPolicy(rules: Partial<Record<WorkspacePolicyLevel, WorkspacePolicyRule>>): void;
}

export function createWorkspace(options: {
  session: WorkspaceSession;
  policy?: Partial<Record<WorkspacePolicyLevel, WorkspacePolicyRule>>;
  now?: () => string;
}): Workspace {
  let session = options.session;
  let resolved = resolveWorkspacePolicy(options.policy ?? {});
  const now = options.now ?? (() => new Date().toISOString());

  /**
   * Documents are REPLACED, never mutated.
   *
   * React reads this store through useSyncExternalStore and compares snapshots
   * by identity: a document edited in place is a change React cannot see, and a
   * getter that builds a fresh array on every call is an infinite render loop.
   * So `documents` is the snapshot -- it keeps its identity until something
   * actually changes, and a change replaces only the documents it touched, so
   * marking one form dirty does not hand every other tab a new object.
   */
  let documents: WorkspaceDocument[] = [];
  let activeId: string | null = null;
  let counter = 0;
  const listeners = new Set<(event: WorkspaceEvent) => void>();
  const changeListeners = new Set<() => void>();

  /* Two subscriptions, deliberately. An audit trail and a render trigger are
     not the same thing: focusing a tab is both, typing in a form is only the
     second, and an audit log that records keystrokes is the noise §17.8 warns
     against. */
  const emit = (type: WorkspaceEventType, document: WorkspaceDocument) => {
    const event: WorkspaceEvent = { type, document, at: now() };
    for (const listener of listeners) listener(event);
  };

  const commit = (next: WorkspaceDocument[]) => {
    documents = next;
    for (const listener of changeListeners) listener();
  };

  const find = (documentId: string) => documents.find((doc) => doc.documentId === documentId) ?? null;

  /** A new array where the target is ACTIVE and any other ACTIVE falls back. */
  const withActivated = (list: WorkspaceDocument[], documentId: string, at: string): WorkspaceDocument[] =>
    list.map((doc) => {
      if (doc.documentId === documentId) return { ...doc, state: "ACTIVE" as const, lastActivatedAt: at };
      if (doc.state === "ACTIVE") return { ...doc, state: "BACKGROUND" as const };
      return doc;
    });

  /**
   * Exactly one document is ACTIVE, and the rest keep their state without
   * paying for liveness. maxActiveDocuments is the ceiling for split panes and
   * starts binding in Phase 3; enforcing it here would be enforcing a limit
   * nothing in a tab workspace can reach.
   */
  const activate = (documentId: string) => {
    commit(withActivated(documents, documentId, now()));
    activeId = documentId;
  };

  const presentationFor = (requested?: WorkspacePresentation): { mode?: WorkspacePresentation; reason?: string } => {
    if (resolved.modes.length === 0) {
      return { reason: "No presentation mode is permitted here. Check the platform and shell workspace policy." };
    }
    if (requested && !resolved.modes.includes(requested)) {
      const level = resolved.deniedBy[requested];
      return { reason: `${requested} is not available${level ? ` — removed at the ${level} level` : ""}.` };
    }
    return { mode: requested ?? resolved.modes[0] };
  };

  const removeDocument = (document: WorkspaceDocument, announce: boolean) => {
    let next = documents.filter((doc) => doc.documentId !== document.documentId);
    if (activeId === document.documentId) {
      activeId = null;
      /* Whatever was used most recently takes over. Deliberately silent: this
         is a consequence of the close, not a second access event, and an audit
         trail full of implicit focus records is the noise §17.8 warns about. */
      const successor = [...next].sort((a, b) => b.lastActivatedAt.localeCompare(a.lastActivatedAt))[0];
      if (successor) {
        next = withActivated(next, successor.documentId, now());
        activeId = successor.documentId;
      }
    }
    commit(next);
    if (announce) emit("close", document);
  };

  const setDirty = (documentId: string, dirty: boolean) => {
    const doc = find(documentId);
    if (!doc || doc.dirty === dirty) return;
    commit(documents.map((each) => (each.documentId === documentId ? { ...each, dirty } : each)));
  };

  const closeMany = (candidates: WorkspaceDocument[], discardChanges: boolean, includeUnclosable = false): CloseResult => {
    const targets = includeUnclosable ? candidates : candidates.filter((doc) => doc.closable);
    const dirty = targets.filter((doc) => doc.dirty);
    if (dirty.length > 0 && !discardChanges) {
      return { ok: false, reason: `${dirty.length} document(s) have unsaved changes.`, dirtyDocumentIds: dirty.map((doc) => doc.documentId) };
    }
    for (const doc of targets) removeDocument(doc, true);
    return { ok: true };
  };

  const clear = () => {
    /* Unconditional, dirty or not. A tenant switch or a logout is not a moment
       to ask whether to keep another tenant's record on screen. */
    const closing = documents;
    commit([]);
    activeId = null;
    for (const doc of closing) emit("close", doc);
  };

  return {
    openDocument(request) {
      const key = documentKey({ tenantId: session.tenantId, documentType: request.documentType, entityId: request.entityId });

      /* Before the limit check, deliberately. A full workspace must still be
         navigable -- refusing to focus something already open would mean the
         twelfth document locks you out of the first eleven. */
      const existing = documents.find((doc) => doc.documentKey === key);
      if (existing) {
        if (existing.documentId !== activeId) {
          activate(existing.documentId);
          emit("focus", find(existing.documentId)!);
        }
        /* Re-read: activate replaced the object, and handing back the stale one
           would give the caller a document whose state says BACKGROUND. */
        return { ok: true, reused: true, document: find(existing.documentId)! };
      }

      const { mode, reason } = presentationFor(request.presentation);
      if (!mode) return { ok: false, reason };

      if (documents.length >= resolved.limits.maxOpenDocuments) {
        return { ok: false, reason: `The workspace limit of ${resolved.limits.maxOpenDocuments} open documents has been reached. Close one first.` };
      }

      const documentId = `w${++counter}`;
      const security: WorkspaceSecurityContext = {
        tenantId: session.tenantId,
        branchId: session.branchId,
        userId: session.userId,
        roleId: session.roleId,
        patientId: request.patientId,
        encounterId: request.encounterId,
        episodeId: request.episodeId,
        documentId,
        documentKey: key,
      };

      const document: WorkspaceDocument = {
        documentId,
        documentKey: key,
        module: request.module,
        documentType: request.documentType.toUpperCase(),
        entityId: request.entityId,
        title: request.title,
        subtitle: request.subtitle,
        route: request.route,
        presentation: mode,
        state: "ACTIVE",
        dirty: false,
        closable: request.closable ?? true,
        security,
        openedAt: now(),
        lastActivatedAt: now(),
      };

      /* One commit, not two. Appending and then activating would move the
         snapshot twice for a single user action, and every subscriber would
         render an intermediate state that never existed on screen. */
      commit(withActivated([...documents, document], documentId, document.lastActivatedAt));
      activeId = documentId;
      const opened = find(documentId)!;
      emit("open", opened);
      return { ok: true, document: opened };
    },

    focusDocument(documentId) {
      const document = find(documentId);
      if (!document) return false;
      /* Focusing what is already focused is not an access event. */
      if (document.documentId === activeId) return true;
      activate(documentId);
      emit("focus", find(documentId)!);
      return true;
    },

    closeDocument(documentId, closeOptions) {
      const document = find(documentId);
      if (!document) return { ok: false, reason: "That document is not open." };
      /* Checked before the dirty guard: discardChanges answers "may I lose this
         work", which is a different question from "may this tab go away". */
      if (!document.closable) return { ok: false, reason: `${document.title} cannot be closed.` };
      if (document.dirty && !closeOptions?.discardChanges) {
        return { ok: false, reason: "This document has unsaved changes.", dirtyDocumentIds: [documentId] };
      }
      removeDocument(document, true);
      return { ok: true };
    },

    closeAll(closeOptions) {
      return closeMany([...documents], closeOptions?.discardChanges ?? false, closeOptions?.includeUnclosable ?? false);
    },

    closeOthers(documentId, closeOptions) {
      return closeMany(documents.filter((doc) => doc.documentId !== documentId), closeOptions?.discardChanges ?? false);
    },

    /* A no-op does not commit. Otherwise every keystroke in an already-dirty
       form invalidates the snapshot and re-renders the whole tab bar. */
    markDirty(documentId) { setDirty(documentId, true); },
    markClean(documentId) { setDirty(documentId, false); },

    suspendDocument(documentId) {
      const document = find(documentId);
      if (!document) return;
      if (document.state === "SUSPENDED") return;
      commit(documents.map((doc) => (doc.documentId === documentId ? { ...doc, state: "SUSPENDED" as const } : doc)));
      if (activeId === documentId) activeId = null;
      emit("suspend", find(documentId)!);
    },

    /**
     * Coming back from suspended is not a UI transition. The document released
     * its data, and permissions change while a record sits open, so this is a
     * point where authorisation is asked again — and a document the user may no
     * longer see is closed rather than shown.
     */
    resumeDocument(documentId, resumeOptions) {
      const document = find(documentId);
      if (!document) return { ok: false, reason: "That document is not open." };
      if (resumeOptions?.authorised === false) {
        removeDocument(document, true);
        return { ok: false, reason: "No longer authorised for this record." };
      }
      activate(documentId);
      emit("resume", find(documentId)!);
      return { ok: true, revalidationRequired: true };
    },

    isAlreadyOpen({ documentType, entityId }) {
      const key = documentKey({ tenantId: session.tenantId, documentType, entityId });
      return documents.some((doc) => doc.documentKey === key);
    },

    getDocument(documentId) { return find(documentId); },
    /* The array itself, not a copy: it is the snapshot React compares by
       identity, and a copy would differ on every call. Treat it as read-only —
       nothing here mutates it, and neither should a caller. */
    getOpenDocuments() { return documents; },
    getActiveDocument() { return activeId ? find(activeId) : null; },

    switchTenant(tenantId) { clear(); session = { ...session, tenantId }; },
    logout() { clear(); },

    restoreMetadata() {
      return documents.map((doc) => ({
        tenantId: doc.security.tenantId,
        userId: doc.security.userId,
        documentKey: doc.documentKey,
        module: doc.module,
        documentType: doc.documentType,
        entityId: doc.entityId,
        route: doc.route,
        presentation: doc.presentation,
      }));
    },

    restore(entries, restoreOptions) {
      let restored = 0;
      let skipped = 0;
      const pending: WorkspaceDocument[] = [];
      for (const entry of entries) {
        /* Rebound to the live session, never trusted as written. A restore blob
           is a file on a shared machine; the tenant and user in it are a claim. */
        if (entry.tenantId !== session.tenantId || entry.userId !== session.userId) { skipped += 1; continue; }
        if (restoreOptions?.authorise && !restoreOptions.authorise(entry)) { skipped += 1; continue; }
        if (documents.length + pending.length >= resolved.limits.maxOpenDocuments) { skipped += 1; continue; }

        /* The saved mode may not be permitted on this device -- a window saved
           on the desktop restoring into the web shell. Fall back rather than
           drop the document. */
        const mode = resolved.modes.includes(entry.presentation) ? entry.presentation : resolved.modes[0];
        if (!mode) { skipped += 1; continue; }

        const documentId = `w${++counter}`;
        restored += 1;
        pending.push({
          documentId,
          documentKey: entry.documentKey,
          module: entry.module,
          documentType: entry.documentType,
          entityId: entry.entityId,
          /* Not the patient's name: nothing carrying one survived the save. The
             document replaces this when it loads its own data. */
          title: `${entry.documentType} ${entry.entityId}`,
          route: entry.route,
          presentation: mode,
          closable: true,
          /* Suspended, not active. Mounting five live screens at login is the
             performance problem this lifecycle exists to avoid, and none of
             them has any data yet. */
          state: "SUSPENDED",
          dirty: false,
          security: {
            tenantId: session.tenantId,
            branchId: session.branchId,
            userId: session.userId,
            roleId: session.roleId,
            documentId,
            documentKey: entry.documentKey,
          },
          openedAt: now(),
          lastActivatedAt: now(),
        });
      }
      /* One commit for the batch. Restoring eight documents on login should
         move the snapshot once, not eight times. */
      if (pending.length) commit([...documents, ...pending]);
      return { restored, skipped };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },

    subscribeToChanges(listener) {
      changeListeners.add(listener);
      return () => { changeListeners.delete(listener); };
    },

    setPolicy(rules) { resolved = resolveWorkspacePolicy(rules); },
  };
}
