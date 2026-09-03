'use client';
import { create } from 'zustand';
import { usePrefsStore } from '@/lib/prefs/store';
export type ToastKind = 'ok' | 'warn' | 'err' | 'info';
export interface Toast { id: number; kind: ToastKind; title: string; msg: string; dur: number }
interface TS { toasts: Toast[]; push: (msg: string, kind?: ToastKind, title?: string) => void; dismiss: (id: number) => void }
let seq = 0;
const TITLES: Record<ToastKind, string> = { ok: 'Success', warn: 'Warning', err: 'Error', info: 'Info' };
export const useToastStore = create<TS>((set, get) => ({
  toasts: [],
  push: (msg, kind = 'ok', title) => { const id = ++seq; const dur = usePrefsStore.getState().prefs.toastDur * 1000; set({ toasts: [...get().toasts, { id, kind, title: title ?? TITLES[kind], msg, dur }] }); setTimeout(() => get().dismiss(id), dur); },
  dismiss: id => set({ toasts: get().toasts.filter(t => t.id !== id) })
}));
export const toast = (msg: string, kind?: ToastKind, title?: string) => useToastStore.getState().push(msg, kind, title);
