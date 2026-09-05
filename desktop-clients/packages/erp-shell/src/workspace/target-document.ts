import { PAGE_REGISTRY } from "@pepbits/erp-config";
import type { NavigationTarget } from "@pepbits/platform-ports";
import type { OpenRequest, WorkspaceDocument } from "@pepbits/workspace-core";

/**
 * The bridge between how the shells name a destination and how the workspace
 * names a record.
 *
 * Both already exist and neither is going away: `targetKey` is
 * `pageId:mode:recordId` and a document key is `tenant:type:entity`. They have
 * to agree exactly, or the same click opens one tab under the old rule and a
 * second under the new one, with the duplicate guard reporting nothing wrong.
 * That agreement is this file, and the round-trip test is what holds it.
 */

const MODE_SEPARATOR = "~";

/* encodeURIComponent, because a document key refuses a colon inside any part
   and record ids in the wild contain them -- "C:100", an MRN, an external
   reference. Without escaping, the first such record throws on open. It leaves
   `~` alone, and mode is a fixed enum, so splitting on the first one is
   unambiguous. */
function encodeEntity(mode: string, recordId: string): string {
  return `${mode}${MODE_SEPARATOR}${encodeURIComponent(recordId)}`;
}

function titleFor(target: NavigationTarget): string {
  if (target.title) return target.title;
  const base = PAGE_REGISTRY[target.pageId]?.title ?? "Page";
  const suffix = target.mode && target.mode !== "view" ? ` • ${target.mode === "new" ? "New" : "Edit"}` : "";
  const record = target.recordId ? ` • ${target.recordId}` : "";
  return `${base}${suffix}${record}`;
}

export function documentFromTarget(target: NavigationTarget, options: { closable?: boolean } = {}): OpenRequest {
  const page = PAGE_REGISTRY[target.pageId];
  return {
    module: page?.module ?? "shared",
    /* The page id IS the document type. A screen is what the record is: two
       customers on the customer master are two entities of one type. */
    documentType: target.pageId,
    entityId: encodeEntity(target.mode ?? "list", target.recordId ?? "root"),
    title: titleFor(target),
    route: target.pageId,
    closable: options.closable,
  };
}

export function targetFromDocument(document: Pick<WorkspaceDocument, "documentType" | "entityId">): NavigationTarget {
  const at = document.entityId.indexOf(MODE_SEPARATOR);
  const mode = at < 0 ? "list" : document.entityId.slice(0, at);
  const recordId = at < 0 ? "root" : decodeURIComponent(document.entityId.slice(at + 1));
  return {
    /* Lower-cased: the store upper-cases every document type so that "patient"
       and "PATIENT" are one record, and page ids are lower kebab-case. */
    pageId: document.documentType.toLowerCase(),
    ...(mode === "list" ? {} : { mode: mode as NavigationTarget["mode"] }),
    ...(recordId === "root" ? {} : { recordId }),
  };
}
