import { cn } from '@/lib/format';
import type { SelectHTMLAttributes } from 'react';
export interface Option { value: string; label: string }
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> { options: (Option | string)[]; placeholder?: string; compact?: boolean }
export function Select({ options, placeholder, compact, className, ...props }: SelectProps) {
  return (
    <select className={cn(compact ? 'h-[30px]' : 'h-[32px]', 'px-2 border border-border bg-field text-text text-form rounded-ui outline-none w-full focus:border-accent disabled:bg-surface2', className)} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
