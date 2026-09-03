"use client";

import React from "react";
import { ArrowDownRight, ArrowUpRight, CalendarDays, ChevronRight, Circle, Clock3, Download, Ellipsis, Filter, Maximize2, RefreshCw, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { dashboardData } from "@pepbits/erp-data";
import { useNavigation } from "@pepbits/platform-ports";
import { useERP, dashboardPageId as dashboardFor } from "@pepbits/erp-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@pepbits/ops-ui";
import { Badge } from "@pepbits/ops-ui";
import { Button, IconButton } from "@pepbits/ops-ui";
import { cn } from "@pepbits/ops-ui";
import { PAGE_REGISTRY } from "@pepbits/erp-config";
import type { ModuleKey } from "@pepbits/erp-config";

function TrendChart({ values, labels, module }: { values: number[]; labels: string[]; module: ModuleKey }) {
  const width = 760;
  const height = 210;
  const paddingX = 28;
  const paddingY = 22;
  const min = Math.min(...values) * .92;
  const max = Math.max(...values) * 1.06;
  const points = values.map((value, index) => {
    const x = paddingX + (index / (values.length - 1)) * (width - paddingX * 2);
    const y = paddingY + (1 - (value - min) / (max - min || 1)) * (height - paddingY * 2);
    return { x, y, value };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `${path} L${points[points.length - 1].x},${height - paddingY} L${points[0].x},${height - paddingY} Z`;
  const id = `trend-${module}`;
  return (
    <div className="relative h-[225px] w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[210px] w-full" preserveAspectRatio="none" aria-label="Twelve month trend chart">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity=".28" /><stop offset="100%" stopColor="var(--primary)" stopOpacity="0" /></linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = paddingY + line * ((height - paddingY * 2) / 3);
          return <line key={line} x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="var(--border)" strokeDasharray="4 6" strokeWidth="1" />;
        })}
        <path d={area} fill={`url(#${id})`} />
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => <g key={index}><circle cx={point.x} cy={point.y} r="5" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2.5" /><circle cx={point.x} cy={point.y} r="2" fill="var(--primary)" /></g>)}
      </svg>
      <div className="absolute inset-x-5 bottom-0 flex justify-between text-[length:calc(8.5px*var(--fs-scale))] font-semibold text-[var(--text-subtle)]">{labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  );
}

function KpiCard({ item, index }: { item: { label: string; value: string; delta: string; trend: "up" | "down" | "neutral"; note: string }; index: number }) {
  const positive = item.trend === "up";
  const negative = item.trend === "down";
  return (
    <Card className="group relative min-w-0 overflow-hidden transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary)_24%,var(--border))] hover:shadow-[var(--shadow-md)]">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-[var(--primary)] opacity-0 transition group-hover:opacity-100" />
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><p className="truncate text-[length:calc(9px*var(--fs-scale))] font-black uppercase tracking-[.11em] text-[var(--text-subtle)]">{item.label}</p><div className="mt-2 truncate text-[length:calc(20px*var(--fs-scale))] font-black tracking-[-.045em] text-[var(--text)]">{item.value}</div></div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--primary)]"><span className="text-[length:calc(11px*var(--fs-scale))] font-black">{String(index + 1).padStart(2, "0")}</span></div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2.5">
          <span className={cn("inline-flex items-center gap-1 text-[length:calc(9.5px*var(--fs-scale))] font-extrabold", positive && "text-[var(--success)]", negative && "text-[var(--danger)]", item.trend === "neutral" && "text-[var(--warning)]")}>{positive ? <ArrowUpRight className="size-3" /> : negative ? <ArrowDownRight className="size-3" /> : <Circle className="size-2 fill-current" />}{item.delta}</span>
          <span className="truncate text-right text-[length:calc(8.5px*var(--fs-scale))] font-semibold text-[var(--text-muted)]">{item.note}</span>
        </div>
      </CardContent>
    </Card>
  );
}

const branchRows = [
  { branch: "Abu Dhabi HQ", volume: "AED 8.42M", plan: 96, variance: "+7.8%", exceptions: 12, health: "Strong" },
  { branch: "Dubai Center", volume: "AED 6.18M", plan: 91, variance: "+3.1%", exceptions: 18, health: "Stable" },
  { branch: "Sharjah Hub", volume: "AED 3.26M", plan: 84, variance: "-1.6%", exceptions: 9, health: "Watch" },
  { branch: "Kochi Delivery", volume: "AED 1.47M", plan: 102, variance: "+11.2%", exceptions: 4, health: "Strong" },
];


/* Defect: the generated ids did not exist for finance, hr or sales, so the click
   did nothing at all. Verify against the registry and fall back audibly. */
function registeredPage(candidate: string, fallback: string): string {
  if (PAGE_REGISTRY[candidate]) return candidate;
  console.warn(`[dashboard] no page registered for "${candidate}"; falling back to "${fallback}"`);
  return fallback;
}

export function ModuleDashboard({ moduleKey }: { moduleKey?: ModuleKey }) {
  const { currentModule, module, toast, format } = useERP();
  const navigation = useNavigation();
  const key = moduleKey ?? currentModule;
  const data = dashboardData[key];

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center gap-2 text-[length:calc(9.5px*var(--fs-scale))] font-semibold text-[var(--text-muted)]"><Badge tone="success"><span className="size-1.5 rounded-full bg-current" />Live</Badge><span className="flex items-center gap-1"><CalendarDays className="size-3" />September 2026</span><span className="hidden h-4 w-px bg-[var(--border)] sm:block" /><span className="hidden sm:inline">Consolidated • 4 branches • AED</span><span className="hidden items-center gap-1 lg:flex"><ShieldCheck className="size-3" />Role-filtered data</span></div>
        <div className="flex items-center gap-1.5"><Button size="xs" variant="ghost" leftIcon={<Filter className="size-3" />}>Filters</Button><Button size="xs" variant="ghost" leftIcon={<Download className="size-3" />} onClick={() => toast({ title: "Dashboard exported", message: "The mock snapshot was prepared as CSV.", type: "success" })}>Export</Button><Button size="xs" variant="secondary" leftIcon={<RefreshCw className="size-3" />} onClick={() => toast({ title: "Dashboard refreshed", message: "All widgets are synchronized with mock data.", type: "info" })}>Refresh</Button></div>
      </div>

      <div data-tour="kpis" className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {data.kpis.map((item, index) => <KpiCard key={item.label} item={item} index={index} />)}
      </div>

      <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1.75fr)_minmax(330px,.75fr)]">
        <Card data-tour="chart" className="min-w-0">
          <CardHeader><CardTitle title="Twelve-month operating trend" subtitle="Actual versus trajectory • refreshed four minutes ago" action={<div className="flex items-center gap-1"><Badge tone="brand"><TrendingUp className="size-3" />+12.4% YoY</Badge><IconButton label="Expand chart" className="size-7"><Maximize2 className="size-3" /></IconButton><IconButton label="Chart options" className="size-7"><Ellipsis className="size-3.5" /></IconButton></div>} /></CardHeader>
          <CardContent className="pb-3 pt-2">
            <TrendChart values={data.trend} labels={data.trendLabels} module={key} />
            <div className="mt-1 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3 sm:grid-cols-4">
              {["Forecast confidence", "Data completeness", "Plan attainment", "Exception rate"].map((label, index) => <div key={label} className="rounded-xl bg-[var(--surface-2)] px-3 py-2"><div className="text-[length:calc(8.5px*var(--fs-scale))] font-bold uppercase tracking-[.08em] text-[var(--text-subtle)]">{label}</div><div className="mt-1 flex items-end justify-between"><span className="text-[length:calc(14px*var(--fs-scale))] font-black">{[94, 99, 91, 3.8][index]}{index === 3 ? "%" : "%"}</span><span className="text-[length:calc(8px*var(--fs-scale))] font-bold text-[var(--success)]">healthy</span></div></div>)}
            </div>
          </CardContent>
        </Card>

        <Card data-tour="recent">
          <CardHeader><CardTitle title="Action queue" subtitle="Prioritized by impact and SLA" action={<Badge tone="warning">{data.queue.reduce((sum, item) => sum + item.count, 0)} open</Badge>} /></CardHeader>
          <div className="divide-y divide-[var(--border)]">
            {data.queue.map((item, index) => <button key={item.label} type="button" onClick={() => navigation.openInNewContext({ pageId: registeredPage(key === "finance" ? "billing-worklist" : key === "hr" ? "approval-worklist" : key === "payroll" ? "payroll-worklist" : key === "sales" ? "order-worklist" : key === "supply" ? "procurement-worklist" : "component-library", dashboardFor(key)) })} className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--surface-2)]"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[length:calc(11px*var(--fs-scale))] font-black text-[var(--primary-strong)]">{item.count}</span><span className="min-w-0 flex-1"><span className="block truncate text-[length:calc(10.5px*var(--fs-scale))] font-extrabold">{item.label}</span><span className="mt-0.5 block truncate text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]">{item.value}</span></span><span className="text-right"><span className="block text-[length:calc(8px*var(--fs-scale))] font-bold uppercase text-[var(--text-subtle)]">SLA</span><span className="block text-[length:calc(9.5px*var(--fs-scale))] font-extrabold text-[var(--warning)]">{item.SLA}</span></span><ChevronRight className="size-3.5 text-[var(--text-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--primary)]" /></button>)}
          </div>
          <div className="border-t border-[var(--border)] bg-[var(--surface-2)] p-2"><Button variant="ghost" size="sm" className="w-full" onClick={() => navigation.open({ pageId: registeredPage(key === "library" ? "page-catalog" : `${key === "supply" ? "procurement" : key}-worklist`, dashboardFor(key)) })}>Open full worklist <ChevronRight className="size-3" /></Button></div>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader><CardTitle title="Branch performance" subtitle="Current period operating summary" action={<Button variant="ghost" size="xs">View analysis</Button>} /></CardHeader>
          <div className="nex-scrollbar overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead><tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">{["Branch", "Volume", "Plan", "Variance", "Exceptions", "Health"].map((head) => <th key={head} className="px-4 py-2 text-[length:calc(8.5px*var(--fs-scale))] font-black uppercase tracking-[.09em] text-[var(--text-subtle)]">{head}</th>)}</tr></thead>
              <tbody>{branchRows.map((row) => <tr key={row.branch} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]"><td className="px-4 py-3 text-[length:calc(10.5px*var(--fs-scale))] font-extrabold">{row.branch}</td><td className="px-4 py-3 text-[length:calc(10px*var(--fs-scale))] font-bold">{row.volume}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--surface-3)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(row.plan, 100)}%` }} /></div><span className="text-[length:calc(9px*var(--fs-scale))] font-extrabold">{row.plan}%</span></div></td><td className={cn("px-4 py-3 text-[length:calc(9.5px*var(--fs-scale))] font-extrabold", row.variance.startsWith("+") ? "text-[var(--success)]" : "text-[var(--danger)]")}>{row.variance}</td><td className="px-4 py-3 text-[length:calc(10px*var(--fs-scale))] font-bold">{row.exceptions}</td><td className="px-4 py-3"><Badge tone={row.health === "Strong" ? "success" : row.health === "Stable" ? "info" : "warning"}>{row.health}</Badge></td></tr>)}</tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle title="Live activity" subtitle="Automations, approvals and exceptions" action={<span className="flex items-center gap-1 text-[length:calc(8.5px*var(--fs-scale))] font-bold text-[var(--success)]"><span className="size-1.5 animate-pulse rounded-full bg-current" />streaming</span>} /></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[var(--border)]">
              {data.activity.map((activity) => <div key={activity.title} className="flex gap-3 px-4 py-3"><span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl", activity.tone === "success" && "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]", activity.tone === "warning" && "bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)]", activity.tone === "danger" && "bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)]", activity.tone === "info" && "bg-[color-mix(in_srgb,var(--info)_10%,transparent)] text-[var(--info)]")}><Sparkles className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[length:calc(10.5px*var(--fs-scale))] font-extrabold">{activity.title}</span><span className="mt-0.5 block truncate text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]">{activity.detail}</span></span><span className="flex shrink-0 items-center gap-1 self-start text-[length:calc(8px*var(--fs-scale))] font-semibold text-[var(--text-subtle)]"><Clock3 className="size-2.5" />{activity.time}</span></div>)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {data.breakdown.map((item) => {
          const percent = Math.round((item.value / item.total) * 100);
          return <Card key={item.label} className="p-3.5"><div className="flex items-center justify-between gap-2"><span className="truncate text-[length:calc(10px*var(--fs-scale))] font-extrabold">{item.label}</span><span className="text-[length:calc(9px*var(--fs-scale))] font-bold text-[var(--text-muted)]">{format.compact(item.value)} / {format.compact(item.total)}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-3)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${percent}%` }} /></div><div className="mt-2 flex justify-between text-[length:calc(8.5px*var(--fs-scale))] font-semibold text-[var(--text-muted)]"><span>Utilization</span><span>{percent}%</span></div></Card>;
        })}
      </div>
    </div>
  );
}
