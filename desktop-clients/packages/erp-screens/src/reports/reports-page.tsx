"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarClock, ChevronDown, Clock3, Download, FileSpreadsheet, FileText, Filter, Mail, Play, Printer, RotateCcw, Save, Send, SlidersHorizontal, Sparkles } from "lucide-react";
import { useERP } from "@pepbits/erp-shell";
import { usePublishAiSources } from "@pepbits/ai-client";
import { InlineAiAction } from "@pepbits/ai-ui";
import { Button } from "@pepbits/ops-ui";
import { Badge } from "@pepbits/ops-ui";
import { Card, CardHeader, CardTitle } from "@pepbits/ops-ui";
import { Input, MultiSelect, Select, Toggle } from "@pepbits/ops-ui";
import type { ReferenceResponse } from "@pepbits/ops-ui";
import { authedFetch } from "@pepbits/auth";
import { classificationFor, partitionFilters, type FilterDefinition, type FilterValues } from "@pepbits/erp-config";
import { FilterBar } from "../worklist/filter-bar";
import { Modal } from "@pepbits/ops-ui";
import { cn } from "@pepbits/ops-ui";
import type { Formatters, PageDefinition } from "@pepbits/erp-config";

const reportRows = [
  { dimension: "Abu Dhabi HQ", current: 8424000, previous: 7681000, budget: 8100000, variance: 324000, contribution: 44.8 },
  { dimension: "Dubai Center", current: 6182000, previous: 5940000, budget: 6400000, variance: -218000, contribution: 32.9 },
  { dimension: "Sharjah Hub", current: 3264000, previous: 3096000, budget: 3450000, variance: -186000, contribution: 17.4 },
  { dimension: "Kochi Delivery", current: 918000, previous: 792000, budget: 820000, variance: 98000, contribution: 4.9 },
];

function ReportChart({ values, format }: { values: typeof reportRows; format: Formatters }) {
  const max = Math.max(...values.flatMap((item) => [item.current, item.previous, item.budget]));
  return <div className="nex-scrollbar flex h-64 items-end gap-5 overflow-x-auto px-4 pb-4 pt-7">{values.map((item) => <div key={item.dimension} className="flex min-w-28 flex-1 flex-col items-center"><div className="flex h-48 w-full items-end justify-center gap-1.5"><div className="group relative w-5 rounded-t bg-[color-mix(in_srgb,var(--primary)_42%,transparent)]" style={{ height: `${(item.previous / max) * 100}%` }}><span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[var(--text)] px-1.5 py-0.5 text-[length:calc(8px*var(--fs-scale))] text-[var(--surface)] group-hover:block">{format.money(item.previous)}</span></div><div className="group relative w-5 rounded-t bg-[var(--primary)]" style={{ height: `${(item.current / max) * 100}%` }}><span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[var(--text)] px-1.5 py-0.5 text-[length:calc(8px*var(--fs-scale))] text-[var(--surface)] group-hover:block">{format.money(item.current)}</span></div><div className="group relative w-5 rounded-t border border-dashed border-[var(--accent)] bg-[var(--accent-soft)]" style={{ height: `${(item.budget / max) * 100}%` }}><span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[var(--text)] px-1.5 py-0.5 text-[length:calc(8px*var(--fs-scale))] text-[var(--surface)] group-hover:block">{format.money(item.budget)}</span></div></div><span className="mt-2 max-w-28 truncate text-[length:calc(8.5px*var(--fs-scale))] font-bold text-[var(--text-muted)]">{item.dimension}</span></div>)}</div>;
}

function ScheduleModal({ open, onClose, reportTitle }: { open: boolean; onClose: () => void; reportTitle: string }) {
  const { toast, format } = useERP();
  const [recipients, setRecipients] = useState(["prakash@nexora.example"]);
  return <Modal open={open} onClose={onClose} title="Schedule report delivery" subtitle="Run the report asynchronously and deliver it by email." size="md" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" leftIcon={<Send className="size-3.5" />} onClick={() => { toast({ title: "Report scheduled", message: `${reportTitle} will be delivered to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`, type: "success" }); onClose(); }}>Create schedule</Button></>}><div className="grid gap-4 p-5 md:grid-cols-2"><Input className="md:col-span-2" label="Schedule name" defaultValue={`Monthly ${reportTitle}`} required /><Select label="Frequency" value="monthly" options={[{ label: "Daily", value: "daily" }, { label: "Weekly", value: "weekly" }, { label: "Monthly", value: "monthly" }, { label: "Quarterly", value: "quarterly" }]} onChange={() => undefined} /><Input label="Delivery time" type="time" defaultValue="07:30" /><Input label="Start date" type="date" defaultValue="2026-10-01" /><Select label="Time zone" value="dubai" options={[{ label: "Asia/Dubai (UTC+4)", value: "dubai" }, { label: "Asia/Kolkata (UTC+5:30)", value: "kolkata" }]} onChange={() => undefined} /><MultiSelect className="md:col-span-2" label="Recipients" value={recipients} onChange={setRecipients} options={[{ label: "Prakash Mathew • prakash@nexora.example", value: "prakash@nexora.example" }, { label: "Finance Leadership", value: "finance-leadership@nexora.example" }, { label: "Branch Managers", value: "branch-managers@nexora.example" }]} /><Select label="Output format" value="xlsx" options={[{ label: "Excel workbook", value: "xlsx" }, { label: "PDF", value: "pdf" }, { label: "CSV", value: "csv" }]} onChange={() => undefined} /><Select label="Delivery mode" value="attachment" options={[{ label: "Email attachment", value: "attachment" }, { label: "Secure download link", value: "link" }, { label: "Both", value: "both" }]} onChange={() => undefined} /><Toggle className="md:col-span-2" label="Send only when data exists" description="Skip delivery when the filtered result is empty." checked={true} onChange={() => undefined} /></div></Modal>;
}

export function ReportsPage({ page }: { page: PageDefinition }) {
  const { toast, format } = useERP();
  const [advanced, setAdvanced] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  /* The rows the report is currently showing. The report is the figures, so
     this is the whole of what the page has to offer. */
  usePublishAiSources(`report:${page.id}`, { "page-metrics": reportRows });
  const [running, setRunning] = useState(false);

  /**
   * The same bar the worklist uses.
   *
   * This screen had its own: a strip of filters, a collapsible "Advanced
   * filters" section with the same chevron, and its own idea of which of them
   * could be shared. Two copies of one pattern, and only one of them knew about
   * the classification registry — so a report's filters were offered as a link
   * without anything having decided they could be.
   */
  const [filters, setFilters] = useState<FilterValues>({ view: "summary", from: "2026-09-01", to: "2026-09-30", preset: "mtd", currency: "AED", comparison: "budget", aggregation: "branch" });
  const setFilter = (key: string, value: string) => setFilters((current) => ({ ...current, [key]: value }));

  const definition = (key: string, label: string, type: FilterDefinition["type"], options?: string[]): FilterDefinition =>
    ({ key, label, type, options, classification: classificationFor(key) });

  const basic: FilterDefinition[] = [
    definition("view", "Report view", "select", [`${page.title} • Summary`, `${page.title} • Detailed`, `${page.title} • Exceptions`]),
    definition("from", "From date", "date"),
    definition("to", "To date", "date"),
    definition("preset", "Date preset", "select", ["Month to date", "Previous month", "Quarter to date", "Year to date", "Custom"]),
  ];
  const advancedFilters: FilterDefinition[] = [
    definition("branch", "Branch", "select"),
    definition("currency", "Currency", "select", ["AED", "USD"]),
    definition("comparison", "Comparison", "select", ["Budget", "Previous period", "Previous year"]),
    definition("aggregation", "Aggregation", "select", ["Branch", "Department", "Customer", "Month"]),
    definition("minimum", "Minimum value", "text"),
  ];

  const sensitiveKeys = useMemo(
    () => partitionFilters([...basic, ...advancedFilters], filters).sensitiveKeys,
    [filters],
  );

  const [reference, setReference] = useState<ReferenceResponse | null>(null);
  const loadReference = useCallback(() => {
    void authedFetch("/reference?keys=branches")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setReference((body as ReferenceResponse | null) ?? null))
      .catch(() => setReference(null));
  }, []);
  useEffect(() => loadReference(), [loadReference]);
  const totals = useMemo(() => ({ current: reportRows.reduce((sum, row) => sum + row.current, 0), previous: reportRows.reduce((sum, row) => sum + row.previous, 0), budget: reportRows.reduce((sum, row) => sum + row.budget, 0) }), []);
  const variance = totals.current - totals.budget;
  const run = () => { setRunning(true); window.setTimeout(() => { setRunning(false); toast({ title: "Report refreshed", message: `${page.title} completed using the selected filters.`, type: "success" }); }, 450); };
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-2">
        <FilterBar
          definitions={basic}
          advanced={advancedFilters}
          values={filters}
          sensitiveKeys={sensitiveKeys}
          reference={reference ?? undefined}
          referenceKeys={{ branch: "branches" }}
          onRetryReference={loadReference}
          onChange={setFilter}
          onApply={run}
          onReset={() => setFilters({})}
          onCopyLink={() => { void navigator.clipboard?.writeText(window.location.href); toast({ title: "Link copied", message: "It carries only the filters that may travel in a URL.", type: "success" }); }}
        />
        <div data-tour="report-actions" className="flex flex-wrap items-center justify-end gap-1.5">
          <InlineAiAction useCaseId="report.summarise" label="Summarise" />
          <Button variant="primary" leftIcon={<Play className="size-3.5" />} loading={running} onClick={run}>Run report</Button>
          <Button variant="secondary" leftIcon={<CalendarClock className="size-3.5" />} onClick={() => setScheduleOpen(true)}>Schedule</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-sm)]"><div className="flex items-center gap-2 text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]"><Badge tone="success"><span className="size-1.5 rounded-full bg-current" />Ready</Badge><span>{filters.from ?? "—"} to {filters.to ?? "—"}</span><span className="h-3 w-px bg-[var(--border)]" /><span>4 branches • 18,426 source records</span><span className="hidden items-center gap-1 lg:flex"><Clock3 className="size-3" />Generated 17:42 GST</span></div><div className="flex gap-1"><Button size="xs" variant="ghost" leftIcon={<Save className="size-3" />}>Save view</Button><Button size="xs" variant="ghost" leftIcon={<Printer className="size-3" />}>Print</Button><Button size="xs" variant="secondary" leftIcon={<Download className="size-3" />}>Export</Button></div></div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{[
        ["Current period", format.money(totals.current), "+8.7% vs prior", "success"],
        ["Previous period", format.money(totals.previous), "Comparable basis", "info"],
        ["Budget / target", format.money(totals.budget), "Approved plan", "neutral"],
        ["Variance", format.money(variance), `${((variance / totals.budget) * 100).toFixed(1)}% favorable`, variance >= 0 ? "success" : "danger"],
      ].map(([label, value, note, tone]) => <Card key={label} className="p-4"><div className="flex items-center justify-between"><span className="text-[length:calc(9px*var(--fs-scale))] font-black uppercase tracking-[.1em] text-[var(--text-subtle)]">{label}</span><Badge tone={tone as "success" | "info" | "neutral" | "danger"}>{note}</Badge></div><div className="mt-3 text-[length:calc(20px*var(--fs-scale))] font-black tracking-[-.04em]">{value}</div></Card>)}</div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.55fr)]">
        <Card className="overflow-hidden"><CardHeader><CardTitle title="Performance by branch" subtitle="Current, previous and budget comparison" action={<div className="flex items-center gap-3 text-[length:calc(8.5px*var(--fs-scale))] font-bold text-[var(--text-muted)]"><span className="flex items-center gap-1"><span className="size-2 rounded bg-[color-mix(in_srgb,var(--primary)_42%,transparent)]" />Previous</span><span className="flex items-center gap-1"><span className="size-2 rounded bg-[var(--primary)]" />Current</span><span className="flex items-center gap-1"><span className="size-2 rounded border border-[var(--accent)] bg-[var(--accent-soft)]" />Budget</span></div>} /></CardHeader><ReportChart values={reportRows} format={format} /></Card>
        <Card className="overflow-hidden"><CardHeader><CardTitle title="Report intelligence" subtitle="Automated observations from the result" action={<Sparkles className="size-4 text-[var(--primary)]" />} /></CardHeader><div className="divide-y divide-[var(--border)]">{[
          ["Abu Dhabi contributes 44.8%", "The branch is 4.0% above budget and leads absolute growth.", "success"],
          ["Dubai is below plan", "AED 218K unfavorable variance despite 4.1% period growth.", "warning"],
          ["Kochi outperformed", "Contribution is small, but performance is 12.0% above budget.", "info"],
          ["No material data gaps", "99.2% of source records passed validation checks.", "success"],
        ].map(([title, detail, tone]) => <div key={title} className="flex gap-3 px-4 py-3"><span className={cn("mt-1 size-2 shrink-0 rounded-full", tone === "success" ? "bg-[var(--success)]" : tone === "warning" ? "bg-[var(--warning)]" : "bg-[var(--info)]")} /><div><div className="text-[length:calc(10px*var(--fs-scale))] font-extrabold">{title}</div><div className="mt-1 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{detail}</div></div></div>)}</div></Card>
      </div>

      <Card className="overflow-hidden"><CardHeader><CardTitle title="Detailed output" subtitle="Sortable report result • grouped by branch" action={<div className="flex gap-1"><Button size="xs" variant="ghost" leftIcon={<FileText className="size-3" />}>PDF</Button><Button size="xs" variant="ghost" leftIcon={<FileSpreadsheet className="size-3" />}>Excel</Button></div>} /></CardHeader><div className="nex-scrollbar overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">{["Dimension", "Current", "Previous", "Budget", "Variance", "Contribution", "Trend"].map((heading) => <th key={heading} className="px-4 py-2 text-[length:calc(8.5px*var(--fs-scale))] font-black uppercase tracking-[.08em] text-[var(--text-subtle)]">{heading}</th>)}</tr></thead><tbody>{reportRows.map((row) => <tr key={row.dimension} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]"><td className="px-4 py-3 text-[length:calc(10.5px*var(--fs-scale))] font-extrabold">{row.dimension}</td><td className="px-4 py-3 text-[length:calc(10px*var(--fs-scale))] font-bold">{format.money(row.current)}</td><td className="px-4 py-3 text-[length:calc(10px*var(--fs-scale))] text-[var(--text-muted)]">{format.money(row.previous)}</td><td className="px-4 py-3 text-[length:calc(10px*var(--fs-scale))] text-[var(--text-muted)]">{format.money(row.budget)}</td><td className={cn("px-4 py-3 text-[length:calc(10px*var(--fs-scale))] font-extrabold", row.variance >= 0 ? "text-[var(--success-ink)]" : "text-[var(--danger-ink)]")}>{format.money(row.variance)}</td><td className="px-4 py-3 text-[length:calc(10px*var(--fs-scale))] font-bold">{row.contribution}%</td><td className="px-4 py-3"><div className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--surface-3)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(100, (row.current / totals.current) * 180)}%` }} /></div></td></tr>)}</tbody><tfoot><tr className="border-t-2 border-[var(--border-strong)] bg-[var(--surface-2)] font-black"><td className="px-4 py-3 text-[length:calc(10px*var(--fs-scale))]">Total</td><td className="px-4 py-3 text-[length:calc(10px*var(--fs-scale))]">{format.money(totals.current)}</td><td className="px-4 py-3 text-[length:calc(10px*var(--fs-scale))]">{format.money(totals.previous)}</td><td className="px-4 py-3 text-[length:calc(10px*var(--fs-scale))]">{format.money(totals.budget)}</td><td className="px-4 py-3 text-[length:calc(10px*var(--fs-scale))]">{format.money(variance)}</td><td className="px-4 py-3 text-[length:calc(10px*var(--fs-scale))]">100%</td><td /></tr></tfoot></table></div></Card>

      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]"><Filter className="size-3.5 shrink-0" /><span>Interactive reports are limited to a configurable date range. Large historical requests should run as scheduled jobs and deliver a secure file link.</span></div>
      <ScheduleModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} reportTitle={page.title} />
    </div>
  );
}
