"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Columns3, Download, FilterX, Grid2X2, ListFilter, MoreHorizontal, Plus, RefreshCw, Rows3, Save, Settings2, Star, Upload } from "lucide-react";
import { getWorklistConfig, FILTER_CLASSIFICATIONS } from "@pepbits/erp-data";
import { useNavigation } from "@pepbits/platform-ports";
import { useERP } from "@pepbits/erp-shell";
import { Button, ConfirmDialog, IconButton, Segmented, classifyFailure } from "@pepbits/ops-ui";
import { SearchInput } from "@pepbits/ops-ui";
import { Badge } from "@pepbits/ops-ui";
import { ActionMenu, MenuButton } from "@pepbits/ops-ui";
import { EmptyState } from "@pepbits/ops-ui";
import { Pagination } from "@pepbits/ops-ui";
import { useColumnLayout } from "./use-column-layout";
import { usePublishAiSources } from "@pepbits/ai-client";
import { InlineAiAction } from "@pepbits/ai-ui";
import { exportRows } from "./export-rows";
import { authedFetch } from "@pepbits/auth";
import { FilterBar } from "./filter-bar";
import { DataTable } from "./data-table";
import { CardGrid } from "./card-grid";
import { ColumnManager } from "./column-manager";
import { RecordPreview } from "./record-preview";
import { storableFilters, partitionFilters } from "@pepbits/erp-config";
import type { DataColumn, PageDefinition, ResultView, FilterDefinition, WorklistConfig } from "@pepbits/erp-config";
import { cn } from "@pepbits/ops-ui";

function valueText(value: string | number | boolean) { return String(value).toLowerCase(); }

type Row = Record<string, string | number | boolean>;
type SavedFilters = { search: string; filters: Record<string, string> };

/* Filters are written at the point of the user's action, not from an effect on
   [search, filters]: an effect fires on the page-change reset too, and would
   save page A's filters under page B's key for one render before the reset
   landed. Last write wins, but the transient wrong write is still a bug. */
/* Filtered on the way IN as well as out: whatever is on disk may have been
   written by a build from before this rule existed. */
function readFilters(pageId: string): SavedFilters | null {
  try {
    const raw = window.localStorage.getItem(`nexora-filters:${pageId}`);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedFilters;
    return { search: "", filters: storableFilters(filterDefinitions(saved.filters ?? {}), saved.filters ?? {}) };
  } catch { return null; }
}

/* The registry, shaped as definitions for whichever keys are in play. */
function filterDefinitions(values: Record<string, string>): FilterDefinition[] {
  return Object.keys(values).map((key) => ({
    key,
    label: key,
    type: "text" as const,
    classification: FILTER_CLASSIFICATIONS[key] ?? "unclassified",
  }));
}
/**
 * The same allowlist that guards the URL guards this.
 *
 * localStorage is not a safer place than a query string — it is unencrypted, it
 * survives logout, and it outlives the session that was authorised to see the
 * value. §17.7 asks for the minimum to be kept there.
 *
 * `search` is dropped outright, and `query` is classified phi for the same
 * reason: both are free-text boxes a user can type anything into, which makes
 * them the single most likely place for a patient name to arrive by accident.
 * That is exactly what a browser check found here — the search box was blanked
 * while the same text went on reaching disk as filters.query.
 */
function writeFilters(pageId: string, saved: SavedFilters) {
  const safe = { search: "", filters: storableFilters(filterDefinitions(saved.filters ?? {}), saved.filters ?? {}) };
  try { window.localStorage.setItem(`nexora-filters:${pageId}`, JSON.stringify(safe)); } catch { /* storage unavailable */ }
}
function clearFilters(pageId: string) {
  try { window.localStorage.removeItem(`nexora-filters:${pageId}`); } catch { /* storage unavailable */ }
}

/* "smart" matches every whitespace-separated token somewhere in the ROW, so
   "dubai active" finds a Dubai customer whose status is Active even though no
   single cell contains both words. The other two modes test each cell alone. */
function rowMatches(row: Row, term: string, mode: "contains" | "starts-with" | "smart"): boolean {
  const values = Object.values(row).map(valueText);
  if (mode === "smart") { const hay = values.join(" "); return term.split(/\s+/).every((token) => hay.includes(token)); }
  if (mode === "starts-with") return values.some((value) => value.startsWith(term));
  return values.some((value) => value.includes(term));
}

export function WorklistPage({ page }: { page: PageDefinition }) {
  const { preferences, updatePreference, toast, format } = useERP();
  const navigation = useNavigation();
  const config = useMemo(() => getWorklistConfig(page.id, page.title, page.entity), [page.entity, page.id, page.title]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [previewRow, setPreviewRow] = useState<Record<string, string | number | boolean> | null>(null);
  const [columnOpen, setColumnOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const defaults = useMemo(() => config.columns.filter((column) => column.defaultVisible !== false).map((column) => column.key), [config.columns]);
  /* Column visibility and sort live in whichever store columnLayoutScope names
     -- this browser, or the account. Everything below is unaware of which. */
  const { visibleKeys, setVisibleKeys, sort, setSort, reset: resetLayout } =
    useColumnLayout(page.id, preferences.columnLayoutScope, config.columns, defaults);

  useEffect(() => {
    /* Every worklist shares this one component instance, so a page change must
       reset what the previous page left behind -- and, when remembering, restore
       what THIS page had. */
    const saved = preferences.rememberFilters ? readFilters(page.id) : null;
    setSearch(saved?.search ?? "");
    setFilters(saved?.filters ?? {});
    setPageNumber(1);
    setSelected([]);
  }, [page.id, preferences.rememberFilters]);

  const persist = (nextSearch: string, nextFilters: Record<string, string>) => {
    if (preferences.rememberFilters) writeFilters(page.id, { search: nextSearch, filters: nextFilters });
  };

  const filtered = useMemo(() => {
    let rows = [...config.rows];
    const term = search.trim().toLowerCase();
    if (term) rows = rows.filter((row) => rowMatches(row, term, preferences.globalSearchMode));
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      if (key === "query" || key === "recordRef" || key === "tags" || key === "createdBy") {
        const q = value.toLowerCase();
        rows = rows.filter((row) => Object.values(row).some((entry) => valueText(entry).includes(q)));
      } else if (key === "from") {
        rows = rows.filter((row) => Object.values(row).filter((entry) => /^\d{4}-\d{2}-\d{2}/.test(String(entry))).some((entry) => String(entry) >= value));
      } else if (key === "to") {
        rows = rows.filter((row) => Object.values(row).filter((entry) => /^\d{4}-\d{2}-\d{2}/.test(String(entry))).some((entry) => String(entry) <= value));
      } else {
        rows = rows.filter((row) => valueText(row[key] ?? "").includes(value.toLowerCase()) || Object.values(row).some((entry) => valueText(entry) === value.toLowerCase()));
      }
    });
    if (sort) rows.sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true });
      return sort.direction === "asc" ? comparison : -comparison;
    });
    return rows;
  }, [config.rows, filters, preferences.globalSearchMode, search, sort]);

  const pageSize = preferences.pageSize;
  /**
   * Corrections made in the table, by record id and column.
   *
   * Held here rather than written through, because these rows are generated in
   * the client and there is no server copy to write to yet. What that means for
   * the framework's §20 conflict model is that it is unexercised, not absent:
   * InlineEdit surfaces a rejected write and keeps the typed value, and the day
   * these rows come from an API with a version on them, the rejection has
   * somewhere to come from.
   */
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  useEffect(() => { setEdits({}); }, [page.id]);

  /* Definitions, from the worklist config plus the classification registry.
     The config says what a filter IS on screen; the registry says what it
     HOLDS, and only the second decides where the value may go. */
  const toDefinitions = useCallback(
    (source: WorklistConfig["basicFilters"]): FilterDefinition[] =>
      source.map((filter) => ({ ...filter, classification: FILTER_CLASSIFICATIONS[filter.key] ?? "unclassified" })),
    [],
  );
  const basicDefinitions = useMemo(() => toDefinitions(config.basicFilters), [config.basicFilters, toDefinitions]);
  const advancedDefinitions = useMemo(() => toDefinitions(config.advancedFilters), [config.advancedFilters, toDefinitions]);
  /**
   * What is being held back, INCLUDING the search box above the bar.
   *
   * That box is separate state and is not one of the config's filters, so it
   * was not reaching the share decision at all: someone could type a name into
   * it and still be offered a copy-link. It is free text a user can type
   * anything into, which is exactly why `query` is classified phi — and the
   * decision has to see it.
   */
  const sensitiveFilterKeys = useMemo(() => {
    const everything = { ...filters, ...(search.trim() ? { query: search } : {}) };
    return partitionFilters(
      [...basicDefinitions, ...advancedDefinitions, { key: "query", label: "Search", type: "text", classification: FILTER_CLASSIFICATIONS.query }],
      everything,
    ).sensitiveKeys.sort();
  }, [basicDefinitions, advancedDefinitions, filters, search]);

  /* The sharing branch. A view holds the filters a URL may not, so the link is
     an opaque id and the values stay on the server. */
  const createSavedView = useCallback(async () => {
    try {
      const response = await authedFetch("/views", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pageId: page.id, label: `${page.title} — filtered`, filters: { ...filters, ...(search.trim() ? { query: search } : {}) } }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const view = (await response.json()) as { id: string };
      const link = `${window.location.origin}/view/${view.id}`;
      await navigator.clipboard?.writeText(link).catch(() => undefined);
      toast({ title: "Saved view created", message: `${view.id} — the link carries no filter values.`, type: "success" });
    } catch (error) {
      /* Through the mapper, so a 403 on a saved view reads as a refusal rather
         than as a broken service — and the reference gives support something to
         trace, since the detail never reaches the screen. */
      const status = Number(error instanceof Error ? error.message : NaN);
      const failure = classifyFailure(Number.isFinite(status) ? { status } : { networkError: true });
      toast({ title: failure.title, message: `${failure.description} Reference: ${failure.reference}`, type: "error" });
    }
  }, [filters, search, page.id, page.title, toast]);

  const pageRows = filtered
    .slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
    .map((row) => {
      const applied = edits[String(row[config.primaryKey])];
      return applied ? { ...row, ...applied } : row;
    });
  const visibleColumns = visibleKeys.map((key) => config.columns.find((column) => column.key === key)).filter(Boolean) as DataColumn[];
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const changeFilter = (key: string, value: string) => { const next = { ...filters, [key]: value }; setFilters(next); persist(search, next); setPageNumber(1); };
  const reset = () => { setFilters({}); setSearch(""); clearFilters(page.id); setPageNumber(1); toast({ title: "Filters reset", message: "The default worklist view has been restored.", type: "info" }); };
  const toggle = (id: string) => setSelected((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  const toggleAll = () => {
    const ids = pageRows.map((row) => String(row[config.primaryKey]));
    const all = ids.every((id) => selected.includes(id));
    setSelected((previous) => all ? previous.filter((id) => !ids.includes(id)) : Array.from(new Set([...previous, ...ids])));
  };
  const toggleSort = (column: DataColumn) => {
    if (!column.sortable) return;
    setSort((previous) => previous?.key === column.key ? { key: column.key, direction: previous.direction === "asc" ? "desc" : "asc" } : { key: column.key, direction: "asc" });
    setPageNumber(1);
  };
  /* On web, openInNewContext is window.open -- so every View click spawned a
     browser tab whether the user wanted one or not. `open` navigates in place.
     On desktop both members append an MDI tab, so this reads as "reuse the
     matching tab" vs "always a new one", which is the same intent. */
  const openRecord = (target: Parameters<typeof navigation.open>[0]) =>
    preferences.openRecordsIn === "same-tab" ? navigation.open(target) : navigation.openInNewContext(target);
  const selectedRows = filtered.filter((row) => selected.includes(String(row[config.primaryKey])));

  /* Offer the selection to the assistant. Publishing is all this page does --
     it hands over rows it is already showing, and the use case decides which
     columns of them may be read. The page never learns what AI does with it,
     and the assistant never reaches in here for more. */
  usePublishAiSources(`worklist:${page.id}`, { "worklist-selection": selectedRows });
  const doExport = (rows: Row[], what: string) => {
    if (!rows.length) { toast({ title: "Nothing to export", message: "No records match the current view.", type: "warning" }); return; }
    const name = exportRows(rows, visibleColumns, format, preferences.exportFormat, page.title);
    toast({ title: "Export ready", message: `${rows.length} ${what} saved as ${name}.`, type: "success" });
  };
  const archive = () => {
    toast({ title: "Archived", message: `${selected.length} records moved to the archive (mock).`, type: "success" });
    setSelected([]);
    setConfirmArchive(false);
  };
  const view = (row: Record<string, string | number | boolean>) => { setPreviewRow(null); openRecord({ pageId: page.id, mode: "view", recordId: String(row[config.primaryKey]), title: `${String(row[config.displayKey])} • View` }); };
  const edit = (row: Record<string, string | number | boolean>) => { setPreviewRow(null); openRecord({ pageId: page.id, mode: "edit", recordId: String(row[config.primaryKey]), title: `${String(row[config.displayKey])} • Edit` }); };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-[var(--shadow-sm)]">
        <div data-tour="search" className="min-w-[240px] flex-1 lg:max-w-xl"><SearchInput value={search} onChange={(value) => { setSearch(value); persist(value, filters); setPageNumber(1); }} className="w-full" placeholder={`Search ${page.title.toLowerCase()} by ID, name or any visible value…`} /></div>
        <Button data-tour="new" variant="primary" leftIcon={<Plus className="size-3.5" />} onClick={() => openRecord({ pageId: page.id, mode: "new", title: `New ${page.title.replace(/ (Master|Worklist)$/i, "")}` })}>New</Button>
        <div className="hidden h-7 w-px bg-[var(--border)] md:block" />
        <ActionMenu align="left" trigger={<Button variant="secondary" leftIcon={<Star className="size-3.5" />}>Saved views</Button>}>
          {(close) => <><MenuButton label="My default view" hint="Table • 8 columns • 20 rows" onClick={close} /><MenuButton label="High priority" hint="4 filters • updated today" onClick={close} /><MenuButton label="Open items by branch" hint="Shared by Operations" onClick={close} /><MenuButton icon={<Save className="size-3.5" />} label="Save current view" onClick={() => { toast({ title: "View saved", message: "Current filters and columns were saved as a personal view.", type: "success" }); close(); }} /></>}
        </ActionMenu>
        <div className="ml-auto flex items-center gap-1">
            {/* Was two IconButtons in a bordered box, which is a segmented
                control drawn by hand: no group name, no radio semantics, and
                two tab stops where there should be one. */}
            <div data-tour="view">
              <Segmented
                label="Result view"
                value={preferences.resultView}
                onChange={(next) => updatePreference("resultView", next as ResultView)}
                options={[
                  { value: "table", label: "Table view", icon: <Rows3 className="size-3.5" />, iconOnly: true },
                  { value: "cards", label: "Card grid view", icon: <Grid2X2 className="size-3.5" />, iconOnly: true },
                ]}
              />
            </div>
          <IconButton data-tour="columns" label="Choose columns" onClick={() => setColumnOpen(true)}><Columns3 className="size-4" /></IconButton>
          <IconButton label="Refresh results" onClick={() => toast({ title: "Worklist refreshed", message: `${filtered.length} mock records synchronized.`, type: "info" })}><RefreshCw className="size-4" /></IconButton>
          <ActionMenu trigger={<IconButton label="More worklist actions"><MoreHorizontal className="size-4" /></IconButton>}>
            {(close) => <><MenuButton icon={<Download className="size-3.5" />} label={`Export visible records (${preferences.exportFormat.toUpperCase()})`} onClick={() => { doExport(filtered, "records"); close(); }} /><MenuButton icon={<Upload className="size-3.5" />} label="Import records" onClick={() => { navigation.open({ pageId: "spreadsheet-studio" }); close(); }} /><MenuButton icon={<Settings2 className="size-3.5" />} label="Page preferences" onClick={() => { navigation.open({ pageId: "preferences" }); close(); }} /></>}
          </ActionMenu>
        </div>
      </div>

        {/* The shared bar, driven by the classification registry. It replaces a
            panel that rendered the same controls with no idea what any of them
            held — which is how a patient name reached localStorage. */}
        <div data-tour="filters">
          <FilterBar
            definitions={basicDefinitions}
            advanced={advancedDefinitions}
            values={filters}
            sensitiveKeys={sensitiveFilterKeys}
            onChange={changeFilter}
            onApply={() => toast({ title: "Filters applied", message: `${filtered.length} matching records found.`, type: "success" })}
            onReset={reset}
            onCopyLink={() => { void navigator.clipboard?.writeText(window.location.href); toast({ title: "Link copied", message: "It carries only the filters that may travel in a URL.", type: "success" }); }}
            onSaveView={() => void createSavedView()}
          />
        </div>

      {selected.length ? <div className="animate-slide-up flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--primary)_25%,var(--border))] bg-[var(--primary-soft)] px-3 py-2"><Badge tone="brand">{selected.length} selected</Badge><span className="text-[length:calc(9.5px*var(--fs-scale))] font-semibold text-[var(--text-muted)]">Bulk operations apply only to records you can update.</span><div className="ml-auto flex gap-1.5"><Button size="xs" variant="secondary" leftIcon={<Archive className="size-3" />} onClick={() => preferences.confirmBulkActions ? setConfirmArchive(true) : archive()}>Archive</Button><Button size="xs" variant="secondary" leftIcon={<Download className="size-3" />} onClick={() => doExport(selectedRows, "selected records")}>Export</Button><InlineAiAction useCaseId="worklist.summarise-selection" label="Summarise" /><Button size="xs" variant="ghost" leftIcon={<FilterX className="size-3" />} onClick={() => setSelected([])}>Clear</Button></div></div> : null}

      <section className="min-h-[420px] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2">
          <div className="flex items-center gap-2"><ListFilter className="size-3.5 text-[var(--primary)]" /><span className="text-[length:calc(10.5px*var(--fs-scale))] font-extrabold">Results</span><Badge tone="neutral">{filtered.length} records</Badge>{activeFilterCount || search ? <Badge tone="brand">Filtered</Badge> : null}</div>
          <div className="flex items-center gap-2 text-[length:calc(8.5px*var(--fs-scale))] font-semibold text-[var(--text-muted)]"><span>View: <b className="text-[var(--text)]">{preferences.resultView === "table" ? "Table" : "Card grid"}</b></span><span className="h-3 w-px bg-[var(--border)]" /><span>Preview: <b className="text-[var(--text)]">{preferences.previewMode.replaceAll("-", " ")}</b></span></div>
        </div>
        {pageRows.length ? preferences.resultView === "table" ? (
          <DataTable
            onCellCommit={(row, column, next) => {
              const id = String(row[config.primaryKey]);
              setEdits((current) => ({ ...current, [id]: { ...current[id], [column.key]: next } }));
              toast({ type: "success", title: `${column.label} updated`, message: `${id} · ${next}` });
            }}
            rows={pageRows} columns={visibleColumns} primaryKey={config.primaryKey} displayKey={config.displayKey} selected={selected} onToggle={toggle} onToggleAll={toggleAll} sort={sort} onSort={toggleSort} onPreview={setPreviewRow} onView={view} onEdit={edit} density={preferences.density} format={format} stickyHeader={preferences.stickyTableHeader} zebra={preferences.zebraStripes} wrap={preferences.wrapCellText} />
        ) : (
          <CardGrid rows={pageRows} columns={visibleColumns} primaryKey={config.primaryKey} displayKey={config.displayKey} selected={selected} onToggle={toggle} onPreview={setPreviewRow} onView={view} onEdit={edit} density={preferences.density} format={format} />
        ) : <EmptyState action={<Button variant="secondary" onClick={reset}>Clear filters</Button>} />}
        <Pagination page={pageNumber} pageSize={pageSize} total={filtered.length} onPageChange={setPageNumber} onPageSizeChange={(size) => { updatePreference("pageSize", size); setPageNumber(1); }} />
      </section>

      <ColumnManager open={columnOpen} onClose={() => setColumnOpen(false)} columns={config.columns} visibleKeys={visibleKeys} onChange={setVisibleKeys} onReset={resetLayout} />
      <ConfirmDialog open={confirmArchive} title={`Archive ${selected.length} records?`} message={<>They will leave every worklist and report until restored. This cannot be undone from the worklist.<br /><br />Turn off <b>Confirm bulk actions</b> in My Preferences to skip this prompt.</>} confirmLabel="Archive" tone="danger" onConfirm={archive} onCancel={() => setConfirmArchive(false)} />
      <RecordPreview row={previewRow} config={config} onClose={() => setPreviewRow(null)} onView={() => previewRow && view(previewRow)} onEdit={() => previewRow && edit(previewRow)} />
    </div>
  );
}
