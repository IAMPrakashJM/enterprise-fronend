import { cn } from '@/lib/format';
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={cn('font-mono text-[10.5px] border border-border bg-surface2 px-1 rounded-ui leading-4', className)}>{children}</kbd>;
}
