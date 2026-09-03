'use client';
import { useEffect, useRef, useState } from 'react';
import type { FieldSchema } from '@/lib/types';
import { Button } from '@/components/primitives/Button';
import { useT } from '@/lib/i18n/useT';
export function ColumnChooser({ fields, visible, onChange }: { fields: FieldSchema[]; visible: string[]; onChange: (keys: string[]) => void }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null); const t = useT();
  useEffect(() => { const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const up = (k: string) => { const i = visible.indexOf(k); if (i > 0) { const n = [...visible]; n.splice(i, 1); n.splice(i - 1, 0, k); onChange(n); } };
  return (
    <div ref={ref} data-tour="columns" className="relative">
      <Button onClick={() => setOpen(!open)}>{t('columns')} ▾</Button>
      {open && <div className="absolute top-[calc(100%+6px)] end-0 w-60 bg-surface border border-border shadow-ui rounded-ui p-1.5 z-20 max-h-[360px] overflow-auto">
        <div className="px-2 pt-1 pb-2 text-[11px] text-muted uppercase tracking-[.5px]">Visible columns · saved per worklist</div>
        {fields.filter(f => f.type !== 'textarea').map(f => { const on = visible.includes(f.key); return <label key={f.key} className="flex items-center gap-2 px-2 py-1.5 text-[12.5px] cursor-pointer hover:bg-surface2"><input type="checkbox" checked={on} onChange={() => onChange(on ? visible.filter(k => k !== f.key) : [...visible, f.key])} /><span className="flex-1">{f.label}</span><button onClick={e => { e.preventDefault(); up(f.key); }} className="text-muted text-[11px]" title="Move up">▲</button></label>; })}
      </div>}
    </div>
  );
}
