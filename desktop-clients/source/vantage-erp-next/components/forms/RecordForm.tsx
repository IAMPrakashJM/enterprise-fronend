'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EntitySchema, Row } from '@/lib/types';
import { today } from '@/lib/mock';
import { usePrefsStore } from '@/lib/prefs/store';
import { useWorkspace } from '@/lib/workspace/store';
import { useT } from '@/lib/i18n/useT';
import { toast } from '@/lib/toast/store';
import { Button } from '@/components/primitives/Button';
import { FieldRenderer } from './FieldRenderer';
import { cn } from '@/lib/format';
export type FormMode = 'view' | 'edit' | 'new';
function blank(schema: EntitySchema): Row { const d: Row = { _id: schema.id + '-' + (schema.rows.length + 1) }; schema.fields.forEach(f => { d[f.key] = f.type === 'multiselect' ? [] : f.type === 'toggle' ? false : f.type === 'date' ? today : f.type === 'code' ? (f.prefix ?? 'ID') + '-' + String(1000 + schema.rows.length + 1).padStart(4, '0') : ''; }); return d; }
export function RecordForm({ schema, id, mode: initialMode }: { schema: EntitySchema; id: string; mode: FormMode }) {
  const layout = usePrefsStore(s => s.prefs.formLayout); const ws = useWorkspace(); const router = useRouter(); const t = useT();
  const [mode, setMode] = useState<FormMode>(initialMode); const ro = mode === 'view';
  const source = useMemo(() => id === 'new' ? blank(schema) : schema.rows.find(r => r._id === id), [schema, id]);
  const [data, setData] = useState<Row>(() => ({ ...(source ?? blank(schema)) })); const [sec, setSec] = useState(0); const [errors, setErrors] = useState<Record<string, string>>({});
  const close = () => { const t = ws.tabs.find(x => x.id === ws.active); router.push(t && t.id !== 'ws' ? ws.closeTab(t.id) : '/' + ws.module + '/' + schema.id); };
  const save = useCallback(() => {
    const missing = schema.fields.filter(f => f.req && (data[f.key] === '' || data[f.key] == null)); if (missing.length) { setErrors(Object.fromEntries(missing.map(f => [f.key, 'Required']))); toast('Required: ' + missing.map(f => f.label).join(', '), 'err', 'Cannot save'); return; }
    if (mode === 'new') { schema.rows.unshift({ ...data }); toast(schema.label + ' ' + String(data[schema.titleKey]) + ' created', 'ok', 'Saved'); } else { const row = schema.rows.find(r => r._id === id); if (row) Object.assign(row, data); toast(schema.label + ' ' + String(data[schema.titleKey]) + ' updated', 'ok', 'Saved'); }
    close();
  }, [data, mode, schema, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !ro) { e.preventDefault(); save(); } }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, [save, ro]);
  if (!source) return <div className="p-10 text-center text-muted">Record not found</div>;
  const sections = schema.sections; const visible = layout === 'rail' ? sections : [sections[sec]];
  const navBtn = (i: number, extra?: string) => cn(i === sec ? 'text-text font-semibold' : 'text-muted', extra);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className={cn('text-[11px] font-bold tracking-[.6px] uppercase px-2 py-0.5 rounded-ui', ro ? 'bg-surface2 text-muted' : 'bg-accent-soft text-accent')}>{t(mode)}</span>
        <span className="font-semibold text-[15px]">{schema.label}{mode !== 'new' && ': ' + String(data[schema.titleKey] ?? '')}</span><span className="text-muted text-xs">Layout: {layout} (My preferences)</span><span className="flex-1" />
        <div data-tour="form-actions" className="flex gap-2"><Button onClick={close}>{t('cancel')}</Button>{ro && <Button variant="primary" onClick={() => setMode('edit')}>{t('edit')}</Button>}{!ro && layout !== 'wizard' && <Button variant="primary" onClick={save} shortcut="Ctrl S">{t('save')}</Button>}</div>
      </div>
      {layout === 'tabs' && <div data-tour="form-nav" className="flex border-b border-border gap-0.5 overflow-x-auto">{sections.map((s, i) => <button key={s.title} onClick={() => setSec(i)} className={navBtn(i, cn('h-9 px-3.5 border-b-2 whitespace-nowrap flex items-center gap-2 hover:text-text', i === sec ? 'border-accent' : 'border-transparent'))}><span>{s.title}</span><span className="text-[10.5px] text-muted font-mono">{s.fields.length}</span></button>)}</div>}
      {layout === 'wizard' && <div data-tour="form-nav" className="flex items-center bg-surface border border-border rounded-ui px-4 py-3 overflow-x-auto">{sections.map((s, i) => <div key={s.title} className="flex items-center flex-1 last:flex-none"><button onClick={() => setSec(i)} className="flex items-center gap-2.5 whitespace-nowrap"><span className={cn('w-[26px] h-[26px] rounded-full grid place-items-center text-xs font-bold font-mono border', i <= sec ? 'bg-accent text-accent-fg border-accent' : 'bg-surface text-muted border-border')}>{i < sec ? '✓' : i + 1}</span><span className={navBtn(i)}>{s.title}</span></button>{i < sections.length - 1 && <span className="flex-1 min-w-6 h-px bg-border mx-3" />}</div>)}</div>}
      <div className="flex gap-3.5 items-start">
        {layout === 'rail' && <div data-tour="form-nav" className="w-[200px] shrink-0 sticky top-0 flex flex-col gap-0.5 bg-surface border border-border rounded-ui p-1.5">{sections.map((s, i) => <button key={s.title} onClick={() => { setSec(i); document.getElementById('sec-' + i)?.scrollIntoView({ block: 'start' }); }} className={navBtn(i, cn('flex justify-between items-center px-2.5 py-2 text-left border-s-[3px] hover:bg-surface2', i === sec ? 'border-accent bg-surface2' : 'border-transparent'))}><span>{s.title}</span><span className="text-[10.5px] text-muted font-mono">{s.fields.length}</span></button>)}</div>}
        <div data-tour="form-body" className="flex-1 min-w-0 flex flex-col gap-3.5">
          {visible.map((s, vi) => { const i = layout === 'rail' ? vi : sec; return (
            <div key={s.title} id={'sec-' + i} className="bg-surface border border-border rounded-ui">
              <div className="px-4 py-2.5 border-b border-border flex items-center gap-2.5"><span className="font-semibold">{s.title}</span><span className="text-muted text-[11.5px]">{s.fields.length} fields</span></div>
              <div className="px-4 py-3.5 grid gap-x-4 gap-y-3 text-form" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))' }}>
                {s.fields.map(f => <FieldRenderer key={f.key} field={f} value={data[f.key]} readOnly={ro} error={errors[f.key]} onChange={v => { setData({ ...data, [f.key]: v }); if (errors[f.key]) setErrors({ ...errors, [f.key]: '' }); }} />)}
              </div>
            </div>); })}
          {layout === 'wizard' && <div className="flex justify-between items-center py-2.5"><Button disabled={sec === 0} onClick={() => setSec(sec - 1)}>← {t('back')}</Button><span className="text-muted text-xs font-mono">Step {sec + 1} / {sections.length}</span>{sec < sections.length - 1 ? <Button variant="primary" onClick={() => setSec(sec + 1)}>{t('next')} →</Button> : !ro && <Button variant="primary" className="bg-success border-success" onClick={save}>{t('save')} ✓</Button>}</div>}
        </div>
      </div>
    </section>
  );
}
