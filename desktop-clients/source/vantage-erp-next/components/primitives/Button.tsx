import { cn } from '@/lib/format';
import { Kbd } from './Kbd';
import type { ButtonHTMLAttributes } from 'react';
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Tone = 'accent' | 'success' | 'danger' | 'warn';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; tone?: Tone; size?: 'sm' | 'md'; shortcut?: string }
const tones: Record<Tone, string> = { accent: 'text-accent border-accent', success: 'text-success border-success', danger: 'text-danger border-danger', warn: 'text-warn border-warn' };
export function Button({ variant = 'secondary', tone = 'accent', size = 'md', shortcut, className, children, ...props }: ButtonProps) {
  return (
    <button className={cn('inline-flex items-center gap-2 whitespace-nowrap border rounded-ui text-ui cursor-pointer disabled:opacity-50 disabled:cursor-default', size === 'md' ? 'h-[30px] px-3' : 'h-[24px] px-2 text-[11.5px]',
      variant === 'primary' && 'bg-accent text-accent-fg border-accent font-semibold hover:brightness-110',
      variant === 'secondary' && 'bg-surface text-text border-border hover:border-accent',
      variant === 'outline' && cn('bg-transparent', tones[tone]),
      variant === 'ghost' && 'bg-transparent border-transparent text-accent hover:text-text', className)} {...props}>
      {children}{shortcut && <Kbd className="opacity-75 border-current">{shortcut}</Kbd>}
    </button>
  );
}
