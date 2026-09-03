'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PREFS, PreferencesSchema, type Preferences } from './schema';
interface PrefsState { prefs: Preferences; set: (patch: Partial<Preferences>) => void; reset: () => void; setColumns: (entity: string, keys: string[]) => void }
export const usePrefsStore = create<PrefsState>()(persist((set, get) => ({
  prefs: DEFAULT_PREFS,
  set: patch => set({ prefs: { ...get().prefs, ...patch } }),
  reset: () => set({ prefs: DEFAULT_PREFS }),
  setColumns: (entity, keys) => set({ prefs: { ...get().prefs, columns: { ...get().prefs.columns, [entity]: keys } } })
}), { name: 'vantage.prefs', merge: (persisted, current) => { const parsed = PreferencesSchema.partial().safeParse((persisted as { prefs?: unknown })?.prefs ?? {}); return { ...current, prefs: { ...DEFAULT_PREFS, ...(parsed.success ? parsed.data : {}) } }; } }));
export const usePreferences = () => { const s = usePrefsStore(); return [s.prefs, s.set] as const; };
