import { afterEach, beforeEach, expect, test, vi } from "vitest";
const windows = vi.hoisted(() => [] as Array<{ events: Map<string, () => void>; onClose?: (event: {preventDefault:()=>void}) => void; destroy: ReturnType<typeof vi.fn> }>);
vi.mock("@tauri-apps/api/webviewWindow", () => ({
  WebviewWindow: class {
    events = new Map<string, () => void>();
    onClose?: (event: {preventDefault:()=>void}) => void;
    destroy = vi.fn(async () => {});
    constructor() { windows.push(this); }
    async once(name: string, fn: () => void) { this.events.set(name, fn); return () => {}; }
    async onCloseRequested(fn: (event: {preventDefault:()=>void}) => void) { this.onClose = fn; return () => {}; }
    async setFocus() {}
  },
}));
import { createTauriWindowPort } from "./tauri-windows";
beforeEach(() => { windows.length = 0; Object.assign(window, { __TAURI_INTERNALS__: {} }); });
afterEach(() => { delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__; });
const request = { documentId: "w1", documentKey: "t:C:1", title: "Customer 1" };
test("opening resolves only when the native window has been created", async () => {
  const port = createTauriWindowPort();
  let resolved = false;
  const pending = port.open(request).then(ok => { resolved = true; return ok; });
  await Promise.resolve();
  expect(resolved).toBe(false);
  windows[0].events.get("tauri://created")!();
  expect(await pending).toBe(true);
  const closed = vi.fn(); port.onClosed(closed);
  await port.close(request.documentId);
  expect(windows[0].destroy).toHaveBeenCalledOnce();
  expect(closed).not.toHaveBeenCalled();
});
test("creation failure permits another attempt", async () => {
  const port = createTauriWindowPort();
  const failed = port.open(request);
  windows[0].events.get("tauri://error")!();
  expect(await failed).toBe(false);
  const retry = port.open(request);
  windows[1].events.get("tauri://created")!();
  expect(await retry).toBe(true);
});

test("a stale close listener cannot destroy a reopened window with the same label", async () => {
  const port = createTauriWindowPort();
  const first = port.open(request); windows[0].events.get("tauri://created")!(); await first;
  const oldHandler = windows[0].onClose!;
  const closed = vi.fn(); port.onClosed(closed);
  const preventDefault = vi.fn(); oldHandler({preventDefault});
  expect(preventDefault).toHaveBeenCalledOnce();
  expect(windows[0].destroy).toHaveBeenCalledOnce();
  expect(closed).toHaveBeenCalledOnce();
  const second = port.open(request); windows[1].events.get("tauri://created")!(); await second;
  oldHandler({preventDefault});
  expect(windows[0].destroy).toHaveBeenCalledOnce();
  expect(windows[1].destroy).not.toHaveBeenCalled();
  expect(closed).toHaveBeenCalledOnce();
  await port.close(request.documentId);
  expect(windows[1].destroy).toHaveBeenCalledOnce();
});
