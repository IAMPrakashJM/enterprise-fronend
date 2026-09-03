export type Cells = Record<string, string>;
export function colLetter(i: number) { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
export function colIndex(l: string) { let n = 0; for (const ch of l) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; }
export function splitRef(ref: string) { return { col: colIndex(ref.match(/[A-Z]+/)![0]), row: +ref.match(/\d+/)![0] }; }
export function cellValue(cells: Cells, ref: string, depth = 0): string | number {
  const raw = cells[ref]; if (raw == null || raw === '') return '';
  return raw.charAt(0) === '=' ? evalFormula(cells, raw.slice(1), depth + 1) : raw;
}
export function evalFormula(cells: Cells, expr: string, depth: number): string | number {
  if (depth > 30) return '#CYCLE';
  const num = (v: unknown) => { const n = parseFloat(String(v)); return isNaN(n) ? 0 : n; };
  const range = (a: string, b: string) => { const A = splitRef(a), B = splitRef(b); const out: number[] = [];
    for (let c = Math.min(A.col, B.col); c <= Math.max(A.col, B.col); c++) for (let r = Math.min(A.row, B.row); r <= Math.max(A.row, B.row); r++) { const v = cellValue(cells, colLetter(c) + r, depth); if (v !== '' && !isNaN(parseFloat(String(v)))) out.push(num(v)); } return out; };
  let e = expr.toUpperCase().replace(/(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\(([A-Z]+\d+):([A-Z]+\d+)\)/g, (_m, fn, a, b) => { const v = range(a, b); if (!v.length) return '0';
    switch (fn) { case 'SUM': return String(v.reduce((x, y) => x + y, 0)); case 'AVG': case 'AVERAGE': return String(v.reduce((x, y) => x + y, 0) / v.length); case 'MIN': return String(Math.min(...v)); case 'MAX': return String(Math.max(...v)); default: return String(v.length); } });
  e = e.replace(/[A-Z]+\d+/g, ref => { const v = cellValue(cells, ref, depth); return String(v === '' ? 0 : num(v)); });
  if (!/^[\d\s+\-*/().%]*$/.test(e)) return '#ERR';
  try { const v = Function('"use strict";return (' + e + ')')(); return isFinite(v) ? v : '#DIV/0'; } catch { return '#ERR'; }
}
export const fmtCell = (v: string | number) => typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(2)) : v;
