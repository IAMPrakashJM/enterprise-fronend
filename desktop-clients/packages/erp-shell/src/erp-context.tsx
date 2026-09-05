"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PREFERENCES, LANGUAGE_OPTIONS, MODULES, PAGE_REGISTRY,
  createFormatters, preferenceOverrides, sanitizePreferences, translate,
  SHORTCUTS,
  SIDEBAR_SEARCH_EVENT,
  matchesShortcut,
} from "@pepbits/erp-config";
import type { Formatters, ModuleKey, ToastItem, UserPreferences } from "@pepbits/erp-config";
import { useNavigation } from "@pepbits/platform-ports";
import { authedFetch, useSession } from "@pepbits/auth";


/* Every family here is loaded by the shells (Google Fonts in web's layout.tsx
   and desktop's index.html), so the picker changes what you see. Before this
   the list offered Inter and Manrope with neither loaded -- the choice did
   nothing on any machine that lacked them locally, which is most machines. */
const FONT_MAP: Record<string, string> = {
  inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  plex: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  "source-sans": "'Source Sans 3', ui-sans-serif, system-ui, sans-serif",
  nunito: "'Nunito Sans', ui-sans-serif, system-ui, sans-serif",
  manrope: "Manrope, Inter, ui-sans-serif, system-ui, sans-serif",
  system: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  "plex-mono": "'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
};

/* 13px is the reference: the design as drawn. Each scale is the chosen px over
   that, applied by calc() at every text class -- see tokens.css for why the
   multiplication happens at the element and not here. */
const TYPE_REFERENCE_PX = 13;

/** Table/card row padding, as a variable so density has ONE definition. */
const ROW_PADDING = { compact: "6px", comfortable: "10px", spacious: "14px" };

interface ERPContextValue {
  /** Derived from the navigation port, never stored. Two sources of truth for the
      active module was what stranded a foreign home tab in the desktop tab bar. */
  currentModule: ModuleKey;
  module: (typeof MODULES)[ModuleKey];
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  updatePreferences: (next: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  branch: string;
  setBranch: (branch: string) => void;
  /** Read-only now. The role selector was a "view as" control, not
      authorization; with it gone the role is simply the signed-in account's. */
  role: string;
  toasts: ToastItem[];
  toast: (toast: Omit<ToastItem, "id">) => void;
  /** Preference-aware value formatting. Every screen renders money, dates and
      numbers through this, so one preference change reformats all of them. */
  format: Formatters;
  dismissToast: (id: string) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  documentationOpen: boolean;
  setDocumentationOpen: (open: boolean) => void;
  t: (key: string) => string;
}

const ERPContext = createContext<ERPContextValue | null>(null);

export function dashboardPageId(module: ModuleKey): string {
  return module === "library" ? "library-dashboard" : `${module}-dashboard`;
}

/** The module a page belongs to, with "shared" pages inheriting the fallback so the
    sidebar keeps rendering a real module while Preferences is open. */
export function moduleForPage(pageId: string, fallback: ModuleKey = "finance"): ModuleKey {
  const page = PAGE_REGISTRY[pageId];
  return page && page.module !== "shared" ? page.module : fallback;
}

/** Where the boot-time answer to "skeletons?" is kept. */
export const SKELETON_HINT = "nexora-loading-skeletons";

/** Readable before the provider exists, so the fallback can be chosen. */
export function skeletonsPreferred(): boolean {
  try { return window.localStorage.getItem(SKELETON_HINT) !== "false"; } catch { return true; }
}

export function ERPProvider({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const navigation = useNavigation();
  const { user } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  /* Seeded from the signed-in account rather than hardcoded, but still user-changeable:
     the header selectors are a "view as" control in this prototype, not authorization. */
  const [branch, setBranch] = useState(user?.branch ?? "hq");
  const [role] = useState(user?.role ?? "enterprise-admin");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [documentationOpen, setDocumentationOpen] = useState(false);
  /* Remembered only so a "shared" page (Preferences, Spreadsheet Studio, the Developer
     Library) keeps the sidebar on the module the user came from. */
  const [lastModule, setLastModule] = useState<ModuleKey>("finance");

  const currentModule = moduleForPage(navigation.current.pageId, lastModule);

  useEffect(() => {
    const page = PAGE_REGISTRY[navigation.current.pageId];
    if (page && page.module !== "shared") setLastModule(page.module);
  }, [navigation.current.pageId]);

  /* Preferences come from the server, keyed by the signed-in user. The shell renders
     `fallback` until they land, so it never paints in one theme and then jumps to
     another — and localStorage holds none of this, because two stores for one setting
     is a reconciliation bug waiting to happen. */
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await authedFetch("/preferences");
        if (cancelled) return;
        if (response.ok) {
          const body = (await response.json()) as { preferences?: unknown };
          /* Validated, not spread. A theme id removed in a later release, or a
             hand-edited preferences.json, used to reach the shell verbatim and
             set data-theme to a selector no stylesheet defines. */
          if (!cancelled) setPreferences(sanitizePreferences(body.preferences));
        }
      } catch {
        // API unreachable: fall through to defaults rather than blocking the shell.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* Debounced so dragging a slider or clicking through a theme row does not fire a
     request per keystroke, and skipped until the initial load resolves so mounting
     cannot immediately write back what it just read. */
  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      void authedFetch("/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: preferenceOverrides(preferences) }),
      }).catch(() => {
        // A failed save is not worth interrupting the user over in a demo.
      });
    }, 400);
    return () => window.clearTimeout(timer);
    /* Remembered for the NEXT first paint. The loading placeholder must be
       chosen before preferences exist — that fetch is the wait it covers — so
       the only honest way to honour the setting is to have kept last time's
       answer, the same trick a theme uses to avoid a flash of wrong colours.
       The first visit ever gets the default, and nothing can change that. */
    try { window.localStorage.setItem(SKELETON_HINT, String(preferences.loadingSkeletons)); } catch { /* storage unavailable */ }
  }, [loaded, preferences]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = preferences.theme;
    root.dataset.reducedMotion = String(preferences.reducedMotion);
    root.style.setProperty("--font-ui", FONT_MAP[preferences.fontFamily] ?? FONT_MAP.inter);
    root.style.setProperty("--fs-shell", String(preferences.fontSizeBase / TYPE_REFERENCE_PX));
    root.style.setProperty("--fs-form", String(preferences.fontSizeForm / TYPE_REFERENCE_PX));
    root.style.setProperty("--fs-result", String(preferences.fontSizeResult / TYPE_REFERENCE_PX));
    /* Written as variables rather than read as props by each component: one
       assignment restyles every card, table row and input at once, and there is
       no ternary to duplicate across DataTable and CardGrid. */
    root.style.setProperty("--radius", `${preferences.cornerRadius}px`);
    root.style.setProperty("--row-py", ROW_PADDING[preferences.density]);
    const language = LANGUAGE_OPTIONS.find((item) => item.value === preferences.language);
    root.lang = preferences.language;
    root.dir = language?.dir ?? "ltr";
  }, [preferences]);

  useEffect(() => {
    window.localStorage.setItem("nexora-module", currentModule);
  }, [currentModule]);

  const updatePreference = useCallback(<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((previous) => ({ ...previous, [key]: value }));
  }, []);

  const updatePreferences = useCallback((next: Partial<UserPreferences>) => {
    setPreferences((previous) => ({ ...previous, ...next }));
  }, []);

  const resetPreferences = useCallback(() => setPreferences(DEFAULT_PREFERENCES), []);

  const toast = useCallback((nextToast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    /* Trimmed on ADD, not at render: keeping the overflow in state and showing
       only the last N leaves invisible toasts holding live dismiss timers, and
       a bulk action would then drip them back one at a time as those fire. */
    setToasts((previous) => [...previous, { ...nextToast, id }].slice(-preferences.maxVisibleToasts));
    window.setTimeout(() => setToasts((previous) => previous.filter((item) => item.id !== id)), preferences.toastDuration);
  }, [preferences.maxVisibleToasts, preferences.toastDuration]);

  const dismissToast = useCallback((id: string) => setToasts((previous) => previous.filter((item) => item.id !== id)), []);

  useEffect(() => {
    /* OFF UNBINDS, rather than binding and then ignoring. Someone who turns
       shortcuts off usually wants a key back — for a screen reader, the browser,
       an IME — and a listener that swallows the event before deciding not to act
       has still taken it. */
    if (!preferences.keyboardShortcuts) return undefined;

    const actions: Record<string, () => void> = {
      command: () => setCommandOpen(true),
      preferences: () => navigation.open({ pageId: "preferences" }),
      dashboard: () => navigation.open({ pageId: `${currentModule}-dashboard` }),
      search: () => window.dispatchEvent(new CustomEvent(SIDEBAR_SEARCH_EVENT)),
      newRecord: () => navigation.openInNewContext({ pageId: navigation.current.pageId, mode: "new" }),
      pinSidebar: () => updatePreference("sidebarPinned", !preferences.sidebarPinned),
      help: () => setHelpOpen(true),
    };

    const onKey = (event: KeyboardEvent) => {
      /* Holding a shortcut used to append one tab per OS key-repeat event. */
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA"
        || target?.getAttribute("contenteditable") === "true";

      /* One loop over the registry, so a shortcut cannot exist in the help panel
         and not in the binding, or the other way round. */
      for (const shortcut of SHORTCUTS) {
        if (!matchesShortcut(shortcut, event)) continue;
        if (typing && !shortcut.whileTyping) continue;
        const run = actions[shortcut.id];
        if (!run) continue;
        event.preventDefault();
        run();
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentModule, navigation, preferences.keyboardShortcuts, preferences.sidebarPinned, updatePreference]);

  const t = useCallback((key: string) => translate(preferences.language, key), [preferences.language]);

  const format = useMemo(() => createFormatters(preferences), [
    preferences.currencyCode, preferences.numberLocale, preferences.dateFormat, preferences.decimalPlaces,
    preferences.timeFormat, preferences.currencyDisplay, preferences.negativeStyle,
  ]);

  const value = useMemo<ERPContextValue>(() => ({
    currentModule,
    module: MODULES[currentModule],
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    branch,
    setBranch,
    role,
    toasts,
    toast,
    dismissToast,
    format,
    commandOpen,
    setCommandOpen,
    helpOpen,
    setHelpOpen,
    documentationOpen,
    setDocumentationOpen,
    t,
  }), [branch, commandOpen, currentModule, dismissToast, documentationOpen, format, helpOpen, preferences, resetPreferences, role, t, toast, toasts, updatePreference, updatePreferences]);

  if (!loaded) return <>{fallback}</>;

  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>;
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) throw new Error("useERP must be used within ERPProvider");
  return context;
}
