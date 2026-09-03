import { cn } from '@/lib/format';
import type { TextareaHTMLAttributes } from 'react';
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} className={cn('p-2 border border-border bg-field text-text text-form rounded-ui outline-none w-full resize-y focus:border-accent focus:shadow-[0_0_0_2px_var(--accent-soft)] read-only:bg-surface2', className)} {...props} />;
}
