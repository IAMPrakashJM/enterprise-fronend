"use client";

import React from "react";
import { BellRing, CheckCircle2, Languages, MonitorCog, PanelLeft, Settings2, SlidersHorizontal, Sparkles, Table2 } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Select, Toggle, cn } from "@pepbits/ops-ui";
import { LANGUAGE_OPTIONS, THEME_OPTIONS } from "@pepbits/erp-config";
import type {
  BillingLayout, Density, FormNavigation, LanguageKey, PreviewMode, ResultView,
  SidebarPlacement, ThemeKey, ToastPosition, UserPreferences,
} from "@pepbits/erp-config";
import { useERP } from "@pepbits/erp-shell";

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

export function PreferencesPage({ showTabPreferences = true }: { showTabPreferences?: boolean }) {
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
            {/* Desktop only: on web the browser owns tab creation, so the control governs nothing. */}
            {showTabPreferences ? <Toggle label="Open records in tabs" description="Keep parallel records available in the workspace." checked={preferences.openRecordsInTabs} onChange={(value) => set("openRecordsInTabs", value)} /> : null}
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

