import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { NULL_WINDOW_PORT, type DetachedWindowRequest, type WindowPort } from "@pepbits/platform-ports";

/** The query key a child window is told which record to open through. */
export const DOCUMENT_PARAM = "document";

/**
 * True inside a Tauri webview, false in a browser.
 *
 * The same bundle serves both — `npm run dev:desktop` opens it at :3101 in a
 * normal browser — so this is a runtime question, not a build-time one. When it
 * is false the null port is used and the detach action is never offered, rather
 * than being offered and doing nothing.
 */
export function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** A label Tauri accepts: letters, numbers, dash, underscore. */
function labelFor(documentId: string): string {
  return `doc-${documentId.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

/**
 * Detached windows, backed by Tauri.
 *
 * The child is given the document KEY and nothing else. It carries the tenant,
 * the record type and the record id — the same minimal identifier §17.6 allows
 * in a window title — and no name, because a URL is as visible as a title and
 * lives in more places.
 */
export function createTauriWindowPort(): WindowPort {
  if (!inTauri()) return NULL_WINDOW_PORT;

  const windows = new Map<string, WebviewWindow>();
  const listeners = new Set<(documentId: string) => void>();

  return {
    available: true,

    async open(request: DetachedWindowRequest) {
      if (windows.has(request.documentId)) {
        await windows.get(request.documentId)?.setFocus();
        return true;
      }
      const child = new WebviewWindow(labelFor(request.documentId), {
        url: `index.html?${DOCUMENT_PARAM}=${encodeURIComponent(request.documentKey)}`,
        title: request.title,
        width: 1100,
        height: 800,
        /* Not centred: a second window centred on top of the first is a second
           window the user has to move before they can compare anything. */
        center: false,
      });
      windows.set(request.documentId, child);

      /* Tauri reports creation failures through an event rather than a rejected
         constructor, so a window that never appeared would otherwise sit in the
         map for ever and block a retry. */
      await child.once("tauri://error", () => {
        windows.delete(request.documentId);
        for (const listener of listeners) listener(request.documentId);
      });
      /* The user closing the window with its own button. Without this the tab
         strip goes on claiming the record is on a monitor that no longer shows
         it. */
      await child.onCloseRequested(() => {
        windows.delete(request.documentId);
        for (const listener of listeners) listener(request.documentId);
      });
      return true;
    },

    async close(documentId: string) {
      const child = windows.get(documentId);
      windows.delete(documentId);
      await child?.close().catch(() => undefined);
    },

    async focus(documentId: string) {
      await windows.get(documentId)?.setFocus().catch(() => undefined);
    },

    onClosed(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

/** The document key this window was told to open, or null for the main window. */
export function detachedDocumentKey(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(DOCUMENT_PARAM);
}
