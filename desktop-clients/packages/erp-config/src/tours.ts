import type { PageKind } from "./types";

/**
 * Guided tours, one per page kind. Each step names a `data-tour` anchor on the
 * page; the help panel spotlights that element and shows the text beside it.
 *
 * A step whose anchor is not on the page is skipped at runtime rather than
 * failing, so a tour can list an element that only some layouts render (the
 * billing tab strip, say) without every layout having to carry it.
 */
export interface TourStep {
  target: string;
  title: string;
  text: string;
}

export const TOURS: Record<PageKind | "default", TourStep[]> = {
  /* Deliberately short. This screen is read by someone who already knows what a
     provider key is; a tour that explains the obvious is the one people learn to
     dismiss without reading. */
  consultation: [
    { target: "compose", title: "Four layers, one screen", text: "Type, specialty, complaint and patient context compose the template. The same engine covers every combination without a page for each." },
    { target: "source", title: "Every section says why", text: "Each section names the layer that added it, so a field you are asked to fill can always be traced back to the choice that put it there." },
  ],
  inbox: [
    { target: "filter", title: "Unread only", text: "The header count and this list read the same data, so what it says is unread is what you will find here." },
    { target: "target", title: "Every item goes somewhere", text: "An item you cannot act on is a nag. Where there is a record behind it, Open takes you straight there." },
  ],
  "ai-admin": [
    { target: "credential", title: "Write-only", text: "A key can be set, replaced and removed here, and never read back. The last four characters and a fingerprint are what tell two keys apart." },
    { target: "limits", title: "Limits that bite", text: "Requests per minute and tokens per day are enforced on every dispatch. A missing or zero value falls back to the server default, never to unlimited." },
  ],
  worklist: [
    { target: "search", title: "Find records", text: "Start typing to search every visible column. How it matches — smart, contains or starts-with — is a preference." },
    { target: "filters", title: "Refine with filters", text: "Basic filters are always visible. Open Advanced filters for dates and less common fields." },
    { target: "view", title: "Choose a view", text: "Switch between a dense table and a card grid. Your choice is saved to your account." },
    { target: "columns", title: "Pick your columns", text: "Show or hide columns per worklist. Click a header to sort. Saved per browser or per account, your choice." },
    { target: "new", title: "Create a record", text: "New opens a blank form — in a new tab or in place, per your preference." },
  ],
  form: [
    { target: "form-nav", title: "Sections", text: "The record is grouped into sections. Navigate with the rail, tabs or wizard steps — pick which in Preferences." },
    { target: "form-body", title: "Fields", text: "Every control is a shared component: text, select, multi-select, date, toggle. One schema drives view, edit and new." },
    { target: "form-actions", title: "Save", text: "Save shows a toast where your preferences place it." },
  ],
  billing: [
    { target: "bill-tabs", title: "Header entries", text: "Bill, customer and insurance details live in header tabs. The layout — tabs, vertical or split — is a preference." },
    { target: "bill-lines", title: "Line items", text: "Add products; quantity, price and tax compute totals live." },
    { target: "bill-summary", title: "Totals", text: "Subtotal, tax and balance update as you type. Print produces the tax invoice." },
  ],
  dashboard: [
    { target: "kpis", title: "Key figures", text: "Headline metrics for the module, with change versus last period." },
    { target: "chart", title: "Trend", text: "Twelve-month trend of the primary measure." },
    { target: "recent", title: "Action queue", text: "What needs attention, prioritised by impact. Click a row to open it." },
  ],
  reports: [
    { target: "report-list", title: "Pick a report", text: "Reports are grouped by module and dimension." },
    { target: "report-filters", title: "Filter", text: "Date range presets plus advanced filters." },
    { target: "report-actions", title: "Run or schedule", text: "Run to see results now, or schedule delivery to your email." },
  ],
  spreadsheet: [
    { target: "sheet-bar", title: "Formula bar", text: "Select a cell; type a value or a formula starting with =." },
    { target: "sheet", title: "Grid", text: "Arrow keys move, Enter commits, Tab moves right." },
    { target: "sheet-tools", title: "Import & export", text: "Import a workbook or CSV, export what you have." },
  ],
  preferences: [
    { target: "prefs-layout", title: "Layout", text: "Sidebar side, form style, result view, quick view and page size. Honoured by every module and page." },
    { target: "prefs-sidebar", title: "Sidebar", text: "Placement, hover or click to open, pinning, and the rail's own palette — which can be a different theme from the page." },
    { target: "prefs-theme", title: "Themes", text: "Thirteen themes; every component picks up tokens instantly. Each card is drawn with that theme's real colours." },
    { target: "prefs-type", title: "Typography", text: "Font family and three independent sizes — shell, forms and result tables — plus density and corner radius." },
    { target: "prefs-toast", title: "Toasts", text: "Position, duration and style of notifications. Try one with the preview buttons." },
    { target: "prefs-lang", title: "Language & help", text: "Language and direction, the help assistant, documentation and animations." },
  ],
  library: [
    { target: "module", title: "Developer library", text: "Component documentation and the page registry that every screen is rendered from." },
    { target: "sidebar", title: "Browse", text: "Architecture, components, patterns and configuration are grouped in the sidebar." },
  ],
  default: [
    { target: "module", title: "Modules", text: "Switch module; the sidebar reloads with that module's menu." },
    { target: "sidebar", title: "Sidebar", text: "Hover to expand, click the pin to keep it open. Three levels: section, group, page." },
    { target: "profile", title: "Profile", text: "Settings, profile, preferences and sign out." },
  ],
};

/** Every shortcut the shell or a page handles. Kept beside the tours because
    the help panel lists both, and a shortcut that exists here but not in a
    keydown handler is a lie the panel tells. */
/* HOTKEYS lived here and the help panel wrote the same list out again.
   Replaced by SHORTCUTS in shortcuts.ts, which the binder, the help panel and
   the preferences page all read — so a shortcut cannot work and be documented
   wrong at the same time. */
