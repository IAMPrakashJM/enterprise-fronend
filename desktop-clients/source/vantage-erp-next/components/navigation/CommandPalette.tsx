'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { modules, hrefFor } from '@/lib/mock';
import { useWorkspace } from '@/lib/workspace/store';
import { Kbd } from '@/components/primitives/Kbd';
import { cn } from '@/lib/format';
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const ws = useWorkspace(); const router = useRouter(); const [q, setQ] = useState(''); const [idx, setIdx] = useState(0); const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const all = useMemo(() => modules.flatMap(m => m.sections.flatMap(s => s.items.flatMap(g => g.children.map(c => ({ short: m.short, label: c.label, crumb: m.name + ' › ' + g.label, module: m.id, href: hrefFor(m.id, c.route) }))))), []);
  const items = all.filter(i => !q || (i.label + ' ' + i.crumb).toLowerCase().includes(q.toLowerCase())).sort((a, b) => (a.module === ws.module ? 0 : 1) - (b.module === ws.module ? 0 : 1)).slice(0, 12);
  const go = (i: typeof items[number]) => { if (i.module !== ws.module) ws.setModule(i.module); ws.setWorkspace(i.href, i.label); router.push(i.href); onClose(); };
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/35 z-[90]" />
      <div role="dialog" className="fixed top-[12vh] left-1/2 -translate-x-1/2 w-[min(620px,92vw)] bg-surface border border-border shadow-ui rounded-ui z-[91] flex flex-col max-h-[70vh] animate-[fadeIn_.12s]">
        <input ref={ref} value={q} onChange={e => { setQ(e.target.value); setIdx(0); }} onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(Math.min(items.length - 1, idx + 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(Math.max(0, idx - 1)); } else if (e.key === 'Enter' && items[idx]) go(items[idx]); }} placeholder="Go to a page, record type or action…" className="h-[46px] px-4 border-b border-border bg-transparent text-[15px] outline-none" />
        <div className="overflow-auto p-1.5">{items.map((i, n) => <button key={i.href + i.label} onClick={() => go(i)} className={cn('w-full flex items-center gap-3 px-3 py-2 text-left rounded-ui hover:bg-surface2', n === idx && 'bg-surface2')}><span className="text-[10px] font-bold text-accent w-6">{i.short}</span><span className="flex-1">{i.label}</span><span className="text-muted text-[11.5px]">{i.crumb}</span></button>)}{!items.length && <div className="p-6 text-center text-muted">Nothing matches</div>}</div>
        <div className="px-3.5 py-2 border-t border-border text-muted text-[11px] flex gap-3.5"><span><Kbd>↵</Kbd> open</span><span><Kbd>↑↓</Kbd> move</span><span><Kbd>esc</Kbd> close</span></div>
      </div>
    </>
  );
}
