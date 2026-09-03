'use client';
import { useMemo, useState } from 'react';
import { schemas, today } from '@/lib/mock';
import { money, cn } from '@/lib/format';
import { toast } from '@/lib/toast/store';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/primitives/Button';
import { Field, Input } from '@/components/primitives/Input';
import { Select } from '@/components/primitives/Select';
import { Textarea } from '@/components/primitives/Textarea';
import { Toggle } from '@/components/primitives/Toggle';
interface Line { product: string; qty: number; price: number; tax: number }
interface Payment { mode: string; amount: number; date: string; ref: string }
type Tab = 'bill' | 'customer' | 'insurance' | 'lines' | 'payments';
export function Transaction() {
  const t = useT(); const products = schemas.product.rows; const customers = schemas.customer.rows;
  const [tab, setTab] = useState<Tab>('bill'); const [status, setStatus] = useState('Draft'); const [print, setPrint] = useState(false);
  const [h, setH] = useState({ no: 'INV-1058', date: today, dueDate: '2026-10-02', customer: String(customers[0].name), currency: 'AED', terms: 'Net 30', jurisdiction: 'UAE', salesperson: '', reference: '', notes: '', contact: String(customers[0].contact), email: String(customers[0].email), shipTo: String(customers[0].address), insurer: '', policy: '', claim: '', coverage: '', preAuth: false });
  const [lines, setLines] = useState<Line[]>(products.slice(0, 3).map(p => ({ product: p._id, qty: 2, price: Number(p.price), tax: Number(p.tax) })));
  const [payments, setPayments] = useState<Payment[]>([]); const [pay, setPay] = useState({ mode: 'Bank transfer', amount: '', date: today, ref: '' });
  const set = (k: keyof typeof h, v: unknown) => setH({ ...h, [k]: v });
  const calc = useMemo(() => { const ls = lines.map(l => { const sub = l.qty * l.price, tax = sub * l.tax / 100; return { ...l, sub, taxAmt: tax, total: sub + tax, name: products.find(p => p._id === l.product)?.name ?? '—' }; }); const subtotal = ls.reduce((a, l) => a + l.sub, 0), taxTotal = ls.reduce((a, l) => a + l.taxAmt, 0), paid = payments.reduce((a, p) => a + p.amount, 0); return { ls, subtotal, taxTotal, grand: subtotal + taxTotal, paid, balance: subtotal + taxTotal - paid }; }, [lines, payments, products]);
  const cust = customers.find(c => c.name === h.customer);
  const tabs: [Tab, string, string][] = [['bill', 'Bill details', h.no], ['customer', 'Customer', String(cust?.code ?? '—')], ['insurance', 'Insurance / other', h.insurer ? 'Set' : '—'], ['lines', 'Line items', String(lines.length)], ['payments', 'Payments', String(payments.length)]];
  const upd = (i: number, patch: Partial<Line>) => setLines(lines.map((l, j) => j === i ? { ...l, ...patch } : l));
  const grid = { display: 'grid', gridTemplateColumns: '36px minmax(220px,2fr) 90px 120px 80px 130px 130px 40px', alignItems: 'center' } as const;
  const RO = ({ label, value }: { label: string; value: string }) => <Field label={label}><Input readOnly mono value={value} /></Field>;
  return (
    <section className="grid gap-3.5 items-start" style={{ gridTemplateColumns: '1fr 300px' }}>
      <div className="flex flex-col gap-3 min-w-0">
        <div data-tour="bill-tabs" className="flex border-b border-border gap-0.5 overflow-x-auto">{tabs.map(([id, title, badge]) => <button key={id} onClick={() => setTab(id)} className={cn('h-9 px-3.5 border-b-2 whitespace-nowrap flex gap-2 items-center hover:text-text', tab === id ? 'border-accent text-text font-semibold' : 'border-transparent text-muted')}><span>{title}</span><span className="text-[10.5px] px-1.5 rounded-full bg-surface2 text-muted font-mono">{badge}</span></button>)}</div>
        {(tab === 'bill' || tab === 'customer' || tab === 'insurance') && <div className="bg-surface border border-border rounded-ui px-4 py-3.5 grid gap-x-4 gap-y-3 text-form" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
          {tab === 'bill' && <><RO label="Invoice no." value={h.no} /><Field label="Invoice date"><Input type="date" value={h.date} onChange={e => set('date', e.target.value)} /></Field><Field label="Due date"><Input type="date" value={h.dueDate} onChange={e => set('dueDate', e.target.value)} /></Field><Field label="Currency"><Select value={h.currency} onChange={e => set('currency', e.target.value)} options={['AED', 'INR', 'USD', 'SGD', 'SAR']} /></Field><Field label="Payment terms"><Select value={h.terms} onChange={e => set('terms', e.target.value)} options={['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Advance']} /></Field><Field label="Tax jurisdiction"><Select value={h.jurisdiction} onChange={e => set('jurisdiction', e.target.value)} options={['UAE', 'India-TN', 'Singapore', 'KSA']} /></Field><Field label="Salesperson"><Select value={h.salesperson} placeholder="—" onChange={e => set('salesperson', e.target.value)} options={schemas.salesperson.rows.slice(0, 10).map(s => String(s.name))} /></Field><Field label="Customer PO / reference"><Input value={h.reference} onChange={e => set('reference', e.target.value)} /></Field><Field label="Notes on invoice" span><Textarea rows={2} value={h.notes} onChange={e => set('notes', e.target.value)} /></Field></>}
          {tab === 'customer' && <><Field label="Customer"><Select value={h.customer} onChange={e => { const c = customers.find(x => x.name === e.target.value); setH({ ...h, customer: e.target.value, contact: String(c?.contact ?? ''), email: String(c?.email ?? ''), shipTo: String(c?.address ?? '') }); }} options={customers.slice(0, 40).map(c => String(c.name))} /></Field><RO label="Customer code" value={String(cust?.code ?? '')} /><RO label="Tax registration" value={String(cust?.taxId ?? '')} /><Field label="Contact person"><Input value={h.contact} onChange={e => set('contact', e.target.value)} /></Field><Field label="Email"><Input type="email" value={h.email} onChange={e => set('email', e.target.value)} /></Field><RO label="Credit limit" value={money(cust?.creditLimit)} /><Field label="Ship-to address" span><Textarea rows={2} value={h.shipTo} onChange={e => set('shipTo', e.target.value)} /></Field></>}
          {tab === 'insurance' && <><Field label="Insurer / third party"><Select value={h.insurer} placeholder="—" onChange={e => set('insurer', e.target.value)} options={['Orion Assurance', 'Gulf Mutual', 'Sable Re', 'Government scheme']} /></Field><Field label="Policy no."><Input value={h.policy} onChange={e => set('policy', e.target.value)} /></Field><Field label="Claim / authorization no."><Input value={h.claim} onChange={e => set('claim', e.target.value)} /></Field><Field label="Coverage %"><Input type="number" mono value={h.coverage} onChange={e => set('coverage', e.target.value)} /></Field><div className="flex flex-col gap-1"><span className="text-[11.5px] text-muted">Pre-authorization received</span><Toggle checked={h.preAuth} onChange={v => set('preAuth', v)} /></div></>}
        </div>}
        {tab === 'lines' && <div data-tour="bill-lines" className="bg-surface border border-border rounded-ui overflow-x-auto">
          <div style={grid} className="bg-surface2 text-[11px] uppercase tracking-[.5px] text-muted [&>span]:px-2.5 [&>span]:py-2"><span>#</span><span>Product</span><span className="text-right">Qty</span><span className="text-right">Unit price</span><span className="text-right">Tax %</span><span className="text-right">Tax</span><span className="text-right">Line total</span><span /></div>
          {calc.ls.map((l, i) => <div key={i} style={grid} className="border-t border-border [&>span]:px-1.5 [&>span]:py-1">
            <span className="text-muted font-mono text-xs !px-2.5">{i + 1}</span>
            <span><Select compact value={l.product} placeholder="Select product…" onChange={e => { const p = products.find(x => x._id === e.target.value); upd(i, p ? { product: p._id, price: Number(p.price), tax: Number(p.tax) } : { product: '' }); }} options={products.slice(0, 40).map(p => ({ value: p._id, label: p.sku + ' · ' + p.name }))} /></span>
            <span><Input mono className="h-[30px] text-right" type="number" value={l.qty} onChange={e => upd(i, { qty: +e.target.value })} /></span><span><Input mono className="h-[30px] text-right" type="number" value={l.price} onChange={e => upd(i, { price: +e.target.value })} /></span><span><Input mono className="h-[30px] text-right" type="number" value={l.tax} onChange={e => upd(i, { tax: +e.target.value })} /></span>
            <span className="text-right font-mono text-result !px-2.5">{money(l.taxAmt)}</span><span className="text-right font-mono text-result font-semibold !px-2.5">{money(l.total)}</span>
            <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="w-[26px] h-[26px] text-muted hover:text-danger text-base">×</button>
          </div>)}
          <div className="px-2.5 py-2 border-t border-border flex gap-2"><Button variant="ghost" className="border-dashed border-border" onClick={() => setLines([...lines, { product: '', qty: 1, price: 0, tax: 5 }])}>+ Add line</Button></div>
        </div>}
        {tab === 'payments' && <div className="bg-surface border border-border rounded-ui">
          <div className="grid gap-2.5 px-3.5 py-3 border-b border-border items-end" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto' }}>
            <Field label="Mode"><Select compact value={pay.mode} onChange={e => setPay({ ...pay, mode: e.target.value })} options={['Bank transfer', 'Cash', 'Card', 'Cheque', 'Insurance claim']} /></Field><Field label="Amount"><Input mono className="h-[30px]" type="number" value={pay.amount} onChange={e => setPay({ ...pay, amount: e.target.value })} /></Field><Field label="Date"><Input className="h-[30px]" type="date" value={pay.date} onChange={e => setPay({ ...pay, date: e.target.value })} /></Field><Field label="Reference"><Input className="h-[30px]" value={pay.ref} onChange={e => setPay({ ...pay, ref: e.target.value })} /></Field>
            <Button variant="primary" onClick={() => { if (!(+pay.amount > 0)) { toast('Enter a payment amount', 'err'); return; } setPayments([...payments, { ...pay, amount: +pay.amount }]); setPay({ ...pay, amount: '', ref: '' }); toast('Payment of ' + money(pay.amount) + ' recorded', 'ok'); }}>Add payment</Button>
          </div>
          {payments.map((p, i) => <div key={i} className="grid gap-2.5 px-3.5 py-2 border-b border-border text-result items-center" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto' }}><span>{p.mode}</span><span className="font-mono">{money(p.amount)}</span><span className="font-mono">{p.date}</span><span className="text-muted">{p.ref}</span><button onClick={() => setPayments(payments.filter((_, j) => j !== i))} className="w-[26px] h-[26px] text-muted hover:text-danger text-base">×</button></div>)}
          {!payments.length && <div className="p-6 text-center text-muted">No payments recorded</div>}
        </div>}
      </div>
      <div data-tour="bill-summary" className="sticky top-0 flex flex-col gap-3">
        <div className="bg-surface border border-border rounded-ui px-4 py-3.5 flex flex-col gap-2 text-result">
          <div className="flex justify-between items-baseline"><span className="font-semibold text-ui">Summary</span><span className="text-[11px] px-2 py-0.5 rounded-full bg-surface2 text-muted">{status}</span></div>
          {[['Lines', String(lines.length)], ['Subtotal', money(calc.subtotal)], ['Tax', money(calc.taxTotal)]].map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-muted">{k}</span><span className="font-mono">{v}</span></div>)}
          <div className="flex justify-between border-t border-border pt-2 font-semibold text-ui"><span>Total</span><span className="font-mono">{h.currency} {money(calc.grand)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Paid</span><span className="font-mono text-success">{money(calc.paid)}</span></div>
          <div className="flex justify-between font-semibold"><span>Balance due</span><span className={cn('font-mono', calc.balance > 0 ? 'text-danger' : 'text-success')}>{money(calc.balance)}</span></div>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="primary" className="h-[34px] justify-center" onClick={() => toast(h.no + ' saved as draft', 'ok', 'Saved')}>{t('save')} draft</Button>
          <Button variant="outline" tone="success" className="h-[34px] justify-center hover:bg-success hover:text-white" onClick={() => { if (!lines.length) { toast('Add at least one line before posting', 'err'); return; } setStatus(calc.balance <= 0 ? 'Paid' : 'Posted'); toast(h.no + ' posted to ledger · ' + h.currency + ' ' + money(calc.grand), 'ok', 'Posted'); }}>Post invoice</Button>
          <Button className="h-[34px] justify-center" onClick={() => setPrint(true)}>{t('print')} tax invoice</Button>
        </div>
        <div className="bg-surface border border-border rounded-ui px-3.5 py-3 text-xs text-muted leading-relaxed"><b className="text-text">Tax invoice details</b><br />Jurisdiction: {h.jurisdiction}<br />TRN: 100-2846-1937-003<br />Series: INV-2026</div>
      </div>
      {print && <>
        <div onClick={() => setPrint(false)} className="fixed inset-0 bg-black/45 z-[80]" />
        <div className="fixed top-[4vh] left-1/2 -translate-x-1/2 w-[min(760px,94vw)] max-h-[92vh] bg-white text-neutral-900 z-[81] shadow-ui flex flex-col print:static print:shadow-none">
          <div className="flex justify-between items-center px-4 py-2.5 border-b border-neutral-200 bg-neutral-100 print:hidden"><span className="font-semibold text-[13px]">Print preview · Tax invoice</span><span className="flex gap-2"><button onClick={() => window.print()} className="h-7 px-3 bg-neutral-900 text-white text-[12.5px]">{t('print')}</button><button onClick={() => setPrint(false)} className="h-7 px-3 border border-neutral-400 text-[12.5px]">{t('close')}</button></span></div>
          <div className="px-10 py-8 overflow-auto text-xs leading-relaxed">
            <div className="flex justify-between items-start mb-6"><div><div className="text-xl font-bold">Halcyon Group Holdings LLC</div><div className="text-neutral-600">Sheikh Zayed Road, Dubai, UAE · TRN 100-2846-1937-003</div></div><div className="text-right"><div className="text-lg font-bold">TAX INVOICE</div><div className="font-mono">{h.no}</div><div className="text-neutral-600">Date {h.date} · Due {h.dueDate}</div></div></div>
            <div className="grid grid-cols-2 gap-6 mb-5"><div><div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Bill to</div><div className="font-semibold">{h.customer}</div><div className="text-neutral-600">{h.shipTo}</div></div><div><div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Terms</div><div>{h.terms} · {h.currency}</div><div className="text-neutral-600">Jurisdiction {h.jurisdiction}</div></div></div>
            <div className="grid border-b-2 border-neutral-900 text-[10px] uppercase tracking-wider text-neutral-500 py-1" style={{ gridTemplateColumns: '2fr 60px 100px 60px 100px' }}><span>Description</span><span className="text-right">Qty</span><span className="text-right">Unit</span><span className="text-right">Tax</span><span className="text-right">Amount</span></div>
            {calc.ls.map((l, i) => <div key={i} className="grid border-b border-neutral-200 py-1.5 font-mono text-[11.5px]" style={{ gridTemplateColumns: '2fr 60px 100px 60px 100px' }}><span className="font-sans">{l.name}</span><span className="text-right">{l.qty}</span><span className="text-right">{money(l.price)}</span><span className="text-right">{l.tax}%</span><span className="text-right">{money(l.total)}</span></div>)}
            <div className="flex justify-end mt-3"><div className="w-[260px] grid gap-x-4 gap-y-1 font-mono text-[11.5px]" style={{ gridTemplateColumns: '1fr auto' }}><span className="font-sans text-neutral-600">Subtotal</span><span className="text-right">{money(calc.subtotal)}</span><span className="font-sans text-neutral-600">Tax</span><span className="text-right">{money(calc.taxTotal)}</span><span className="font-sans font-bold border-t border-neutral-900 pt-1">Total {h.currency}</span><span className="text-right font-bold border-t border-neutral-900 pt-1">{money(calc.grand)}</span><span className="font-sans text-neutral-600">Paid</span><span className="text-right">{money(calc.paid)}</span><span className="font-sans font-bold">Balance due</span><span className="text-right font-bold">{money(calc.balance)}</span></div></div>
          </div>
        </div>
      </>}
    </section>
  );
}
