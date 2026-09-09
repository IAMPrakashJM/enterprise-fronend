"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardGrid,
  Badge,
  Button,
  DescriptionList,
  Input,
  Select,
  Textarea,
  Checkbox,
  DateInput,
  LoadingState,
  RecoveryNotice,
  failureFromError,
  useLocalization,
} from "@pepbits/ops-ui";
import type {
  PatientRecord,
  PatientField,
  PatientMetadata,
  UserPreferences,
  Formatters,
} from "@pepbits/erp-config";
import type { ClinicalTemplateAdapter } from "@pepbits/erp-data";
export type ClinicalView = "query" | "record" | "overview";
export interface PatientDestination {
  view: ClinicalView;
  patientId?: string;
  mode?: "new" | "edit" | "view";
}
export interface ClinicalPageProps {
  adapter: ClinicalTemplateAdapter;
  metadata: PatientMetadata;
  preferences: UserPreferences;
  format: Formatters;
  onOpen: (target: PatientDestination) => void;
  patientId?: string;
  mode?: "new" | "edit" | "view";
}
export function useClinicalLoad<T>(
  load: () => Promise<T>,
  dependencies: React.DependencyList,
) {
  const [value, setValue] = useState<T | null>(null),
    [error, setError] = useState<unknown>(null),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setValue(null);
    setError(null);
    void load()
      .then((v) => {
        if (current) setValue(v);
      })
      .catch((e) => {
        if (current) setError(e);
      });
    return () => {
      current = false;
    };
  }, [...dependencies, revision]);
  return { value, error, retry: () => setRevision((v) => v + 1), setValue };
}
export function ClinicalLoading({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return error ? (
    <RecoveryNotice failure={failureFromError(error)} onRetry={retry} />
  ) : (
    <LoadingState />
  );
}
export function PatientBanner({
  patient,
  actions,
  format,
}: {
  patient: PatientRecord;
  actions?: React.ReactNode;
  format: Formatters;
}) {
  const { t } = useLocalization();
  const name = [
    patient.values.firstName,
    patient.values.middleName,
    patient.values.lastName,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-[var(--primary)]" />
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-xl font-bold text-[var(--primary)]"
            aria-hidden
          >
            {name
              ? name
                  .split(" ")
                  .slice(0, 2)
                  .map((v) => v[0])
                  .join("")
              : "+"}
          </span>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">
                {patient.mrn || t("template.clinical.mrnPending")}
              </Badge>
              <Badge
                tone={
                  patient.values.status === "temporary" ? "warning" : "success"
                }
              >
                {t(`template.clinical.${patient.values.status || "new"}`)}
              </Badge>
            </div>
            <h2 className="text-xl font-bold">
              {name || t("template.clinical.newPatient")}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {[
                patient.values.gender
                  ? t(`template.clinical.${patient.values.gender}`)
                  : "",
                patient.values.birthDate
                  ? format.date(String(patient.values.birthDate))
                  : "",
                patient.values.mobile,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </CardContent>
    </Card>
  );
}
export function PatientFieldControl({
  field,
  value,
  onChange,
  disabled,
  error,
}: {
  field: PatientField;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
  disabled?: boolean;
  error?: string;
}) {
  const common = {
    label: field.label,
    "aria-label": field.label,
    required: field.required,
    disabled,
    error,
  };
  if (field.type === "checkbox")
    return (
      <div className="flex min-h-16 items-center">
        <Checkbox
          label={field.label}
          checked={!!value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
    );
  if (field.type === "select")
    return (
      <Select
        {...common}
        value={String(value ?? "")}
        options={[
          { value: "", label: "template.clinical.select" },
          ...(field.options ?? []),
        ]}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  if (field.type === "textarea")
    return (
      <Textarea
        {...common}
        value={String(value ?? "")}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  if (field.type === "date")
    return (
      <DateInput
        {...common}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  return (
    <Input
      {...common}
      type={field.type}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
export function PatientSummaryPanel({
  patient,
  format,
}: {
  patient: PatientRecord;
  format: Formatters;
}) {
  const { t } = useLocalization();
  return (
    <Card>
      <CardHeader>
        <CardTitle title="template.clinical.summary" />
      </CardHeader>
      <CardContent>
        <DescriptionList
          layout="stacked"
          itemClassName="space-y-1 py-1"
          items={["mrn", "mobile", "email", "birthDate", "branch"].map(
            (id) => ({
              id,
              label: `template.clinical.${id}`,
              value:
                id === "mrn"
                  ? patient.mrn || t("template.clinical.mrnPending")
                  : id === "birthDate"
                    ? format.date(String(patient.values[id] ?? ""))
                    : id === "branch" && patient.values[id]
                      ? t(`template.clinical.${patient.values[id]}`)
                      : String(patient.values[id] || "—"),
            }),
          )}
        />
      </CardContent>
    </Card>
  );
}
export function ClinicalSection({
  title,
  count,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { t } = useLocalization(),
    id = React.useId();
  return (
    <Card>
      <CardHeader>
        <Button
          variant="ghost"
          className="w-full text-start"
          style={{ justifyContent: "space-between" }}
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
        >
          <span className="flex items-center gap-2">
            <span aria-hidden>{open ? "▾" : "▸"}</span>
            <span className="font-bold">{t(title)}</span>
            {count !== undefined ? <Badge>{count}</Badge> : null}
          </span>
          <span className="max-w-[45%] truncate text-xs text-[var(--text-muted)]">
            {summary}
          </span>
        </Button>
      </CardHeader>
      {open ? <CardContent id={id}>{children}</CardContent> : null}
    </Card>
  );
}
export function PatientCollectionEditor({
  id,
  patient,
  metadata,
  update,
  disabled,
  errors,
}: {
  id: string;
  patient: PatientRecord;
  metadata: PatientMetadata;
  update: (record: PatientRecord) => void;
  disabled: boolean;
  errors: Record<string, string>;
}) {
  const { t } = useLocalization();
  const definition = metadata.collections.find((c) => c.id === id);
  if (!definition) return null;
  const rows = patient.collections[id] ?? [];
  const change = (next: typeof rows) =>
    update({ ...patient, collections: { ...patient.collections, [id]: next } });
  return (
    <Card>
      <CardHeader>
        <CardTitle
          title={definition.title}
          action={
            <Button
              disabled={disabled || rows.length >= 30}
              onClick={() =>
                change([
                  ...rows,
                  Object.fromEntries([
                    ["id", crypto.randomUUID()],
                    ...definition.fields.map((f) => [f.id, ""]),
                  ]),
                ])
              }
            >
              {t("template.clinical.add")}
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {!rows.length ? (
          <p className="text-sm text-[var(--text-muted)]">
            {t("template.clinical.noneRecorded")}
          </p>
        ) : (
          rows.map((row, index) => (
            <div
              key={row.id}
              className="space-y-2 border-b border-[var(--border)] pb-4 last:border-0"
            >
              <CardGrid columns={2}>
                {definition.fields.map((field) => (
                  <PatientFieldControl
                    key={field.id}
                    field={field}
                    value={row[field.id] ?? ""}
                    disabled={disabled}
                    error={errors[`${id}.${index}.${field.id}`]}
                    onChange={(value) =>
                      change(
                        rows.map((r, i) =>
                          i === index ? { ...r, [field.id]: String(value) } : r,
                        ),
                      )
                    }
                  />
                ))}
              </CardGrid>
              <Button
                variant="ghost"
                disabled={disabled}
                onClick={() => change(rows.filter((_, i) => i !== index))}
              >
                {t("template.remove")}
              </Button>
            </div>
          ))
        )}
        {errors[id] ? <p role="alert">{t(errors[id])}</p> : null}
        {id === "documents" ? (
          <p className="text-xs text-[var(--text-muted)]">
            {t("template.clinical.documentNote")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
