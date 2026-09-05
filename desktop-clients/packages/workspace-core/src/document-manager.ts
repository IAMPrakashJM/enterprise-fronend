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
  closeAll(options?: { discardChanges?: boolean }): CloseResult;
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

  subscribe(listener: (event: WorkspaceEvent) => void): () => void;
}

export function createWorkspace(options: {
  session: WorkspaceSession;
  policy?: Partial<Record<WorkspacePolicyLevel, WorkspacePolicyRule>>;
  now?: () => string;
}): Workspace {
  let session = options.session;
  const resolved = resolveWorkspacePolicy(options.policy ?? {});
  const now = options.now ?? (() => new Date().toISOString());

  let documents: WorkspaceDocument[] = [];
  let activeId: string | null = null;
  let counter = 0;
  const listeners = new Set<(event: WorkspaceEvent) => void>();

  const emit = (type: WorkspaceEventType, document: WorkspaceDocument) => {
    const event: WorkspaceEvent = { type, document, at: now() };
    for (const listener of listeners) listener(event);
  };

  const find = (documentId: string) => documents.find((doc) => doc.documentId === documentId) ?? null;

  /**
   * Exactly one document is ACTIVE, and the rest keep their state without
   * paying for liveness. maxActiveDocuments is the ceiling for split panes and
   * starts binding in Phase 3; enforcing it here would be enforcing a limit
   * nothing in a tab workspace can reach.
   */
  const activate = (document: WorkspaceDocument) => {
    for (const other of documents) {
      if (other !== document && other.state === "ACTIVE") other.state = "BACKGROUND";
    }
    document.state = "ACTIVE";
    document.lastActivatedAt = now();
    activeId = document.documentId;
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
    documents = documents.filter((doc) => doc !== document);
    if (announce) emit("close", document);
    if (activeId === document.documentId) {
      activeId = null;
      /* Whatever was used most recently takes over. Deliberately silent: this
         is a consequence of the close, not a second access event, and an audit
         trail full of implicit focus records is the noise §17.8 warns about. */
      const next = [...documents].sort((a, b) => b.lastActivatedAt.localeCompare(a.lastActivatedAt))[0];
      if (next) activate(next);
    }
  };

  const closeMany = (targets: WorkspaceDocument[], discardChanges: boolean): CloseResult => {
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
    for (const doc of [...documents]) emit("close", doc);
    documents = [];
    activeId = null;
  };

  return {
    openDocument(request) {
      const key = documentKey({ tenantId: session.tenantId, documentType: request.documentType, entityId: request.entityId });

      /* Before the limit check, deliberately. A full workspace must still be
         navigable -- refusing to focus something already open would mean the
         twelfth document locks you out of the first eleven. */
      const existing = documents.find((doc) => doc.documentKey === key);
      if (existing) {
        if (existing.documentId !== activeId) { activate(existing); emit("focus", existing); }
        return { ok: true, reused: true, document: existing };
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
        security,
        openedAt: now(),
        lastActivatedAt: now(),
      };

      documents.push(document);
      activate(document);
      emit("open", document);
      return { ok: true, document };
    },

    focusDocument(documentId) {
      const document = find(documentId);
      if (!document) return false;
      /* Focusing what is already focused is not an access event. */
      if (document.documentId === activeId) return true;
      activate(document);
      emit("focus", document);
      return true;
    },

    closeDocument(documentId, closeOptions) {
      const document = find(documentId);
      if (!document) return { ok: false, reason: "That document is not open." };
      if (document.dirty && !closeOptions?.discardChanges) {
        return { ok: false, reason: "This document has unsaved changes.", dirtyDocumentIds: [documentId] };
      }
      removeDocument(document, true);
      return { ok: true };
    },

    closeAll(closeOptions) {
      return closeMany([...documents], closeOptions?.discardChanges ?? false);
    },

    closeOthers(documentId, closeOptions) {
      return closeMany(documents.filter((doc) => doc.documentId !== documentId), closeOptions?.discardChanges ?? false);
    },

    markDirty(documentId) { const doc = find(documentId); if (doc) doc.dirty = true; },
    markClean(documentId) { const doc = find(documentId); if (doc) doc.dirty = false; },

    suspendDocument(documentId) {
      const document = find(documentId);
      if (!document) return;
      document.state = "SUSPENDED";
      if (activeId === documentId) activeId = null;
      emit("suspend", document);
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
      activate(document);
      emit("resume", document);
      return { ok: true, revalidationRequired: true };
    },

    isAlreadyOpen({ documentType, entityId }) {
      const key = documentKey({ tenantId: session.tenantId, documentType, entityId });
      return documents.some((doc) => doc.documentKey === key);
    },

    getDocument(documentId) { return find(documentId); },
    getOpenDocuments() { return [...documents]; },
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
      for (const entry of entries) {
        /* Rebound to the live session, never trusted as written. A restore blob
           is a file on a shared machine; the tenant and user in it are a claim. */
        if (entry.tenantId !== session.tenantId || entry.userId !== session.userId) { skipped += 1; continue; }
        if (restoreOptions?.authorise && !restoreOptions.authorise(entry)) { skipped += 1; continue; }
        if (documents.length >= resolved.limits.maxOpenDocuments) { skipped += 1; continue; }

        /* The saved mode may not be permitted on this device -- a window saved
           on the desktop restoring into the web shell. Fall back rather than
           drop the document. */
        const mode = resolved.modes.includes(entry.presentation) ? entry.presentation : resolved.modes[0];
        if (!mode) { skipped += 1; continue; }

        const documentId = `w${++counter}`;
        documents.push({
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
        restored += 1;
      }
      return { restored, skipped };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
