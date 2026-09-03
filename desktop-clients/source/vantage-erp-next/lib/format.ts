import type { FieldSchema } from './types';
export const isNumType = (f: FieldSchema) => f.type === 'currency' || f.type === 'number' || f.type === 'percent';
export const money = (v: unknown) => Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function fmt(f: FieldSchema, v: unknown): string {
  if (v === undefined || v === null || v === '') return '';
  switch (f.type) {
    case 'currency': return money(v);
    case 'number': return Number(v).toLocaleString();
    case 'percent': return v + '%';
    case 'toggle': return v ? 'Yes' : 'No';
    case 'multiselect': return Array.isArray(v) ? v.join(', ') : String(v);
    default: return String(v);
  }
}
export function statusTone(v: unknown): 'success' | 'warn' | 'danger' | 'neutral' {
  const x = String(v ?? '').toLowerCase();
  if (/paid|active|approved|posted|received|won|passed|present|delivered|closed/.test(x)) return 'success';
  if (/pending|draft|open|sent|partial|late|scheduled|calculated|submitted|negotiation|in transit/.test(x)) return 'warn';
  if (/overdue|blocked|void|rejected|lost|failed|absent|disputed|inactive|cancel/.test(x)) return 'danger';
  return 'neutral';
}
export function downloadCsv(name: string, rows: unknown[][]) {
  const csv = rows.map(r => r.map(v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; a.click();
}
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch; }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(v => v !== ''));
}
export const cn = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
