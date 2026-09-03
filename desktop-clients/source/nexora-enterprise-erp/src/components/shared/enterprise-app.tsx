"use client";

import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  BellRing,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Download,
  FileSpreadsheet,
  Info,
  Keyboard,
  Languages,
  LayoutDashboard,
  MonitorCog,
  PanelLeft,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import { EnterpriseShell } from "@/components/layout/enterprise-shell";
import { ModuleDashboard } from "@/components/dashboard/module-dashboard";
import { WorklistPage } from "@/components/worklist/worklist-page";
import { DynamicRecordForm } from "@/components/forms/dynamic-record-form";
import { BillingPage } from "@/components/billing/billing-page";
import { ReportsPage } from "@/components/reports/reports-page";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Toggle } from "@/components/ui/form-controls";
import { Drawer, Modal } from "@/components/ui/overlay";
import { LANGUAGE_OPTIONS } from "@/config/i18n";
import { MODULES, PAGE_REGISTRY } from "@/config/navigation";
import { THEME_OPTIONS } from "@/config/themes";
import { useERP } from "@/context/erp-context";
import { cn } from "@/lib/cn";
import type {
  BillingLayout,
  Density,
  FormNavigation,
  LanguageKey,
  PageDefinition,
  PreviewMode,
  ResultView,
  SidebarPlacement,
  ThemeKey,
  ToastPosition,
  UserPreferences,
} from "@/types";

function ChoiceGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string; description?: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "focus-ring rounded-xl border p-3 text-left transition",
            value === option.value
              ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-sm"
              : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold">{option.label}</span>
            {value === option.value ? <CheckCircle2 className="size-4 text-[var(--primary)]" /> : null}
          </div>
          {option.description ? <p className="mt-1 text-[9px] leading-relaxed text-[var(--text-muted)]">{option.description}</p> : null}
        </button>
      ))}
    </div>
  );
}

function PreferenceSection({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle title={title} subtitle={subtitle} action={<span className="flex size-8 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">{icon}</span>} />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PreferencesPage() {
  const { preferences, updatePreference, resetPreferences, toast } = useERP();
  const set = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => updatePreference(key, value);

  return (
    <div className="mx-auto flex max-w-[1700px] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
        <div>
          <div className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-[var(--primary)]" /><h2 className="text-[13px] font-black">Personal workspace profile</h2><Badge tone="brand">Saved locally</Badge></div>
          <p className="mt-1 text-[9.5px] text-[var(--text-muted)]">These preferences drive every shared page, form, worklist, preview, toast and navigation component.</p>
        </div>
        <div className="flex gap-2"><Button variant="ghost" onClick={resetPreferences}>Restore defaults</Button><Button variant="primary" onClick={() => toast({ title: "Preferences saved", message: "Your component and workspace settings are active across the ERP.", type: "success" })}>Save preferences</Button></div>
      </div>

      <div className="grid gap-3 2xl:grid-cols-2">
        <PreferenceSection title="Theme system" subtitle="Semantic tokens update the complete application, not individual pages." icon={<Sparkles className="size-4" />}>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {THEME_OPTIONS.map((theme) => (
              <button key={theme.id} type="button" onClick={() => set("theme", theme.id)} className={cn("focus-ring rounded-xl border p-3 text-left transition", preferences.theme === theme.id ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] hover:bg-[var(--surface-2)]")}>
                <div className="flex items-center justify-between"><span className="text-[11px] font-extrabold">{theme.name}</span>{preferences.theme === theme.id ? <CheckCircle2 className="size-4 text-[var(--primary)]" /> : null}</div>
                <div className="mt-2 flex gap-1.5">{theme.swatches.map((swatch) => <span key={swatch} className="h-5 flex-1 rounded-md border border-black/10" style={{ background: swatch }} />)}</div>
                <p className="mt-2 text-[9px] text-[var(--text-muted)]">{theme.description}</p>
              </button>
            ))}
          </div>
        </PreferenceSection>

        <PreferenceSection title="Typography and language" subtitle="Use controlled choices to preserve accessibility and layout stability." icon={<Languages className="size-4" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Language" value={preferences.language} onChange={(event) => set("language", event.target.value as LanguageKey)} options={LANGUAGE_OPTIONS.map((item) => ({ label: `${item.native} — ${item.label}`, value: item.value }))} />
            <Select label="Font family" value={preferences.fontFamily} onChange={(event) => set("fontFamily", event.target.value as UserPreferences["fontFamily"])} options={[{ label: "Inter", value: "inter" }, { label: "Manrope", value: "manrope" }, { label: "System UI", value: "system" }, { label: "Monospace", value: "mono" }]} />
            <Select label="Font size" value={preferences.fontSize} onChange={(event) => set("fontSize", event.target.value as UserPreferences["fontSize"])} options={[{ label: "Small", value: "sm" }, { label: "Standard", value: "md" }, { label: "Large", value: "lg" }]} />
            <Select label="Information density" value={preferences.density} onChange={(event) => set("density", event.target.value as Density)} options={[{ label: "Compact", value: "compact" }, { label: "Comfortable", value: "comfortable" }, { label: "Spacious", value: "spacious" }]} />
          </div>
        </PreferenceSection>

        <PreferenceSection title="Navigation and workspace" subtitle="Control sidebar behavior, placement and multi-record tabs." icon={<PanelLeft className="size-4" />}>
          <ChoiceGroup<SidebarPlacement> value={preferences.sidebarPlacement} onChange={(value) => set("sidebarPlacement", value)} options={[{ value: "left", label: "Left sidebar", description: "Traditional LTR enterprise navigation." }, { value: "right", label: "Right sidebar", description: "Useful for RTL and alternate workflows." }]} />
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <Toggle label="Fix sidebar open" description="Disable automatic hover collapse." checked={preferences.sidebarPinned} onChange={(value) => set("sidebarPinned", value)} />
            <Toggle label="Open records in tabs" description="Keep parallel records available in the workspace." checked={preferences.openRecordsInTabs} onChange={(value) => set("openRecordsInTabs", value)} />
          </div>
        </PreferenceSection>

        <PreferenceSection title="Lists and record previews" subtitle="The same data contract renders as a table, cards or compact preview." icon={<Table2 className="size-4" />}>
          <ChoiceGroup<ResultView> value={preferences.resultView} onChange={(value) => set("resultView", value)} options={[{ value: "table", label: "Data table", description: "Dense, sortable and configurable columns." }, { value: "cards", label: "Card grid", description: "Responsive visual record summaries." }]} />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Select label="Preview presentation" value={preferences.previewMode} onChange={(event) => set("previewMode", event.target.value as PreviewMode)} options={[{ label: "Centered record card", value: "center-card" }, { label: "Centered modal", value: "center-modal" }, { label: "Left side panel", value: "left-drawer" }, { label: "Right side panel", value: "right-drawer" }]} />
            <Select label="Records per page" value={String(preferences.pageSize)} onChange={(event) => set("pageSize", Number(event.target.value) as 20 | 50 | 100)} options={[{ label: "20 records", value: "20" }, { label: "50 records", value: "50" }, { label: "100 records", value: "100" }]} />
          </div>
        </PreferenceSection>

        <PreferenceSection title="Forms and billing" subtitle="One schema is reused by rail, tabs and wizard presentations." icon={<MonitorCog className="size-4" />}>
          <ChoiceGroup<FormNavigation> value={preferences.formNavigation} onChange={(value) => set("formNavigation", value)} options={[{ value: "rail", label: "Section rail", description: "Fast navigation for expert users." }, { value: "tabs", label: "Horizontal tabs", description: "Familiar grouped form sections." }, { value: "wizard", label: "Guided wizard", description: "Sequential completion and review." }]} />
          <div className="mt-4"><Select label="Billing workspace layout" value={preferences.billingLayout} onChange={(event) => set("billingLayout", event.target.value as BillingLayout)} options={[{ label: "Workspace tabs", value: "workspace" }, { label: "Vertical sections", value: "vertical" }, { label: "Split header and lines", value: "split" }]} /></div>
        </PreferenceSection>

        <PreferenceSection title="Notifications, search and guidance" subtitle="Personalize feedback timing, location and contextual assistance." icon={<BellRing className="size-4" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Toast position" value={preferences.toastPosition} onChange={(event) => set("toastPosition", event.target.value as ToastPosition)} options={[
              { label: "Top left", value: "top-left" }, { label: "Top center", value: "top-center" }, { label: "Top right", value: "top-right" }, { label: "Bottom left", value: "bottom-left" }, { label: "Bottom center", value: "bottom-center" }, { label: "Bottom right", value: "bottom-right" },
            ]} />
            <Select label="Toast duration" value={String(preferences.toastDuration)} onChange={(event) => set("toastDuration", Number(event.target.value) as 2000 | 3500 | 5000 | 8000)} options={[{ label: "2 seconds", value: "2000" }, { label: "3.5 seconds", value: "3500" }, { label: "5 seconds", value: "5000" }, { label: "8 seconds", value: "8000" }]} />
            <Select label="Search matching" value={preferences.globalSearchMode} onChange={(event) => set("globalSearchMode", event.target.value as UserPreferences["globalSearchMode"])} options={[{ label: "Smart relevance", value: "smart" }, { label: "Contains", value: "contains" }, { label: "Starts with", value: "starts-with" }]} />
            <Select label="Toast style" value={preferences.toastTone} onChange={(event) => set("toastTone", event.target.value as UserPreferences["toastTone"])} options={[{ label: "Adaptive", value: "adaptive" }, { label: "Brand", value: "brand" }, { label: "Neutral", value: "neutral" }]} />
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <Toggle label="Animated page helper" description="Show contextual walkthrough controls." checked={preferences.helperEnabled} onChange={(value) => set("helperEnabled", value)} />
            <Toggle label="Documentation access" description="Expose developer and user guidance." checked={preferences.documentationEnabled} onChange={(value) => set("documentationEnabled", value)} />
            <Toggle label="Remember page filters" description="Retain personal filters and saved views." checked={preferences.rememberFilters} onChange={(value) => set("rememberFilters", value)} />
            <Toggle label="Keyboard shortcut hints" description="Show discoverable key combinations." checked={preferences.showKeyboardHints} onChange={(value) => set("showKeyboardHints", value)} />
            <Toggle label="Reduce motion" description="Minimize animation and transition effects." checked={preferences.reducedMotion} onChange={(value) => set("reducedMotion", value)} />
          </div>
        </PreferenceSection>
      </div>
    </div>
  );
}

type SheetCell = string | number;
const SHEET_COLUMNS = ["Item Code", "Description", "Quantity", "Unit Cost", "Discount %", "Tax %", "Net Cost", "Supplier"];
const INITIAL_SHEET: SheetCell[][] = [
  ["ITM-1001", "Industrial sensor", 12, 148.5, 3, 5, 2052.27, "Atlas Components"],
  ["ITM-1002", "Control relay", 36, 29.75, 0, 5, 1124.55, "Meridian Trading"],
  ["ITM-1003", "Shielded cable 20m", 18, 86.4, 2, 5, 1600.70, "Falcon Industrial"],
  ["ITM-1004", "Terminal enclosure", 8, 235, 5, 5, 1875.30, "Nova Systems"],
  ["ITM-1005", "Power conditioning unit", 4, 920, 4, 5, 3709.44, "Atlas Components"],
  ...Array.from({ length: 15 }, () => Array<SheetCell>(8).fill("")),
];

function SpreadsheetPage() {
  const { toast } = useERP();
  const [rows, setRows] = useState<SheetCell[][]>(INITIAL_SHEET);
  const [selected, setSelected] = useState({ row: 0, column: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = `${String.fromCharCode(65 + selected.column)}${selected.row + 1}`;
  const selectedValue = rows[selected.row]?.[selected.column] ?? "";

  const updateCell = (row: number, column: number, value: SheetCell) => {
    setRows((previous) => previous.map((current, rowIndex) => rowIndex === row ? current.map((cell, columnIndex) => columnIndex === column ? value : cell) : current));
  };

  const importFile = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed = XLSX.utils.sheet_to_json<SheetCell[]>(worksheet, { header: 1, defval: "" });
    if (!parsed.length) return;
    const body = parsed[0].some((value, index) => String(value).toLowerCase().includes(SHEET_COLUMNS[index]?.toLowerCase() ?? "__")) ? parsed.slice(1) : parsed;
    const normalized = body.slice(0, 500).map((row) => Array.from({ length: SHEET_COLUMNS.length }, (_, index) => row[index] ?? ""));
    setRows(normalized.length ? normalized : INITIAL_SHEET);
    toast({ title: "Workbook imported", message: `${normalized.length} rows loaded into Spreadsheet Studio.`, type: "success" });
  };

  const exportWorkbook = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([SHEET_COLUMNS, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Costing");
    XLSX.writeFile(workbook, "nexora-costing-workbook.xlsx");
    toast({ title: "Workbook exported", message: "The edited worksheet was downloaded as an Excel file.", type: "success" });
  };

  const recalculate = () => {
    setRows((previous) => previous.map((row) => {
      const quantity = Number(row[2]) || 0;
      const unit = Number(row[3]) || 0;
      const discount = Number(row[4]) || 0;
      const tax = Number(row[5]) || 0;
      const subtotal = quantity * unit * (1 - discount / 100);
      return row.map((cell, index) => index === 6 ? Number((subtotal * (1 + tax / 100)).toFixed(2)) : cell);
    }));
    toast({ title: "Cost model recalculated", message: "Net cost was refreshed from quantity, unit cost, discount and tax.", type: "info" });
  };

  const total = rows.reduce((sum, row) => sum + (Number(row[6]) || 0), 0);

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-[var(--shadow-sm)]">
        <Button variant="primary" leftIcon={<Upload className="size-3.5" />} onClick={() => inputRef.current?.click()}>Import Excel / CSV</Button>
        <input ref={inputRef} className="hidden" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.currentTarget.value = ""; }} />
        <Button leftIcon={<Download className="size-3.5" />} onClick={exportWorkbook}>Export workbook</Button>
        <Button variant="secondary" leftIcon={<WandSparkles className="size-3.5" />} onClick={recalculate}>Recalculate costs</Button>
        <div className="ml-auto flex items-center gap-2"><Badge tone="brand">{rows.length} rows</Badge><Badge tone="success">AED {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Badge></div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
          <span className="flex h-8 min-w-14 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-black">{cellRef}</span>
          <Input aria-label="Formula bar" value={selectedValue} onChange={(event) => updateCell(selected.row, selected.column, event.target.value)} className="flex-1" />
          <span className="hidden text-[9px] text-[var(--text-muted)] lg:inline">Edit cells directly, paste ranges, import workbooks and export the current model.</span>
        </div>
        <div className="nex-scrollbar max-h-[650px] overflow-auto" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file) void importFile(file); }}>
          <table className="min-w-[1100px] w-full border-collapse text-[10px]">
            <thead className="sticky top-0 z-10 bg-[var(--surface-2)]">
              <tr><th className="w-12 border-b border-r border-[var(--border)] px-2 py-2 text-center text-[9px] text-[var(--text-subtle)]">#</th>{SHEET_COLUMNS.map((column, index) => <th key={column} className="min-w-32 border-b border-r border-[var(--border)] px-3 py-2 text-left font-extrabold"><span className="mr-2 text-[8px] text-[var(--text-subtle)]">{String.fromCharCode(65 + index)}</span>{column}</th>)}</tr>
            </thead>
            <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="hover:bg-[var(--surface-2)]"><td className="border-b border-r border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-center text-[9px] font-bold text-[var(--text-subtle)]">{rowIndex + 1}</td>{SHEET_COLUMNS.map((_, columnIndex) => <td key={columnIndex} className={cn("border-b border-r border-[var(--border)] p-0", selected.row === rowIndex && selected.column === columnIndex && "outline outline-2 -outline-offset-2 outline-[var(--primary)]")}><input aria-label={`Row ${rowIndex + 1}, column ${SHEET_COLUMNS[columnIndex]}`} value={row[columnIndex] ?? ""} onFocus={() => setSelected({ row: rowIndex, column: columnIndex })} onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)} className="h-8 w-full min-w-28 bg-transparent px-3 text-[10px] outline-none" /></td>)}</tr>)}</tbody>
            <tfoot className="sticky bottom-0 bg-[var(--surface)]"><tr><td colSpan={7} className="border-t border-[var(--border-strong)] px-3 py-2 text-right text-[10px] font-black">Grand total</td><td className="border-t border-[var(--border-strong)] px-3 py-2 text-[11px] font-black text-[var(--primary)]">AED {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="border-t border-[var(--border-strong)]" /></tr></tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

const COMPONENT_ROWS = [
  ["Button", "ui/button.tsx", "Variants, sizes, loading, icons and focus contract"],
  ["Form controls", "ui/form-controls.tsx", "Input, search, textarea, select, multiselect and toggle"],
  ["Overlay", "ui/overlay.tsx", "Modal, center record card and left/right drawer"],
  ["Worklist", "worklist/worklist-page.tsx", "Filters, views, columns, sorting, pagination and preview"],
  ["Dynamic form", "forms/dynamic-record-form.tsx", "Schema-driven rail, tabs and wizard presentation"],
  ["Billing", "billing/billing-page.tsx", "Header records, lines, payments, tax and print composition"],
  ["Application shell", "layout/enterprise-shell.tsx", "Header, module navigation, sidebar, tabs and footer"],
];

function LibraryPage({ page }: { page: PageDefinition }) {
  const { openPage, toast } = useERP();
  return (
    <div className="mx-auto flex max-w-[1700px] flex-col gap-3">
      <div className="surface-grid overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-3xl"><Badge tone="violet">DEVELOPER LIBRARY</Badge><h2 className="mt-3 text-[22px] font-black tracking-[-.04em]">{page.title}</h2><p className="mt-2 text-[10.5px] leading-relaxed text-[var(--text-muted)]">A shared, schema-driven component platform for ERP masters, transactions, worklists, reports and utilities. Pages compose reusable controls instead of duplicating markup or visual rules.</p></div><div className="flex gap-2"><Button leftIcon={<BookOpen className="size-3.5" />} onClick={() => openPage("integration-guide")}>Integration guide</Button><Button variant="primary" leftIcon={<FileSpreadsheet className="size-3.5" />} onClick={() => openPage("spreadsheet-studio")}>Spreadsheet Studio</Button></div></div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_.8fr]">
        <Card>
          <CardHeader><CardTitle title="Shared component registry" subtitle="Change a primitive once; all consuming pages inherit the contract." action={<Badge tone="brand">{COMPONENT_ROWS.length} families</Badge>} /></CardHeader>
          <div className="overflow-auto"><table className="w-full min-w-[680px] text-[10px]"><thead className="bg-[var(--surface-2)] text-left text-[8.5px] uppercase tracking-[.08em] text-[var(--text-subtle)]"><tr><th className="px-4 py-2.5">Component</th><th className="px-4 py-2.5">Source</th><th className="px-4 py-2.5">Contract</th><th className="px-4 py-2.5">Status</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{COMPONENT_ROWS.map(([name, source, contract]) => <tr key={name} className="hover:bg-[var(--surface-2)]"><td className="px-4 py-3 font-extrabold">{name}</td><td className="px-4 py-3 font-mono text-[9px] text-[var(--primary)]">{source}</td><td className="px-4 py-3 text-[var(--text-muted)]">{contract}</td><td className="px-4 py-3"><Badge tone="success">Ready</Badge></td></tr>)}</tbody></table></div>
        </Card>
        <Card>
          <CardHeader><CardTitle title="Live primitives" subtitle="Theme-aware interactive examples" /></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2"><Button variant="primary">Primary action</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="danger">Danger</Button></div>
            <Input label="Reusable text input" placeholder="Component-bound value" hint="Validation, density and theme are inherited." />
            <Select label="Reusable select" options={[{ label: "Enterprise", value: "enterprise" }, { label: "Professional", value: "professional" }]} />
            <Toggle label="Policy-controlled option" description="A standard accessible toggle contract." checked onChange={() => undefined} />
            <div className="flex flex-wrap gap-2"><Badge tone="success">Success</Badge><Badge tone="warning">Warning</Badge><Badge tone="danger">Exception</Badge><Badge tone="info">Information</Badge></div>
            <Button className="w-full" leftIcon={<WandSparkles className="size-3.5" />} onClick={() => toast({ title: "Component event", message: "The shared toast service handled this component action.", type: "success" })}>Test component feedback</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Schema first", "Fields and sections are defined once and rendered by every form presentation."],
          ["Semantic themes", "Components consume tokens such as surface, border, primary and text."],
          ["Stable contracts", "New properties remain optional or versioned to protect existing pages."],
          ["Keyboard ready", "Global and page-specific actions are discoverable and focus accessible."],
        ].map(([title, description], index) => <Card key={title}><CardContent><span className="flex size-8 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[10px] font-black text-[var(--primary)]">0{index + 1}</span><h3 className="mt-3 text-[12px] font-black">{title}</h3><p className="mt-1.5 text-[9.5px] leading-relaxed text-[var(--text-muted)]">{description}</p></CardContent></Card>)}
      </div>
    </div>
  );
}

function PageRenderer() {
  const { activePageId, activeTab, currentModule } = useERP();
  const page = PAGE_REGISTRY[activePageId];
  if (!page) return <div className="p-8 text-center text-sm text-[var(--text-muted)]">Page configuration was not found.</div>;

  if (activeTab.mode && (page.kind === "worklist" || page.kind === "form")) return <DynamicRecordForm page={page} />;
  switch (page.kind) {
    case "dashboard": return <ModuleDashboard moduleKey={page.module === "shared" ? currentModule : page.module} />;
    case "worklist": return <WorklistPage page={page} />;
    case "form": return <DynamicRecordForm page={page} />;
    case "billing": return <BillingPage page={page} />;
    case "reports": return <ReportsPage page={page} />;
    case "preferences": return <PreferencesPage />;
    case "spreadsheet": return <SpreadsheetPage />;
    case "library": return <LibraryPage page={page} />;
    default: return <WorklistPage page={page} />;
  }
}

function CommandPalette() {
  const { commandOpen, setCommandOpen, openPage } = useERP();
  const [query, setQuery] = useState("");
  const pages = useMemo(() => {
    const term = query.trim().toLowerCase();
    return Object.values(PAGE_REGISTRY)
      .filter((page) => !term || `${page.title} ${page.subtitle} ${page.module}`.toLowerCase().includes(term))
      .slice(0, 18);
  }, [query]);
  return (
    <Modal open={commandOpen} onClose={() => { setCommandOpen(false); setQuery(""); }} title="Open page or command" subtitle="Search every configured module, master, transaction, report and utility." size="md">
      <div className="p-3">
        <div className="flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3"><Search className="size-4 text-[var(--text-subtle)]" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages, modules and actions…" className="h-full min-w-0 flex-1 bg-transparent text-[12px] outline-none" /><kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[8px] text-[var(--text-muted)]">ESC</kbd></div>
        <div className="mt-2 max-h-[55vh] overflow-auto">{pages.map((page) => { const module = page.module === "shared" ? null : MODULES[page.module]; return <button key={page.id} type="button" onClick={() => { openPage(page.id); setCommandOpen(false); setQuery(""); }} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[var(--surface-2)]"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">{page.kind === "dashboard" ? <LayoutDashboard className="size-4" /> : <ChevronRight className="size-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-extrabold">{page.title}</span><span className="mt-0.5 block truncate text-[9px] text-[var(--text-muted)]">{page.subtitle}</span></span><Badge tone="neutral">{module?.shortLabel ?? "Shared"}</Badge></button>; })}</div>
      </div>
    </Modal>
  );
}

const toastPositionClass: Record<ToastPosition, string> = {
  "top-left": "left-4 top-4 items-start",
  "top-center": "left-1/2 top-4 -translate-x-1/2 items-center",
  "top-right": "right-4 top-4 items-end",
  "bottom-left": "bottom-12 left-4 items-start",
  "bottom-center": "bottom-12 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-12 right-4 items-end",
};

function ToastViewport() {
  const { toasts, dismissToast, preferences } = useERP();
  const tone: Record<string, BadgeTone> = { success: "success", error: "danger", warning: "warning", info: "info" };
  const icons = { success: CheckCircle2, error: AlertCircle, warning: AlertCircle, info: Info };
  return (
    <div className={cn("pointer-events-none fixed z-[180] flex max-w-[calc(100vw-2rem)] flex-col gap-2", toastPositionClass[preferences.toastPosition])}>
      {toasts.map((item) => { const Icon = icons[item.type]; return <div key={item.id} className="pointer-events-auto animate-slide-up flex w-[360px] max-w-full items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-md)]"><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)]"><Icon className={cn("size-4", item.type === "success" && "text-[var(--success)]", item.type === "error" && "text-[var(--danger)]", item.type === "warning" && "text-[var(--warning)]", item.type === "info" && "text-[var(--info)]")} /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-[11px] font-extrabold">{item.title}</span><Badge tone={tone[item.type]}>{item.type}</Badge></span>{item.message ? <span className="mt-1 block text-[9.5px] leading-relaxed text-[var(--text-muted)]">{item.message}</span> : null}</span><IconButton label="Dismiss" className="size-7" onClick={() => dismissToast(item.id)}><X className="size-3.5" /></IconButton></div>; })}
    </div>
  );
}

function HelpAssistant() {
  const { preferences, helpOpen, setHelpOpen, activePageId, setDocumentationOpen } = useERP();
  const page = PAGE_REGISTRY[activePageId];
  if (!preferences.helperEnabled) return null;
  const steps = page?.kind === "worklist"
    ? ["Use the global search for any visible value.", "Open Advanced filters only when you need precise criteria.", "Choose table or cards, then preview, view or edit a record."]
    : page?.kind === "form"
      ? ["Complete the active form section.", "Use the rail, tabs or wizard selected in My Preferences.", "Validate and save with Alt + S."]
      : ["Review summary indicators and action queues.", "Use the module selector to reset navigation for another domain.", "Press Ctrl/Cmd + K to open any page quickly."];
  return (
    <>
      <button type="button" aria-label="Open page helper" onClick={() => setHelpOpen(true)} className="help-pulse no-print fixed bottom-12 right-5 z-[70] flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-[var(--shadow-md)] transition hover:-translate-y-0.5"><CircleHelp className="size-5" /></button>
      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title={`${page?.title ?? "Page"} assistant`} subtitle="Interactive guidance generated from the current page type." size="md" footer={<><Button variant="ghost" onClick={() => setHelpOpen(false)}>Close</Button>{preferences.documentationEnabled ? <Button variant="primary" leftIcon={<BookOpen className="size-3.5" />} onClick={() => { setHelpOpen(false); setDocumentationOpen(true); }}>Open documentation</Button> : null}</>}>
        <div className="p-5"><div className="rounded-2xl border border-[color-mix(in_srgb,var(--primary)_24%,var(--border))] bg-[var(--primary-soft)] p-4"><div className="flex items-center gap-2 text-[12px] font-black text-[var(--primary-strong)]"><WandSparkles className="size-4" />Guided workflow</div><p className="mt-1 text-[9.5px] leading-relaxed text-[var(--text-muted)]">Follow these steps to complete the main task on this page.</p></div><div className="mt-4 space-y-2">{steps.map((step, index) => <div key={step} className="flex gap-3 rounded-xl border border-[var(--border)] p-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[9px] font-black">{index + 1}</span><span className="pt-1 text-[10.5px] font-semibold">{step}</span></div>)}</div><div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--surface-2)] p-3 text-[9.5px] text-[var(--text-muted)]"><Keyboard className="size-4 text-[var(--primary)]" /><b className="text-[var(--text)]">Tip:</b> press ? from any non-input area to reopen this helper.</div></div>
      </Modal>
    </>
  );
}

function DocumentationDrawer() {
  const { documentationOpen, setDocumentationOpen, activePageId, preferences, openPage } = useERP();
  if (!preferences.documentationEnabled) return null;
  const page = PAGE_REGISTRY[activePageId];
  return (
    <Drawer open={documentationOpen} onClose={() => setDocumentationOpen(false)} title="Product documentation" subtitle={page?.title ?? "Enterprise workspace"} side="right" width="lg" footer={<><Button variant="ghost" onClick={() => setDocumentationOpen(false)}>Close</Button><Button variant="primary" onClick={() => { openPage("integration-guide"); setDocumentationOpen(false); }}>Developer guide</Button></>}>
      <div className="space-y-4 p-5"><div className="rounded-2xl bg-[var(--primary-soft)] p-4"><Badge tone="brand">PAGE GUIDE</Badge><h3 className="mt-2 text-[15px] font-black">{page?.title}</h3><p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">{page?.subtitle}</p></div>{[
        ["Purpose", "This page is rendered from the central page registry and uses shared shell, theme, access and preference contracts."],
        ["Interaction model", "Search, filtering, forms, views and feedback are composed from reusable components so behavior remains consistent."],
        ["Extension rule", "Add new fields through entity schemas, new pages through the page registry and new themes through semantic design tokens."],
        ["Accessibility", "All primary actions are keyboard focusable, overlays close with Escape and reduced motion is available in preferences."],
      ].map(([title, text]) => <section key={title} className="rounded-xl border border-[var(--border)] p-4"><h4 className="text-[11px] font-black">{title}</h4><p className="mt-1.5 text-[9.5px] leading-relaxed text-[var(--text-muted)]">{text}</p></section>)}</div>
    </Drawer>
  );
}

export function EnterpriseApp() {
  return (
    <>
      <EnterpriseShell><PageRenderer /></EnterpriseShell>
      <CommandPalette />
      <ToastViewport />
      <HelpAssistant />
      <DocumentationDrawer />
    </>
  );
}
