"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BellRing, CheckCircle2, Clock3, Coins, Download, Languages, MonitorCog, PanelLeft,
  RotateCcw, Search, Settings2, SlidersHorizontal, Sparkles, Table2, Upload,
} from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, RangeInput, Select, Tabs, Toggle, cn } from "@pepbits/ops-ui";
import {
  DEFAULT_PREFERENCES, LANGUAGE_OPTIONS, THEME_OPTIONS, changedPreferenceCount,
  preferenceOverrides, sanitizePreferences,
} from "@pepbits/erp-config";
import type {
  BillingLayout, ClockZone, ColumnLayoutScope, CurrencyCode, CurrencyDisplay, DateFormat, Density,
  DocsPosition, ExportFormat, FontFamily, FormNavigation, LandingPage, LanguageKey, NegativeStyle, NumberLocale, OpenRecordsIn,
  PreviewMode, ResultView, SearchMode, SidebarExpandOn, SidebarPlacement, SidebarTheme, SidebarTone, TimeFormat, ToastPosition,
  ToastStyle, UserPreferences,
} from "@pepbits/erp-config";
import { TOUR_REVEAL_EVENT, useERP } from "@pepbits/erp-shell";

/* Currency is fixed at the tenant's AED for now, so the picker is hidden rather
   than deleted: the preference, its default and the formatter path all stay, so
   flipping this back to true is the whole re-enable. */
const SHOW_CURRENCY_PICKER = false;

type PrefTab = "behaviour" | "page" | "notification" | "language" | "general";

/** Which tab each tour anchor lives on. */
const TOUR_TABS: Record<string, PrefTab> = {
  "prefs-layout": "behaviour",
  "prefs-theme": "page",
  "prefs-type": "page",
  "prefs-toast": "notification",
  "prefs-lang": "language",
};

const PREF_TABS: Array<{ id: PrefTab; label: string; icon: React.ReactNode }> = [
  { id: "behaviour",    label: "Behaviour",    icon: <MonitorCog className="size-3.5" /> },
  { id: "page",         label: "Page",         icon: <Sparkles className="size-3.5" /> },
  { id: "notification", label: "Notification", icon: <BellRing className="size-3.5" /> },
  { id: "language",     label: "Language & help", icon: <Languages className="size-3.5" /> },
  { id: "general",      label: "General",      icon: <Settings2 className="size-3.5" /> },
];

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function ChoiceGroup<T extends string>({ value, options, onChange }: {
  value: T;
  options: Array<{ value: T; label: string; description?: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onChange(option.value)} className={cn(
          "focus-ring rounded-xl border p-3 text-left transition",
          value === option.value
            ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-sm"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]",
        )}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[length:calc(11px*var(--fs-scale))] font-extrabold">{option.label}</span>
            {value === option.value ? <CheckCircle2 className="size-4 text-[var(--primary)]" /> : null}
          </div>
          {option.description ? <p className="mt-1 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{option.description}</p> : null}
        </button>
      ))}
    </div>
  );
}

/* Vantage's row shape: a small muted label, the control, an optional hint
   beneath. Used by the Layout section so it reads like the page it was copied
   from rather than like the card grid used elsewhere here. */
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[length:calc(10px*var(--fs-scale))] font-bold text-[var(--text-muted)]">{label}</span>
      {children}
      {hint ? <span className="text-[length:calc(9px*var(--fs-scale))] leading-snug text-[var(--text-muted)]">{hint}</span> : null}
    </div>
  );
}

/* A segmented control for two or three short options. role="radiogroup", not
   the Tabs component: these are settings, and a screen reader announcing "tab"
   for "Left | Right" would be wrong. */
function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ value: T; label: string }>; onChange: (value: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button key={option.value} type="button" role="radio" aria-checked={active} onClick={() => onChange(option.value)}
            className={cn("focus-ring h-8 flex-1 whitespace-nowrap rounded-lg px-2 text-[length:calc(10.5px*var(--fs-scale))] font-bold transition",
              active ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]")}>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* Each theme card is rendered INSIDE that theme: data-theme on the card makes
   the CSS variables resolve to its palette, so the preview is the real tokens
   rather than three hand-picked swatches that could drift from them. */
function ThemeCard({ id, name, description, active, onSelect }: { id: string; name: string; description: string; active: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={cn("focus-ring group overflow-hidden rounded-xl border text-left transition", active ? "border-[var(--primary)] ring-2 ring-[var(--primary-soft)]" : "border-[var(--border)] hover:border-[var(--border-strong)]")}>
      <div data-theme={id} className="flex h-20 gap-1.5 p-2" style={{ background: "var(--bg)" }}>
        <div className="w-4 rounded-md" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mx-auto mt-1.5 size-2 rounded-sm" style={{ background: "var(--primary)" }} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="h-3 rounded-md" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
          <div className="flex flex-1 flex-col justify-between rounded-md p-1.5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="h-1.5 w-2/3 rounded-full" style={{ background: "var(--text-muted)", opacity: .55 }} />
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-7 rounded-md" style={{ background: "var(--primary)" }} />
              <div className="h-2.5 w-4 rounded-md" style={{ background: "var(--accent)" }} />
              <div className="ml-auto h-2 w-5 rounded-full" style={{ background: "var(--success)", opacity: .8 }} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
        <div className="min-w-0"><div className="truncate text-[length:calc(10.5px*var(--fs-scale))] font-extrabold">{name}</div><div className="truncate text-[length:calc(8.5px*var(--fs-scale))] text-[var(--text-muted)]">{description}</div></div>
        {active ? <CheckCircle2 className="size-4 shrink-0 text-[var(--primary)]" /> : null}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

/* Each section declares its tab, the keys it owns (for its own Reset button and
   the changed-count badge), and search keywords. Hidden rather than unmounted
   when another tab is active: every control is context-driven so nothing is
   lost either way, but mounted sections stay reachable by the browser's find. */
function PreferenceSection({ title, subtitle, icon, tab, keys, keywords, activeTab, query, tour, children }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tab: PrefTab;
  keys: Array<keyof UserPreferences>;
  keywords: string;
  activeTab: PrefTab;
  query: string;
  /** data-tour anchor, so the guided tour can spotlight this section. */
  tour?: string;
  children: React.ReactNode;
}) {
  const { preferences, updatePreferences } = useERP();
  const changed = keys.filter((key) => preferences[key] !== DEFAULT_PREFERENCES[key]).length;
  /* A search overrides the tab: when you type, every matching section shows
     wherever it lives, which is the whole point of searching. */
  const searching = query.trim().length > 0;
  const matches = !searching || `${title} ${subtitle} ${keywords}`.toLowerCase().includes(query.trim().toLowerCase());
  const visible = searching ? matches : tab === activeTab;
  const resetSection = () => {
    const patch: Partial<UserPreferences> = {};
    for (const key of keys) (patch as Record<string, unknown>)[key] = DEFAULT_PREFERENCES[key];
    updatePreferences(patch);
  };
  return (
    <Card hidden={!visible} data-tour={tour}>
      <CardHeader>
        <CardTitle title={title} subtitle={subtitle} action={
          <span className="flex items-center gap-2">
            {changed ? <Badge tone="brand">{changed} changed</Badge> : null}
            {changed ? <Button size="xs" variant="ghost" leftIcon={<RotateCcw className="size-3" />} onClick={resetSection}>Reset</Button> : null}
            <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">{icon}</span>
          </span>
        } />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function PreferencesPage({ showTabPreferences = true }: { showTabPreferences?: boolean }) {
  const { preferences, updatePreference, updatePreferences, resetPreferences, toast, branch } = useERP();
  const set = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => updatePreference(key, value);
  /* Navigation state, not a setting: which tab you last had open should not
     sync across devices. Same for the search box. */
  const [activeTab, setActiveTab] = useState<PrefTab>("behaviour");
  const [query, setQuery] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const changed = useMemo(() => changedPreferenceCount(preferences), [preferences]);

  /* The guided tour names a section; if it lives on another tab, switch there
     first or the spotlight would have nothing to measure. The map is the same
     one the sections declare with their `tour` prop. */
  useEffect(() => {
    const onReveal = (event: Event) => {
      const target = (event as CustomEvent<{ target: string }>).detail?.target;
      const owner = TOUR_TABS[target];
      if (owner) { setActiveTab(owner); setQuery(""); }
    };
    window.addEventListener(TOUR_REVEAL_EVENT, onReveal);
    return () => window.removeEventListener(TOUR_REVEAL_EVENT, onReveal);
  }, []);

  /* Export writes only the overrides -- the same shape the server stores -- so
     a file made today still imports cleanly after new preferences are added. */
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(preferenceOverrides(preferences), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nexora-preferences-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const importJson = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      /* Through the same validator the server response goes through: an
         imported file is user-authored and can carry anything. */
      const next = sanitizePreferences(parsed);
      updatePreferences(next);
      toast({ title: "Preferences imported", message: `${changedPreferenceCount(next)} settings differ from the defaults.`, type: "success" });
    } catch {
      toast({ title: "Import failed", message: "That file is not a preferences export.", type: "error" });
    }
  };

  const common = { activeTab, query };
  const branchLabel = branch === "india" ? "Kochi" : branch === "hq" ? "Abu Dhabi" : branch.charAt(0).toUpperCase() + branch.slice(1);

  return (
    <div className="flex h-full w-full flex-col gap-3">
      {/* ---- header ---------------------------------------------------- */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
        <div className="min-w-0">
          <div className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-[var(--primary)]" /><h2 className="text-[length:calc(13px*var(--fs-scale))] font-black">My Preferences</h2>{changed ? <Badge tone="brand">{changed} changed</Badge> : <Badge tone="neutral">All defaults</Badge>}</div>
          <p className="mt-1 text-[length:calc(9.5px*var(--fs-scale))] text-[var(--text-muted)]">Saved to your account and applied everywhere the moment you change them.</p>
        </div>
        <label className="relative ml-auto min-w-[220px] flex-1 lg:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search settings…" className="focus-ring h-9 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] pl-8 pr-3 text-[length:calc(10.5px*var(--fs-scale))] font-semibold text-[var(--text)] placeholder:text-[var(--text-subtle)]" />
        </label>
        <div className="flex flex-wrap gap-2">
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importJson(file); event.target.value = ""; }} />
          <Button variant="secondary" leftIcon={<Upload className="size-3.5" />} onClick={() => fileInput.current?.click()}>Import</Button>
          <Button variant="secondary" leftIcon={<Download className="size-3.5" />} onClick={exportJson}>Export</Button>
          <Button variant="ghost" leftIcon={<RotateCcw className="size-3.5" />} onClick={() => { resetPreferences(); toast({ title: "Defaults restored", message: "Every preference is back to its default.", type: "info" }); }}>Restore defaults</Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[210px_minmax(0,1fr)]">
        {/* ---- rail ------------------------------------------------------ */}
        <Card className="nex-scrollbar p-1.5 lg:h-full lg:overflow-y-auto">
          <Tabs orientation="vertical" variant="pills" items={PREF_TABS} value={activeTab} onChange={(value) => { setActiveTab(value as PrefTab); setQuery(""); }} />
          {query.trim() ? <p className="px-2.5 pt-3 text-[length:calc(8.5px*var(--fs-scale))] font-semibold text-[var(--text-muted)]">Showing every section matching “{query.trim()}”. Clear the search to go back to tabs.</p> : null}
        </Card>

        {/* ---- sections -------------------------------------------------- */}
        <div className="nex-scrollbar grid min-w-0 content-start gap-3 lg:h-full lg:overflow-y-auto lg:pe-1">

          {/* ================= BEHAVIOUR ================= */}
          {/* Row for row, Vantage's Layout group -- same labels, same hints. */}
          <PreferenceSection {...common} tab="behaviour" tour="prefs-layout" title="Layout" subtitle="Honoured by every module and page." icon={<PanelLeft className="size-4" />}
            keys={["sidebarPlacement", "sidebarPinned", "formNavigation", "resultView", "previewMode", "pageSize"]} keywords="layout sidebar position left right pinned hover record form style rail tabs wizard worklist result view table cards quick view preview card modal panel rows per page size">
            <div className="grid gap-x-5 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
              <Row label="Sidebar position">
                <Segmented<SidebarPlacement> label="Sidebar position" value={preferences.sidebarPlacement} onChange={(value) => set("sidebarPlacement", value)} options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]} />
              </Row>
              <Row label="Sidebar pinned open" hint="Otherwise expands on hover">
                <Segmented<"on" | "off"> label="Sidebar pinned open" value={preferences.sidebarPinned ? "on" : "off"} onChange={(value) => set("sidebarPinned", value === "on")} options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]} />
              </Row>
              <Row label="Record form style" hint="View, edit and new records">
                <Segmented<FormNavigation> label="Record form style" value={preferences.formNavigation} onChange={(value) => set("formNavigation", value)} options={[{ value: "rail", label: "Rail" }, { value: "tabs", label: "Tabs" }, { value: "wizard", label: "Wizard" }]} />
              </Row>
              <Row label="Worklist result view">
                <Segmented<ResultView> label="Worklist result view" value={preferences.resultView} onChange={(value) => set("resultView", value)} options={[{ value: "table", label: "Table" }, { value: "cards", label: "Card grid" }]} />
              </Row>
              <Row label="Quick view style" hint="Shown when clicking a result row">
                <Select aria-label="Quick view style" value={preferences.previewMode} onChange={(event) => set("previewMode", event.target.value as PreviewMode)} options={[{ label: "Centered record card", value: "center-card" }, { label: "Center modal", value: "center-modal" }, { label: "Left side panel", value: "left-drawer" }, { label: "Right side panel", value: "right-drawer" }]} />
              </Row>
              <Row label="Default rows per page">
                <Select aria-label="Default rows per page" value={String(preferences.pageSize)} onChange={(event) => set("pageSize", Number(event.target.value) as 10 | 20 | 50 | 100)} options={[{ label: "10", value: "10" }, { label: "20", value: "20" }, { label: "50", value: "50" }, { label: "100", value: "100" }]} />
              </Row>
            </div>
          </PreferenceSection>

          <PreferenceSection {...common} tab="behaviour" title="Navigation and workspace" subtitle="How the sidebar opens and where you land." icon={<PanelLeft className="size-4" />}
            keys={["sidebarExpandOn", "sidebarTone", "sidebarTheme", "openRecordsInTabs", "landingPage"]} keywords="sidebar hover click expand tabs landing home start page tone dark rail contrast colour color">
            <ChoiceGroup<SidebarExpandOn> value={preferences.sidebarExpandOn} onChange={(value) => set("sidebarExpandOn", value)} options={[{ value: "hover", label: "Expand on hover", description: "The rail opens as the pointer crosses it." }, { value: "click", label: "Expand on click", description: "The rail opens only when its logo is clicked." }]} />
            <div className="mt-4">
              <ChoiceGroup<SidebarTone> value={preferences.sidebarTone} onChange={(value) => set("sidebarTone", value)} options={[
                { value: "surface", label: "Sidebar matches the page", description: "The rail uses the same surface as cards and panels." },
                { value: "contrast", label: "Sidebar in its own tone", description: "A deeper rail drawn from the active theme — Solarized gets its base03." },
              ]} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* The rail can run a different theme from the page: a Solarized
                  sidebar against a Nexora workspace, say. "Match" is the common
                  case and stays first. */}
              <Select label="Sidebar theme" hint="Which palette the rail uses. Independent of the page theme." value={preferences.sidebarTheme} onChange={(event) => set("sidebarTheme", event.target.value as SidebarTheme)} options={[
                { label: "Match the page theme", value: "match" },
                ...THEME_OPTIONS.map((theme) => ({ label: theme.name, value: theme.id })),
              ]} />
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {showTabPreferences
                ? <Toggle label="Open records in tabs" description="Each record gets its own workspace tab. Off reuses the matching tab." checked={preferences.openRecordsInTabs} onChange={(value) => set("openRecordsInTabs", value)} />
                : <Select label="Start on" value={preferences.landingPage} onChange={(event) => set("landingPage", event.target.value as LandingPage)} options={[{ label: "The current module's dashboard", value: "module-dashboard" }, { label: "The page I last had open", value: "last-visited" }]} />}
            </div>
          </PreferenceSection>

          <PreferenceSection {...common} tab="behaviour" title="Lists and record previews" subtitle="Worklists, searching, filtering, previews and exports." icon={<Table2 className="size-4" />}
            keys={["openRecordsIn", "columnLayoutScope", "rememberFilters", "globalSearchMode", "confirmBulkActions", "exportFormat"]} keywords="open records new tab in place search matching filters remember export csv xlsx excel bulk archive confirm columns layout">
            <div>
              <ChoiceGroup<OpenRecordsIn> value={preferences.openRecordsIn} onChange={(value) => set("openRecordsIn", value)} options={[{ value: "new-tab", label: "Open records in a new tab", description: "View, Edit and New each get their own container." }, { value: "same-tab", label: "Open records in place", description: "Navigate within the current page instead." }]} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Select label="Search matching" value={preferences.globalSearchMode} onChange={(event) => set("globalSearchMode", event.target.value as SearchMode)} options={[{ label: "Smart — every word, anywhere in the row", value: "smart" }, { label: "Contains — the phrase, in any cell", value: "contains" }, { label: "Starts with — a cell begins with it", value: "starts-with" }]} />
              <Select label="Column layout is saved" value={preferences.columnLayoutScope} onChange={(event) => set("columnLayoutScope", event.target.value as ColumnLayoutScope)} options={[{ label: "For this browser only", value: "browser" }, { label: "To my account", value: "account" }]} />
              <Select label="Export format" value={preferences.exportFormat} onChange={(event) => set("exportFormat", event.target.value as ExportFormat)} options={[{ label: "CSV — opens anywhere", value: "csv" }, { label: "Excel workbook (.xlsx)", value: "xlsx" }]} />
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <Toggle label="Remember filters and search" description="Each worklist reopens with the filters you left on it." checked={preferences.rememberFilters} onChange={(value) => set("rememberFilters", value)} />
              <Toggle label="Confirm bulk actions" description="Ask before archiving selected records." checked={preferences.confirmBulkActions} onChange={(value) => set("confirmBulkActions", value)} />
            </div>
          </PreferenceSection>

          <PreferenceSection {...common} tab="behaviour" title="Tables" subtitle="How the data table reads at twelve columns and a hundred rows." icon={<Table2 className="size-4" />}
            keys={["stickyTableHeader", "zebraStripes", "wrapCellText"]} keywords="table header sticky zebra stripes wrap truncate rows">
            <div className="grid gap-2 md:grid-cols-3">
              <Toggle label="Sticky header" description="Column names stay visible while you scroll." checked={preferences.stickyTableHeader} onChange={(value) => set("stickyTableHeader", value)} />
              <Toggle label="Zebra stripes" description="Alternate rows are tinted." checked={preferences.zebraStripes} onChange={(value) => set("zebraStripes", value)} />
              <Toggle label="Wrap long text" description="Off truncates a long cell to one line." checked={preferences.wrapCellText} onChange={(value) => set("wrapCellText", value)} />
            </div>
          </PreferenceSection>

          <PreferenceSection {...common} tab="behaviour" title="Billing" subtitle="The tax invoice workspace." icon={<MonitorCog className="size-4" />}
            keys={["billingLayout"]} keywords="billing invoice layout workspace split vertical">
            <div><Select label="Billing workspace layout" value={preferences.billingLayout} onChange={(event) => set("billingLayout", event.target.value as BillingLayout)} options={[{ label: "Workspace tabs", value: "workspace" }, { label: "Vertical sections", value: "vertical" }, { label: "Split header and lines", value: "split" }]} /></div>
          </PreferenceSection>

          {/* ================= PAGE ================= */}
          <PreferenceSection {...common} tab="page" tour="prefs-theme" title="Theme" subtitle="Thirteen palettes. Each card is drawn with that theme's real tokens." icon={<Sparkles className="size-4" />}
            keys={["theme"]} keywords="theme dark light colour color palette midnight nord plum graphite">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {THEME_OPTIONS.map((theme) => <ThemeCard key={theme.id} id={theme.id} name={theme.name} description={theme.description} active={preferences.theme === theme.id} onSelect={() => set("theme", theme.id)} />)}
            </div>
          </PreferenceSection>

          <PreferenceSection {...common} tab="page" tour="prefs-type" title="Typography" subtitle="Fonts and sizes for the shell, forms and result lists." icon={<Languages className="size-4" />}
            keys={["fontFamily", "fontSizeBase", "fontSizeForm", "fontSizeResult", "density", "cornerRadius"]} keywords="font family size typography plex inter manrope nunito source sans georgia serif mono base form result table density compact spacious corners radius rounded square">
            <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
              <Select label="Font family" value={preferences.fontFamily} onChange={(event) => set("fontFamily", event.target.value as FontFamily)} options={[
                { label: "Inter (default)", value: "inter" }, { label: "IBM Plex Sans", value: "plex" }, { label: "Source Sans 3", value: "source-sans" }, { label: "Nunito Sans", value: "nunito" },
                { label: "Manrope", value: "manrope" }, { label: "System UI", value: "system" }, { label: "Georgia (serif)", value: "georgia" }, { label: "IBM Plex Mono", value: "plex-mono" },
              ]} />
              <RangeInput label="Base font size" hint="Header, sidebar, cards and everything not listed below." value={preferences.fontSizeBase} min={11} max={16} step={0.5} unit="px" onChange={(value) => set("fontSizeBase", value)} />
              <RangeInput label="Form field size" hint="Record forms: labels, inputs and section text." value={preferences.fontSizeForm} min={11} max={17} step={0.5} unit="px" onChange={(value) => set("fontSizeForm", value)} />
              <RangeInput label="Result / table size" hint="Worklist tables and card grids." value={preferences.fontSizeResult} min={10} max={16} step={0.5} unit="px" onChange={(value) => set("fontSizeResult", value)} />
              <Select label="Density" hint="Row padding in tables and cards." value={preferences.density} onChange={(event) => set("density", event.target.value as Density)} options={[{ label: "Compact", value: "compact" }, { label: "Comfortable", value: "comfortable" }, { label: "Spacious", value: "spacious" }]} />
              <RangeInput label="Corner radius" hint="0 squares every corner in the app." value={preferences.cornerRadius} min={0} max={20} step={1} unit="px" onChange={(value) => set("cornerRadius", value)} />
            </div>
            <p className="mt-3 text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]">13px is the design as drawn. Each size scales its area independently, so dense tables and readable forms are not a trade-off.</p>
          </PreferenceSection>

          {/* ================= NOTIFICATION ================= */}
          <PreferenceSection {...common} tab="notification" tour="prefs-toast" title="Toasts" subtitle="Where they appear, how long they stay, and how they look. Try one below." icon={<BellRing className="size-4" />}
            keys={["toastPosition", "toastDuration", "maxVisibleToasts", "toastStyle"]} keywords="toast notification position duration solid light style preview">
            <div className="grid gap-4 md:grid-cols-2">
              <Select label="Position" value={preferences.toastPosition} onChange={(event) => set("toastPosition", event.target.value as ToastPosition)} options={[
                { label: "Top left", value: "top-left" }, { label: "Top center", value: "top-center" }, { label: "Top right", value: "top-right" }, { label: "Bottom left", value: "bottom-left" }, { label: "Bottom center", value: "bottom-center" }, { label: "Bottom right", value: "bottom-right" },
              ]} />
              <Select label="Duration" value={String(preferences.toastDuration)} onChange={(event) => set("toastDuration", Number(event.target.value) as 2000 | 3500 | 5000 | 8000)} options={[{ label: "2 seconds", value: "2000" }, { label: "3.5 seconds", value: "3500" }, { label: "5 seconds", value: "5000" }, { label: "8 seconds", value: "8000" }]} />
              <Select label="On screen at once" value={String(preferences.maxVisibleToasts)} onChange={(event) => set("maxVisibleToasts", Number(event.target.value) as 1 | 3 | 5)} options={[{ label: "1 — newest only", value: "1" }, { label: "3", value: "3" }, { label: "5", value: "5" }]} />
              <Select label="Style" value={preferences.toastStyle} onChange={(event) => set("toastStyle", event.target.value as ToastStyle)} options={[{ label: "Solid — filled with its colour", value: "solid" }, { label: "Light — tinted icon on a surface", value: "light" }]} />
            </div>
            {/* A settings page that demonstrates its own settings: fire one with the
                position, duration and style above without leaving the page. */}
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
              <span className="text-[length:calc(10px*var(--fs-scale))] font-extrabold">Preview</span>
              <span className="text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]">Fires a sample using the settings above.</span>
              <div className="ml-auto flex flex-wrap gap-1.5">
                <Button size="xs" variant="success" onClick={() => toast({ title: "Customer saved", message: "CUS-1042 updated successfully.", type: "success" })}>Success</Button>
                <Button size="xs" variant="secondary" onClick={() => toast({ title: "Credit limit", message: "Exceeded by AED 12,400 on this order.", type: "warning" })}>Warning</Button>
                <Button size="xs" variant="danger" onClick={() => toast({ title: "Posting failed", message: "Period 2026-P08 is locked.", type: "error" })}>Error</Button>
                <Button size="xs" variant="ghost" onClick={() => toast({ title: "Bank feed", message: "2,486 transactions imported.", type: "info" })}>Info</Button>
              </div>
            </div>
          </PreferenceSection>

          {/* ================= GENERAL ================= */}
          <PreferenceSection {...common} tab="general" title="Numbers, currency and dates" subtitle="Applied wherever a value is rendered: worklists, cards, previews, reports and billing." icon={<Coins className="size-4" />}
            keys={["currencyCode", "currencyDisplay", "numberLocale", "dateFormat", "decimalPlaces", "timeFormat", "negativeStyle"]} keywords="number currency dirham aed money decimal thousands lakh date time 12 24 hour negative parentheses accounting format locale">
            <div className="grid gap-4 md:grid-cols-2">
              {SHOW_CURRENCY_PICKER ? <Select label="Currency" value={preferences.currencyCode} onChange={(event) => set("currencyCode", event.target.value as CurrencyCode)} options={[{ label: "AED — UAE dirham", value: "AED" }, { label: "USD — US dollar", value: "USD" }, { label: "EUR — Euro", value: "EUR" }, { label: "INR — Indian rupee", value: "INR" }, { label: "GBP — Pound sterling", value: "GBP" }]} /> : null}
              <Select label="Currency shown as" value={preferences.currencyDisplay} onChange={(event) => set("currencyDisplay", event.target.value as CurrencyDisplay)} options={[{ label: "Symbol — د.إ1,200", value: "symbol" }, { label: "Code — AED 1,200", value: "code" }, { label: "Number only — 1,200", value: "none" }]} />
              <Select label="Number format" value={preferences.numberLocale} onChange={(event) => set("numberLocale", event.target.value as NumberLocale)} options={[{ label: "1,234,567.89", value: "en-US" }, { label: "1.234.567,89", value: "de-DE" }, { label: "1 234 567,89", value: "fr-FR" }, { label: "12,34,567.89 — lakh/crore", value: "en-IN" }]} />
              <Select label="Decimal places" value={String(preferences.decimalPlaces)} onChange={(event) => set("decimalPlaces", Number(event.target.value) as 0 | 2 | 3)} options={[{ label: "None — 1,200", value: "0" }, { label: "Two — 1,200.00", value: "2" }, { label: "Three — 1,200.000", value: "3" }]} />
              <Select label="Negative amounts" value={preferences.negativeStyle} onChange={(event) => set("negativeStyle", event.target.value as NegativeStyle)} options={[{ label: "Minus sign — -1,200", value: "minus" }, { label: "Parentheses — (1,200)", value: "parentheses" }]} />
              <Select label="Date format" value={preferences.dateFormat} onChange={(event) => set("dateFormat", event.target.value as DateFormat)} options={[{ label: "2026-09-03 — ISO", value: "iso" }, { label: "03/09/2026 — day first", value: "dmy" }, { label: "09/03/2026 — month first", value: "mdy" }, { label: "03 Sep 2026", value: "medium" }]} />
              <Select label="Time format" value={preferences.timeFormat} onChange={(event) => set("timeFormat", event.target.value as TimeFormat)} options={[{ label: "24-hour — 14:30", value: "24h" }, { label: "12-hour — 2:30 PM", value: "12h" }]} />
            </div>
          </PreferenceSection>

          <PreferenceSection {...common} tab="general" title="Clock" subtitle="The clock in the header." icon={<Clock3 className="size-4" />}
            keys={["clockSeconds", "clockZone"]} keywords="clock time seconds timezone zone branch dubai kochi header">
            <div className="grid gap-4 md:grid-cols-2">
              <Select label="Time zone" value={preferences.clockZone} onChange={(event) => set("clockZone", event.target.value as ClockZone)} options={[{ label: "This device", value: "browser" }, { label: `Selected branch — ${branchLabel}`, value: "branch" }]} />
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <Toggle label="Show seconds" description="Off ticks once a minute instead of every second." checked={preferences.clockSeconds} onChange={(value) => set("clockSeconds", value)} />
            </div>
          </PreferenceSection>

          {/* ================= LANGUAGE & HELP ================= */}
          {/* Row for row, Vantage's "Language & help" group. "Animations" is the
              inverse of reducedMotion -- one stored key, presented the way the
              copied page presents it. Documentation position is left/right
              rather than Vantage's top/bottom because ours is a side drawer. */}
          <PreferenceSection {...common} tab="language" tour="prefs-lang" title="Language & help" subtitle="Applies to menus, actions and messages." icon={<Languages className="size-4" />}
            keys={["language", "helperEnabled", "documentationEnabled", "docsPosition", "reducedMotion", "showKeyboardHints"]} keywords="language arabic hindi malayalam english rtl help assistant tours documentation docs panel position left right animations motion keyboard shortcuts hints">
            <div className="grid gap-x-5 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
              <Row label="Language" hint="Arabic switches the whole layout to right-to-left">
                <Select aria-label="Language" value={preferences.language} onChange={(event) => set("language", event.target.value as LanguageKey)} options={LANGUAGE_OPTIONS.map((item) => ({ label: `${item.native} — ${item.label}`, value: item.value }))} />
              </Row>
              <Row label="Help assistant button" hint="Guided tours and shortcuts, bottom corner">
                <Segmented<"on" | "off"> label="Help assistant button" value={preferences.helperEnabled ? "on" : "off"} onChange={(value) => set("helperEnabled", value === "on")} options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]} />
              </Row>
              <Row label="Documentation panel on pages">
                <Segmented<"on" | "off"> label="Documentation panel on pages" value={preferences.documentationEnabled ? "on" : "off"} onChange={(value) => set("documentationEnabled", value === "on")} options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]} />
              </Row>
              <Row label="Documentation position" hint="Which side the panel slides in from">
                <Segmented<DocsPosition> label="Documentation position" value={preferences.docsPosition} onChange={(value) => set("docsPosition", value)} options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]} />
              </Row>
              <Row label="Animations" hint="Off minimises every transition and motion effect">
                <Segmented<"on" | "off"> label="Animations" value={preferences.reducedMotion ? "off" : "on"} onChange={(value) => set("reducedMotion", value === "off")} options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]} />
              </Row>
              <Row label="Keyboard shortcut hints" hint="Show discoverable key combinations">
                <Segmented<"on" | "off"> label="Keyboard shortcut hints" value={preferences.showKeyboardHints ? "on" : "off"} onChange={(value) => set("showKeyboardHints", value === "on")} options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]} />
              </Row>
            </div>
          </PreferenceSection>

        </div>
      </div>
    </div>
  );
}
