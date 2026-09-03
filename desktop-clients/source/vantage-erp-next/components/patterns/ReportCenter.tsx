'use client';
import { useMemo, useState } from 'react';
import type { ModuleDef } from '@/lib/types';
import { ERP, schemas, today } from '@/lib/mock';
import { money, downloadCsv, cn } from '@/lib/format';
import { toast } from '@/lib/toast/store';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/primitives/Button';
import { Field, Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
const PRESETS: Record<string, [string, string]> = { mtd: ['2026-09-01', today], qtd: ['2026-07-01', today], ytd: ['2026-01-01', today], last30: ['2026-08-03', today] };
function namesFor(id: string): string[] { const pick = (e: string, k: string) => Array.from(new Set(schemas[e].rows.map(r => String(r[k]))));
  if (/cust|ar-aging|sales-by/.test(id)) return pick('customer', 'name'); if (/tax/.test(id)) return pick('tax', 'name'); if (/sp-perf/.test(id)) return pick('salesperson', 'name'); if (/^(tb|pl|bs)$/.test(id)) return pick('glAccount', 'name'); if (/ap|vendor/.test(id)) return pick('vendor', 'name'); if (/headcount/.test(id)) return pick('department', 'name'); if (/payroll|leave|attendance/.test(id)) return pick('employee', 'name'); if (/stock-val/.test(id)) return pick('warehouse', 'name'); if (/reorder/.test(id)) return pick('product', 'name'); if (/po-status/.test(id)) return pick('purchaseOrder', 'no');
  return ['Button', 'Input', 'Select', 'MultiSelect', 'DatePicker', 'Toggle', 'Table', 'CardGrid', 'Tabs', 'Wizard', 'Rail', 'Modal', 'SidePanel', 'Toast', 'Sidebar', 'Header']; }
export function ReportCenter({ module: m }: { module: ModuleDef }) {
  const t = useT(); const list = ERP.reports[m.id] ?? []; const [id, setId] = useState(list[0]?.id); const cur = list.find(r => r.id === id) ?? list[0];
  const [f, setF] = useState({ preset: 'mtd', from: PRESETS.mtd[0], to: today, branch: '', adv: false, groupBy: 'None', minAmount: '', limit: '25', zero: true, sched: false, freq: 'Daily 07:00' });
  const [result, setResult] = useState<(string | number)[][] | null>(null);
  const run = () => { let seed = cur.id.length * 31 + +f.limit; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; const names = namesFor(cur.id);
    const rows = names.slice(0, +f.limit).map(n => [n, ...cur.cols.slice(1).map(c => /%|days|invoices|pos|lines|skus|qty|opening|joined|left|closing|present|late|absent|hours|rejections|variants|pages/i.test(c) ? Math.round(rnd() * 90 + 5) : Math.round(rnd() * 480000 + 2000))]); setResult(rows); toast(cur.name + ' · ' + rows.length + ' rows', 'ok', 'Report ready'); };
  const grid = useMemo(() => ({ display: 'grid', gridTemplateColumns: cur.cols.map((_, i) => i === 0 ? 'minmax(200px,2fr)' : 'minmax(110px,1fr)').join(' ') }), [cur]);
  const cell = (v: string | number, i: number) => i === 0 ? String(v) : (Number.isInteger(v) && +v < 1000 ? String(v) : money(v));
  const max = result ? Math.max(...result.map(r => +r[1] || 0), 1) : 1;
  return (
    <section className="grid gap-3.5 items-start" style={{ gridTemplateColumns: '240px 1fr' }}>
      <div data-tour="report-list" className="bg-surface border border-border rounded-ui p-1.5 flex flex-col gap-0.5 sticky top-0"><div className="px-2.5 pt-1.5 pb-2 text-[11px] uppercase tracking-[.5px] text-muted">{m.name} · {t('reports')}</div>{list.map(r => <button key={r.id} onClick={() => { setId(r.id); setResult(null); }} className={cn('flex px-2.5 py-2 text-left border-s-[3px] hover:bg-surface2', r.id === cur.id ? 'border-accent bg-surface2 font-semibold' : 'border-transparent')}>{r.name}</button>)}</div>
      <div className="flex flex-col gap-3 min-w-0">
        <div data-tour="report-filters" className="bg-surface border border-border rounded-ui px-3.5 py-3 flex flex-col gap-2.5">
          <div className="flex gap-2.5 flex-wrap items-end">
            <Field label="Period"><Select compact className="min-w-[150px]" value={f.preset} onChange={e => { const v = e.target.value; setF({ ...f, preset: v, ...(PRESETS[v] ? { from: PRESETS[v][0], to: PRESETS[v][1] } : {}) }); }} options={[{ value: 'mtd', label: 'Month to date' }, { value: 'qtd', label: 'Quarter to date' }, { value: 'ytd', label: 'Year to date' }, { value: 'last30', label: 'Last 30 days' }, { value: 'custom', label: 'Custom range' }]} /></Field>
            <Field label="From"><Input className="h-[30px]" type="date" value={f.from} onChange={e => setF({ ...f, from: e.target.value, preset: 'custom' })} /></Field><Field label="To"><Input className="h-[30px]" type="date" value={f.to} onChange={e => setF({ ...f, to: e.target.value, preset: 'custom' })} /></Field>
            <Field label={t('branch')}><Select compact className="min-w-[140px]" value={f.branch} placeholder="All branches" onChange={e => setF({ ...f, branch: e.target.value })} options={ERP.branches} /></Field>
            <Button onClick={() => setF({ ...f, adv: !f.adv })}>{t('advanced')} {f.adv ? '▴' : '▾'}</Button><span className="flex-1" />
            <div data-tour="report-actions" className="flex gap-2"><Button variant="primary" onClick={run}>▶ {t('run')}</Button><Button onClick={() => setF({ ...f, sched: !f.sched })}>{t('schedule')} &amp; email</Button><Button disabled={!result} onClick={() => { if (result) { downloadCsv(cur.id + '.csv', [cur.cols, ...result]); toast('Report exported to CSV', 'ok'); } }}>{t('export')}</Button></div>
          </div>
          {f.adv && <div className="grid gap-2.5 pt-2.5 border-t border-border animate-[fadeIn_.15s]" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))' }}>
            <Field label="Group by"><Select compact value={f.groupBy} onChange={e => setF({ ...f, groupBy: e.target.value })} options={['None', 'Branch', 'Month', 'Category']} /></Field><Field label="Minimum amount"><Input className="h-[30px]" type="number" value={f.minAmount} onChange={e => setF({ ...f, minAmount: e.target.value })} /></Field><Field label="Row limit"><Select compact value={f.limit} onChange={e => setF({ ...f, limit: e.target.value })} options={[{ value: '10', label: '10 rows' }, { value: '25', label: '25 rows' }, { value: '50', label: '50 rows' }]} /></Field>
            <label className="flex items-center gap-2 text-[12.5px] self-end h-[30px]"><input type="checkbox" checked={f.zero} onChange={e => setF({ ...f, zero: e.target.checked })} />Include zero balances</label>
          </div>}
          {f.sched && <div className="flex gap-2.5 flex-wrap items-end p-3 bg-surface2 border border-border rounded-ui animate-[fadeIn_.15s]">
            <Field label="Frequency"><Select compact value={f.freq} onChange={e => setF({ ...f, freq: e.target.value })} options={['Daily 07:00', 'Weekly (Mon)', 'Monthly (1st)', 'Quarter end']} /></Field><Field label="Format"><Select compact options={['PDF', 'Excel', 'CSV']} /></Field>
            <div className="flex-1 min-w-[220px]"><Field label="Deliver to"><Input className="h-[30px]" readOnly value={ERP.user.email} /></Field></div>
            <Button variant="primary" className="bg-success border-success" onClick={() => { setF({ ...f, sched: false }); toast(cur.name + ' · ' + f.freq + ' → ' + ERP.user.email, 'ok', 'Schedule created'); }}>Confirm schedule</Button>
          </div>}
        </div>
        {result ? <div className="bg-surface border border-border rounded-ui animate-[fadeIn_.2s]">
          <div className="flex justify-between items-center px-3.5 py-2.5 border-b border-border"><span className="font-semibold">{cur.name}</span><span className="text-muted text-xs font-mono">{f.from} → {f.to} · {result.length} rows</span></div>
          <div className="flex items-end gap-1.5 h-[90px] px-3.5 pt-3 border-b border-border">{result.slice(0, 25).map((r, i) => <div key={i} title={r[0] + ': ' + money(r[1])} className={cn('flex-1 origin-bottom animate-[growUp_.4s_ease-out]', i % 2 ? 'bg-accent-soft' : 'bg-accent')} style={{ height: Math.max(4, Math.round((+r[1] || 0) / max * 100)) + '%' }} />)}</div>
          <div style={grid} className="bg-surface2">{cur.cols.map((c, i) => <span key={c} className={cn('px-3 py-2 text-[11px] uppercase tracking-[.5px] text-muted border-b border-border', i > 0 && 'text-right')}>{c}</span>)}</div>
          {result.map((r, ri) => <div key={ri} style={grid} className="hover:bg-surface2">{r.map((v, i) => <span key={i} className={cn('px-3 text-result border-b border-border', i > 0 && 'text-right font-mono')} style={{ paddingTop: 'var(--row-py)', paddingBottom: 'var(--row-py)' }}>{cell(v, i)}</span>)}</div>)}
          <div style={grid} className="bg-surface2 font-semibold">{cur.cols.map((c, i) => <span key={c} className={cn('px-3 py-2 text-result', i > 0 && 'text-right font-mono')}>{i === 0 ? 'Total (' + result.length + ')' : money(result.reduce((a, r) => a + (+r[i] || 0), 0))}</span>)}</div>
        </div> : <div className="p-12 text-center text-muted bg-surface border border-dashed border-border rounded-ui">Set filters and press <b>{t('run')}</b>, or schedule delivery to <b>{ERP.user.email}</b>.</div>}
      </div>
    </section>
  );
}
