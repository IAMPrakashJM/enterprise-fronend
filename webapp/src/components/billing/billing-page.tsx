"use client";

import React, { useMemo, useState } from "react";
import { BadgeCheck, Banknote, Calculator, CheckCircle2, ChevronDown, CircleDollarSign, Copy, Download, FileCheck2, FileText, History, MoreHorizontal, Plus, Printer, ReceiptText, Save, ScanLine, ShieldCheck, Trash2, UserRound, WalletCards } from "lucide-react";
import { useERP } from "@/context/erp-context";
import { Button, IconButton } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input, MultiSelect, Select, Textarea, Toggle } from "@/components/ui/form-controls";
import { Tabs } from "@/components/ui/tabs";
import { ActionMenu, MenuButton } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/overlay";
import { cn, formatCurrency } from "@/lib/cn";
import type { BillingLayout, PageDefinition } from "@/types";

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
  return <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3"><div className="flex items-start gap-2.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">{icon}</span><div><h3 className="text-[12px] font-black">{title}</h3><p className="mt-0.5 text-[9px] text-[var(--text-muted)]">{description}</p></div></div>{action}</div>;
}

function BillingDetails() {
  return <div><SectionHeading icon={<ReceiptText className="size-4" />} title="Billing details" description="Document identity, dates, currency, ownership and commercial references." /><div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"><Input label="Invoice number" value="INV-26-005184" disabled /><Input label="Invoice date" type="date" defaultValue="2026-09-02" required /><Input label="Due date" type="date" defaultValue="2026-10-02" required /><Select label="Branch" value="hq" options={[{ label: "Abu Dhabi • Head Office", value: "hq" }, { label: "Dubai • Business Center", value: "dubai" }]} onChange={() => undefined} /><Select label="Currency" value="AED" options={[{ label: "AED • UAE Dirham", value: "AED" }, { label: "USD • US Dollar", value: "USD" }, { label: "INR • Indian Rupee", value: "INR" }]} onChange={() => undefined} /><Input label="Exchange rate" type="number" defaultValue="1.000000" suffix="AED" /><Input label="Purchase order reference" defaultValue="PO-AHL-2026-0118" /><Input label="Contract reference" defaultValue="CTR-ENT-00412" /><Select label="Account manager" value="maya" options={[{ label: "Maya Thomas", value: "maya" }, { label: "Ibrahim Noor", value: "ibrahim" }]} onChange={() => undefined} /><Textarea className="md:col-span-2 xl:col-span-3" label="Invoice remarks" defaultValue="Annual enterprise subscription, implementation and support services for the 2026–2027 contract period." /></div></div>;
}

function CustomerDetails() {
  return <div><SectionHeading icon={<UserRound className="size-4" />} title="Customer details" description="Bill-to party, contact, delivery and credit profile." action={<Button size="xs" variant="outline">Open customer master</Button>} /><div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"><Select className="md:col-span-2" label="Customer" value="atlas" options={[{ label: "CUS-02401 • Atlas Horizon LLC", value: "atlas" }, { label: "CUS-02402 • Bluecrest Retail", value: "bluecrest" }]} onChange={() => undefined} /><Input label="Tax registration number" value="100384720100003" disabled /><Input label="Primary contact" value="Aisha Rahman" /><Input label="Email" value="accounts@atlashorizon.example" /><Input label="Phone" value="+971 2 555 0184" /><Select label="Payment terms" value="30" options={[{ label: "Net 30", value: "30" }, { label: "Net 60", value: "60" }, { label: "Due immediately", value: "0" }]} onChange={() => undefined} /><Input label="Credit limit" value="500,000" prefix="AED" disabled /><Input label="Current exposure" value="184,200" prefix="AED" disabled /><Textarea className="md:col-span-2 xl:col-span-3" label="Billing address" value="Level 18, Horizon Tower, Al Maryah Island, Abu Dhabi, United Arab Emirates" readOnly /></div></div>;
}

function TaxDetails() {
  return <div><SectionHeading icon={<ShieldCheck className="size-4" />} title="Contract, insurance & tax" description="Payer allocation, policy references, jurisdiction and tax treatment." /><div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"><Select label="Payer arrangement" value="customer" options={[{ label: "Direct customer billing", value: "customer" }, { label: "Insurance / third party", value: "insurance" }, { label: "Split payer", value: "split" }]} onChange={() => undefined} /><Select label="Tax jurisdiction" value="uae" options={[{ label: "UAE Federal VAT", value: "uae" }, { label: "Export • Zero rated", value: "export" }, { label: "Saudi VAT", value: "ksa" }]} onChange={() => undefined} /><Select label="Tax treatment" value="standard" options={[{ label: "Standard rated 5%", value: "standard" }, { label: "Zero rated", value: "zero" }, { label: "Exempt", value: "exempt" }]} onChange={() => undefined} /><Input label="Policy / coverage number" placeholder="Optional third-party coverage" /><Input label="Authorization reference" placeholder="Pre-approval or authorization" /><Input label="Claim / external reference" placeholder="External billing reference" /><MultiSelect className="md:col-span-2" label="Tax evidence" value={["trn", "contract"]} onChange={() => undefined} options={[{ label: "Tax registration verified", value: "trn" }, { label: "Signed contract", value: "contract" }, { label: "Export evidence", value: "export" }, { label: "Exemption certificate", value: "exempt" }]} /><Toggle label="Reverse charge applies" checked={false} onChange={() => undefined} /><Toggle label="Electronic tax invoice" checked={true} onChange={() => undefined} /><Toggle label="Validate tax at posting" checked={true} onChange={() => undefined} /></div></div>;
}

function LineItems({ lines, setLines }: { lines: LineItem[]; setLines: React.Dispatch<React.SetStateAction<LineItem[]>> }) {
  const update = (id: number, key: keyof LineItem, value: string | number) => setLines((previous) => previous.map((line) => line.id === id ? { ...line, [key]: typeof line[key] === "number" ? Number(value) : value } : line));
  return <div><SectionHeading icon={<Calculator className="size-4" />} title="Line items" description="Products, services, quantities, rates, discounts and line-level tax." action={<div className="flex gap-1.5"><Button size="xs" variant="outline" leftIcon={<ScanLine className="size-3" />}>Scan / lookup</Button><Button size="xs" variant="primary" leftIcon={<Plus className="size-3" />} onClick={() => setLines((previous) => [...previous, { id: Date.now(), code: "", description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 5 }])}>Add line</Button></div>} /><div className="nex-scrollbar overflow-x-auto"><table className="w-full min-w-[960px] border-collapse text-left"><thead><tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">{["#", "Item / service", "Description", "Qty", "Unit price", "Discount %", "Tax %", "Line total", ""].map((heading) => <th key={heading} className="px-3 py-2 text-[8.5px] font-black uppercase tracking-[.08em] text-[var(--text-subtle)]">{heading}</th>)}</tr></thead><tbody>{lines.map((line, index) => { const base = line.quantity * line.unitPrice * (1 - line.discount / 100); const total = base * (1 + line.taxRate / 100); return <tr key={line.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]"><td className="px-3 py-2 text-[9px] font-bold text-[var(--text-subtle)]">{index + 1}</td><td className="w-44 px-2 py-2"><Input value={line.code} placeholder="Item code" onChange={(event) => update(line.id, "code", event.target.value)} /></td><td className="min-w-64 px-2 py-2"><Input value={line.description} placeholder="Description" onChange={(event) => update(line.id, "description", event.target.value)} /></td><td className="w-20 px-2 py-2"><Input type="number" min={0} value={line.quantity} onChange={(event) => update(line.id, "quantity", event.target.value)} /></td><td className="w-32 px-2 py-2"><Input type="number" min={0} value={line.unitPrice} onChange={(event) => update(line.id, "unitPrice", event.target.value)} /></td><td className="w-24 px-2 py-2"><Input type="number" min={0} max={100} value={line.discount} onChange={(event) => update(line.id, "discount", event.target.value)} /></td><td className="w-24 px-2 py-2"><Select value={String(line.taxRate)} options={[{ label: "0%", value: "0" }, { label: "5%", value: "5" }, { label: "15%", value: "15" }]} onChange={(event) => update(line.id, "taxRate", event.target.value)} /></td><td className="whitespace-nowrap px-3 py-2 text-[10px] font-black tabular-nums">{formatCurrency(total)}</td><td className="px-2 py-2"><IconButton label="Delete line" className="size-7 text-[var(--danger)]" onClick={() => setLines((previous) => previous.filter((item) => item.id !== line.id))}><Trash2 className="size-3.5" /></IconButton></td></tr>; })}</tbody></table></div></div>;
}

function Payments() {
  return <div><SectionHeading icon={<WalletCards className="size-4" />} title="Payments & allocations" description="Receipts, deposits, credit applications and outstanding balance." action={<Button size="xs" variant="primary" leftIcon={<Plus className="size-3" />}>Add payment</Button>} /><div className="grid gap-4 p-4 xl:grid-cols-[1.2fr_.8fr]"><div className="overflow-hidden rounded-xl border border-[var(--border)]"><table className="w-full text-left"><thead><tr className="bg-[var(--surface-2)]">{["Receipt", "Method", "Date", "Reference", "Amount", "Status"].map((h) => <th key={h} className="px-3 py-2 text-[8px] font-black uppercase text-[var(--text-subtle)]">{h}</th>)}</tr></thead><tbody>{[
    ["RCT-26-00841", "Bank transfer", "2026-08-28", "AHL-TRF-8841", "AED 25,000", "Cleared"],
    ["DEP-26-00174", "Customer deposit", "2026-07-15", "CTR-ENT-00412", "AED 10,000", "Applied"],
  ].map((row) => <tr key={row[0]} className="border-t border-[var(--border)]">{row.map((value, index) => <td key={value} className="px-3 py-3 text-[9.5px] font-semibold text-[var(--text-muted)]">{index === 5 ? <StatusBadge value={value} /> : value}</td>)}</tr>)}</tbody></table></div><div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4"><div className="text-[9px] font-black uppercase tracking-[.1em] text-[var(--text-subtle)]">Allocation summary</div>{[["Invoice total", "AED 73,164"], ["Payments applied", "AED 35,000"], ["Credit notes", "AED 0"], ["Balance due", "AED 38,164"]].map(([label, value], index) => <div key={label} className={cn("flex justify-between border-b border-[var(--border)] py-2.5 text-[10px]", index === 3 && "border-0 text-[12px] font-black text-[var(--primary)]")}><span>{label}</span><span className="font-extrabold">{value}</span></div>)}</div></div></div>;
}

function Audit() {
  return <div><SectionHeading icon={<History className="size-4" />} title="Audit & workflow" description="Validation, approval, posting and delivery history." /><div className="p-4"><div className="relative ml-3 border-l border-[var(--border)] pl-6">{[
    ["Invoice draft updated", "Prakash Mathew changed 3 line items", "02 Sep 2026 • 16:42", "success"],
    ["Tax validation completed", "UAE VAT rules passed with no exceptions", "02 Sep 2026 • 16:40", "success"],
    ["Credit review warning", "Customer exposure exceeds soft threshold", "02 Sep 2026 • 16:38", "warning"],
    ["Invoice created", "Created from contract CTR-ENT-00412", "02 Sep 2026 • 16:31", "info"],
  ].map(([title, detail, time, tone]) => <div key={title} className="relative pb-6 last:pb-0"><span className={cn("absolute -left-[31px] top-0 flex size-3 rounded-full border-2 border-[var(--surface)]", tone === "success" ? "bg-[var(--success)]" : tone === "warning" ? "bg-[var(--warning)]" : "bg-[var(--info)]")} /><div className="text-[10.5px] font-extrabold">{title}</div><div className="mt-1 text-[9px] text-[var(--text-muted)]">{detail}</div><div className="mt-1 text-[8px] font-semibold text-[var(--text-subtle)]">{time}</div></div>)}</div></div></div>;
}

function InvoicePrint({ open, onClose, lines, subtotal, discount, tax, total }: { open: boolean; onClose: () => void; lines: LineItem[]; subtotal: number; discount: number; tax: number; total: number }) {
  return <Modal open={open} onClose={onClose} title="Tax invoice preview" subtitle="Print-ready customer document" size="xl" footer={<><Button variant="ghost" onClick={onClose}>Close</Button><Button variant="secondary" leftIcon={<Download className="size-3.5" />}>Download PDF</Button><Button variant="primary" leftIcon={<Printer className="size-3.5" />} onClick={() => window.print()}>Print invoice</Button></>}><div className="bg-[#eef1f5] p-6 print:bg-white print:p-0"><article className="mx-auto max-w-4xl rounded-md bg-white p-9 text-slate-900 shadow-xl print:shadow-none"><header className="flex justify-between border-b-2 border-slate-900 pb-6"><div><div className="text-2xl font-black tracking-[-.04em]">NEXORA ONE</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Enterprise Solutions LLC</div><div className="mt-4 text-[10px] leading-relaxed text-slate-600">Al Maryah Island, Abu Dhabi, UAE<br />TRN 100392840100003</div></div><div className="text-right"><div className="text-[11px] font-black uppercase tracking-[.18em] text-slate-500">Tax Invoice</div><div className="mt-2 text-xl font-black">INV-26-005184</div><div className="mt-3 text-[10px] leading-relaxed text-slate-600">Invoice date: 02 Sep 2026<br />Due date: 02 Oct 2026<br />Currency: AED</div></div></header><section className="grid grid-cols-2 gap-8 py-6"><div><div className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">Bill to</div><div className="mt-2 text-sm font-black">Atlas Horizon LLC</div><div className="mt-1 text-[10px] leading-relaxed text-slate-600">Level 18, Horizon Tower<br />Al Maryah Island, Abu Dhabi, UAE<br />TRN 100384720100003</div></div><div><div className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">References</div><div className="mt-2 text-[10px] leading-relaxed text-slate-600">PO: PO-AHL-2026-0118<br />Contract: CTR-ENT-00412<br />Payment terms: Net 30</div></div></section><table className="w-full border-collapse text-left"><thead><tr className="border-y border-slate-300 bg-slate-50">{["Description", "Qty", "Rate", "Disc.", "Tax", "Total"].map((h) => <th key={h} className="px-3 py-2 text-[9px] font-black uppercase text-slate-500">{h}</th>)}</tr></thead><tbody>{lines.map((line) => { const base = line.quantity * line.unitPrice * (1 - line.discount / 100); return <tr key={line.id} className="border-b border-slate-200"><td className="px-3 py-3"><div className="text-[10px] font-bold">{line.description}</div><div className="mt-0.5 text-[8px] text-slate-400">{line.code}</div></td><td className="px-3 py-3 text-[10px]">{line.quantity}</td><td className="px-3 py-3 text-[10px]">{line.unitPrice.toFixed(2)}</td><td className="px-3 py-3 text-[10px]">{line.discount}%</td><td className="px-3 py-3 text-[10px]">{line.taxRate}%</td><td className="px-3 py-3 text-[10px] font-bold">{formatCurrency(base * (1 + line.taxRate / 100)).replace("AED", "")}</td></tr>; })}</tbody></table><section className="ml-auto mt-6 w-72">{[["Subtotal", subtotal], ["Discount", -discount], ["VAT", tax]].map(([label, value]) => <div key={String(label)} className="flex justify-between border-b border-slate-200 py-2 text-[10px]"><span>{label}</span><span className="font-bold">AED {Number(value).toFixed(2)}</span></div>)}<div className="flex justify-between border-b-2 border-slate-900 py-3 text-sm font-black"><span>Total</span><span>AED {total.toFixed(2)}</span></div></section><footer className="mt-10 grid grid-cols-2 gap-10 border-t border-slate-300 pt-5 text-[9px] leading-relaxed text-slate-500"><div><b className="text-slate-700">Payment instructions</b><br />Bank: Nexora Commercial Bank<br />IBAN: AE00 0000 0000 0000 0000 000</div><div><b className="text-slate-700">Tax note</b><br />This document is a tax invoice issued under UAE VAT rules. Values are expressed in AED.</div></footer></article></div></Modal>;
}

export function BillingPage({ page }: { page: PageDefinition }) {
  const { preferences, updatePreference, toast } = useERP();
  const [activeTab, setActiveTab] = useState("billing");
  const [lines, setLines] = useState(INITIAL_LINES);
  const [printOpen, setPrintOpen] = useState(false);
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
    lines: <LineItems lines={lines} setLines={setLines} />,
    payments: <Payments />,
    audit: <Audit />,
  };
  const layoutOptions: Array<{ value: BillingLayout; label: string }> = [{ value: "workspace", label: "Tabbed workspace" }, { value: "vertical", label: "Vertical document" }, { value: "split", label: "Split entry" }];

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center gap-2"><StatusBadge value="Draft" /><span className="text-[10.5px] font-black">INV-26-005184</span><span className="h-4 w-px bg-[var(--border)]" /><span className="text-[9px] font-semibold text-[var(--text-muted)]">Atlas Horizon LLC</span><Badge tone="warning">Credit review</Badge><Badge tone="success"><BadgeCheck className="size-3" />Tax validated</Badge></div>
        <div className="flex flex-wrap items-center gap-1.5"><Select aria-label="Billing layout" className="w-44" value={preferences.billingLayout} options={layoutOptions} placeholder="" onChange={(event) => updatePreference("billingLayout", event.target.value as BillingLayout)} /><Button variant="ghost" leftIcon={<FileCheck2 className="size-3.5" />} onClick={() => toast({ title: "Invoice validated", message: "Tax, credit and required field checks passed with one advisory.", type: "success" })}>Validate</Button><Button variant="secondary" leftIcon={<Printer className="size-3.5" />} onClick={() => setPrintOpen(true)}>Print</Button><Button variant="secondary" leftIcon={<Save className="size-3.5" />} onClick={() => toast({ title: "Draft saved", message: "Invoice changes were saved to the mock workspace.", type: "success" })}>Save draft</Button><Button variant="primary" leftIcon={<CheckCircle2 className="size-3.5" />} onClick={() => toast({ title: "Invoice posted", message: "INV-26-005184 was posted to the ledger and delivery queue.", type: "success" })}>Post invoice</Button><ActionMenu trigger={<IconButton label="More invoice actions"><MoreHorizontal className="size-4" /></IconButton>}>{(close) => <><MenuButton icon={<Copy className="size-3.5" />} label="Duplicate invoice" onClick={close} /><MenuButton icon={<FileText className="size-3.5" />} label="Create credit note" onClick={close} /><MenuButton icon={<Banknote className="size-3.5" />} label="Record payment" onClick={close} /></>}</ActionMenu></div>
      </div>

      <div className={cn("grid min-h-[610px] gap-3", preferences.billingLayout === "split" ? "xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.65fr)]" : "xl:grid-cols-[minmax(0,1fr)_310px]")}>
        <Card className="min-w-0 overflow-hidden">
          {preferences.billingLayout === "workspace" ? <><Tabs items={billingTabs} value={activeTab} onChange={setActiveTab} className="px-2 pt-1" /><div className="min-h-[540px]">{sections[activeTab]}</div></> : preferences.billingLayout === "vertical" ? <div className="divide-y divide-[var(--border)]">{billingTabs.slice(0, 5).map((tab) => <section key={tab.id}>{sections[tab.id]}</section>)}</div> : <><Tabs items={billingTabs} value={activeTab} onChange={setActiveTab} className="px-2 pt-1" /><div className="min-h-[540px]">{activeTab === "lines" ? sections.lines : activeTab === "payments" ? sections.payments : <div className="grid divide-y divide-[var(--border)]">{sections.billing}{sections.customer}{sections.tax}</div>}</div></>}
        </Card>

        <div className="space-y-3">
          <Card className="overflow-hidden"><div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><CircleDollarSign className="size-4" /></span><div><div className="text-[11px] font-black">Invoice summary</div><div className="text-[8.5px] text-[var(--text-muted)]">{lines.length} line items • AED</div></div></div></div><div className="p-4">{[["Gross subtotal", totals.subtotal], ["Line discounts", -totals.discount], ["Taxable amount", totals.taxable], ["VAT", totals.tax]].map(([label, value]) => <div key={String(label)} className="flex items-center justify-between border-b border-[var(--border)] py-2.5 text-[9.5px]"><span className="text-[var(--text-muted)]">{label}</span><span className="font-extrabold tabular-nums">{formatCurrency(Number(value))}</span></div>)}<div className="mt-3 rounded-xl bg-[var(--primary)] p-3 text-white"><div className="text-[8.5px] font-bold uppercase tracking-[.1em] opacity-75">Invoice total</div><div className="mt-1 text-[22px] font-black tracking-[-.04em]">{formatCurrency(totals.total)}</div><div className="mt-2 flex justify-between text-[8.5px] opacity-80"><span>Balance after payments</span><span className="font-bold">{formatCurrency(Math.max(0, totals.total - 35000))}</span></div></div></div></Card>
          <Card className="p-3.5"><div className="text-[9px] font-black uppercase tracking-[.1em] text-[var(--text-subtle)]">Validation status</div><div className="mt-3 space-y-2">{[
            ["Required fields", "Passed", "success"], ["Tax calculation", "Passed", "success"], ["Credit control", "Advisory", "warning"], ["Duplicate check", "Passed", "success"], ["Posting period", "Open", "success"],
          ].map(([label, value, tone]) => <div key={label} className="flex items-center justify-between text-[9.5px]"><span className="text-[var(--text-muted)]">{label}</span><Badge tone={tone as "success" | "warning"}>{value}</Badge></div>)}</div></Card>
          <Card className="p-3.5"><div className="text-[9px] font-black uppercase tracking-[.1em] text-[var(--text-subtle)]">Quick actions</div><div className="mt-2 grid grid-cols-2 gap-2">{[[Printer, "Print"], [Download, "Export"], [Banknote, "Payment"], [ReceiptText, "Credit note"]].map(([Icon, label]) => { const Component = Icon as React.ElementType; return <button key={String(label)} type="button" onClick={() => label === "Print" ? setPrintOpen(true) : toast({ title: `${label} action`, message: "The selected mock action was started.", type: "info" })} className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[9px] font-bold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"><Component className="size-4" />{String(label)}</button>; })}</div></Card>
        </div>
      </div>
      <InvoicePrint open={printOpen} onClose={() => setPrintOpen(false)} lines={lines} {...totals} />
    </div>
  );
}
