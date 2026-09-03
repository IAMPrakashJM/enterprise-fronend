'use client';
import type { EntitySchema } from '@/lib/types';
import { isNumType } from '@/lib/format';
import { Select } from '@/components/primitives/Select';
import { Input, inputCls } from '@/components/primitives/Input';
import { Button } from '@/components/primitives/Button';
import { useT } from '@/lib/i18n/useT';
import { cn } from '@/lib/format';
export type Filters = Record<string, string>;
export function BasicFilters({ schema, filters, onChange }: { schema: EntitySchema; filters: Filters; onChange: (k: string, v: string) => void }) {
  const distinct = (key: string, opts?: string[]) => opts ?? Array.from(new Set(schema.rows.map(r => String(r[key])))).sort();
  return <>{schema.fields.filter(f => f.basic).map(f => <Select key={f.key} compact className="min-w-[130px] w-auto" value={filters[f.key] ?? ''} onChange={e => onChange(f.key, e.target.value)} options={[{ value: '', label: f.label + ': all' }, ...distinct(f.key, f.options).map(o => ({ value: o, label: o }))]} />)}</>;
}
export function AdvancedFilters({ schema, filters, onChange }: { schema: EntitySchema; filters: Filters; onChange: (k: string, v: string) => void }) {
  return (
    <div className="grid gap-2.5 px-3.5 py-3 bg-surface border border-border rounded-ui animate-[fadeIn_.15s]" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
      {schema.fields.filter(f => f.adv).map(f => (
        <label key={f.key} className="flex flex-col gap-1 text-[11.5px] text-muted"><span>{f.label}</span>
          {f.type === 'date' ? <span className="flex gap-1.5"><input type="date" className={cn(inputCls, 'h-[30px] px-1.5')} value={filters[f.key + '__from'] ?? ''} onChange={e => onChange(f.key + '__from', e.target.value)} /><input type="date" className={cn(inputCls, 'h-[30px] px-1.5')} value={filters[f.key + '__to'] ?? ''} onChange={e => onChange(f.key + '__to', e.target.value)} /></span>
          : isNumType(f) ? <Input type="number" className="h-[30px]" placeholder="Minimum" value={filters[f.key + '__min'] ?? ''} onChange={e => onChange(f.key + '__min', e.target.value)} />
          : f.type === 'select' ? <Select compact value={filters[f.key] ?? ''} onChange={e => onChange(f.key, e.target.value)} options={[{ value: '', label: 'Any' }, ...(f.options ?? []).map(o => ({ value: o, label: o }))]} />
          : <Input className="h-[30px]" placeholder="Contains…" value={filters[f.key] ?? ''} onChange={e => onChange(f.key, e.target.value)} />}
        </label>
      ))}
    </div>
  );
}
export function AdvancedToggle({ open, count, onToggle }: { open: boolean; count: number; onToggle: () => void }) {
  const t = useT();
  return <Button onClick={onToggle} className={cn(open && 'bg-surface2')}><span>{t('advanced')}</span><span className="text-[10px] text-muted">{open ? '▴' : '▾'}</span>{count > 0 && <span className="bg-accent text-accent-fg text-[10px] px-1.5 rounded-full">{count}</span>}</Button>;
}
