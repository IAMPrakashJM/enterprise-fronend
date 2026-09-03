'use client';
import { useToastStore, type ToastKind } from '@/lib/toast/store';
import { usePrefsStore } from '@/lib/prefs/store';
import { cn } from '@/lib/format';
const KIND: Record<ToastKind, { cls: string; icon: string }> = { ok: { cls: 'bg-success', icon: '✓' }, warn: { cls: 'bg-warn', icon: '!' }, err: { cls: 'bg-danger', icon: '×' }, info: { cls: 'bg-accent', icon: 'i' } };
const BAR: Record<ToastKind, string> = { ok: 'var(--success)', warn: 'var(--warn)', err: 'var(--danger)', info: 'var(--accent)' };
export function Toaster() {
  const { toasts, dismiss } = useToastStore(); const solid = usePrefsStore(s => s.prefs.toastStyle) === 'solid';
  return (
    <div className="fixed flex flex-col gap-2 z-[100] pointer-events-none" style={{ top: 'var(--toast-top)', bottom: 'var(--toast-bottom)', left: 'var(--toast-left)', right: 'var(--toast-right)', transform: 'translateX(var(--toast-tx))' }}>
      {toasts.map(t => (
        <div key={t.id} role="status" className={cn('relative overflow-hidden flex gap-2.5 items-start min-w-[280px] max-w-[380px] px-3 py-2.5 border shadow-ui rounded-ui pointer-events-auto animate-[toastIn_.2s]', solid ? 'bg-sidebar text-sidebar-text border-transparent' : 'bg-surface text-text border-border')} style={{ borderInlineStartWidth: 4, borderInlineStartColor: BAR[t.kind] }}>
          <span className={cn('w-[18px] h-[18px] shrink-0 rounded-full text-white grid place-items-center text-[11px] font-bold', KIND[t.kind].cls)}>{KIND[t.kind].icon}</span>
          <span className="flex flex-col gap-0.5 flex-1 min-w-0"><span className="font-semibold text-[12.5px]">{t.title}</span><span className="text-[12px] opacity-85 leading-snug">{t.msg}</span></span>
          <button onClick={() => dismiss(t.id)} className="opacity-60 text-base leading-none">×</button>
          <span className="absolute left-0 bottom-0 h-0.5" style={{ background: BAR[t.kind], animation: 'progress ' + t.dur + 'ms linear', width: '100%' }} />
        </div>
      ))}
    </div>
  );
}
