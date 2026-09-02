import { useCallback, useMemo, useRef, useState } from "react";
import { PAGE_REGISTRY } from "@pepbits/erp-config";
import type { ModuleKey } from "@pepbits/erp-config";
import { targetKey } from "@pepbits/platform-ports";
import type { NavigationPort, NavigationTarget } from "@pepbits/platform-ports";

export interface MdiTab {
  id: string;
  title: string;
  target: NavigationTarget;
  closable: boolean;
}

function dashboardPageId(module: ModuleKey): string {
  return module === "library" ? "library-dashboard" : `${module}-dashboard`;
}

function moduleOf(pageId: string, fallback: ModuleKey): ModuleKey {
  const page = PAGE_REGISTRY[pageId];
  return page && page.module !== "shared" ? page.module : fallback;
}

function titleFor(target: NavigationTarget): string {
  if (target.title) return target.title;
  const page = PAGE_REGISTRY[target.pageId];
  const base = page?.title ?? "Page";
  const suffix = target.mode && target.mode !== "view" ? ` • ${target.mode === "new" ? "New" : "Edit"}` : "";
  const record = target.recordId ? ` • ${target.recordId}` : "";
  return `${base}${suffix}${record}`;
}

/* The home tab is built through the SAME id function as every other tab. A bespoke
   `${module}-home` id sat outside openPage's namespace, so the dedupe lookup always
   missed it and clicking the dashboard menu item opened a duplicate of the tab
   already showing that dashboard. */
function homeTab(module: ModuleKey): MdiTab {
  const target: NavigationTarget = { pageId: dashboardPageId(module) };
  return { id: targetKey(target), title: titleFor(target), target, closable: false };
}

export function useMdiNavigation(initialModule: ModuleKey = "finance") {
  const [tabs, setTabs] = useState<MdiTab[]>(() => [homeTab(initialModule)]);
  const [activeTabId, setActiveTabId] = useState(() => homeTab(initialModule).id);
  /* A monotonic counter, not Date.now(): millisecond resolution let two forced opens
     inside one tick collide on id, which duplicated a React key AND made closeTab's
     filter remove both colliding tabs at once. */
  const forcedSeq = useRef(0);

  const currentModule = useCallback(
    (list: MdiTab[]) => moduleOf(list.find((tab) => !tab.closable)?.target.pageId ?? "finance-dashboard", "finance"),
    [],
  );

  const open = useCallback((target: NavigationTarget) => {
    const id = targetKey(target);
    setTabs((previous) => {
      const here = currentModule(previous);
      const next = moduleOf(target.pageId, here);
      /* Crossing modules rebuilds the tab set — the old setModule behaviour. Doing it
         here rather than in shared state is what stops the previous module's
         unclosable home tab being stranded in the bar. */
      if (next !== here) {
        const home = homeTab(next);
        setActiveTabId(id);
        return home.id === id ? [home] : [home, { id, title: titleFor(target), target, closable: true }];
      }
      setActiveTabId(id);
      if (previous.some((tab) => tab.id === id)) return previous;
      return [...previous, { id, title: titleFor(target), target, closable: true }];
    });
  }, [currentModule]);

  const openInNewContext = useCallback((target: NavigationTarget) => {
    forcedSeq.current += 1;
    const id = `${targetKey(target)}#${forcedSeq.current}`;
    setTabs((previous) => [...previous, { id, title: titleFor(target), target, closable: true }]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs((previous) => {
      const index = previous.findIndex((tab) => tab.id === tabId);
      if (index < 0 || !previous[index].closable) return previous;
      const next = previous.filter((tab) => tab.id !== tabId);
      setActiveTabId((active) => (active === tabId ? (next[Math.max(0, index - 1)] ?? next[0])?.id ?? active : active));
      return next;
    });
  }, []);

  const closeOtherTabs = useCallback((tabId: string) => {
    setTabs((previous) => previous.filter((tab) => !tab.closable || tab.id === tabId));
    setActiveTabId(tabId);
  }, []);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  const port: NavigationPort = useMemo(() => ({
    current: activeTab.target,
    open,
    openInNewContext,
    hrefFor: () => "#",
  }), [activeTab.target, open, openInNewContext]);

  return { port, tabs, activeTab, activeTabId, setActiveTabId, closeTab, closeOtherTabs };
}
