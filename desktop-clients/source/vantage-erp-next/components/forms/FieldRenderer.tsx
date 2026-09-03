'use client';
import type { FieldSchema } from '@/lib/types';
import { isNumType } from '@/lib/format';
import { Field, Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
import { MultiSelect } from '@/components/primitives/MultiSelect';
import { Toggle } from '@/components/primitives/Toggle';
import { Textarea } from '@/components/primitives/Textarea';
export function FieldRenderer({ field: f, value, onChange, readOnly, error }: { field: FieldSchema; value: unknown; onChange: (v: unknown) => void; readOnly?: boolean; error?: string }) {
  const common = { label: f.label, required: f.req, error };
  switch (f.type) {
    case 'select': return <Field {...common}><Select value={String(value ?? '')} disabled={readOnly} onChange={e => onChange(e.target.value)} placeholder="—" options={f.options ?? []} /></Field>;
    case 'multiselect': return <Field {...common}><MultiSelect value={Array.isArray(value) ? value as string[] : []} options={f.options ?? []} disabled={readOnly} onChange={onChange} /></Field>;
    case 'toggle': return <div className="flex flex-col gap-1"><span className="text-[11.5px] text-muted">{f.label}</span><Toggle checked={!!value} disabled={readOnly} onChange={onChange} /></div>;
    case 'textarea': return <Field {...common} span><Textarea value={String(value ?? '')} readOnly={readOnly} onChange={e => onChange(e.target.value)} /></Field>;
    default: return <Field {...common}><Input type={f.type === 'date' ? 'date' : isNumType(f) ? 'number' : f.type === 'email' ? 'email' : 'text'} mono={isNumType(f) || f.type === 'code'} value={String(value ?? '')} readOnly={readOnly} placeholder={f.label} error={error} onChange={e => onChange(isNumType(f) ? (e.target.value === '' ? '' : +e.target.value) : e.target.value)} /></Field>;
  }
}
