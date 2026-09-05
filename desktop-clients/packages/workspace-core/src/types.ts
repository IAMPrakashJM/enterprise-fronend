/**
 * The vocabulary of the workspace, shared by both shells.
 *
 * The framework's central claim is that a record is the unit of work and a tab,
 * split pane, page or window is only how it is shown -- so everything here is
 * about the DOCUMENT, and `presentation` is one field on it rather than the
 * thing being modelled.
 */

/** How a document is shown. Chosen by policy, not by the document. */
export type WorkspacePresentation = "SINGLE" | "TAB" | "SPLIT" | "WINDOW";

/**
 * What a document is currently costing.
 *
 * ACTIVE may hold subscriptions, polling and timers. BACKGROUND keeps its state
 * and unsaved edits but stops paying for liveness. SUSPENDED has released its
 * heavy resources and must revalidate both data and authorisation before it can
 * be shown again -- permissions change while a record sits open.
 */
export type WorkspaceDocumentState = "ACTIVE" | "BACKGROUND" | "SUSPENDED" | "MINIMIZED" | "CLOSED";

/**
 * Everything a document needs to know about who is looking at it.
 *
 * Carried per document and never read from a shared mutable "current patient".
 * With two patients open, one global variable is a wrong-patient action waiting
 * for a race between a click and a fetch.
 */
export interface WorkspaceSecurityContext {
  tenantId: string;
  branchId?: string;
  userId: string;
  roleId?: string;
  patientId?: string;
  encounterId?: string;
  episodeId?: string;
  documentId: string;
  documentKey: string;
}

export interface WorkspaceDocument {
  documentId: string;
  documentKey: string;

  module: string;
  documentType: string;
  entityId: string;

  /** Display only. Never persisted -- see `restoreMetadata`. */
  title: string;
  subtitle?: string;
  route?: string;

  presentation: WorkspacePresentation;
  state: WorkspaceDocumentState;
  dirty: boolean;

  security: WorkspaceSecurityContext;

  openedAt: string;
  lastActivatedAt: string;
}

export interface WorkspaceLimits {
  maxOpenDocuments: number;
  maxActiveDocuments: number;
  maxSplitPanes: number;
  maxDetachedWindows: number;
}
