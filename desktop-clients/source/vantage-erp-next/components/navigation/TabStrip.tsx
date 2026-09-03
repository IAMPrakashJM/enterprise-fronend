'use client';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace/store';
import { getModule } from '@/lib/mock';
import { Kbd } from '@/components/primitives/Kbd';
import { cn } from '@/lib/format';
export function TabStrip({ onPalette }: { onPalette: () => void }) {
  const ws = useWorkspace(); const router = useRouter(); const m = getModule(ws.module);
  return (
    <div className="h-[34px] shrink-0 flex items-stretch bg-surface border-b border-border overflow-x-auto overflow-y-hidden">
      {ws.tabs.map(tb => { const act = tb.id === ws.active; return (
        <div key={tb.id} onClick={() => { ws.activate(tb.id); router.push(tb.href); }} className={cn('flex items-center gap-2 px-3 border-e border-border border-b-2 cursor-pointer whitespace-nowrap text-[12.5px] max-w-[260px] hover:bg-surface2', act ? 'border-b-accent bg-bg text-text' : 'border-b-transparent text-muted')}>
          <span className="text-[10px] font-bold text-accent tracking-wide">{tb.badge ?? (tb.id === 'ws' ? m.short : '')}</span><span className="truncate">{tb.title}</span>
          {tb.id !== 'ws' && <button title="Close tab (Ctrl+W)" onClick={e => { e.stopPropagation(); router.push(ws.closeTab(tb.id)); }} className="w-[18px] h-[18px] grid place-items-center text-muted text-sm leading-none rounded-ui hover:bg-border hover:text-text">×</button>}
        </div>); })}
      <div className="flex-1" />
      <button onClick={onPalette} title="Command palette (Ctrl+K)" className="flex items-center gap-2 px-3 border-s border-border text-muted text-xs whitespace-nowrap hover:text-text"><span>Go to…</span><Kbd>Ctrl K</Kbd></button>
    </div>
  );
}
