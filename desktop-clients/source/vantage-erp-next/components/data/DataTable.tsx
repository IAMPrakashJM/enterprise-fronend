'use client';
import type { FieldSchema, Row } from '@/lib/types';
import { fmt, isNumType, statusTone, cn } from '@/lib/format';
import { Button } from '@/components/primitives/Button';
import { useT } from '@/lib/i18n/useT';
const STATUS_KEYS = ['status', 'stage', 'qc'];
const toneCls = { success: 'text-success', warn: 'text-warn', danger: 'text-danger', neutral: '' };
export function DataTable({ cols, rows, sort, onSort, onRow, onView, onEdit, empty }: { cols: FieldSchema[]; rows: Row[]; sort: { key: string | null; dir: 1 | -1 }; onSort: (k: string) => void; onRow: (r: Row) => void; onView: (r: Row) => void; onEdit: (r: Row) => void; empty: string }) {
  const t = useT(); const grid = { display: 'grid', gridTemplateColumns: cols.map(c => isNumType(c) ? 'minmax(110px,.8fr)' : 'minmax(140px,1fr)').join(' ') + ' 110px', alignItems: 'center' } as const;
  return (
    <div data-tour="rows" className="bg-surface border border-border rounded-ui overflow-x-auto">
      <div style={grid} className="bg-surface2 sticky top-0 z-[1]">
        {cols.map(c => <button key={c.key} onClick={() => onSort(c.key)} className="flex gap-1.5 items-center px-3 py-2 border-b border-border text-muted text-[11px] uppercase tracking-[.5px] text-left whitespace-nowrap hover:text-text"><span>{c.label}</span><span className="text-accent">{sort.key === c.key ? (sort.dir > 0 ? '↑' : '↓') : ''}</span></button>)}
        <span className="border-b border-border py-2" />
      </div>
      {rows.map(r => (
        <div key={r._id} style={grid} className="cursor-pointer hover:bg-surface2" onClick={() => onRow(r)}>
          {cols.map(c => <span key={c.key} className={cn('px-3 border-b border-border text-result truncate', isNumType(c) && 'font-mono text-right', STATUS_KEYS.includes(c.key) && toneCls[statusTone(r[c.key])])} style={{ paddingTop: 'var(--row-py)', paddingBottom: 'var(--row-py)' }}>{fmt(c, r[c.key])}</span>)}
          <span className="px-2 border-b border-border flex gap-1 justify-end" style={{ paddingTop: 'calc(var(--row-py) - 2px)', paddingBottom: 'calc(var(--row-py) - 2px)' }}><Button size="sm" onClick={e => { e.stopPropagation(); onView(r); }}>{t('view')}</Button><Button size="sm" onClick={e => { e.stopPropagation(); onEdit(r); }}>{t('edit')}</Button></span>
        </div>
      ))}
      {!rows.length && <div className="p-10 text-center text-muted">{empty}</div>}
    </div>
  );
}
