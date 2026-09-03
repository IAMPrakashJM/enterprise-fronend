'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ERP } from '@/lib/mock';
import { HOTKEYS } from '@/lib/hotkeys';
import { useT } from '@/lib/i18n/useT';
import { useWorkspace } from '@/lib/workspace/store';
import { Button } from '@/components/primitives/Button';
import { Kbd } from '@/components/primitives/Kbd';
import { cn } from '@/lib/format';
export function HelpFab({ onClick }: { onClick: () => void }) { const t = useT(); return <button onClick={onClick} title={t('help') + ' (F1)'} className="fixed bottom-11 end-5 w-11 h-11 rounded-full bg-accent text-accent-fg text-lg font-bold z-[70] shadow-ui grid place-items-center animate-[pulse_2.4s_infinite]">?</button>; }
export function HelpPanel({ pageType, pageName, onClose }: { pageType: string; pageName: string; onClose: () => void }) {
  const t = useT(); const ws = useWorkspace(); const router = useRouter(); const [tab, setTab] = useState<'tour' | 'docs' | 'keys'>('tour'); const [step, setStep] = useState(0); const [playing, setPlaying] = useState(false); const [spot, setSpot] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const steps = ERP.tours[pageType] ?? ERP.tours.default; const st = steps[Math.min(step, steps.length - 1)]; const doc = ERP.docs[pageType] ?? ERP.docs.dashboard;
  const measure = useCallback(() => { if (tab !== 'tour') { setSpot(null); return; } const el = document.querySelector('[data-tour="' + st.target + '"]'); if (!el) { setSpot(null); return; } const r = el.getBoundingClientRect(); setSpot({ x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 }); }, [st, tab]);
  useEffect(() => { const id = setTimeout(measure, 60); window.addEventListener('resize', measure); return () => { clearTimeout(id); window.removeEventListener('resize', measure); }; }, [measure]);
  useEffect(() => { if (!playing) return; const i = setInterval(() => setStep(s => (s + 1) % steps.length), 4000); return () => clearInterval(i); }, [playing, steps.length]);
  const tabBtn = (id: typeof tab, label: string) => <button key={id} onClick={() => { setTab(id); setPlaying(false); }} className={cn('flex-1 h-[38px] border-b-2 text-[12.5px]', tab === id ? 'border-accent text-text font-semibold' : 'border-transparent text-muted')}>{label}</button>;
  return (
    <>
      <div role="dialog" className="fixed bottom-24 end-5 w-[360px] max-h-[70vh] bg-surface border border-border shadow-ui rounded-ui z-[71] flex flex-col overflow-hidden animate-[fadeIn_.15s]">
        <div className="flex border-b border-border">{tabBtn('tour', t('tour'))}{tabBtn('docs', t('docs'))}{tabBtn('keys', t('shortcuts'))}<button onClick={onClose} className="w-9 text-muted text-lg">×</button></div>
        {tab === 'tour' && <div className="px-4 py-3.5 flex flex-col gap-3 overflow-auto">
          <div className="flex items-center gap-2.5"><span className="text-[11px] uppercase tracking-[.5px] text-muted">{t('tour')} · {pageName}</span><span className="flex-1" /><span className="font-mono text-[11.5px] text-muted">{step + 1} / {steps.length}</span></div>
          <div className="h-[3px] bg-surface2 rounded-sm overflow-hidden"><div className="h-full bg-accent transition-[width] duration-300" style={{ width: ((step + 1) / steps.length * 100) + '%' }} /></div>
          <div className="flex gap-3 items-start p-3 bg-surface2 rounded-ui min-h-[90px]"><span className="w-7 h-7 shrink-0 rounded-full bg-accent text-accent-fg grid place-items-center font-bold font-mono text-xs">{step + 1}</span><span className="flex flex-col gap-1"><span className="font-semibold">{st.title}</span><span className="text-[12.5px] leading-relaxed text-muted">{st.text}</span></span></div>
          <div className="flex gap-1.5">{steps.map((s, i) => <button key={s.target} title={s.title} onClick={() => setStep(i)} className={cn('h-2 flex-1 rounded-sm', i <= step ? 'bg-accent' : 'bg-border')} />)}</div>
          <div className="flex gap-2 items-center"><Button variant={playing ? 'outline' : 'primary'} onClick={() => setPlaying(!playing)}>{playing ? '❚❚ Pause' : '▶ Play tour'}</Button><span className="flex-1" /><Button onClick={() => setStep((step - 1 + steps.length) % steps.length)}>←</Button><Button onClick={() => setStep((step + 1) % steps.length)}>→</Button></div>
        </div>}
        {tab === 'docs' && <div className="px-4 py-3.5 flex flex-col gap-2.5 overflow-auto"><span className="font-semibold">{doc.title}</span><span className="text-[12.5px] leading-relaxed text-muted">{doc.body}</span><span className="text-xs leading-relaxed border-t border-border pt-2.5 text-muted">Full manual and release notes are in the Library module.</span><Button size="sm" className="self-start text-accent" onClick={() => { ws.setModule('library'); router.push('/library'); onClose(); }}>Open Library →</Button></div>}
        {tab === 'keys' && <div className="px-4 pb-3.5 pt-2 flex flex-col overflow-auto">{HOTKEYS.map(h => <div key={h.keys} className="flex justify-between items-center py-1.5 border-b border-border text-[12.5px]"><span>{h.what}</span><Kbd>{h.keys}</Kbd></div>)}</div>}
      </div>
      {spot && <><div className="fixed z-[65] pointer-events-none border-2 border-accent rounded transition-all duration-300" style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h, boxShadow: '0 0 0 9999px rgba(0,0,0,.35)' }} /><div className="fixed z-[66] pointer-events-none bg-accent text-accent-fg px-2 py-0.5 text-[11.5px] font-semibold rounded-ui transition-all duration-300" style={{ left: spot.x, top: spot.y + spot.h + 8 }}>{st.title}</div></>}
    </>
  );
}
export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (<><div onClick={onClose} className="fixed inset-0 bg-black/35 z-[90]" /><div role="dialog" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(520px,92vw)] bg-surface border border-border shadow-ui rounded-ui z-[91] animate-[fadeIn_.12s]"><div className="flex justify-between items-center px-4 py-3 border-b border-border"><span className="font-semibold">{t('shortcuts')}</span><button onClick={onClose} className="text-muted text-lg leading-none">×</button></div><div className="px-4 pt-2 pb-3.5 grid grid-cols-2 gap-x-6 gap-y-1.5">{HOTKEYS.map(h => <div key={h.keys} className="flex justify-between items-center py-1.5 border-b border-border text-[12.5px]"><span>{h.what}</span><Kbd>{h.keys}</Kbd></div>)}</div></div></>);
}
