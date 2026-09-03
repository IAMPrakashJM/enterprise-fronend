'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ERP, getModule, hrefFor } from '@/lib/mock';
import { usePrefsStore } from '@/lib/prefs/store';
import { useWorkspace } from '@/lib/workspace/store';
import { useT } from '@/lib/i18n/useT';
import { cn } from '@/lib/format';
export function Sidebar() {
  const { module, setWorkspace, role } = useWorkspace(); const { prefs, set } = usePrefsStore(); const router = useRouter(); const path = usePathname(); const t = useT();
  const [hover, setHover] = useState(false); const [open, setOpen] = useState<Record<string, boolean>>({});
  const expanded = prefs.pinned || hover; const m = getModule(module);
  useEffect(() => { document.documentElement.style.setProperty('--sb-w', expanded ? '260px' : '56px'); }, [expanded]);
  const go = (href: string, title: string) => { setWorkspace(href, title); router.push(href); };
  return (
    <div className="relative shrink-0 transition-[width] duration-150" style={{ width: 'var(--sb-slot)' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <aside data-tour="sidebar" className="absolute top-0 bottom-0 overflow-hidden flex flex-col z-30 bg-sidebar text-sidebar-text shadow-ui transition-[width] duration-150" style={{ width: 'var(--sb-w)', left: 'var(--sb-l)', right: 'var(--sb-r)' }}>
        <div className="h-11 shrink-0 flex items-center gap-2.5 px-3 border-b border-white/10">
          <span className="w-8 h-6 shrink-0 grid place-items-center text-[10px] font-bold tracking-wide bg-white/10 rounded-ui">{m.short}</span>
          <span className="whitespace-nowrap font-semibold truncate flex-1">{m.name}</span>
          <button onClick={() => set({ pinned: !prefs.pinned })} title={(prefs.pinned ? t('unpin') : t('pin')) + ' (Alt+P)'} className="w-6 h-6 shrink-0 border border-white/20 rounded-ui grid place-items-center text-[11px] hover:bg-white/10">{prefs.pinned ? '◉' : '○'}</button>
        </div>
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1.5">
          {m.sections.map(sec => (
            <div key={sec.title}>
              <div className="mx-3 mt-2 mb-0.5 pt-1.5 border-t border-white/10 text-[10px] font-bold tracking-[.9px] uppercase opacity-55 whitespace-nowrap overflow-hidden h-[22px]">{expanded ? t(sec.title) : ''}</div>
              {sec.items.map(g => {
                const active = g.children.some(c => hrefFor(module, c.route) === path); const isOpen = open[g.id] ?? active;
                return (
                  <div key={g.id}>
                    <button title={g.label} onClick={() => expanded ? setOpen({ ...open, [g.id]: !isOpen }) : go(hrefFor(module, g.children[0].route), g.children[0].label)} className={cn('w-full flex items-center gap-2.5 px-3 h-9 text-left whitespace-nowrap hover:bg-white/10 border-s-[3px]', active ? 'border-accent' : 'border-transparent')}>
                      <span className="w-[29px] h-[26px] shrink-0 grid place-items-center text-[11px] font-bold bg-white/10 rounded-ui">{g.icon}</span>
                      <span className="flex-1 truncate">{g.label}</span><span className="text-[10px] opacity-70">{expanded ? (isOpen ? '▾' : '▸') : ''}</span>
                    </button>
                    {expanded && isOpen && <div className="flex flex-col pt-0.5 pb-1.5">
                      {g.children.map(c => { const href = hrefFor(module, c.route); const on = href === path; return (
                        <button key={c.label} onClick={() => go(href, c.label)} className={cn('flex items-center gap-2 ps-[54px] pe-3 h-[30px] text-[12.5px] text-left whitespace-nowrap hover:bg-white/10 hover:opacity-100', on ? 'bg-white/10' : 'opacity-80')}>
                          <span className={cn('w-[5px] h-[5px] rounded-full shrink-0', on ? 'bg-accent' : 'bg-white/30')} /><span className="truncate">{c.label}</span>
                        </button>); })}
                    </div>}
                  </div>);
              })}
            </div>
          ))}
        </nav>
        <div className="shrink-0 px-3 py-2.5 border-t border-white/10 flex items-center gap-2.5 whitespace-nowrap overflow-hidden">
          <span className="w-8 h-6 shrink-0 grid place-items-center text-[10px] font-bold bg-white/15 rounded-ui">{ERP.user.initials}</span>
          <span className="flex flex-col leading-tight overflow-hidden"><span className="text-[12px]">{ERP.user.name}</span><span className="text-[10.5px] opacity-60">{role}</span></span>
        </div>
      </aside>
    </div>
  );
}
