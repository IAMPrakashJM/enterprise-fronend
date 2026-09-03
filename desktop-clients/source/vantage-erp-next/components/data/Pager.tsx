'use client';
import { useT } from '@/lib/i18n/useT';
import { Select } from '@/components/primitives/Select';
import { cn } from '@/lib/format';
export function Pager({ page, pages, total, from, to, pageSize, onPage, onPageSize }: { page: number; pages: number; total: number; from: number; to: number; pageSize: number; onPage: (n: number) => void; onPageSize: (n: number) => void }) {
  const t = useT(); const nums: number[] = []; for (let i = Math.max(1, page - 2); i <= Math.min(pages, Math.max(1, page - 2) + 4); i++) nums.push(i);
  const b = 'h-[26px] min-w-[26px] px-1.5 border rounded-ui text-xs font-mono disabled:opacity-40';
  return (
    <div data-tour="pager" className="flex items-center gap-3 flex-wrap text-[12.5px] text-muted">
      <span>{t('showing')} <b className="text-text">{from}–{to}</b> {t('of')} <b className="text-text">{total}</b> {t('records')}</span><span className="flex-1" />
      <label className="flex items-center gap-1.5">{t('rowsPerPage')}<Select compact className="w-auto h-[26px] text-xs" value={String(pageSize)} onChange={e => onPageSize(+e.target.value)} options={['10', '20', '50', '100']} /></label>
      <div className="flex gap-0.5"><button className={cn(b, 'border-border bg-surface text-text')} disabled={page <= 1} onClick={() => onPage(page - 1)}>‹</button>
        {nums.map(n => <button key={n} onClick={() => onPage(n)} className={cn(b, n === page ? 'bg-accent text-accent-fg border-accent' : 'border-border bg-surface text-text')}>{n}</button>)}
        <button className={cn(b, 'border-border bg-surface text-text')} disabled={page >= pages} onClick={() => onPage(page + 1)}>›</button></div>
    </div>
  );
}
