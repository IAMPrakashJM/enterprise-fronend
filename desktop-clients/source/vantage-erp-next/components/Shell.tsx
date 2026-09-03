'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ERP, getModule, getSchema, modules } from '@/lib/mock';
import { usePrefsStore } from '@/lib/prefs/store';
import { applyPrefs } from '@/lib/prefs/applyPrefs';
import { useWorkspace } from '@/lib/workspace/store';
import { useHotkeys } from '@/lib/hotkeys';
import { useT } from '@/lib/i18n/useT';
import { LIBRARY } from '@/lib/library';
import { Header } from '@/components/navigation/Header';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TabStrip } from '@/components/navigation/TabStrip';
import { Footer } from '@/components/navigation/Footer';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { Toaster } from '@/components/surfaces/Toaster';
import { HelpFab, HelpPanel, ShortcutsDialog } from '@/components/help/HelpPanel';
import { DocsPanel } from '@/components/patterns/DocsPanel';
function describe(path: string, t: (k: string) => string) {
  const seg = path.split('/').filter(Boolean); const m = modules.find(x => x.id === seg[0]);
  if (seg[0] === 'preferences') return { type: 'prefs', title: t('myPreferences') }; if (seg[0] === 'settings') return { type: 'settings', title: t('settings') }; if (seg[0] === 'profile') return { type: 'profile', title: t('myProfile') };
  if (seg[0] === 'library' && seg[1]) return { type: 'library', title: 'Library · ' + (LIBRARY[seg[1]]?.title ?? '') };
  if (!m) return { type: 'dashboard', title: t('dashboard') };
  if (!seg[1]) return { type: 'dashboard', title: t('dashboard') + ' · ' + m.name };
  if (seg[1] === 'billing') return { type: 'billing', title: 'Tax invoice' }; if (seg[1] === 'reports') return { type: 'reports', title: 'Report center' }; if (seg[1] === 'excel') return { type: 'excel', title: 'Excel utility' };
  const s = getSchema(seg[1]); if (s && seg[2]) { const row = s.rows.find(r => r._id === seg[2]); return { type: 'form', title: (seg[2] === 'new' ? t('new') + ' ' : '') + s.label + (row ? ': ' + String(row[s.titleKey]) : '') }; }
  return { type: 'worklist', title: s?.plural ?? seg[1] };
}
export function Shell({ children }: { children: React.ReactNode }) {
  const { prefs, set } = usePrefsStore(); const ws = useWorkspace(); const path = usePathname(); const router = useRouter(); const t = useT();
  const [palette, setPalette] = useState(false); const [keys, setKeys] = useState(false); const [help, setHelp] = useState(false); const [ready, setReady] = useState(false);
  useEffect(() => { applyPrefs(prefs); setReady(true); }, [prefs]);
  useEffect(() => { const seg = path.split('/').filter(Boolean)[0]; if (seg && modules.some(m => m.id === seg) && seg !== ws.module) ws.setModule(seg); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  const info = describe(path, t); const m = getModule(ws.module);
  useHotkeys(useCallback((e: KeyboardEvent, typing: boolean) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true); return; }
    if (e.key === 'Escape') { setPalette(false); setKeys(false); setHelp(false); return; }
    if (e.key === 'F1') { e.preventDefault(); setHelp(h => !h); return; }
    if (e.altKey && /^[1-5]$/.test(e.key)) { e.preventDefault(); const mod = modules[+e.key - 1]; ws.setModule(mod.id); router.push('/' + mod.id); return; }
    if (e.altKey && e.key.toLowerCase() === 'p') { e.preventDefault(); set({ pinned: !prefs.pinned }); return; }
    if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); const i = ws.tabs.findIndex(x => x.id === ws.active); const n = ws.tabs[(i + (e.key === 'ArrowRight' ? 1 : ws.tabs.length - 1)) % ws.tabs.length]; ws.activate(n.id); router.push(n.href); return; }
    if (e.ctrlKey && e.key.toLowerCase() === 'w' && ws.active !== 'ws') { e.preventDefault(); router.push(ws.closeTab(ws.active)); return; }
    if (!typing && e.key === '?') { e.preventDefault(); setKeys(true); }
  }, [ws, prefs.pinned, set, router]));
  return (
    <div className={'flex flex-col h-screen overflow-hidden bg-bg text-text ' + (ready ? '' : 'invisible')}>
      <Header title={info.title} crumb={m.name} />
      <div className="flex flex-1 min-h-0" style={{ flexDirection: 'var(--side-dir)' as never }}>
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          <TabStrip onPalette={() => setPalette(true)} />
          <div id="content-scroll" className="flex-1 overflow-auto p-4 flex flex-col gap-3.5">
            <DocsPanel pageType={info.type} position="top" />
            {children}
            <DocsPanel pageType={info.type} position="bottom" />
          </div>
        </main>
      </div>
      <Footer onShortcuts={() => setKeys(true)} />
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
      {keys && <ShortcutsDialog onClose={() => setKeys(false)} />}
      {prefs.help && <HelpFab onClick={() => setHelp(!help)} />}
      {help && <HelpPanel pageType={info.type} pageName={info.title.split(' · ')[0]} onClose={() => setHelp(false)} />}
      <Toaster />
    </div>
  );
}
