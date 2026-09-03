'use client';
import { cn } from '@/lib/format';
export type Placement = 'card' | 'modal' | 'panel-left' | 'panel-right';
export function Surface({ placement, onClose, children, className, label }: { placement: Placement; onClose: () => void; children: React.ReactNode; className?: string; label?: string }) {
  const panel = placement.startsWith('panel');
  return (
    <>
      <div onClick={onClose} className={cn('fixed inset-0 z-[59] animate-[fadeIn_.15s]', placement === 'card' ? 'bg-transparent' : 'bg-black/35')} />
      <div role="dialog" aria-label={label} className={cn('fixed z-[60] bg-surface border border-border shadow-ui flex flex-col animate-[fadeIn_.15s]',
        placement === 'card' && 'top-[90px] left-1/2 -translate-x-1/2 w-[min(560px,92vw)] max-h-[70vh] rounded-ui',
        placement === 'modal' && 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(640px,92vw)] max-h-[80vh] rounded-ui',
        panel && 'top-12 bottom-7 w-[min(420px,92vw)]', placement === 'panel-left' && 'left-0', placement === 'panel-right' && 'right-0', className)}>
        {children}
      </div>
    </>
  );
}
export function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: { title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/35 z-[90]" />
      <div role="alertdialog" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] bg-surface border border-border shadow-ui rounded-ui z-[91] p-5 flex flex-col gap-3.5 animate-[fadeIn_.12s]">
        <span className="font-semibold text-[15px]">{title}</span><span className="text-muted text-[12.5px] leading-relaxed">{body}</span>
        <div className="flex gap-2 justify-end"><button onClick={onCancel} className="h-[30px] px-3 border border-border bg-surface rounded-ui">Cancel</button><button onClick={onConfirm} className="h-[30px] px-3.5 border border-danger bg-danger text-white font-semibold rounded-ui">{confirmLabel}</button></div>
      </div>
    </>
  );
}
