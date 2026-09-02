"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Archive, Columns3, Download, FilterX, Grid2X2, ListFilter, MoreHorizontal, Plus, RefreshCw, Rows3, Save, Settings2, Star, Upload } from "lucide-react";
import { getWorklistConfig } from "@pepbits/erp-data";
import { useNavigation } from "@pepbits/platform-ports";
import { useERP } from "@pepbits/erp-shell";
import { Button, IconButton } from "@pepbits/ops-ui";
import { SearchInput } from "@pepbits/ops-ui";
import { Badge } from "@pepbits/ops-ui";
import { ActionMenu, MenuButton } from "@pepbits/ops-ui";
import { EmptyState } from "@pepbits/ops-ui";
import { Pagination } from "@pepbits/ops-ui";
import { FilterPanel } from "./filter-panel";
import { DataTable } from "./data-table";
import { CardGrid } from "./card-grid";
import { ColumnManager } from "./column-manager";
import { RecordPreview } from "./record-preview";
import type { DataColumn, PageDefinition } from "@pepbits/erp-config";
import { cn } from "@pepbits/ops-ui";

function valueText(value: string | number | boolean) { return String(value).toLowerCase(); }

export function WorklistPage({ page }: { page: PageDefinition }) {
  const { preferences, updatePreference, toast } = useERP();
  const navigation = useNavigation();
  const config = useMemo(() => getWorklistConfig(page.id, page.title, page.entity), [page.entity, page.id, page.title]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [previewRow, setPreviewRow] = useState<Record<string, string | number | boolean> | null>(null);
  const [columnOpen, setColumnOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const defaults = useMemo(() => config.columns.filter((column) => column.defaultVisible !== false).map((column) => column.key), [config.columns]);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(defaults);

  useEffect(() => {
    try {
      const savedColumns = window.localStorage.getItem(`nexora-columns:${page.id}`);
      if (savedColumns) {
        const parsed = JSON.parse(savedColumns) as string[];
        const valid = parsed.filter((key) => config.columns.some((column) => column.key === key));
        if (valid.length) setVisibleKeys(valid);
      } else setVisibleKeys(defaults);
      const savedSort = window.localStorage.getItem(`nexora-sort:${page.id}`);
      if (savedSort) setSort(JSON.parse(savedSort));
    } catch {
      setVisibleKeys(defaults);
    }
    setPageNumber(1);
    setSelected([]);
  }, [config.columns, defaults, page.id]);

  useEffect(() => {
    window.localStorage.setItem(`nexora-columns:${page.id}`, JSON.stringify(visibleKeys));
  }, [page.id, visibleKeys]);
  useEffect(() => {
    if (sort) window.localStorage.setItem(`nexora-sort:${page.id}`, JSON.stringify(sort));
  }, [page.id, sort]);

  const filtered = useMemo(() => {
    let rows = [...config.rows];
    const term = search.trim().toLowerCase();
    if (term) rows = rows.filter((row) => Object.values(row).some((value) => valueText(value).includes(term)));
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
  }, [config.rows, filters, search, sort]);

  const pageSize = preferences.pageSize;
  const pageRows = filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  const visibleColumns = visibleKeys.map((key) => config.columns.find((column) => column.key === key)).filter(Boolean) as DataColumn[];
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const changeFilter = (key: string, value: string) => { setFilters((previous) => ({ ...previous, [key]: value })); setPageNumber(1); };
  const reset = () => { setFilters({}); setSearch(""); setPageNumber(1); toast({ title: "Filters reset", message: "The default worklist view has been restored.", type: "info" }); };
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
  const view = (row: Record<string, string | number | boolean>) => { setPreviewRow(null); navigation.openInNewContext({ pageId: page.id, mode: "view", recordId: String(row[config.primaryKey]), title: `${String(row[config.displayKey])} • View` }); };
  const edit = (row: Record<string, string | number | boolean>) => { setPreviewRow(null); navigation.openInNewContext({ pageId: page.id, mode: "edit", recordId: String(row[config.primaryKey]), title: `${String(row[config.displayKey])} • Edit` }); };

  return (
    <div className="mx-auto flex max-w-[1900px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-[var(--shadow-sm)]">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPageNumber(1); }} className="min-w-[240px] flex-1 lg:max-w-xl" placeholder={`Search ${page.title.toLowerCase()} by ID, name or any visible value…`} />
        <Button variant="primary" leftIcon={<Plus className="size-3.5" />} onClick={() => navigation.openInNewContext({ pageId: page.id, mode: "new", title: `New ${page.title.replace(/ (Master|Worklist)$/i, "")}` })}>New</Button>
        <div className="hidden h-7 w-px bg-[var(--border)] md:block" />
        <ActionMenu align="left" trigger={<Button variant="secondary" leftIcon={<Star className="size-3.5" />}>Saved views</Button>}>
          {(close) => <><MenuButton label="My default view" hint="Table • 8 columns • 20 rows" onClick={close} /><MenuButton label="High priority" hint="4 filters • updated today" onClick={close} /><MenuButton label="Open items by branch" hint="Shared by Operations" onClick={close} /><MenuButton icon={<Save className="size-3.5" />} label="Save current view" onClick={() => { toast({ title: "View saved", message: "Current filters and columns were saved as a personal view.", type: "success" }); close(); }} /></>}
        </ActionMenu>
        <div className="ml-auto flex items-center gap-1">
          <div className="flex rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] p-0.5"><IconButton label="Table view" className={cn("size-7", preferences.resultView === "table" && "bg-[var(--surface)] text-[var(--primary)] shadow-sm")} onClick={() => updatePreference("resultView", "table")}><Rows3 className="size-3.5" /></IconButton><IconButton label="Card grid view" className={cn("size-7", preferences.resultView === "cards" && "bg-[var(--surface)] text-[var(--primary)] shadow-sm")} onClick={() => updatePreference("resultView", "cards")}><Grid2X2 className="size-3.5" /></IconButton></div>
          <IconButton label="Choose columns" onClick={() => setColumnOpen(true)}><Columns3 className="size-4" /></IconButton>
          <IconButton label="Refresh results" onClick={() => toast({ title: "Worklist refreshed", message: `${filtered.length} mock records synchronized.`, type: "info" })}><RefreshCw className="size-4" /></IconButton>
          <ActionMenu trigger={<IconButton label="More worklist actions"><MoreHorizontal className="size-4" /></IconButton>}>
            {(close) => <><MenuButton icon={<Download className="size-3.5" />} label="Export visible records" onClick={() => { toast({ title: "Export prepared", message: `${filtered.length} records are ready for export.`, type: "success" }); close(); }} /><MenuButton icon={<Upload className="size-3.5" />} label="Import records" onClick={() => { navigation.open({ pageId: "spreadsheet-studio" }); close(); }} /><MenuButton icon={<Settings2 className="size-3.5" />} label="Page preferences" onClick={() => { navigation.open({ pageId: "preferences" }); close(); }} /></>}
          </ActionMenu>
        </div>
      </div>

      <FilterPanel config={config} values={filters} onChange={changeFilter} advancedOpen={advancedOpen} onAdvancedToggle={() => setAdvancedOpen((previous) => !previous)} onApply={() => toast({ title: "Filters applied", message: `${filtered.length} matching records found.`, type: "success" })} onReset={reset} activeFilterCount={activeFilterCount} />

      {selected.length ? <div className="animate-slide-up flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--primary)_25%,var(--border))] bg-[var(--primary-soft)] px-3 py-2"><Badge tone="brand">{selected.length} selected</Badge><span className="text-[9.5px] font-semibold text-[var(--text-muted)]">Bulk operations apply only to records you can update.</span><div className="ml-auto flex gap-1.5"><Button size="xs" variant="secondary" leftIcon={<Archive className="size-3" />}>Archive</Button><Button size="xs" variant="secondary" leftIcon={<Download className="size-3" />}>Export</Button><Button size="xs" variant="ghost" leftIcon={<FilterX className="size-3" />} onClick={() => setSelected([])}>Clear</Button></div></div> : null}

      <section className="min-h-[420px] overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2">
          <div className="flex items-center gap-2"><ListFilter className="size-3.5 text-[var(--primary)]" /><span className="text-[10.5px] font-extrabold">Results</span><Badge tone="neutral">{filtered.length} records</Badge>{activeFilterCount || search ? <Badge tone="brand">Filtered</Badge> : null}</div>
          <div className="flex items-center gap-2 text-[8.5px] font-semibold text-[var(--text-muted)]"><span>View: <b className="text-[var(--text)]">{preferences.resultView === "table" ? "Table" : "Card grid"}</b></span><span className="h-3 w-px bg-[var(--border)]" /><span>Preview: <b className="text-[var(--text)]">{preferences.previewMode.replaceAll("-", " ")}</b></span></div>
        </div>
        {pageRows.length ? preferences.resultView === "table" ? (
          <DataTable rows={pageRows} columns={visibleColumns} primaryKey={config.primaryKey} displayKey={config.displayKey} selected={selected} onToggle={toggle} onToggleAll={toggleAll} sort={sort} onSort={toggleSort} onPreview={setPreviewRow} onView={view} onEdit={edit} density={preferences.density} />
        ) : (
          <CardGrid rows={pageRows} columns={visibleColumns} primaryKey={config.primaryKey} displayKey={config.displayKey} selected={selected} onToggle={toggle} onPreview={setPreviewRow} onView={view} onEdit={edit} density={preferences.density} />
        ) : <EmptyState action={<Button variant="secondary" onClick={reset}>Clear filters</Button>} />}
        <Pagination page={pageNumber} pageSize={pageSize} total={filtered.length} onPageChange={setPageNumber} onPageSizeChange={(size) => { updatePreference("pageSize", size); setPageNumber(1); }} />
      </section>

      <ColumnManager open={columnOpen} onClose={() => setColumnOpen(false)} columns={config.columns} visibleKeys={visibleKeys} onChange={setVisibleKeys} onReset={() => setVisibleKeys(defaults)} />
      <RecordPreview row={previewRow} config={config} onClose={() => setPreviewRow(null)} onView={() => previewRow && view(previewRow)} onEdit={() => previewRow && edit(previewRow)} />
    </div>
  );
}
