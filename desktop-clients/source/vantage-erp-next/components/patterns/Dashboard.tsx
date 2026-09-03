'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ModuleDef, Row } from '@/lib/types';
import { ERP, getSchema } from '@/lib/mock';
import { fmt, cn } from '@/lib/format';
import { useWorkspace } from '@/lib/workspace/store';
import { useT } from '@/lib/i18n/useT';
import { QuickView } from '@/components/data/QuickView';
export function Dashboard({ module: m }: { module: ModuleDef }) {
  const d = ERP.dash[m.id]; const ws = useWorkspace(); const router = useRouter(); const t = useT(); const [quick, setQuick] = useState<Row | null>(null);
  const schema = d.recent ? getSchema(d.recent.entity) : undefined; const cols = schema ? schema.fields.filter(f => f.col).slice(0, 5) : []; const max = Math.max(...d.chart.series);
  const card = 'bg-surface border border-border rounded-ui px-4 py-3.5';
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-baseline gap-2.5 flex-wrap"><span className="text-xl font-semibold">{t('welcome')}, {ERP.user.name.split(' ')[0]}</span><span className="text-muted">{m.tagline} · {ws.branch}</span></div>
      <div data-tour="kpis" className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>{d.kpis.map(k => <div key={k.label} className={cn(card, 'flex flex-col gap-1.5')}><span className="text-muted text-[11.5px] uppercase tracking-[.6px]">{k.label}</span><span className="text-2xl font-semibold font-mono tracking-tight">{k.value}</span><span className={cn('text-xs font-semibold', k.up ? 'text-success' : 'text-danger')}>{k.delta}<span className="text-muted font-normal"> vs last period</span></span></div>)}</div>
      <div className="grid gap-3" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
        <div data-tour="chart" className={cn(card, 'flex flex-col gap-3 min-w-0')}><span className="font-semibold">{d.chart.title}</span>
          <div className="flex items-end gap-2.5 h-[150px] border-b border-border">{d.chart.series.map((v, i) => <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 h-full"><span className="text-[10.5px] text-muted font-mono">{v >= 100 ? Math.round(v).toLocaleString() : v}</span><div title={d.chart.labels[i]} className={cn('w-full max-w-12 border border-accent origin-bottom animate-[growUp_.5s_ease-out]', i === d.chart.series.length - 1 ? 'bg-accent' : 'bg-accent-soft')} style={{ height: Math.round(v / max * 100) + '%' }} /></div>)}</div>
          <div className="flex gap-2.5">{d.chart.labels.map(l => <span key={l} className="flex-1 text-center text-[11px] text-muted">{l}</span>)}</div></div>
        <div className={cn(card, 'flex flex-col gap-2.5')}><span className="font-semibold">{d.breakdown.title}</span>{d.breakdown.rows.map(([l, p]) => <div key={l} className="flex flex-col gap-1"><div className="flex justify-between text-[12.5px]"><span>{l}</span><span className="font-mono text-muted">{p}%</span></div><div className="h-1.5 bg-surface2 rounded-ui"><div className="h-full bg-accent" style={{ width: p + '%' }} /></div></div>)}</div>
        <div className={cn(card, 'flex flex-col gap-2')}><span className="font-semibold">{t('tasks')}</span>{d.tasks.map(x => <div key={x} className="flex gap-2 items-start text-[12.5px] leading-snug"><span className="w-1.5 h-1.5 rounded-full bg-warn mt-1.5 shrink-0" /><span>{x}</span></div>)}</div>
      </div>
      {schema && <div data-tour="recent" className="bg-surface border border-border rounded-ui">
        <div className="flex justify-between items-center px-3.5 py-2.5 border-b border-border"><span className="font-semibold">{d.recent!.title}</span><button onClick={() => { const href = '/' + m.id + '/' + schema.id; ws.setWorkspace(href, schema.plural); router.push(href); }} className="text-accent text-[12.5px]">Open worklist →</button></div>
        <div className="grid" style={{ gridTemplateColumns: cols.map(() => 'minmax(120px,1fr)').join(' ') }}>{cols.map(c => <span key={c.key} className="px-3 py-2 text-[11px] uppercase tracking-[.5px] text-muted border-b border-border">{c.label}</span>)}</div>
        {schema.rows.slice(0, 6).map(r => <div key={r._id} onClick={() => setQuick(r)} className="grid cursor-pointer hover:bg-surface2" style={{ gridTemplateColumns: cols.map(() => 'minmax(120px,1fr)').join(' ') }}>{cols.map(c => <span key={c.key} className="px-3 text-result border-b border-border truncate" style={{ paddingTop: 'var(--row-py)', paddingBottom: 'var(--row-py)' }}>{fmt(c, r[c.key])}</span>)}</div>)}
      </div>}
      {quick && schema && <QuickView schema={schema} row={quick} onClose={() => setQuick(null)} />}
    </section>
  );
}
