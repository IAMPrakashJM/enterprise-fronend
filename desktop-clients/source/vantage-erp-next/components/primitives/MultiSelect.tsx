'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/format';
export function MultiSelect({ value, options, onChange, disabled, placeholder = 'Select…' }: { value: string[]; options: string[]; onChange: (v: string[]) => void; disabled?: boolean; placeholder?: string }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen(!open)} className={cn('min-h-[32px] w-full px-2 py-[3px] border border-border rounded-ui text-form text-left flex flex-wrap gap-1 items-center focus:border-accent focus:shadow-[0_0_0_2px_var(--accent-soft)]', disabled ? 'bg-surface2' : 'bg-field cursor-pointer')}>
        {value.map(v => <span key={v} className="px-2 rounded-full bg-accent-soft text-accent text-[11.5px]">{v}</span>)}
        {!value.length && <span className="text-muted text-[11.5px]">{placeholder}</span>}
        <span className="ms-auto text-[10px] text-muted">▼</span>
      </button>
      {open && <div className="absolute top-full inset-x-0 z-20 bg-surface border border-border shadow-ui rounded-ui p-1 max-h-[220px] overflow-auto">
        {options.map(o => <label key={o} className="flex gap-2 items-center px-2 py-1.5 text-[12.5px] cursor-pointer hover:bg-surface2"><input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} />{o}</label>)}
      </div>}
    </div>
  );
}
