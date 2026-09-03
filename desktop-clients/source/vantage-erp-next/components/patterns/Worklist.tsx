'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EntitySchema, Row } from '@/lib/types';
import { fmt, isNumType, downloadCsv, cn } from '@/lib/format';
import { usePrefsStore } from '@/lib/prefs/store';
import { useWorkspace } from '@/lib/workspace/store';
import { useT } from '@/lib/i18n/useT';
import { toast } from '@/lib/toast/store';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Kbd } from '@/components/primitives/Kbd';
import { BasicFilters, AdvancedFilters, AdvancedToggle, type Filters } from '@/components/data/FilterBar';
import { DataTable } from '@/components/data/DataTable';
import { CardGrid } from '@/components/data/CardGrid';
import { Pager } from '@/components/data/Pager';
import { ColumnChooser } from '@/components/data/ColumnChooser';
import { QuickView } from '@/components/data/QuickView';
export function Worklist({ schema }: { schema: EntitySchema }) {
  const { prefs, set, setColumns } = usePrefsStore(); const ws = useWorkspace(); const router = useRouter(); const t = useT();
  const [q, setQ] = useState(''); const [filters, setFilters] = useState<Filters>({}); const [adv, setAdv] = useState(false); const [sort, setSort] = useState<{ key: string | null; dir: 1 | -1 }>({ key: null, dir: 1 }); const [page, setPage] = useState(1); const [quick, setQuick] = useState<Row | null>(null);
  const visibleKeys = prefs.columns[schema.id] ?? schema.fields.filter(f => f.col).map(f => f.key);
  const cols = visibleKeys.map(k => schema.fields.find(f => f.key === k)!).filter(Boolean);
  const rows = useMemo(() => { const ql = q.trim().toLowerCase(); let out = schema.rows.filter(r => {
      if (ql && !cols.some(c => fmt(c, r[c.key]).toLowerCase().includes(ql)) && !String(r[schema.titleKey]).toLowerCase().includes(ql)) return false;
      for (const k in filters) { const v = filters[k]; if (!v) continue; const key = k.replace(/__(from|to|min)$/, ''); const f = schema.fields.find(x => x.key === key); if (!f) continue; const rv = r[key] as string | number;
        if (k.endsWith('__from')) { if (rv < v) return false; } else if (k.endsWith('__to')) { if (rv > v) return false; } else if (k.endsWith('__min')) { if (+rv < +v) return false; }
        else if (f.type === 'text' || f.type === 'email') { if (!String(rv).toLowerCase().includes(v.toLowerCase())) return false; } else if (String(rv) !== v) return false; }
      return true; });
    if (sort.key) { const f = schema.fields.find(x => x.key === sort.key)!; out = [...out].sort((a, b) => { const x = a[sort.key!] as never, y = b[sort.key!] as never; return (isNumType(f) ? (x as number) - (y as number) : String(x).localeCompare(String(y))) * sort.dir; }); }
    return out; }, [schema, q, filters, sort, cols]);
  const ps = prefs.pageSize, pages = Math.max(1, Math.ceil(rows.length / ps)), cur = Math.min(page, pages), slice = rows.slice((cur - 1) * ps, cur * ps);
  const open = (r: Row | null, mode: 'view' | 'edit' | 'new') => { const href = '/' + ws.module + '/' + schema.id + '/' + (r ? r._id : 'new') + '?mode=' + mode; ws.openTab(href, (mode === 'new' ? t('new') + ' ' : '') + schema.label + (r ? ': ' + String(r[schema.titleKey]) : ''), mode.toUpperCase()); router.push(href); };
  useEffect(() => { const h = (e: KeyboardEvent) => { const tag = ((e.target as HTMLElement).tagName || '').toLowerCase(); if (e.altKey && e.key.toLowerCase() === 'n') { e.preventDefault(); open(null, 'new'); } else if (e.key === '/' && !['input', 'textarea', 'select'].includes(tag)) { e.preventDefault(); document.getElementById('wl-search')?.focus(); } else if (e.key === 'Escape') setQuick(null); }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }); // eslint-disable-line react-hooks/exhaustive-deps
  const setF = (k: string, v: string) => { setFilters({ ...filters, [k]: v }); setPage(1); };
  const advCount = Object.entries(filters).filter(([k, v]) => v && schema.fields.some(f => f.adv && k.startsWith(f.key))).length;
  const table = prefs.resultView === 'table';
  return (
    <section className="flex flex-col gap-3">
      <div className="flex gap-2 items-center flex-wrap">
        <div data-tour="search" className="relative flex-1 min-w-[220px] max-w-[420px]"><Input id="wl-search" className="h-[30px] pe-8" placeholder={t('search') + ' ' + schema.plural.toLowerCase() + '…'} value={q} onChange={e => { setQ(e.target.value); setPage(1); }} /><Kbd className="absolute end-2 top-2 text-muted">/</Kbd></div>
        <div data-tour="filters" className="flex gap-2 flex-wrap"><BasicFilters schema={schema} filters={filters} onChange={setF} /><AdvancedToggle open={adv} count={advCount} onToggle={() => setAdv(!adv)} />{(q || Object.values(filters).some(Boolean)) && <Button variant="ghost" onClick={() => { setQ(''); setFilters({}); setPage(1); }}>{t('clear')}</Button>}</div>
        <div className="flex-1" />
        <div data-tour="view" className="flex border border-border rounded-ui overflow-hidden"><button onClick={() => set({ resultView: 'table' })} className={cn('h-7 px-2.5 text-xs', table ? 'bg-accent text-accent-fg' : 'bg-surface')}>{t('table')}</button><button onClick={() => set({ resultView: 'cards' })} className={cn('h-7 px-2.5 text-xs border-s border-border', !table ? 'bg-accent text-accent-fg' : 'bg-surface')}>{t('cards')}</button></div>
        <ColumnChooser fields={schema.fields} visible={visibleKeys} onChange={k => setColumns(schema.id, k)} />
        <Button onClick={() => { downloadCsv(schema.plural.replace(/\s+/g, '_') + '.csv', [cols.map(c => c.label), ...rows.map(r => cols.map(c => fmt(c, r[c.key])))]); toast(rows.length + ' rows exported', 'ok', t('export')); }}>{t('export')}</Button>
        <Button data-tour="new" variant="primary" shortcut="Alt N" onClick={() => open(null, 'new')}>+ {t('new')}</Button>
      </div>
      {adv && <AdvancedFilters schema={schema} filters={filters} onChange={setF} />}
      {table ? <DataTable cols={cols} rows={slice} sort={sort} onSort={k => setSort({ key: k, dir: sort.key === k ? (sort.dir === 1 ? -1 : 1) : 1 })} onRow={setQuick} onView={r => open(r, 'view')} onEdit={r => open(r, 'edit')} empty={t('noResults')} />
        : <CardGrid schema={schema} cols={cols} rows={slice} onRow={setQuick} onView={r => open(r, 'view')} onEdit={r => open(r, 'edit')} empty={t('noResults')} />}
      <Pager page={cur} pages={pages} total={rows.length} from={rows.length ? (cur - 1) * ps + 1 : 0} to={Math.min(rows.length, cur * ps)} pageSize={ps} onPage={setPage} onPageSize={n => { set({ pageSize: n as 10 | 20 | 50 | 100 }); setPage(1); }} />
      {quick && <QuickView schema={schema} row={quick} onClose={() => setQuick(null)} />}
    </section>
  );
}
