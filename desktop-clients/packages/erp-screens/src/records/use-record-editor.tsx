"use client";
import {RecoveryNotice,failureFromError} from "@pepbits/ops-ui";
import { Card } from "@pepbits/ops-ui";
import { TableContainer } from "@pepbits/ops-ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@pepbits/ops-ui";
import { LocalizedText, useLocalization } from "@pepbits/ops-ui";
import { ProductRecordContext, useProductRequest } from "../product-services";
import React, { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { authedFetch, readToken, useSession } from "@pepbits/auth";
import { createHttpRecordAdapter, RecordEditor, type RecordAdapter } from "@pepbits/erp-data";
import { useERP, useProduct } from "@pepbits/erp-shell";
import { useDocumentId, useIsDocumentFocused, useOptionalWorkspace, useReportDirty } from "@pepbits/workspace-core";
import { Button } from "@pepbits/ops-ui";

const attached = new WeakSet<object>();
const cleanupTimers = new WeakMap<object, ReturnType<typeof setTimeout>>();
const AdapterContext = ProductRecordContext;
/** Products inject their own transport; screens retain the same editing behavior. */
export const RecordAdapterProvider = AdapterContext.Provider;

function useRecordTransport() {
  const provided = useContext(AdapterContext);
  const request = useProductRequest();
  return useMemo(() => provided ?? createHttpRecordAdapter(request), [provided, request]);
}

export function useSavedRecords(prefix: string) {
  const adapter = useRecordTransport();
  const product = useProduct();
  const focused = useIsDocumentFocused();
  const [records, setRecords] = useState<Array<{ key: string; record: { values: Record<string, unknown> } }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    if (!focused) return;
    const load = () => { void adapter.list<Record<string, unknown>>(JSON.stringify([product.id, prefix]))
      .then(values => { if (active) { setRecords(values); setError(null); } })
      .catch(() => { if (active) setError("Saved records could not be loaded. Showing the available preview rows."); }); };
    load(); window.addEventListener("focus", load);
    return () => { active = false; window.removeEventListener("focus", load); };
  }, [adapter, product.id, prefix, focused, refresh]);
  return { records, error, retry: () => setRefresh(value => value + 1) };
}

export function useRecordEditor<T>(recordKey: string, initial: T, createPrefix?: string) {
  const { user } = useSession();
  const product = useProduct();
  const { toast } = useERP();
  const workspace = useOptionalWorkspace();
  const owner = useDocumentId();
  const adapter = useRecordTransport();
  const key = JSON.stringify([product.id, recordKey]);
  const cacheKey = `record-editor:${user?.tenantId}:${user?.id}:${key}`;
  const editor = useMemo(() => workspace?.getDraft<RecordEditor<T>>(owner ?? "", cacheKey) ?? new RecordEditor(adapter, key, initial, createPrefix ? () => JSON.stringify([product.id, `${createPrefix}${crypto.randomUUID()}`]) : undefined), [workspace, owner, cacheKey, adapter, createPrefix, product.id]);
  const state = useSyncExternalStore(editor.subscribe, editor.snapshot, editor.snapshot);
  useEffect(() => {
    clearTimeout(cleanupTimers.get(editor));
    if (workspace && owner) workspace.setDraft(owner, cacheKey, editor);
    editor.start();
    if (!workspace || !owner) return () => {
      cleanupTimers.set(editor, setTimeout(() => { void editor.saveDraft().finally(editor.stop); }, 0));
    };
    if (!attached.has(editor)) {
      attached.add(editor);
      const unsubscribe = workspace.subscribe(event => {
        if (event.type !== "close" || event.document.documentId !== owner) return;
        unsubscribe();
        void editor.close().catch(() => toast({ title: "Recovery draft could not be removed", message: "The service was unavailable or another window changed the draft. Review it when reopening the record.", type: "warning" }));
      });
    }
  }, [editor, workspace, owner, cacheKey, toast]);
  useReportDirty(editor.dirty || !!state.recovery);
  return { editor, ...state, dirty: editor.dirty };
}

export function useRecordField<T, K extends keyof T>(editor: RecordEditor<T>, key: K): [T[K], React.Dispatch<React.SetStateAction<T[K]>>] {
  const state = useSyncExternalStore(editor.subscribe, editor.snapshot, editor.snapshot);
  return [state.values[key], (next) => editor.update(previous => ({ ...previous,
    [key]: typeof next === "function" ? (next as (value: T[K]) => T[K])(previous[key]) : next,
  }))];
}

function RecordComparison({ local, remote }: { local: unknown; remote: unknown }) {
  const flatten = (value: unknown, path = "", output: Record<string, string> = {}): Record<string, string> => {
    if (value !== null && typeof value === "object") {
      for (const [key, entry] of Object.entries(value)) flatten(entry, path ? `${path} / ${key}` : key, output);
    } else output[path] = value === null || value === undefined ? "—" : typeof value === "boolean" ? value ? "Yes" : "No" : String(value);
    return output;
  };
  const mine = flatten(local), theirs = flatten(remote);
  const changes = [...new Set([...Object.keys(mine), ...Object.keys(theirs)])].filter(key => mine[key] !== theirs[key]);
  if (!changes.length) return <p><LocalizedText message="ui.your.values.match.this.version.deecc49a" /></p>;
  return <TableContainer className="max-h-72"><Table className="w-full text-left text-sm"><TableHeader><TableRow><TableHead className="p-2"><LocalizedText message="ui.field.f45fc1df" /></TableHead><TableHead className="p-2"><LocalizedText message="ui.your.edits.1eaa375b" /></TableHead><TableHead className="p-2"><LocalizedText message="ui.latest.version.ef7105b6" /></TableHead></TableRow></TableHeader><TableBody>
    {changes.map(key => <TableRow key={key} className="border-t border-[var(--border)]"><TableHead className="p-2 font-medium">{key.replace(/([a-z])([A-Z])/g, "$1 $2")}</TableHead><TableCell className="max-w-80 break-words p-2">{mine[key] ?? "—"}</TableCell><TableCell className="max-w-80 break-words p-2">{theirs[key] ?? "—"}</TableCell></TableRow>)}
  </TableBody></Table></TableContainer>;
}

export function RecordSaveStatus<T>({ editor }: { editor: RecordEditor<T> }) {
  const {t,dateTime} = useLocalization();
  const state = useSyncExternalStore(editor.subscribe, editor.snapshot, editor.snapshot);
  return <Card shadow="none" tone="muted" className="flex flex-wrap items-center gap-2 p-3 text-sm" aria-live="polite">
    {state.loading ? <span><LocalizedText message="ui.loading.saved.record.and.recovery.draft.90568331" /></span> : state.recovery ? <>
      <span><LocalizedText message="ui.a.recovery.draft.is.available.from.567e101f" />{" "}{dateTime(state.recovery.savedAt)}.</span>
      <Button disabled={state.busy} onClick={editor.restore}><LocalizedText message="ui.restore.draft.a86e1a9f" /></Button>
      <Button disabled={state.busy} onClick={() => void editor.discard()}><LocalizedText message="ui.discard.recovery.draft.0d6faf2c" /></Button>
    </> : <span>{state.busy ? <LocalizedText message="ui.saving.23e39291" /> : state.error ? <LocalizedText message="ui.changes.need.attention.fbaeabd5" /> : editor.dirty ? state.draftSaved ? <LocalizedText message="ui.recovery.draft.saved.record.has.unsaved.changes.a3d2d0f5" /> : <LocalizedText message="ui.unsaved.changes.recovery.pending.f83c324c" /> : state.lastSaved ? t("Saved {date}", {date:dateTime(state.lastSaved)}) : <LocalizedText message="ui.no.changes.saved.0a823d05" />}</span>}
    {state.error && !state.conflict ? <RecoveryNotice sessionRestored={!!readToken()} failure={failureFromError(state.failure)} preservesValues={editor.dirty} onReload={()=>window.location.reload()} busy={state.busy} onRetry={()=>void editor.retry()} /> : null}
    {state.conflict ? <>
      <Button disabled={state.busy} onClick={async () => { await editor.review(); }}><LocalizedText message="ui.review.latest.version.c57df6b5" /></Button>
      {state.reviewed ? <div className="w-full">
        <RecordComparison local={state.values} remote={state.baseline} />
        {state.remoteDraft ? <div><b><LocalizedText message="ui.latest.recovery.draft.from.another.editor.21da5598" /></b><RecordComparison local={state.values} remote={state.remoteDraft.values} /></div> : null}
        <Button disabled={state.busy} onClick={() => { editor.keepEdits(); }}><LocalizedText message="ui.keep.my.edits.for.the.next.save.b1e81546" /></Button>
        <Button disabled={state.busy} onClick={() => { void editor.discard(); }}><LocalizedText message="ui.use.saved.version.a5955780" /></Button>
      </div> : null}
    </> : null}
  </Card>;
}
