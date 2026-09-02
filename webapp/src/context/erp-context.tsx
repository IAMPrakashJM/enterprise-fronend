"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LANGUAGE_OPTIONS, translate } from "@/config/i18n";
import { MODULES, PAGE_REGISTRY } from "@/config/navigation";
import type { ModuleKey, ToastItem, UserPreferences, WorkspaceTab } from "@/types";

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

interface OpenPageOptions {
  mode?: "view" | "edit" | "new";
  recordId?: string;
  title?: string;
  forceNewTab?: boolean;
}

interface ERPContextValue {
  currentModule: ModuleKey;
  module: (typeof MODULES)[ModuleKey];
  setModule: (module: ModuleKey) => void;
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  updatePreferences: (next: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  branch: string;
  setBranch: (branch: string) => void;
  role: string;
  setRole: (role: string) => void;
  tabs: WorkspaceTab[];
  activeTab: WorkspaceTab;
  activePageId: string;
  openPage: (pageId: string, options?: OpenPageOptions) => void;
  closeTab: (tabId: string) => void;
  activateTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
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

function dashboardPage(module: ModuleKey) {
  return module === "library" ? "library-dashboard" : `${module}-dashboard`;
}

function makeDashboardTab(module: ModuleKey): WorkspaceTab {
  const pageId = dashboardPage(module);
  return {
    id: `${module}-home`,
    title: PAGE_REGISTRY[pageId]?.title ?? "Dashboard",
    pageId,
    closable: false,
  };
}

export function ERPProvider({ children }: { children: React.ReactNode }) {
  const [currentModule, setCurrentModule] = useState<ModuleKey>("finance");
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [branch, setBranch] = useState("hq");
  const [role, setRole] = useState("enterprise-admin");
  const [tabs, setTabs] = useState<WorkspaceTab[]>([makeDashboardTab("finance")]);
  const [activeTabId, setActiveTabId] = useState("finance-home");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [documentationOpen, setDocumentationOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("nexora-preferences-v1");
      if (saved) setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) as Partial<UserPreferences> });
      const savedModule = window.localStorage.getItem("nexora-module") as ModuleKey | null;
      if (savedModule && MODULES[savedModule]) {
        setCurrentModule(savedModule);
        const home = makeDashboardTab(savedModule);
        setTabs([home]);
        setActiveTabId(home.id);
      }
    } catch {
      // Invalid browser storage is ignored and safe defaults are retained.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("nexora-preferences-v1", JSON.stringify(preferences));
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

  const setModule = useCallback((nextModule: ModuleKey) => {
    setCurrentModule(nextModule);
    const home = makeDashboardTab(nextModule);
    setTabs([home]);
    setActiveTabId(home.id);
  }, []);

  const openPage = useCallback((pageId: string, options: OpenPageOptions = {}) => {
    const page = PAGE_REGISTRY[pageId];
    if (!page) return;
    if (page.module !== "shared" && page.module !== currentModule) setCurrentModule(page.module);

    const suffix = options.mode && options.mode !== "view" ? ` • ${options.mode === "new" ? "New" : "Edit"}` : "";
    const recordSuffix = options.recordId ? ` • ${options.recordId}` : "";
    const title = options.title ?? `${page.title}${suffix}${recordSuffix}`;
    const baseId = `${pageId}:${options.mode ?? "list"}:${options.recordId ?? "root"}`;
    const existing = tabs.find((tab) => tab.id === baseId);
    if (existing && !options.forceNewTab) {
      setActiveTabId(existing.id);
      return;
    }
    const nextTab: WorkspaceTab = {
      id: options.forceNewTab ? `${baseId}:${Date.now()}` : baseId,
      title,
      pageId,
      mode: options.mode,
      recordId: options.recordId,
      closable: true,
    };
    setTabs((previous) => [...previous, nextTab]);
    setActiveTabId(nextTab.id);
  }, [currentModule, tabs]);

  const closeTab = useCallback((tabId: string) => {
    setTabs((previous) => {
      const index = previous.findIndex((tab) => tab.id === tabId);
      if (index < 0 || !previous[index].closable) return previous;
      const next = previous.filter((tab) => tab.id !== tabId);
      if (activeTabId === tabId) {
        const fallback = next[Math.max(0, index - 1)] ?? next[0];
        if (fallback) setActiveTabId(fallback.id);
      }
      return next;
    });
  }, [activeTabId]);

  const closeOtherTabs = useCallback((tabId: string) => {
    setTabs((previous) => previous.filter((tab) => !tab.closable || tab.id === tabId));
    setActiveTabId(tabId);
  }, []);

  const toast = useCallback((nextToast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((previous) => [...previous, { ...nextToast, id }]);
    window.setTimeout(() => setToasts((previous) => previous.filter((item) => item.id !== id)), preferences.toastDuration);
  }, [preferences.toastDuration]);

  const dismissToast = useCallback((id: string) => setToasts((previous) => previous.filter((item) => item.id !== id)), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.getAttribute("contenteditable") === "true";
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === ",") {
        event.preventDefault();
        openPage("preferences");
      }
      if (!typing && event.key === "?") {
        event.preventDefault();
        setHelpOpen(true);
      }
      if (!typing && event.altKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        const active = tabs.find((tab) => tab.id === activeTabId);
        if (active) openPage(active.pageId, { mode: "new", forceNewTab: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTabId, openPage, tabs]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const t = useCallback((key: string) => translate(preferences.language, key), [preferences.language]);

  const value = useMemo<ERPContextValue>(() => ({
    currentModule,
    module: MODULES[currentModule],
    setModule,
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    branch,
    setBranch,
    role,
    setRole,
    tabs,
    activeTab,
    activePageId: activeTab?.pageId ?? dashboardPage(currentModule),
    openPage,
    closeTab,
    activateTab: setActiveTabId,
    closeOtherTabs,
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
  }), [activeTab, branch, closeOtherTabs, closeTab, commandOpen, currentModule, dismissToast, documentationOpen, helpOpen, openPage, preferences, resetPreferences, role, setModule, t, tabs, toast, toasts, updatePreference, updatePreferences]);

  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>;
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) throw new Error("useERP must be used within ERPProvider");
  return context;
}
