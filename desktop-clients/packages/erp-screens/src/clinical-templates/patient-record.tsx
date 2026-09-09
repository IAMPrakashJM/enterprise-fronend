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
  Tabs,
  DescriptionList,
  ConfirmDialog,
  Modal,
  RecoveryNotice,
  failureFromError,
  useLocalization,
} from "@pepbits/ops-ui";
import type {
  PatientRecord,
  PatientSave,
  PatientSection,
} from "@pepbits/erp-config";
import { ClinicalRequestFailure } from "@pepbits/erp-data";
import {
  ClinicalLoading,
  PatientBanner,
  PatientFieldControl,
  PatientCollectionEditor,
  PatientSummaryPanel,
  useClinicalLoad,
  type ClinicalPageProps,
  type PatientDestination,
} from "./shared";
import { PatientInsuranceCheck } from "./insurance-check";
import { PatientCareAction } from "./care-action";
export function PatientRecordTemplate(props: ClinicalPageProps) {
  const { adapter, patientId } = props;
  const loaded = useClinicalLoad(
    () => (patientId ? adapter.load(patientId) : adapter.newRecord()),
    [adapter, patientId],
  );
  return loaded.value ? (
    <PatientRecordEditor
      key={patientId ?? "new"}
      {...props}
      initial={loaded.value}
    />
  ) : (
    <ClinicalLoading error={loaded.error} retry={loaded.retry} />
  );
}
function PatientRecordEditor({
  initial,
  adapter,
  metadata,
  preferences,
  format,
  mode = "new",
  onOpen,
}: ClinicalPageProps & { initial: PatientRecord }) {
  const { t } = useLocalization(),
    [patient, setPatient] = useState(initial),
    [saved, setSaved] = useState(initial),
    [section, setSection] = useState(metadata.sections[0].id),
    [editing, setEditing] = useState(mode !== "view"),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [review, setReview] = useState(false),
    [error, setError] = useState<unknown>(null),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [latest, setLatest] = useState<PatientRecord | null>(null),
    [leave, setLeave] = useState<PatientDestination | null>(null),
    [discard, setDiscard] = useState(false),
    [success, setSuccess] = useState(false),
    [care, setCare] = useState<"appointment" | "encounter" | null>(null),
    [collapsed, setCollapsed] = useState<string[]>([]);
  const pending = useRef<PatientSave | null>(null),
    lock = useRef(false),
    alive = useRef(true),
    disabled = !editing || !metadata.canWrite || busy;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const update = (p: PatientRecord) => {
    if (disabled) return;
    setPatient(p);
    setDirty(true);
    setSuccess(false);
    setError(null);
    pending.current = null;
  };
  const go = (target: PatientDestination) => {
    if (dirty) setLeave(target);
    else onOpen(target);
  };
  const missing = (s: PatientSection) =>
    s.fields.filter(
      (f) => f.required && !String(patient.values[f.id] ?? "").trim(),
    ).length;
  const complete = metadata.sections.filter((s) => !missing(s)).length;
  const reviewSave = () => {
    const e: Record<string, string> = {};
    for (const s of metadata.sections)
      for (const f of s.fields)
        if (f.required && !String(patient.values[f.id] ?? "").trim())
          e[f.id] = "template.validation.required";
    setErrors(e);
    if (Object.keys(e).length) {
      setSection(
        metadata.sections.find((s) => s.fields.some((f) => e[f.id]))!.id,
      );
      return;
    }
    setReview(true);
  };
  const save = async () => {
    if (lock.current || disabled) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    pending.current ??= {
      record: structuredClone(patient),
      expectedVersion: patient.version,
      operationId: crypto.randomUUID(),
    };
    try {
      const result = await adapter.save(pending.current);
      if (!alive.current) return;
      setPatient(result);
      setSaved(result);
      setDirty(false);
      setSuccess(true);
      setErrors({});
      setReview(false);
      pending.current = null;
    } catch (e) {
      if (!alive.current) return;
      setReview(false);
      setError(e);
      if (e instanceof ClinicalRequestFailure) {
        setErrors(e.fieldErrors);
        const s = metadata.sections.find(
          (s) =>
            s.fields.some((f) => e.fieldErrors[f.id]) ||
            s.collections.some((c) =>
              Object.keys(e.fieldErrors).some(
                (k) => k === c || k.startsWith(c + "."),
              ),
            ),
        );
        if (s) setSection(s.id);
      }
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const loadLatest = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const p = await adapter.load(patient.id);
      if (alive.current) setLatest(p);
    } catch (e) {
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const index = metadata.sections.findIndex((s) => s.id === section),
    layout = preferences.formNavigation;
  const sectionContent = (s: PatientSection) => (
    <div className="space-y-3" key={s.id}>
      <Card data-clinical-section={s.id}>
        <CardHeader>
          <CardTitle
            title={s.title}
            subtitle={s.subtitle}
            action={
              <Button
                variant="ghost"
                onClick={() =>
                  setCollapsed((c) =>
                    c.includes(s.id)
                      ? c.filter((v) => v !== s.id)
                      : [...c, s.id],
                  )
                }
              >
                {t(
                  collapsed.includes(s.id)
                    ? "template.clinical.expand"
                    : "template.clinical.readSummary",
                )}
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {collapsed.includes(s.id) || !editing ? (
            <DescriptionList
              items={s.fields.map((f) => ({
                id: f.id,
                label: f.label,
                value:
                  f.type === "checkbox"
                    ? t(
                        patient.values[f.id]
                          ? "template.clinical.yes"
                          : "template.clinical.no",
                      )
                    : f.type === "select" && patient.values[f.id]
                      ? t(
                          f.options?.find(
                            (o) => o.value === patient.values[f.id],
                          )?.label ?? String(patient.values[f.id]),
                        )
                      : f.type === "date"
                        ? format.date(String(patient.values[f.id] ?? ""))
                        : String(patient.values[f.id] || "—"),
              }))}
            />
          ) : (
            <CardGrid columns={2}>
              {s.fields.map((field) => (
                <PatientFieldControl
                  key={field.id}
                  field={field}
                  value={patient.values[field.id]}
                  disabled={disabled}
                  error={errors[field.id]}
                  onChange={(value) =>
                    update({
                      ...patient,
                      values: { ...patient.values, [field.id]: value },
                    })
                  }
                />
              ))}
            </CardGrid>
          )}
        </CardContent>
      </Card>
      {s.id === "insurance" ? (
        <PatientInsuranceCheck
          key={patient.version}
          patient={patient}
          adapter={adapter}
          disabled={
            busy ||
            dirty ||
            patient.id === "new" ||
            !patient.values.hasInsurance
          }
        />
      ) : null}
      {s.collections.map((id) => (
        <PatientCollectionEditor
          key={id}
          id={id}
          patient={patient}
          metadata={metadata}
          update={update}
          disabled={
            disabled ||
            (id === "insurances" && !patient.values.hasInsurance) ||
            (id === "disabilities" && !patient.values.hasDisability)
          }
          errors={errors}
        />
      ))}
    </div>
  );
  return (
    <div className="space-y-4" data-clinical-record>
      <PatientBanner
        patient={patient}
        format={format}
        actions={
          <>
            <Button disabled={busy} onClick={() => go({ view: "query" })}>
              {t("template.clinical.backSearch")}
            </Button>
            {patient.id !== "new" ? (
              <>
                <Button
                  disabled={busy}
                  onClick={() =>
                    go({ view: "overview", patientId: patient.id })
                  }
                >
                  {t("template.clinical.overview")}
                </Button>
                <Button
                  disabled={busy || !metadata.canWrite}
                  onClick={() => setCare("appointment")}
                >
                  {t("template.clinical.book")}
                </Button>
              </>
            ) : null}
            {!editing ? (
              <Button
                variant="primary"
                disabled={!metadata.canWrite}
                onClick={() => setEditing(true)}
              >
                {t("template.clinical.edit")}
              </Button>
            ) : (
              <Button
                variant="primary"
                loading={busy}
                disabled={!metadata.canWrite}
                onClick={reviewSave}
              >
                {t(
                  patient.id === "new"
                    ? "template.clinical.createPatient"
                    : "template.clinical.reviewSave",
                )}
              </Button>
            )}
          </>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge tone={dirty ? "warning" : "success"}>
            {t(
              dirty
                ? "template.unsaved"
                : editing
                  ? "template.clinical.edit"
                  : "template.clinical.view",
            )}
          </Badge>
          <span className="text-sm text-[var(--text-muted)]">
            {t("template.clinical.completeCount", {
              count: complete,
              total: metadata.sections.length,
            })}
          </span>
        </div>
        {dirty ? (
          <Button disabled={busy} onClick={() => setDiscard(true)}>
            {t("template.clinical.discard")}
          </Button>
        ) : null}
      </div>
      {success ? (
        <p role="status" className="rounded-lg bg-[var(--primary-soft)] p-3">
          {t("template.clinical.saved")}
        </p>
      ) : null}
      {error ? (
        <div className="space-y-2">
          <RecoveryNotice
            failure={failureFromError(error)}
            onRetry={() => void save()}
            preservesValues
            busy={busy}
          />
          {(error as { status?: number }).status === 409 ? (
            <Button disabled={busy} onClick={() => void loadLatest()}>
              {t("template.reviewLatest")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {Object.keys(errors).length ? (
        <div
          role="alert"
          className="space-y-1 text-sm text-[var(--danger-ink)]"
        >
          {[...new Set(Object.values(errors))].map((e) => (
            <p key={e}>{t(e)}</p>
          ))}
        </div>
      ) : null}
      <CardGrid className="items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <CardGrid
            className={
              layout === "rail"
                ? "items-start gap-4 xl:grid-cols-[210px_minmax(0,1fr)]"
                : "gap-4"
            }
          >
            {layout === "rail" ? (
              <Card>
                <CardHeader>
                  <CardTitle title="template.clinical.sections" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    role="progressbar"
                    aria-label={t("template.clinical.completion")}
                    aria-valuenow={complete}
                    aria-valuemin={0}
                    aria-valuemax={metadata.sections.length}
                    className="h-2 rounded bg-[var(--surface-2)]"
                  >
                    <div
                      className="h-full rounded bg-[var(--primary)]"
                      style={{
                        width: `${(complete / metadata.sections.length) * 100}%`,
                      }}
                    />
                  </div>
                  <Tabs
                    orientation="vertical"
                    variant="pills"
                    value={section}
                    onChange={setSection}
                    items={metadata.sections.map((s, i) => ({
                      id: s.id,
                      label: s.title,
                      badge: missing(s) ? "!" : String(i + 1).padStart(2, "0"),
                    }))}
                  />
                </CardContent>
              </Card>
            ) : (
              <Tabs
                value={section}
                onChange={setSection}
                items={metadata.sections.map((s) => ({
                  id: s.id,
                  label: s.title,
                  badge: missing(s) ? "!" : undefined,
                }))}
              />
            )}
            <div className="min-w-0 space-y-3">
              {metadata.sections
                .filter((s) => s.id === section)
                .map(sectionContent)}
              {layout === "wizard" ? (
                <div className="flex justify-between gap-2">
                  <Button
                    disabled={index === 0}
                    onClick={() => setSection(metadata.sections[index - 1].id)}
                  >
                    {t("template.previous")}
                  </Button>
                  <Button
                    disabled={index === metadata.sections.length - 1}
                    onClick={() => setSection(metadata.sections[index + 1].id)}
                  >
                    {t("template.next")}
                  </Button>
                </div>
              ) : null}
            </div>
          </CardGrid>
        </div>
        <aside className="space-y-3">
          <PatientSummaryPanel patient={patient} format={format} />
          <Card>
            <CardHeader>
              <CardTitle title="template.clinical.history" />
            </CardHeader>
            <CardContent className="space-y-3">
              {patient.activity.length ? (
                patient.activity
                  .slice(-5)
                  .reverse()
                  .map((a) => (
                    <div
                      key={a.id}
                      className="border-s-2 border-[var(--primary)] ps-3 text-sm"
                    >
                      <p>{t(a.messageKey)}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {a.actor} · {format.date(a.at)}
                      </p>
                    </div>
                  ))
              ) : (
                <p>{t("template.clinical.noneRecorded")}</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </CardGrid>
      <Modal
        open={review}
        onClose={() => {
          if (!busy) setReview(false);
        }}
        title="template.clinical.reviewSave"
        size="xl"
        footer={
          <>
            <Button disabled={busy} onClick={() => setReview(false)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={() => void save()}
            >
              {t(
                patient.id === "new"
                  ? "template.clinical.createPatient"
                  : "template.clinical.confirm",
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm">{t("template.clinical.reviewHelp")}</p>
          {metadata.sections.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle
                  title={s.title}
                  action={
                    <Button
                      disabled={busy}
                      onClick={() => {
                        setReview(false);
                        setSection(s.id);
                      }}
                    >
                      {t("template.clinical.edit")}
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent>
                <DescriptionList
                  items={[
                    ...s.fields
                      .filter(
                        (f) =>
                          patient.values[f.id] !== "" &&
                          patient.values[f.id] !== false,
                      )
                      .map((f) => ({
                        id: f.id,
                        label: f.label,
                        value:
                          f.type === "checkbox"
                            ? t("template.clinical.yes")
                            : f.options
                              ? t(
                                  f.options.find(
                                    (o) => o.value === patient.values[f.id],
                                  )?.label ?? String(patient.values[f.id]),
                                )
                              : String(patient.values[f.id]),
                      })),
                    ...s.collections.map((id) => ({
                      id,
                      label: `template.clinical.${id}`,
                      value: String(patient.collections[id]?.length ?? 0),
                    })),
                  ]}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </Modal>
      <ConfirmDialog
        open={discard}
        title="template.clinical.discard"
        message="template.replaceLocalHelp"
        onCancel={() => setDiscard(false)}
        onConfirm={() => {
          setPatient(structuredClone(saved));
          setDirty(false);
          setErrors({});
          setError(null);
          pending.current = null;
          setDiscard(false);
        }}
      />
      <ConfirmDialog
        open={!!leave}
        title="template.clinical.unsaved"
        message="template.replaceLocalHelp"
        onCancel={() => setLeave(null)}
        onConfirm={() => {
          if (leave) {
            setDirty(false);
            onOpen(leave);
            setLeave(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!latest}
        title="template.reviewLatest"
        message="template.replaceLocalHelp"
        onCancel={() => setLatest(null)}
        onConfirm={() => {
          if (latest) {
            setPatient(latest);
            setSaved(latest);
            setDirty(false);
            setErrors({});
            setError(null);
            pending.current = null;
            setLatest(null);
          }
        }}
      />
      {care ? (
        <PatientCareAction
          kind={care}
          patientId={patient.id}
          adapter={adapter}
          metadata={metadata}
          onClose={() => setCare(null)}
          onDone={() => setCare(null)}
        />
      ) : null}
    </div>
  );
}
