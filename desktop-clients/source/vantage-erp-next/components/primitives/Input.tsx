import { cn } from '@/lib/format';
import type { InputHTMLAttributes } from 'react';
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { mono?: boolean; error?: string }
export const inputCls = 'h-[32px] px-2 border border-border bg-field text-text text-form rounded-ui outline-none w-full focus:border-accent focus:shadow-[0_0_0_2px_var(--accent-soft)] read-only:bg-surface2 disabled:bg-surface2';
export function Input({ mono, error, className, ...props }: InputProps) {
  return <input className={cn(inputCls, mono && 'font-mono', error && 'border-danger', className)} {...props} />;
}
export function Field({ label, required, hint, error, children, span }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode; span?: boolean }) {
  return (
    <label className={cn('flex flex-col gap-1', span && 'col-span-full')} title={hint}>
      <span className={cn('text-[11.5px]', error ? 'text-danger' : 'text-muted')}>{label}{required && <span className="text-danger"> *</span>}</span>
      {children}
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </label>
  );
}
