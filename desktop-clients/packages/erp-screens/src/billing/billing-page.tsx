"use client";
import { CardGrid } from "@pepbits/ops-ui";
import { TableContainer } from "@pepbits/ops-ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@pepbits/ops-ui";
import { LocalizedText } from "@pepbits/ops-ui";


import React, { createContext, useContext, useMemo, useState } from "react";
import { BadgeCheck, Banknote, Calculator, CheckCircle2, ChevronDown, CircleDollarSign, Copy, Download, FileCheck2, FileText, History, MoreHorizontal, Plus, Printer, ReceiptText, Save, ScanLine, ShieldCheck, Trash2, UserRound, WalletCards } from "lucide-react";
import { useERP } from "@pepbits/erp-shell";
import { usePublishAiSources } from "@pepbits/ai-client";
import { InlineAiAction } from "@pepbits/ai-ui";
import { Button, IconButton } from "@pepbits/ops-ui";
import { Badge, StatusBadge } from "@pepbits/ops-ui";
import { Card } from "@pepbits/ops-ui";
import { Input, MultiSelect, Select, Textarea, Toggle } from "@pepbits/ops-ui";
import { Tabs } from "@pepbits/ops-ui";
import { ActionMenu, MenuButton } from "@pepbits/ops-ui";
import { Modal } from "@pepbits/ops-ui";
import { cn } from "@pepbits/ops-ui";
import {createFormatters, DEFAULT_PREFERENCES} from "@pepbits/erp-config";
import type { BillingLayout, Formatters, PageDefinition, CurrencyCode } from "@pepbits/erp-config";

import { useRecordEditor, useRecordField, RecordSaveStatus } from "../records/use-record-editor";
import type { RecordEditor } from "@pepbits/erp-data";
import type { NavigationTarget } from "@pepbits/platform-ports";

interface LineItem {
  id: number;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

const INITIAL_LINES: LineItem[] = [
  { id: 1, code: "SRV-CLOUD-01", description: "Enterprise cloud platform subscription", quantity: 12, unitPrice: 1850, discount: 5, taxRate: 5 },
  { id: 2, code: "SRV-IMP-04", description: "Implementation and configuration services", quantity: 80, unitPrice: 425, discount: 0, taxRate: 5 },
  { id: 3, code: "SUP-PREM-02", description: "Premium support coverage", quantity: 12, unitPrice: 680, discount: 3, taxRate: 5 },
  { id: 4, code: "TRN-ADM-01", description: "Administrator enablement workshop", quantity: 3, unitPrice: 3200, discount: 0, taxRate: 5 },
];

const billingTabs = [
  { id: "billing", label: "Billing details", icon: <ReceiptText className="size-3.5" /> },
  { id: "customer", label: "Customer", icon: <UserRound className="size-3.5" /> },
  { id: "tax", label: "Contract, insurance & tax", icon: <ShieldCheck className="size-3.5" /> },
  { id: "lines", label: "Line items", icon: <Calculator className="size-3.5" />, badge: 4 },
  { id: "payments", label: "Payments", icon: <WalletCards className="size-3.5" />, badge: 2 },
  { id: "audit", label: "Audit", icon: <History className="size-3.5" /> },
];

function SectionHeading({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3"><div className="flex items-start gap-2.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">{icon}</span><div><h3 className="text-[length:calc(12px*var(--fs-scale))] font-black"><LocalizedText message={title} /></h3><p className="mt-0.5 text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]"><LocalizedText message={description} /></p></div></div>{action}</div>;
}

type BillingValues = { lines: LineItem[]; fields: Record<string, string | boolean | string[]> };
const BillingContext = createContext<RecordEditor<BillingValues> | null>(null);
function useBillingField(label: string) {
  const editor = useContext(BillingContext)!;
  const [fields, setFields] = useRecordField(editor, "fields");
  return [fields[label], (value: string | boolean | string[]) => setFields(previous => ({ ...previous, [label]: value }))] as const;
}
function BillInput({ label, defaultValue: _default, value: _value, onChange: _change, ...props }: React.ComponentProps<typeof Input>) {
  const [value, set] = useBillingField(String(label));
  return <Input {...props} label={label} value={String(value ?? "")} onChange={event => set(event.target.value)} />;
}
function BillTextarea({ label, defaultValue: _default, value: _value, onChange: _change, ...props }: React.ComponentProps<typeof Textarea>) {
  const [value, set] = useBillingField(String(label));
  return <Textarea {...props} label={label} value={String(value ?? "")} onChange={event => set(event.target.value)} />;
}
function BillSelect({ label, value: _value, onChange: _change, ...props }: React.ComponentProps<typeof Select>) {
  const [value, set] = useBillingField(String(label));
  const editor = useContext(BillingContext)!;
  return <Select {...props} label={label} value={String(value ?? "")} onChange={event => {
    const next = event.target.value;
    if (label === "Customer") editor.update(previous => ({ ...previous, fields: { ...previous.fields,
      Customer: next, "Primary contact": "", Email: "", Phone: "", "Billing address": "",
      "Tax registration number": "", "Credit limit": "", "Current exposure": "",
    } }));
    else set(next);
  }} />;
}
function BillToggle({ label, checked: _value, onChange: _change, ...props }: React.ComponentProps<typeof Toggle>) {
  const [value, set] = useBillingField(String(label));
  return <Toggle {...props} label={label} checked={Boolean(value)} onChange={set} />;
}
function BillMultiSelect({ label, value: _value, onChange: _change, ...props }: React.ComponentProps<typeof MultiSelect>) {
  const [value, set] = useBillingField(String(label));
  return <MultiSelect {...props} label={label} value={Array.isArray(value) ? value : []} onChange={set} />;
}
const INITIAL_BILLING: BillingValues = { lines: INITIAL_LINES, fields: {
  "Invoice number": "INV-26-005184",
  "Invoice date": "2026-09-02",
  "Due date": "2026-10-02",
  "Exchange rate": "1.000000",
  "Purchase order reference": "PO-AHL-2026-0118",
  "Contract reference": "CTR-ENT-00412",
  "Invoice remarks": "Annual enterprise subscription, implementation and support services for the 2026\u20132027 contract period.",
  "Tax registration number": "100384720100003",
  "Primary contact": "Aisha Rahman",
  "Email": "accounts@atlashorizon.example",
  "Phone": "+971 2 555 0184",
  "Credit limit": "500,000",
  "Current exposure": "184,200",
  "Billing address": "Level 18, Horizon Tower, Al Maryah Island, Abu Dhabi, United Arab Emirates",
  "Policy / coverage number": "",
  "Authorization reference": "",
  "Claim / external reference": "",
  "Branch": "hq", "Currency": "AED", "Account manager": "maya", "Customer": "atlas",
  "Payment terms": "30", "Payer arrangement": "customer", "Tax jurisdiction": "uae",
  "Tax treatment": "standard", "Tax evidence": ["trn", "contract"],
  "Reverse charge applies": false, "Electronic tax invoice": true, "Validate tax at posting": true
} };

function BillingDetails() {
  return <div><SectionHeading icon={<ReceiptText className="size-4" />} title="Billing details" description="Document identity, dates, currency, ownership and commercial references." /><div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"><BillInput label="Invoice number" value="INV-26-005184" disabled /><BillInput label="Invoice date" type="date" defaultValue="2026-09-02" required /><BillInput label="Due date" type="date" defaultValue="2026-10-02" required /><BillSelect label="Branch" value="hq" options={[{ label: "Abu Dhabi • Head Office", value: "hq" }, { label: "Dubai • Business Center", value: "dubai" }]} onChange={() => undefined} /><BillSelect label="Currency" value="AED" options={[{ label: "AED • UAE Dirham", value: "AED" }, { label: "USD • US Dollar", value: "USD" }, { label: "INR • Indian Rupee", value: "INR" }]} onChange={() => undefined} /><BillInput label="Exchange rate" type="number" defaultValue="1.000000" suffix="AED" /><BillInput label="Purchase order reference" defaultValue="PO-AHL-2026-0118" /><BillInput label="Contract reference" defaultValue="CTR-ENT-00412" /><BillSelect label="Account manager" value="maya" options={[{ label: "Maya Thomas", value: "maya" }, { label: "Ibrahim Noor", value: "ibrahim" }]} onChange={() => undefined} /><BillTextarea className="md:col-span-2 xl:col-span-3" label="Invoice remarks" defaultValue="Annual enterprise subscription, implementation and support services for the 2026–2027 contract period." /></div></div>;
}

function CustomerDetails() {
  return <div><SectionHeading icon={<UserRound className="size-4" />} title="Customer details" description="Bill-to party, contact, delivery and credit profile." action={<Button size="xs" variant="outline"><LocalizedText message="ui.open.customer.master.dd1e845d" /></Button>} /><div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"><BillSelect className="md:col-span-2" label="Customer" value="atlas" options={[{ label: "CUS-02401 • Atlas Horizon LLC", value: "atlas" }, { label: "CUS-02402 • Bluecrest Retail", value: "bluecrest" }]} onChange={() => undefined} /><BillInput label="Tax registration number" value="100384720100003" disabled /><BillInput label="Primary contact" value="Aisha Rahman" /><BillInput label="Email" value="accounts@atlashorizon.example" /><BillInput label="Phone" value="+971 2 555 0184" /><BillSelect label="Payment terms" value="30" options={[{ label: "Net 30", value: "30" }, { label: "Net 60", value: "60" }, { label: "Due immediately", value: "0" }]} onChange={() => undefined} /><BillInput label="Credit limit" value="500,000" prefix="AED" disabled /><BillInput label="Current exposure" value="184,200" prefix="AED" disabled /><BillTextarea className="md:col-span-2 xl:col-span-3" label="Billing address" value="Level 18, Horizon Tower, Al Maryah Island, Abu Dhabi, United Arab Emirates" /></div></div>;
}

function TaxDetails() {
  return <div><SectionHeading icon={<ShieldCheck className="size-4" />} title="Contract, insurance & tax" description="Payer allocation, policy references, jurisdiction and tax treatment." /><div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"><BillSelect label="Payer arrangement" value="customer" options={[{ label: "Direct customer billing", value: "customer" }, { label: "Insurance / third party", value: "insurance" }, { label: "Split payer", value: "split" }]} onChange={() => undefined} /><BillSelect label="Tax jurisdiction" value="uae" options={[{ label: "UAE Federal VAT", value: "uae" }, { label: "Export • Zero rated", value: "export" }, { label: "Saudi VAT", value: "ksa" }]} onChange={() => undefined} /><BillSelect label="Tax treatment" value="standard" options={[{ label: "Standard rated 5%", value: "standard" }, { label: "Zero rated", value: "zero" }, { label: "Exempt", value: "exempt" }]} onChange={() => undefined} /><BillInput label="Policy / coverage number" placeholder="Optional third-party coverage" /><BillInput label="Authorization reference" placeholder="Pre-approval or authorization" /><BillInput label="Claim / external reference" placeholder="External billing reference" /><BillMultiSelect className="md:col-span-2" label="Tax evidence" value={["trn", "contract"]} onChange={() => undefined} options={[{ label: "Tax registration verified", value: "trn" }, { label: "Signed contract", value: "contract" }, { label: "Export evidence", value: "export" }, { label: "Exemption certificate", value: "exempt" }]} /><BillToggle label="Reverse charge applies" checked={false} onChange={() => undefined} /><BillToggle label="Electronic tax invoice" checked={true} onChange={() => undefined} /><BillToggle label="Validate tax at posting" checked={true} onChange={() => undefined} /></div></div>;
}

function LineItems({ lines, setLines, format }: { lines: LineItem[]; setLines: React.Dispatch<React.SetStateAction<LineItem[]>>; format: Formatters }) {
  const update = (id: number, key: keyof LineItem, value: string | number) => setLines((previous) => previous.map((line) => line.id === id ? { ...line, [key]: typeof line[key] === "number" ? Number(value) : value } : line));
  return <div data-tour="bill-lines"><SectionHeading icon={<Calculator className="size-4" />} title="Line items" description="Products, services, quantities, rates, discounts and line-level tax." action={<div className="flex gap-1.5"><Button size="xs" variant="outline" leftIcon={<ScanLine className="size-3" />}><LocalizedText message="ui.scan.lookup.31816582" /></Button><Button size="xs" variant="primary" leftIcon={<Plus className="size-3" />} onClick={() => setLines((previous) => [...previous, { id: Date.now(), code: "", description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 5 }])}><LocalizedText message="ui.add.line.a922dc85" /></Button></div>} /><TableContainer overflow="horizontal" className=""><Table className="w-full min-w-[960px] border-collapse text-left"><TableHeader><TableRow className="border-b border-[var(--border)] bg-[var(--surface-2)]">{["#", "Item / service", "Description", "Qty", "Unit price", "Discount %", "Tax %", "Line total", ""].map((heading) => <TableHead key={heading} className="px-3 py-2 text-[length:calc(8.5px*var(--fs-scale))] font-black uppercase tracking-[.08em] text-[var(--text-subtle)]"><LocalizedText message={heading} /></TableHead>)}</TableRow></TableHeader><TableBody>{lines.map((line, index) => { const base = line.quantity * line.unitPrice * (1 - line.discount / 100); const total = base * (1 + line.taxRate / 100); return <TableRow key={line.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]"><TableCell className="px-3 py-2 text-[length:calc(9px*var(--fs-scale))] font-bold text-[var(--text-subtle)]">{index + 1}</TableCell><TableCell className="w-44 px-2 py-2"><Input value={line.code} placeholder="ui.item.code.53e24cae" onChange={(event) => update(line.id, "code", event.target.value)} /></TableCell><TableCell className="min-w-64 px-2 py-2"><Input value={line.description} placeholder="ui.description.526e0087" onChange={(event) => update(line.id, "description", event.target.value)} /></TableCell><TableCell className="w-20 px-2 py-2"><Input type="number" min={0} value={line.quantity} onChange={(event) => update(line.id, "quantity", event.target.value)} /></TableCell><TableCell className="w-32 px-2 py-2"><Input type="number" min={0} value={line.unitPrice} onChange={(event) => update(line.id, "unitPrice", event.target.value)} /></TableCell><TableCell className="w-24 px-2 py-2"><Input type="number" min={0} max={100} value={line.discount} onChange={(event) => update(line.id, "discount", event.target.value)} /></TableCell><TableCell className="w-24 px-2 py-2"><Select value={String(line.taxRate)} options={[{ label: "0%", value: "0" }, { label: "5%", value: "5" }, { label: "15%", value: "15" }]} onChange={(event) => update(line.id, "taxRate", event.target.value)} /></TableCell><TableCell className="whitespace-nowrap px-3 py-2 text-[length:calc(10px*var(--fs-scale))] font-black tabular-nums">{format.money(total)}</TableCell><TableCell className="px-2 py-2"><IconButton label="ui.delete.line.5f190885" className="size-7 text-[var(--danger-ink)]" onClick={() => setLines((previous) => previous.filter((item) => item.id !== line.id))}><Trash2 className="size-3.5" /></IconButton></TableCell></TableRow>; })}</TableBody></Table></TableContainer></div>;
}

function Payments() {
  return <div><SectionHeading icon={<WalletCards className="size-4" />} title="Payments & allocations" description="Receipts, deposits, credit applications and outstanding balance." action={<Button size="xs" variant="primary" leftIcon={<Plus className="size-3" />}><LocalizedText message="ui.add.payment.cf9d06f9" /></Button>} /><CardGrid className="gap-4 p-4 xl:grid-cols-[1.2fr_.8fr]"><TableContainer overflow="hidden" className="rounded-xl border border-[var(--border)]"><Table className="w-full text-left"><TableHeader><TableRow className="bg-[var(--surface-2)]">{["Receipt", "Method", "Date", "Reference", "Amount", "Status"].map((h) => <TableHead key={h} className="px-3 py-2 text-[length:calc(8px*var(--fs-scale))] font-black uppercase text-[var(--text-subtle)]"><LocalizedText message={h} /></TableHead>)}</TableRow></TableHeader><TableBody>{[
    ["RCT-26-00841", "Bank transfer", "2026-08-28", "AHL-TRF-8841", "AED 25,000", "Cleared"],
    ["DEP-26-00174", "Customer deposit", "2026-07-15", "CTR-ENT-00412", "AED 10,000", "Applied"],
  ].map((row) => <TableRow key={row[0]} className="border-t border-[var(--border)]">{row.map((value, index) => <TableCell key={value} className="px-3 py-3 text-[length:calc(9.5px*var(--fs-scale))] font-semibold text-[var(--text-muted)]">{index === 5 ? <StatusBadge value={value} /> : value}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer><Card shadow="none" tone="muted" radius="xl" className="p-4"><div className="text-[length:calc(9px*var(--fs-scale))] font-black uppercase tracking-[.1em] text-[var(--text-subtle)]"><LocalizedText message="ui.allocation.summary.a758856b" /></div>{[["Invoice total", "AED 73,164"], ["Payments applied", "AED 35,000"], ["Credit notes", "AED 0"], ["Balance due", "AED 38,164"]].map(([label, value], index) => <div key={label} className={cn("flex justify-between border-b border-[var(--border)] py-2.5 text-[length:calc(10px*var(--fs-scale))]", index === 3 && "border-0 text-[length:calc(12px*var(--fs-scale))] font-black text-[var(--primary)]")}><span><LocalizedText message={String(label)} /></span><span className="font-extrabold">{value}</span></div>)}</Card></CardGrid></div>;
}

function Audit() {
  return <div><SectionHeading icon={<History className="size-4" />} title="Audit & workflow" description="Validation, approval, posting and delivery history." /><div className="p-4"><div className="relative ml-3 border-l border-[var(--border)] pl-6">{[
    ["Invoice draft updated", "Prakash Mathew changed 3 line items", "02 Sep 2026 • 16:42", "success"],
    ["Tax validation completed", "UAE VAT rules passed with no exceptions", "02 Sep 2026 • 16:40", "success"],
    ["Credit review warning", "Customer exposure exceeds soft threshold", "02 Sep 2026 • 16:38", "warning"],
    ["Invoice created", "Created from contract CTR-ENT-00412", "02 Sep 2026 • 16:31", "info"],
  ].map(([title, detail, time, tone]) => <div key={title} className="relative pb-6 last:pb-0"><span className={cn("absolute -left-[31px] top-0 flex size-3 rounded-full border-2 border-[var(--surface)]", tone === "success" ? "bg-[var(--success)]" : tone === "warning" ? "bg-[var(--warning)]" : "bg-[var(--info)]")} /><div className="text-[length:calc(10.5px*var(--fs-scale))] font-extrabold"><LocalizedText message={title} /></div><div className="mt-1 text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]"><LocalizedText message={detail}/></div><div className="mt-1 text-[length:calc(8px*var(--fs-scale))] font-semibold text-[var(--text-subtle)]">{time}</div></div>)}</div></div></div>;
}

function InvoicePrint({ open, onClose, lines, subtotal, discount, tax, total, format, fields }: { open: boolean; onClose: () => void; lines: LineItem[]; subtotal: number; discount: number; tax: number; total: number; format: Formatters; fields: BillingValues["fields"] }) {
  const field = (key: string) => String(fields[key] ?? "");
  return <Modal open={open} onClose={onClose} title="ui.tax.invoice.preview.bb224ea0" subtitle="ui.print.ready.customer.document.5cf532ca" size="xl" footer={<><Button variant="ghost" onClick={onClose}><LocalizedText message="ui.close.7d9eb7ac" /></Button><Button variant="secondary" leftIcon={<Download className="size-3.5" />} onClick={() => window.print()}><LocalizedText message="Save as PDF" /></Button><Button variant="primary" leftIcon={<Printer className="size-3.5" />} onClick={() => window.print()}><LocalizedText message="ui.print.invoice.c1f0d9fa" /></Button></>}><div className="bg-[#eef1f5] p-6 print:bg-white print:p-0"><article data-invoice-print className="mx-auto max-w-4xl rounded-md bg-white p-9 text-slate-900 shadow-xl print:shadow-none"><header className="flex justify-between border-b-2 border-slate-900 pb-6"><div><div className="text-2xl font-black tracking-[-.04em]">NEXORA ONE</div><div className="mt-1 text-[length:calc(10px*var(--fs-scale))] font-bold uppercase tracking-[.18em] text-slate-500">Enterprise Solutions LLC</div><div className="mt-4 text-[length:calc(10px*var(--fs-scale))] leading-relaxed text-slate-600">Al Maryah Island, Abu Dhabi, UAE<br />TRN 100392840100003</div></div><div className="text-right"><div className="text-[length:calc(11px*var(--fs-scale))] font-black uppercase tracking-[.18em] text-slate-500"><LocalizedText message="ui.tax.invoice.e6876b32" /></div><div className="mt-2 text-xl font-black">{field("Invoice number")}</div><div className="mt-3 text-[length:calc(10px*var(--fs-scale))] leading-relaxed text-slate-600"><LocalizedText message="ui.invoice.date.622cf73f" />{format.date(field("Invoice date"))}<br /><LocalizedText message="ui.due.date.9cd51441" />{format.date(field("Due date"))}<br /><LocalizedText message="ui.currency.9fc8cc2a" />{field("Currency")}</div></div></header><section className="grid grid-cols-2 gap-8 py-6"><div><div className="text-[length:calc(9px*var(--fs-scale))] font-black uppercase tracking-[.12em] text-slate-400"><LocalizedText message="ui.bill.to.9ec78118" /></div><div className="mt-2 text-sm font-black">{field("Customer") === "atlas" ? "Atlas Horizon LLC" : "Bluecrest Retail"}</div><div className="mt-1 text-[length:calc(10px*var(--fs-scale))] leading-relaxed text-slate-600">{field("Billing address")}<br />TRN 100384720100003</div></div><div><div className="text-[length:calc(9px*var(--fs-scale))] font-black uppercase tracking-[.12em] text-slate-400"><LocalizedText message="ui.references.69824d3b" /></div><div className="mt-2 text-[length:calc(10px*var(--fs-scale))] leading-relaxed text-slate-600"><LocalizedText message="ui.po.9b83faea" />{field("Purchase order reference")}<br /><LocalizedText message="ui.contract.9a9c244e" />{field("Contract reference")}<br /><LocalizedText message="ui.payment.terms.net.d96f2d95" />{field("Payment terms")}</div></div></section><Table className="w-full border-collapse text-left"><TableHeader><TableRow className="border-y border-slate-300 bg-slate-50">{["Description", "Qty", "Rate", "Disc.", "Tax", "Total"].map((h) => <TableHead key={h} className="px-3 py-2 text-[length:calc(9px*var(--fs-scale))] font-black uppercase text-slate-500"><LocalizedText message={h} /></TableHead>)}</TableRow></TableHeader><TableBody>{lines.map((line) => { const base = line.quantity * line.unitPrice * (1 - line.discount / 100); return <TableRow key={line.id} className="border-b border-slate-200"><TableCell className="px-3 py-3"><div className="text-[length:calc(10px*var(--fs-scale))] font-bold">{line.description}</div><div className="mt-0.5 text-[length:calc(8px*var(--fs-scale))] text-slate-400">{line.code}</div></TableCell><TableCell className="px-3 py-3 text-[length:calc(10px*var(--fs-scale))]">{format.number(line.quantity)}</TableCell><TableCell className="px-3 py-3 text-[length:calc(10px*var(--fs-scale))]">{format.money(line.unitPrice)}</TableCell><TableCell className="px-3 py-3 text-[length:calc(10px*var(--fs-scale))]">{format.percent(line.discount)}</TableCell><TableCell className="px-3 py-3 text-[length:calc(10px*var(--fs-scale))]">{format.percent(line.taxRate)}</TableCell><TableCell className="px-3 py-3 text-[length:calc(10px*var(--fs-scale))] font-bold">{format.money(base * (1 + line.taxRate / 100))}</TableCell></TableRow>; })}</TableBody></Table><section className="ml-auto mt-6 w-72">{[["Subtotal", subtotal], ["Discount", -discount], ["VAT", tax]].map(([label, value]) => <div key={String(label)} className="flex justify-between border-b border-slate-200 py-2 text-[length:calc(10px*var(--fs-scale))]"><span><LocalizedText message={String(label)} /></span><span className="font-bold">{format.money(Number(value))}</span></div>)}<div className="flex justify-between border-b-2 border-slate-900 py-3 text-sm font-black"><span><LocalizedText message="ui.total.c9b3c382" /></span><span>{format.money(total)}</span></div></section><footer className="mt-10 grid grid-cols-2 gap-10 border-t border-slate-300 pt-5 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-slate-500"><div><b className="text-slate-700"><LocalizedText message="ui.payment.instructions.403c5a8d" /></b><br />Bank: Nexora Commercial Bank<br />IBAN: AE00 0000 0000 0000 0000 000</div><div><b className="text-slate-700"><LocalizedText message="ui.tax.note.0f0ab65f" /></b><br /><LocalizedText message="ui.this.document.is.a.tax.invoice.issued.under.uae.vat.rule.fc5e9d6b" /></div></footer></article></div></Modal>;
}

export function BillingPage(props: { page: PageDefinition; target?: NavigationTarget }) {
  return <BillingEditor key={`${props.page.id}:${props.target?.recordId ?? "INV-26-005184"}`} {...props} />;
}
function BillingEditor({ page, target }: { page: PageDefinition; target?: NavigationTarget }) {
  const { preferences, updatePreference, toast, t, format: baseFormat } = useERP();
  const [activeTab, setActiveTab] = useState("billing");
  const record = useRecordEditor<BillingValues>(`billing:${page.id}:${target?.recordId ?? "INV-26-005184"}`, { ...INITIAL_BILLING, fields: { ...INITIAL_BILLING.fields, "Invoice number": target?.recordId ?? "INV-26-005184" } });
  const [lines, setLines] = useRecordField(record.editor, "lines");
  const [printOpen, setPrintOpen] = useState(false);
  const format = useMemo(() => createFormatters({...DEFAULT_PREFERENCES,...preferences,currencyCode:String(record.values.fields.Currency || "AED") as CurrencyCode}), [preferences,record.values.fields.Currency]);

  usePublishAiSources(`billing:${page.id}`, {
    "form-values": { customer: record.values.fields.Customer, reference: record.values.fields["Purchase order reference"], terms: record.values.fields["Payment terms"], jurisdiction: record.values.fields["Tax jurisdiction"] },
  });
  const save = async () => {
    if (!lines.length || lines.some(line => !line.code.trim() || !line.description.trim() || !Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.unitPrice) || line.unitPrice < 0 || !Number.isFinite(line.discount) || line.discount < 0 || line.discount > 100 || ![0, 5, 15].includes(line.taxRate))) {
      toast({ title: "Check line items", message: "Provide item codes, descriptions, positive quantities and valid prices, discounts and tax rates.", type: "warning" }); return;
    }
    if (!record.values.fields["Invoice date"] || !record.values.fields["Due date"]) {
      toast({ title: "Dates required", message: "Enter the invoice and due dates.", type: "warning" }); return;
    }
    if (await record.editor.save()) toast({ title: "Invoice saved", message: "The record service confirmed the save. Posting is a separate workflow.", type: "success" });
  };
  const totals = useMemo(() => {
    const raw = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    const discount = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (line.discount / 100), 0);
    const taxable = raw - discount;
    const tax = lines.reduce((sum, line) => { const base = line.quantity * line.unitPrice * (1 - line.discount / 100); return sum + base * line.taxRate / 100; }, 0);
    return { subtotal: raw, discount, taxable, tax, total: taxable + tax };
  }, [lines]);

  const sections: Record<string, React.ReactNode> = {
    billing: <BillingDetails />,
    customer: <CustomerDetails />,
    tax: <TaxDetails />,
    lines: <LineItems lines={lines} setLines={setLines} format={format} />,
    payments: <Payments />,
    audit: <Audit />,
  };
  const layoutOptions: Array<{ value: BillingLayout; label: string }> = [{ value: "workspace", label: "Tabbed workspace" }, { value: "vertical", label: "Vertical document" }, { value: "split", label: "Split entry" }];

  return (
    <BillingContext.Provider value={record.editor}><div className="flex w-full flex-col gap-3">
      <Card className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2"><StatusBadge value="Draft" /><span className="text-[length:calc(10.5px*var(--fs-scale))] font-black">INV-26-005184</span><span className="h-4 w-px bg-[var(--border)]" /><span className="text-[length:calc(9px*var(--fs-scale))] font-semibold text-[var(--text-muted)]">Atlas Horizon LLC</span><Badge tone="warning"><LocalizedText message="ui.credit.review.00e24d04" /></Badge><Badge tone="success"><BadgeCheck className="size-3" /><LocalizedText message="ui.tax.validated.78e6c997" /></Badge></div>
        <div className="flex flex-wrap items-center gap-1.5"><InlineAiAction useCaseId="form.draft-note" label="Draft note" /><Select aria-label="ui.billing.layout.13fe7207" className="w-44" value={preferences.billingLayout} options={layoutOptions} placeholder="" onChange={(event) => updatePreference("billingLayout", event.target.value as BillingLayout)} /><Button variant="ghost" leftIcon={<FileCheck2 className="size-3.5" />} disabled title="ui.tax.credit.and.posting.checks.require.a.connected.busine.99159296"><LocalizedText message="ui.validate.40611abb" /></Button><Button variant="secondary" leftIcon={<Printer className="size-3.5" />} onClick={() => setPrintOpen(true)}><LocalizedText message="ui.print.df0fe798" /></Button><Button variant="secondary" leftIcon={<Save className="size-3.5" />} disabled={record.busy || record.loading} onClick={() => void record.editor.saveDraft()}><LocalizedText message="ui.save.draft.3de10010" /></Button><Button variant="primary" leftIcon={<CheckCircle2 className="size-3.5" />} disabled title="ui.connect.a.posting.workflow.to.enable.this.action.91fc6f60"><LocalizedText message="ui.post.invoice.fc1694d2" /></Button><ActionMenu trigger={<IconButton label="ui.more.invoice.actions.bd5e1cab"><MoreHorizontal className="size-4" /></IconButton>}>{(close) => <><MenuButton icon={<Copy className="size-3.5" />} label="Duplicate invoice" onClick={close} /><MenuButton icon={<FileText className="size-3.5" />} label="Create credit note" onClick={close} /><MenuButton icon={<Banknote className="size-3.5" />} label="Record payment" onClick={close} /></>}</ActionMenu></div>
      </Card>

      <RecordSaveStatus editor={record.editor} />
      <div className="flex gap-2"><Button disabled={!record.ready || record.loading || record.busy || !!record.error || !!record.recovery} onClick={() => void save()}><LocalizedText message="ui.save.invoice.b2c532bf" /></Button><Button disabled={!record.ready || record.loading || record.busy || !record.dirty} onClick={() => void record.editor.discard()}><LocalizedText message="ui.discard.invoice.changes.30963b6b" /></Button></div>
      <fieldset disabled={!record.ready || record.loading || !!record.recovery} className="min-w-0 border-0 p-0">
      <div className={cn("grid min-h-[610px] gap-3", preferences.billingLayout === "split" ? "xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.65fr)]" : "xl:grid-cols-[minmax(0,1fr)_310px]")}>
        <Card data-tour="bill-tabs" className="min-w-0 overflow-hidden">
          {preferences.billingLayout === "workspace" ? <><Tabs items={billingTabs.map(tab => tab.id === "lines" ? { ...tab, badge: lines.length } : tab)} value={activeTab} onChange={setActiveTab} className="px-2 pt-1" /><div className="min-h-[540px]">{sections[activeTab]}</div></> : preferences.billingLayout === "vertical" ? <div className="divide-y divide-[var(--border)]">{billingTabs.slice(0, 5).map((tab) => <section key={tab.id}>{sections[tab.id]}</section>)}</div> : <><Tabs items={billingTabs.map(tab => tab.id === "lines" ? { ...tab, badge: lines.length } : tab)} value={activeTab} onChange={setActiveTab} className="px-2 pt-1" /><div className="min-h-[540px]">{activeTab === "lines" ? sections.lines : activeTab === "payments" ? sections.payments : <div className="grid divide-y divide-[var(--border)]">{sections.billing}{sections.customer}{sections.tax}</div>}</div></>}
        </Card>

        <div className="space-y-3">
          <Card data-tour="bill-summary" className="overflow-hidden"><div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><CircleDollarSign className="size-4" /></span><div><div className="text-[length:calc(11px*var(--fs-scale))] font-black"><LocalizedText message="ui.invoice.summary.f420ef33" /></div><div className="text-[length:calc(8.5px*var(--fs-scale))] text-[var(--text-muted)]">{lines.length}<LocalizedText message="ui.line.items.a742dc2d" />{String(record.values.fields.Currency)}</div></div></div></div><div className="p-4">{[["Gross subtotal", totals.subtotal], ["Line discounts", -totals.discount], ["Taxable amount", totals.taxable], ["VAT", totals.tax]].map(([label, value]) => <div key={String(label)} className="flex items-center justify-between border-b border-[var(--border)] py-2.5 text-[length:calc(9.5px*var(--fs-scale))]"><span className="text-[var(--text-muted)]"><LocalizedText message={String(label)} /></span><span className="font-extrabold tabular-nums">{format.money(Number(value))}</span></div>)}<div className="mt-3 rounded-xl bg-[var(--primary-fill)] p-3 text-white"><div className="text-[length:calc(8.5px*var(--fs-scale))] font-bold uppercase tracking-[.1em] opacity-75"><LocalizedText message="ui.invoice.total.ad80ed79" /></div><div className="mt-1 text-[length:calc(22px*var(--fs-scale))] font-black tracking-[-.04em]">{format.money(totals.total)}</div><div className="mt-2 flex justify-between text-[length:calc(8.5px*var(--fs-scale))] opacity-80"><span><LocalizedText message="ui.balance.after.payments.765e3dbc" /></span><span className="font-bold">{format.money(Math.max(0, totals.total - 35000))}</span></div></div></div></Card>
          <Card className="p-3.5"><div className="text-[length:calc(9px*var(--fs-scale))] font-black uppercase tracking-[.1em] text-[var(--text-subtle)]"><LocalizedText message="ui.validation.status.d7b6a8ce" /></div><div className="mt-3 space-y-2">{[
            ["Required fields", "Checked on save", "neutral"], ["Tax calculation", "Preview", "neutral"], ["Credit control", "Not checked", "warning"], ["Duplicate check", "Not checked", "warning"], ["Posting period", "Not checked", "warning"],
          ].map(([label, value, tone]) => <div key={label} className="flex items-center justify-between text-[length:calc(9.5px*var(--fs-scale))]"><span className="text-[var(--text-muted)]"><LocalizedText message={String(label)} /></span><Badge tone={tone as "success" | "warning"}>{value}</Badge></div>)}</div></Card>
          <Card className="p-3.5"><div className="text-[length:calc(9px*var(--fs-scale))] font-black uppercase tracking-[.1em] text-[var(--text-subtle)]"><LocalizedText message="ui.quick.actions.1810407f" /></div><div className="mt-2 grid grid-cols-2 gap-2">{[[Printer, "Print"], [Download, "Export"], [Banknote, "Payment"], [ReceiptText, "Credit note"]].map(([Icon, label]) => { const Component = Icon as React.ElementType; return <button key={String(label)} type="button" onClick={() => label === "Print" ? setPrintOpen(true) : toast({ title: t("{action} action", {action:t(String(label))}), message: "The selected mock action was started.", type: "info" })} className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[length:calc(9px*var(--fs-scale))] font-bold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"><Component className="size-4" /><LocalizedText message={String(label)} /></button>; })}</div></Card>
        </div>
      </div>
      </fieldset>
      <InvoicePrint fields={record.values.fields} open={printOpen} onClose={() => setPrintOpen(false)} lines={lines} {...totals} format={format} />
    </div></BillingContext.Provider>
  );
}
