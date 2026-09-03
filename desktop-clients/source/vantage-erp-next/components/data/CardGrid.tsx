'use client';
import type { EntitySchema, FieldSchema, Row } from '@/lib/types';
import { fmt, isNumType, cn } from '@/lib/format';
import { Button } from '@/components/primitives/Button';
import { StatusPill } from '@/components/primitives/StatusPill';
import { useT } from '@/lib/i18n/useT';
export function CardGrid({ schema, cols, rows, onRow, onView, onEdit, empty }: { schema: EntitySchema; cols: FieldSchema[]; rows: Row[]; onRow: (r: Row) => void; onView: (r: Row) => void; onEdit: (r: Row) => void; empty: string }) {
  const t = useT(); const statusF = schema.fields.find(f => ['status', 'stage', 'qc'].includes(f.key));
  const cardCols = cols.filter(c => c.key !== schema.titleKey && c.key !== schema.fields[0].key && c !== statusF).slice(0, 4);
  return (
    <>
      <div data-tour="rows" className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
        {rows.map(r => (
          <div key={r._id} onClick={() => onRow(r)} className="bg-surface border border-border rounded-ui px-3.5 py-3 flex flex-col gap-2 cursor-pointer hover:border-accent hover:shadow-ui">
            <div className="flex justify-between gap-2 items-start"><span className="flex flex-col min-w-0"><span className="font-semibold truncate">{String(r[schema.titleKey])}</span><span className="text-muted text-[11.5px] font-mono">{String(r[schema.fields[0].key])}</span></span>{statusF && <StatusPill value={r[statusF.key]} />}</div>
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-1">{cardCols.map(c => <span key={c.key} className="flex flex-col min-w-0"><span className="text-[10.5px] text-muted uppercase tracking-[.4px]">{c.label}</span><span className={cn('text-result truncate', isNumType(c) && 'font-mono')}>{fmt(c, r[c.key])}</span></span>)}</div>
            <div className="flex gap-1.5 justify-end border-t border-border pt-2"><Button size="sm" onClick={e => { e.stopPropagation(); onView(r); }}>{t('view')}</Button><Button size="sm" variant="primary" onClick={e => { e.stopPropagation(); onEdit(r); }}>{t('edit')}</Button></div>
          </div>
        ))}
      </div>
      {!rows.length && <div className="p-10 text-center text-muted">{empty}</div>}
    </>
  );
}
