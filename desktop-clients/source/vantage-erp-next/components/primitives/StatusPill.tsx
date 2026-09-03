import { cn, statusTone } from '@/lib/format';
export function StatusPill({ value }: { value: unknown }) {
  const tone = statusTone(value);
  return <span className={cn('text-[11px] px-2 py-0.5 border border-border rounded-full whitespace-nowrap', tone === 'success' && 'text-success', tone === 'warn' && 'text-warn', tone === 'danger' && 'text-danger')}>{String(value ?? '')}</span>;
}
