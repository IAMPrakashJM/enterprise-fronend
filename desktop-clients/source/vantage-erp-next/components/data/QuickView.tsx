'use client';
import { useRouter } from 'next/navigation';
import type { EntitySchema, Row } from '@/lib/types';
import { fmt, isNumType, cn } from '@/lib/format';
import { Surface } from '@/components/surfaces/Surface';
import { Button } from '@/components/primitives/Button';
import { usePrefsStore } from '@/lib/prefs/store';
import { useWorkspace } from '@/lib/workspace/store';
import { useT } from '@/lib/i18n/useT';
import { toast } from '@/lib/toast/store';
export function QuickView({ schema, row, onClose }: { schema: EntitySchema; row: Row; onClose: () => void }) {
  const placement = usePrefsStore(s => s.prefs.quickView); const ws = useWorkspace(); const router = useRouter(); const t = useT();
  const title = String(row[schema.titleKey] ?? '');
  const openRecord = (mode: 'view' | 'edit') => { const href = '/' + ws.module + '/' + schema.id + '/' + row._id + '?mode=' + mode; ws.openTab(href, schema.label + ': ' + title, mode.toUpperCase()); router.push(href); onClose(); };
  const run = (a: EntitySchema['quickActions'][number]) => { if (a.act === 'view' || a.act === 'edit') openRecord(a.act); else if (a.act === 'nav') { const href = '/' + ws.module + '/' + a.page; ws.setWorkspace(href, a.label); router.push(href); onClose(); } else { toast(a.msg ?? a.label, 'ok', a.label); onClose(); } };
  return (
    <Surface placement={placement} onClose={onClose} label={t('quickView')}>
      <div className="flex items-start gap-2.5 px-4 py-3.5 border-b border-border">
        <span className="w-[38px] h-[38px] shrink-0 grid place-items-center bg-accent-soft text-accent font-bold rounded-ui">{title.charAt(0) || '?'}</span>
        <span className="flex flex-col min-w-0 flex-1"><span className="text-[11px] uppercase tracking-[.5px] text-muted">{t('quickView')} · {schema.label}</span><span className="font-semibold text-[15px] truncate">{title}</span><span className="text-muted text-xs font-mono">{String(row[schema.fields[0].key])}</span></span>
        <button onClick={onClose} title={t('close') + ' (Esc)'} className="w-7 h-7 text-muted text-lg leading-none hover:text-text">×</button>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2.5 overflow-auto flex-1">
        {schema.fields.filter(f => f.type !== 'textarea').slice(0, 8).map(f => <span key={f.key} className="flex flex-col gap-0.5 min-w-0"><span className="text-[10.5px] text-muted uppercase tracking-[.4px]">{f.label}</span><span className={cn('text-result truncate', isNumType(f) && 'font-mono')}>{fmt(f, row[f.key])}</span></span>)}
      </div>
      <div className="px-4 py-3 border-t border-border flex gap-2 flex-wrap">{schema.quickActions.map((a, i) => <Button key={a.label} variant={i === 0 ? 'primary' : 'secondary'} onClick={() => run(a)}>{a.label}</Button>)}</div>
    </Surface>
  );
}
