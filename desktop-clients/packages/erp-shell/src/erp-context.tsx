"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LANGUAGE_OPTIONS, MODULES, PAGE_REGISTRY, translate } from "@pepbits/erp-config";
import type { ModuleKey, ToastItem, UserPreferences } from "@pepbits/erp-config";
import { useNavigation } from "@pepbits/platform-ports";
import { authedFetch, useSession } from "@pepbits/auth";

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "nexora",
  formNavigation: "rail",
  resultView: "table",
  previewMode: "right-drawer",
  sidebarPlacement: "left",
  sidebarPinned: false,
  density: "comfortable",
  pageSize: 20,
  fontFamily: "inter",
  fontSize: "md",
  toastPosition: "top-right",
  toastDuration: 3500,
  toastTone: "adaptive",
  helperEnabled: true,
  documentationEnabled: true,
  reducedMotion: false,
  language: "en",
  billingLayout: "workspace",
  globalSearchMode: "smart",
  rememberFilters: true,
  openRecordsInTabs: true,
  showKeyboardHints: true,
};

const FONT_MAP = {
  inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  manrope: "Manrope, Inter, ui-sans-serif, system-ui, sans-serif",
  system: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
};

const FONT_SCALE = { sm: ".93", md: "1", lg: "1.08" };

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
  role: string;
  setRole: (role: string) => void;
  toasts: ToastItem[];
  toast: (toast: Omit<ToastItem, "id">) => void;
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

/** Only the keys that differ from the defaults, so the stored JSON reads as "what this
    user changed" and any key added to UserPreferences later starts at its new default
    rather than at whatever was frozen into an older full snapshot. */
function overridesOf(preferences: UserPreferences): Partial<UserPreferences> {
  const diff: Record<string, unknown> = {};
  for (const key of Object.keys(DEFAULT_PREFERENCES) as Array<keyof UserPreferences>) {
    if (preferences[key] !== DEFAULT_PREFERENCES[key]) diff[key] = preferences[key];
  }
  return diff as Partial<UserPreferences>;
}

export function ERPProvider({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const navigation = useNavigation();
  const { user } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  /* Seeded from the signed-in account rather than hardcoded, but still user-changeable:
     the header selectors are a "view as" control in this prototype, not authorization. */
  const [branch, setBranch] = useState(user?.branch ?? "hq");
  const [role, setRole] = useState(user?.role ?? "enterprise-admin");
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
          const body = (await response.json()) as { preferences?: Partial<UserPreferences> };
          if (!cancelled) setPreferences({ ...DEFAULT_PREFERENCES, ...(body.preferences ?? {}) });
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
        body: JSON.stringify({ preferences: overridesOf(preferences) }),
      }).catch(() => {
        // A failed save is not worth interrupting the user over in a demo.
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [loaded, preferences]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = preferences.theme;
    root.dataset.reducedMotion = String(preferences.reducedMotion);
    root.style.setProperty("--font-ui", FONT_MAP[preferences.fontFamily]);
    root.style.setProperty("--font-scale", FONT_SCALE[preferences.fontSize]);
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
    setToasts((previous) => [...previous, { ...nextToast, id }]);
    window.setTimeout(() => setToasts((previous) => previous.filter((item) => item.id !== id)), preferences.toastDuration);
  }, [preferences.toastDuration]);

  const dismissToast = useCallback((id: string) => setToasts((previous) => previous.filter((item) => item.id !== id)), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      /* Holding Alt+N used to append one tab per OS key-repeat event — roughly 19 on
         a default macOS setting, 45 on Windows, from one sustained press. */
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.getAttribute("contenteditable") === "true";
      /* event.code, not event.key: Option+N on a macOS US layout is the tilde dead key
         and reports event.key === "Dead", so every key-based match was silently dead
         on every Mac. */
      if ((event.metaKey || event.ctrlKey) && event.code === "KeyK") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.code === "Comma") {
        event.preventDefault();
        navigation.open({ pageId: "preferences" });
      }
      if (!typing && event.key === "?") {
        event.preventDefault();
        setHelpOpen(true);
      }
      if (!typing && event.altKey && event.code === "KeyN") {
        event.preventDefault();
        navigation.openInNewContext({ pageId: navigation.current.pageId, mode: "new" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigation]);

  const t = useCallback((key: string) => translate(preferences.language, key), [preferences.language]);

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
    setRole,
    toasts,
    toast,
    dismissToast,
    commandOpen,
    setCommandOpen,
    helpOpen,
    setHelpOpen,
    documentationOpen,
    setDocumentationOpen,
    t,
  }), [branch, commandOpen, currentModule, dismissToast, documentationOpen, helpOpen, preferences, resetPreferences, role, t, toast, toasts, updatePreference, updatePreferences]);

  if (!loaded) return <>{fallback}</>;

  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>;
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) throw new Error("useERP must be used within ERPProvider");
  return context;
}
