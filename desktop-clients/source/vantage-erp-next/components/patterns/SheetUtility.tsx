'use client';
import { useState } from 'react';
import { ERP } from '@/lib/mock';
import { downloadCsv, parseCsv, cn } from '@/lib/format';
import { toast } from '@/lib/toast/store';
import { cellValue, colLetter, fmtCell, splitRef, type Cells } from '@/lib/sheet/evaluate';
import { Button } from '@/components/primitives/Button';
function sample(): Cells { const c: Cells = {}; ERP.sheet.forEach((row, r) => row.forEach((v, ci) => { c[colLetter(ci) + (r + 1)] = String(v); })); return c; }
export function SheetUtility() {
  const [cells, setCells] = useState<Cells>(sample); const [nRows, setRows] = useState(30); const [nCols, setCols] = useState(8); const [sel, setSel] = useState('A1'); const [status, setStatus] = useState('Sample loaded · 7 × 7');
  const setCell = (ref: string, v: string) => setCells({ ...cells, [ref]: v });
  const move = (dc: number, dr: number) => { const { col, row } = splitRef(sel); const c = col + dc, r = row + dr; if (c < 0 || r < 1 || c >= nCols || r > nRows) return; const ref = colLetter(c) + r; setSel(ref); (document.querySelector('[data-ref="' + ref + '"]') as HTMLInputElement | null)?.focus(); };
  const fillDown = () => { const { col, row } = splitRef(sel); const L = colLetter(col); const src = cells[sel] ?? ''; const next = { ...cells }; let n = 0; for (let r = row + 1; r <= nRows && n < 20; r++) { if (next[L + r]) { if (n === 0) continue; break; } if (n > 0 && !(next[L + (r - 1)] ?? '')) break; next[L + r] = src.replace(/([A-Z]+)(\d+)/g, (_m, c, rr) => c + (+rr + (r - row))); n++; } setCells(next); toast('Filled ' + n + ' cells down from ' + sel, 'ok'); };
  const importFile = (file?: File) => { if (!file) return; const rd = new FileReader(); rd.onload = () => { const rows = parseCsv(String(rd.result)); const c: Cells = {}; rows.forEach((r, ri) => r.forEach((v, ci) => { c[colLetter(ci) + (ri + 1)] = v; })); setCells(c); setRows(Math.max(30, rows.length + 5)); setCols(Math.max(8, ...rows.map(r => r.length))); setSel('A1'); setStatus(file.name + ' · ' + rows.length + ' rows'); toast(file.name + ' imported (' + rows.length + ' rows)', 'ok', 'CSV'); }; rd.readAsText(file); };
  const exportCsv = () => { const out: string[][] = []; for (let r = 1; r <= nRows; r++) { const row: string[] = []; let any = false; for (let c = 0; c < nCols; c++) { const v = String(fmtCell(cellValue(cells, colLetter(c) + r))); if (v) any = true; row.push(v); } if (any) out.push(row); } downloadCsv('sheet.csv', out); toast(out.length + ' rows exported (computed values)', 'ok', 'CSV'); };
  const grid = { display: 'grid', gridTemplateColumns: '44px repeat(' + nCols + ', minmax(120px,1fr))' }; const { col: sc, row: sr } = splitRef(sel); const raw = cells[sel] ?? '';
  return (
    <section className="flex flex-col gap-2.5 min-h-0">
      <div data-tour="sheet-tools" className="flex gap-2 items-center flex-wrap">
        <label className="h-[30px] px-3 border border-accent bg-accent text-accent-fg font-semibold rounded-ui cursor-pointer flex items-center">Import CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={e => { importFile(e.target.files?.[0]); e.target.value = ''; }} /></label>
        <Button onClick={exportCsv}>Export CSV</Button><div className="w-px h-5 bg-border" /><Button onClick={fillDown}>Fill down</Button><Button onClick={() => setRows(nRows + 10)}>+ Row</Button><Button onClick={() => setCols(nCols + 1)}>+ Column</Button><Button onClick={() => { setCells(sample()); setStatus('Sample loaded · 7 × 7'); }}>Load sample</Button><Button variant="outline" tone="danger" onClick={() => { setCells({}); setStatus('Empty sheet'); toast('Sheet cleared', 'info'); }}>Clear</Button>
        <span className="flex-1" /><span className="text-muted text-xs">{status}</span>
      </div>
      <div data-tour="sheet-bar" className="flex border border-border bg-surface rounded-ui"><span className="w-[70px] grid place-items-center font-mono font-semibold border-e border-border bg-surface2">{sel}</span><span className="w-[30px] grid place-items-center text-muted italic font-mono">fx</span><input value={raw} onChange={e => setCell(sel, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); move(0, 1); } }} placeholder="Value or formula, e.g. =SUM(B2:B6)" className="flex-1 h-8 bg-transparent font-mono text-form outline-none px-2" /><span className="grid place-items-center px-2.5 text-muted text-[11.5px] font-mono">{raw.startsWith('=') ? '= ' + fmtCell(cellValue(cells, sel)) : ''}</span></div>
      <div data-tour="sheet" onDrop={e => { e.preventDefault(); importFile(e.dataTransfer.files[0]); }} onDragOver={e => e.preventDefault()} className="bg-surface border border-border rounded-ui overflow-auto max-h-[calc(100vh-290px)]">
        <div style={grid} className="sticky top-0 z-[2] bg-surface2"><span className="h-[26px] border-b border-e border-border" />{Array.from({ length: nCols }, (_, c) => <span key={c} className={cn('h-[26px] grid place-items-center font-mono text-[11.5px] font-semibold border-b border-e border-border', c === sc ? 'text-accent bg-accent-soft' : 'text-muted')}>{colLetter(c)}</span>)}</div>
        {Array.from({ length: nRows }, (_, ri) => { const r = ri + 1; return (
          <div key={r} style={grid}>
            <span className={cn('h-[26px] grid place-items-center font-mono text-[11.5px] border-b border-e border-border sticky left-0', r === sr ? 'text-accent bg-accent-soft' : 'text-muted bg-surface2')}>{r}</span>
            {Array.from({ length: nCols }, (_, c) => { const ref = colLetter(c) + r, rv = cells[ref] ?? '', on = ref === sel, isF = rv.startsWith('='), disp = on ? rv : String(fmtCell(cellValue(cells, ref))); const isNum = !on && disp !== '' && !isNaN(parseFloat(disp)); return (
              <input key={ref} data-ref={ref} value={disp} onFocus={() => setSel(ref)} onChange={e => setCell(ref, e.target.value)}
                onKeyDown={e => { const t = e.target as HTMLInputElement; if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); move(0, 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(0, -1); } else if (e.key === 'Tab' || (e.key === 'ArrowRight' && t.selectionStart === t.value.length)) { e.preventDefault(); move(1, 0); } else if (e.key === 'ArrowLeft' && t.selectionStart === 0) { e.preventDefault(); move(-1, 0); } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); fillDown(); } }}
                className={cn('h-[26px] border-b border-e border-border font-mono text-xs px-1.5 outline-none min-w-0 -outline-offset-2', on ? 'bg-accent-soft outline outline-2 outline-accent' : r === 1 ? 'bg-surface2 font-semibold' : isF ? 'bg-[color-mix(in_srgb,var(--success)_8%,var(--field))]' : 'bg-field', disp.startsWith('#') ? 'text-danger' : isF ? 'text-success' : 'text-text', isNum && 'text-right')} />); })}
          </div>); })}
      </div>
      <div className="flex gap-4 text-muted text-[11.5px] flex-wrap"><span>Formulas: <code className="font-mono">=A1*B1</code>, <code className="font-mono">=SUM(B2:B9)</code>, AVG, MIN, MAX, COUNT</span><span>Keys: arrows move · Enter commits · Tab next · Ctrl+D fill down</span><span>Drop a .csv onto the grid to import</span></div>
    </section>
  );
}
