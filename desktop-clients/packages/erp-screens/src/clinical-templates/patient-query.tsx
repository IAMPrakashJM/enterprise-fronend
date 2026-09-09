"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardGrid,
  Button,
  Badge,
  Input,
  Select,
  DateInput,
  Tabs,
  Checkbox,
  Drawer,
  Modal,
  Pagination,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  ConfirmDialog,
  RecoveryNotice,
  failureFromError,
  useLocalization,
} from "@pepbits/ops-ui";
import type {
  PatientFilters,
  PatientSummary,
  PatientSavedSearch,
  PatientRecord,
} from "@pepbits/erp-config";
import { exportRows } from "../worklist/export-rows";
import {
  ClinicalLoading,
  PatientBanner,
  PatientSummaryPanel,
  useClinicalLoad,
  type ClinicalPageProps,
} from "./shared";
import { PatientCareAction } from "./care-action";
const fields = [
  "mrn",
  "name",
  "birthDate",
  "gender",
  "mobile",
  "email",
  "nationality",
  "status",
] as const;
export function PatientQueryTemplate(props: ClinicalPageProps) {
  const { adapter, metadata, format, preferences, onOpen } = props,
    { t } = useLocalization();
  const [filters, setFilters] = useState<PatientFilters>({}),
    [applied, setApplied] = useState<PatientFilters>({
      pageSize: preferences.pageSize,
    }),
    [view, setView] = useState(preferences.resultView),
    [columns, setColumns] = useState<string[]>([
      "mrn",
      "name",
      "birthDate",
      "gender",
      "mobile",
      "status",
    ]),
    [columnsOpen, setColumnsOpen] = useState(false),
    [selected, setSelected] = useState<PatientSummary | null>(null),
    [detail, setDetail] = useState<"drawer" | "inline" | "modal">("drawer"),
    [care, setCare] = useState<{
      kind: "appointment" | "encounter";
      id: string;
    } | null>(null),
    [presetName, setPresetName] = useState(""),
    [presets, setPresets] = useState<PatientSavedSearch[]>([]),
    [presetId, setPresetId] = useState(""),
    [error, setError] = useState<unknown>(null),
    [exportOpen, setExportOpen] = useState(false),
    [exportBusy, setExportBusy] = useState(false);
  const search = useClinicalLoad(
    () => adapter.search(applied),
    [adapter, applied],
  );
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    void adapter
      .savedSearches()
      .then((v) => {
        if (active.current) setPresets(v);
      })
      .catch((e) => {
        if (active.current) setError(e);
      });
    return () => {
      active.current = false;
    };
  }, [adapter]);
  const nameRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      ) {
        e.preventDefault();
        if (nameRef.current?.getClientRects().length)
          nameRef.current.querySelector("input")?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const apply = () => {
    setApplied({ ...filters, page: 1, pageSize: preferences.pageSize });
    setSelected(null);
  };
  const change = (id: string, value: string) =>
    setFilters((f) => ({ ...f, [id]: value }));
  const savePreset = async () => {
    try {
      setPresets(await adapter.saveSearch(presetName, filters));
      setPresetName("");
    } catch (e) {
      setError(e);
    }
  };
  const download = async () => {
    if (exportBusy) return;
    setExportBusy(true);
    setError(null);
    try {
      const response = await adapter.exportRows(applied);
      exportRows(
        response.rows.map((r) => ({
          mrn: r.mrn,
          patientName: r.name,
          dob: r.birthDate,
          gender: t(`template.clinical.${r.gender}`),
          phone: r.mobile,
          email: r.email,
          status: t(`template.clinical.${r.status}`),
        })),
        [
          { key: "mrn", label: t("template.clinical.mrn") },
          { key: "patientName", label: t("template.clinical.name") },
          { key: "dob", label: t("template.clinical.birthDate"), type: "date" },
          { key: "gender", label: t("template.clinical.gender") },
          { key: "phone", label: t("template.clinical.mobile") },
          { key: "email", label: t("template.clinical.email") },
          { key: "status", label: t("template.clinical.status") },
        ],
        format,
        "csv",
        "clinical-demo-patients",
      );
      setExportOpen(false);
    } catch (e) {
      setError(e);
    } finally {
      setExportBusy(false);
    }
  };
  const actions = (p: PatientSummary) => (
    <div className="flex flex-wrap gap-1">
      {(["view", "edit"] as const).map((mode) => (
        <Button
          key={mode}
          variant="ghost"
          disabled={mode === "edit" && !metadata.canWrite}
          onClick={() => onOpen({ view: "record", patientId: p.id, mode })}
        >
          {t(`template.clinical.${mode}`)}
        </Button>
      ))}
      <Button
        variant="ghost"
        onClick={() => onOpen({ view: "overview", patientId: p.id })}
      >
        {t("template.clinical.overview")}
      </Button>
      <Button
        variant="ghost"
        disabled={!metadata.canWrite}
        onClick={() => setCare({ kind: "appointment", id: p.id })}
      >
        {t("template.clinical.book")}
      </Button>
      <Button
        variant="ghost"
        disabled={!metadata.canWrite}
        onClick={() => setCare({ kind: "encounter", id: p.id })}
      >
        {t("template.clinical.encounter")}
      </Button>
    </div>
  );
  const cell = (p: PatientSummary, id: (typeof fields)[number]) =>
    !p[id]
      ? "—"
      : id === "birthDate"
        ? format.date(p.birthDate)
        : ["gender", "status", "nationality"].includes(id)
          ? t(`template.clinical.${p[id]}`)
          : String(p[id]);
  return (
    <div className="space-y-4" data-clinical-query>
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">
              {t("template.clinical.query")}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {t("template.clinical.queryHelp")}
            </p>
          </div>
          <Button
            variant="primary"
            disabled={!metadata.canWrite}
            onClick={() => onOpen({ view: "record", mode: "new" })}
          >
            {t("template.clinical.newPatient")}
          </Button>
        </CardContent>
      </Card>
      {error ? (
        <RecoveryNotice
          failure={failureFromError(error)}
          onReturn={() => setError(null)}
        />
      ) : null}
      <CardGrid className="items-start gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle title="template.clinical.filters" />
          </CardHeader>
          <CardContent className="space-y-3">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                apply();
              }}
            >
              <div ref={nameRef}>
                <Input
                  label="template.clinical.search"
                  value={filters.q ?? ""}
                  onChange={(e) => change("q", e.target.value)}
                />
              </div>
              <CardGrid columns={2}>
                {["mrn", "firstName", "lastName", "identity", "mobile"].map(
                  (id) => (
                    <Input
                      key={id}
                      label={t(`template.clinical.${id}`)}
                      value={String(filters[id as keyof PatientFilters] ?? "")}
                      onChange={(e) => change(id, e.target.value)}
                    />
                  ),
                )}
                <DateInput
                  label="template.clinical.birthDate"
                  value={filters.birthDate ?? ""}
                  onChange={(e) => change("birthDate", e.target.value)}
                />
                {["gender", "nationality", "status"].map((id) => (
                  <Select
                    key={id}
                    label={t(`template.clinical.${id}`)}
                    value={String(filters[id as keyof PatientFilters] ?? "")}
                    options={[
                      { value: "", label: "template.all" },
                      ...(metadata.sections
                        .flatMap((s) => s.fields)
                        .find((f) => f.id === id)?.options ?? []),
                    ]}
                    onChange={(e) => change(id, e.target.value)}
                  />
                ))}
              </CardGrid>
              <div className="flex gap-2">
                <Button type="submit" variant="primary">
                  {t("template.clinical.search")}
                </Button>
                <Button
                  onClick={() => {
                    setFilters({});
                    setApplied({ pageSize: preferences.pageSize });
                    setPresetId("");
                  }}
                >
                  {t("template.clinical.clear")}
                </Button>
              </div>
            </form>
            <div className="space-y-2 border-t border-[var(--border)] pt-3">
              <Select
                label="template.clinical.savedSearches"
                value={presetId}
                options={[
                  { value: "", label: "template.clinical.select" },
                  ...presets.map((p) => ({ value: p.id, label: p.name })),
                ]}
                onChange={(e) => {
                  setPresetId(e.target.value);
                  const p = presets.find((p) => p.id === e.target.value);
                  if (p) {
                    setFilters(p.filters);
                    setApplied({
                      ...p.filters,
                      page: 1,
                      pageSize: preferences.pageSize,
                    });
                  }
                }}
              />
              <Input
                label="template.clinical.searchName"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  disabled={!presetName.trim()}
                  onClick={() => void savePreset()}
                >
                  {t("template.clinical.saveSearch")}
                </Button>
                <Button
                  disabled={!presetId}
                  onClick={() =>
                    void adapter
                      .deleteSearch(presetId)
                      .then((v) => {
                        setPresets(v);
                        setPresetId("");
                      })
                      .catch(setError)
                  }
                >
                  {t("template.remove")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="min-w-0 space-y-3">
          <Card>
            <CardContent className="flex flex-wrap items-end justify-between gap-3">
              <Tabs
                items={[
                  { id: "table", label: "template.clinical.table" },
                  { id: "cards", label: "template.clinical.cards" },
                ]}
                value={view}
                onChange={(v) => setView(v as typeof view)}
              />
              <div className="flex flex-wrap items-end gap-2">
                <Select
                  label="template.clinical.quickView"
                  value={detail}
                  options={["drawer", "inline", "modal"].map((value) => ({
                    value,
                    label: `template.clinical.${value}`,
                  }))}
                  onChange={(e) => setDetail(e.target.value as typeof detail)}
                />
                <Select
                  label="template.clinical.sort"
                  value={applied.sort ?? "name"}
                  options={["name", "mrn", "birthDate", "registeredAt"].map(
                    (value) => ({ value, label: `template.clinical.${value}` }),
                  )}
                  onChange={(e) =>
                    setApplied((a) => ({ ...a, sort: e.target.value, page: 1 }))
                  }
                />
                <Button
                  onClick={() =>
                    setApplied((a) => ({
                      ...a,
                      direction: a.direction === "desc" ? "asc" : "desc",
                    }))
                  }
                >
                  {t(
                    applied.direction === "desc"
                      ? "template.clinical.desc"
                      : "template.clinical.asc",
                  )}
                </Button>
                <Button onClick={() => setColumnsOpen(true)}>
                  {t("template.clinical.columns")}
                </Button>
                <Button
                  disabled={!search.value?.total}
                  onClick={() => setExportOpen(true)}
                >
                  {t("template.clinical.export")}
                </Button>
              </div>
            </CardContent>
          </Card>
          {!search.value ? (
            <ClinicalLoading error={search.error} retry={search.retry} />
          ) : (
            <>
              <p role="status" className="text-sm text-[var(--text-muted)]">
                {t("template.clinical.resultCount", {
                  count: search.value.total,
                })}
              </p>
              {!search.value.rows.length ? (
                <EmptyState />
              ) : view === "cards" ? (
                <CardGrid className="gap-3 2xl:grid-cols-2">
                  {search.value.rows.map((p) => (
                    <Card key={p.id}>
                      <CardHeader>
                        <CardTitle
                          title={p.name}
                          subtitle={p.mrn}
                          action={
                            <Badge>{t(`template.clinical.${p.status}`)}</Badge>
                          }
                        />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p>
                          {[format.date(p.birthDate), p.mobile].join(" · ")}
                        </p>
                        <Button onClick={() => setSelected(p)}>
                          {t("template.clinical.quickView")}
                        </Button>
                        {actions(p)}
                      </CardContent>
                    </Card>
                  ))}
                </CardGrid>
              ) : (
                <Card>
                  <TableContainer>
                    <Table
                      density={
                        preferences.density === "compact"
                          ? "compact"
                          : "comfortable"
                      }
                      striped
                      bordered
                      className="w-full min-w-[820px]"
                    >
                      <TableHeader>
                        <TableRow>
                          {fields
                            .filter((id) => columns.includes(id))
                            .map((id) => (
                              <TableHead className="p-3 text-start" key={id}>
                                {t(`template.clinical.${id}`)}
                              </TableHead>
                            ))}
                          <TableHead className="p-3 text-start">
                            {t("template.field.actions")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {search.value.rows.map((p) => (
                          <TableRow key={p.id}>
                            {fields
                              .filter((id) => columns.includes(id))
                              .map((id) => (
                                <TableCell className="p-3" key={id}>
                                  {id === "name" ? (
                                    <Button
                                      variant="ghost"
                                      onClick={() => setSelected(p)}
                                    >
                                      {p.name}
                                    </Button>
                                  ) : (
                                    cell(p, id)
                                  )}
                                </TableCell>
                              ))}
                            <TableCell className="p-2">{actions(p)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              )}
              <Pagination
                page={search.value.page}
                pageSize={search.value.pageSize}
                total={search.value.total}
                onPageChange={(page) => setApplied((a) => ({ ...a, page }))}
                onPageSizeChange={(pageSize) =>
                  setApplied((a) => ({ ...a, pageSize, page: 1 }))
                }
              />
            </>
          )}
          {selected && detail === "inline" ? (
            <QuickPatient
              key={selected.id}
              id={selected.id}
              {...props}
              onClose={() => setSelected(null)}
            />
          ) : null}
        </div>
      </CardGrid>
      <Drawer
        open={!!selected && detail === "drawer"}
        onClose={() => setSelected(null)}
        title="template.clinical.quickView"
        width="lg"
      >
        {selected && detail === "drawer" ? (
          <QuickPatient
            key={selected.id}
            id={selected.id}
            {...props}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </Drawer>
      <Modal
        open={!!selected && detail === "modal"}
        onClose={() => setSelected(null)}
        title="template.clinical.quickView"
      >
        {selected && detail === "modal" ? (
          <QuickPatient
            key={selected.id}
            id={selected.id}
            {...props}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </Modal>
      <Modal
        open={columnsOpen}
        onClose={() => setColumnsOpen(false)}
        title="template.clinical.columns"
      >
        <div className="space-y-3">
          {fields.map((id) => (
            <Checkbox
              key={id}
              label={t(`template.clinical.${id}`)}
              checked={columns.includes(id)}
              disabled={columns.length === 1 && columns.includes(id)}
              onChange={(e) =>
                setColumns((c) =>
                  e.target.checked ? [...c, id] : c.filter((v) => v !== id),
                )
              }
            />
          ))}
        </div>
      </Modal>
      <ConfirmDialog
        open={exportOpen}
        title="template.clinical.export"
        message="template.clinical.exportNotice"
        confirmLabel="template.clinical.export"
        onConfirm={() => void download()}
        onCancel={() => {
          if (!exportBusy) setExportOpen(false);
        }}
      />
      {care ? (
        <PatientCareAction
          {...care}
          patientId={care.id}
          adapter={adapter}
          metadata={metadata}
          onClose={() => setCare(null)}
          onDone={() => {
            setCare(null);
            search.retry();
          }}
        />
      ) : null}
    </div>
  );
}
function QuickPatient({
  id,
  onClose,
  ...props
}: ClinicalPageProps & { id: string; onClose: () => void }) {
  const { t } = useLocalization(),
    load = useClinicalLoad<PatientRecord>(
      () => props.adapter.load(id),
      [props.adapter, id],
    );
  if (!load.value)
    return <ClinicalLoading error={load.error} retry={load.retry} />;
  return (
    <div className="space-y-3">
      <PatientBanner patient={load.value} format={props.format} />
      <PatientSummaryPanel patient={load.value} format={props.format} />
      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={() =>
            props.onOpen({ view: "record", patientId: id, mode: "view" })
          }
        >
          {t("template.clinical.openRecord")}
        </Button>
        <Button onClick={onClose}>{t("Close")}</Button>
      </div>
    </div>
  );
}
