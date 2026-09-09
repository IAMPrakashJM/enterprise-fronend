"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardGrid,
  Modal,
  Select,
  Tabs,
  RecoveryNotice,
  failureFromError,
  useLocalization,
} from "@pepbits/ops-ui";
import {
  validateTriage,
  type TriageAssessment,
  type TriageView,
  type TriageValues,
  type TriageSave,
  type UserPreferences,
  type Formatters,
} from "@pepbits/erp-config";
import type { ClinicalTriageAdapter } from "@pepbits/erp-data";
import { ClinicLedgerTable } from "../clinic-billing/parts";
import { TriageIntake, TriageVitals, TriageHandoff } from "./fields";
const sections = [
  { id: "intake", label: "template.triage.intake" },
  { id: "vitals", label: "template.triage.vitals" },
  { id: "handoff", label: "template.triage.handoffSection" },
];
export function ClinicalTriageEditor({
  initial,
  adapter,
  preferences,
  available,
  format,
  onBusy,
  onDirty,
}: {
  initial: TriageView;
  adapter: ClinicalTriageAdapter;
  preferences: UserPreferences;
  available?: boolean;
  format: Formatters;
  onBusy: (b: boolean) => void;
  onDirty: (b: boolean) => void;
}) {
  const { t } = useLocalization(),
    [data, setData] = useState(initial),
    [record, setRecord] = useState<TriageAssessment>(() =>
      structuredClone(initial.assessments[0] ?? initial.blank),
    ),
    [dirty, setDirty] = useState(false),
    [section, setSection] = useState("intake"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [history, setHistory] = useState(false),
    [confirm, setConfirm] = useState(false),
    [switchTo, setSwitchTo] = useState<string | null>(null),
    [notice, setNotice] = useState("");
  const pending = useRef<TriageSave | null>(null),
    lock = useRef(false),
    root = useRef<HTMLDivElement>(null),
    disabled =
      busy ||
      !!pending.current ||
      !data.canWrite ||
      available === false ||
      record.status === "completed";
  const change = <K extends keyof TriageValues>(
    key: K,
    value: TriageValues[K],
  ) => {
    if (disabled) return;
    setRecord((r) => ({ ...r, values: { ...r.values, [key]: value } }));
    setDirty(true);
    onDirty(true);
    setErrors({});
    setError(null);
    setNotice("");
  };
  const focusErrors = (next: Record<string, string>) => {
    setErrors(next);
    const first = Object.keys(next)[0];
    if (!first) return;
    setSection(
      ["destination", "precautions", "handoff"].includes(first)
        ? "handoff"
        : [
              "complaint",
              "onset",
              "priority",
              "allergyStatus",
              "allergies",
            ].includes(first)
          ? "intake"
          : "vitals",
    );
    requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLElement>(
          `[name="${first}"], [data-field="${first}"] [role="radio"]`,
        )
        ?.focus(),
    );
  };
  const save = async (complete: boolean) => {
    if (
      lock.current ||
      !data.canWrite ||
      available === false ||
      record.status === "completed"
    )
      return;
    if (!pending.current) {
      const invalid = validateTriage(record.values, data.config, complete);
      if (Object.keys(invalid).length) {
        setConfirm(false);
        focusErrors(invalid);
        return;
      }
      pending.current = {
        patientId: record.patientId,
        assessment: record,
        expectedVersion: record.version,
        operationId: crypto.randomUUID(),
        complete,
      };
    }
    lock.current = true;
    setBusy(true);
    onBusy(true);
    setError(null);
    try {
      const saved = await adapter.save(pending.current);
      setRecord(saved);
      setData((d) => ({
        ...d,
        assessments: [saved, ...d.assessments.filter((r) => r.id !== saved.id)],
      }));
      pending.current = null;
      setDirty(false);
      onDirty(false);
      setConfirm(false);
      setNotice(
        saved.status === "completed"
          ? "template.triage.event.completed"
          : "template.triage.event.saved",
      );
    } catch (e) {
      setError(e);
      setConfirm(false);
      if (typeof e === "object" && e && "status" in e && e.status === 400) {
        pending.current = null;
        focusErrors(
          "fieldErrors" in e ? (e.fieldErrors as Record<string, string>) : {},
        );
      }
    } finally {
      lock.current = false;
      setBusy(false);
      onBusy(false);
    }
  };
  useEffect(() => {
    if (!preferences.keyboardShortcuts) return;
    const handler = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "s" &&
        root.current?.contains(document.activeElement)
      ) {
        e.preventDefault();
        void save(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  const choose = (id: string) => {
    const next =
      id === "new"
        ? {
            ...structuredClone(data.blank),
            values: {
              ...structuredClone(data.blank.values),
              measuredAt: new Date().toISOString(),
            },
          }
        : data.assessments.find((r) => r.id === id);
    if (next) {
      setRecord(structuredClone(next));
      pending.current = null;
      setDirty(false);
      onDirty(false);
      setErrors({});
      setError(null);
      setNotice("");
      setSection("intake");
    }
    setSwitchTo(null);
  };
  const requestSwitch = (id: string) => {
    if (dirty || pending.current) setSwitchTo(id);
    else choose(id);
  };
  const reload = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    onBusy(true);
    try {
      const latest = await adapter.load(record.patientId);
      setData(latest);
      const saved = latest.assessments.find((r) => r.id === record.id);
      if (saved?.status === "completed") {
        setRecord(saved);
        setDirty(false);
        onDirty(false);
        setNotice("template.triage.completedLocked");
      } else if (saved)
        setRecord((r) => ({
          ...saved,
          values: r.values,
          encounterId: r.encounterId,
        }));
      pending.current = null;
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      lock.current = false;
      setBusy(false);
      onBusy(false);
    }
  };
  const props = {
      values: record.values,
      config: data.config,
      change,
      disabled,
      errors,
    },
    index = sections.findIndex((s) => s.id === section),
    flat = preferences.formNavigation === "rail";
  return (
    <div
      ref={root}
      className="space-y-3"
      data-triage-editor
      data-layout={preferences.formNavigation}
    >
      <Card>
        <CardContent
          style={{ paddingBlock: ".5rem" }}
          className="flex flex-wrap items-end justify-between gap-3"
        >
          <div className="min-w-56 flex-1">
            <Select
              label="template.triage.encounter"
              placeholder=""
              value={record.encounterId}
              options={[
                { value: "", label: "template.triage.unlinked" },
                ...data.encounters.map((e) => ({
                  value: e.id,
                  label: format.date(e.date) + " • " + t(e.title),
                })),
              ]}
              disabled={disabled}
              error={errors.encounterId}
              onChange={(e) => {
                if (!disabled) {
                  setRecord((r) => ({ ...r, encounterId: e.target.value }));
                  setDirty(true);
                  onDirty(true);
                }
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                record.status === "completed"
                  ? "success"
                  : dirty
                    ? "warning"
                    : "brand"
              }
            >
              {t(
                record.status === "completed"
                  ? "template.triage.completed"
                  : dirty
                    ? "template.triage.unsaved"
                    : record.id === "new"
                      ? "template.triage.new"
                      : "template.triage.draft",
              )}
            </Badge>
            <Button disabled={busy} onClick={() => setHistory(true)}>
              {t("template.triage.history")}
            </Button>
            <Button
              disabled={busy || !data.canWrite || available === false}
              onClick={() => requestSwitch("new")}
            >
              {t("template.triage.new")}
            </Button>
          </div>
        </CardContent>
      </Card>
      {error ? (
        <RecoveryNotice
          failure={failureFromError(error)}
          onRetry={() => void save(pending.current?.complete ?? false)}
        />
      ) : null}
      {error ? (
        <Button disabled={busy} onClick={() => void reload()}>
          {t("template.triage.reload")}
        </Button>
      ) : null}
      {errors.form ? <p role="alert">{t(errors.form)}</p> : null}
      {!flat ? (
        <Tabs items={sections} value={section} onChange={setSection} />
      ) : null}
      {flat ? (
        <>
          <CardGrid
            columns={3}
            style={{
              gridTemplateColumns:
                "minmax(0, 1.15fr) minmax(0, 1.35fr) minmax(0, .7fr)",
            }}
          >
            <TriageIntake {...props} />
            <TriageVitals {...props} />
            <TriageHandoff {...props} vertical />
          </CardGrid>
        </>
      ) : section === "intake" ? (
        <TriageIntake {...props} />
      ) : section === "vitals" ? (
        <TriageVitals {...props} />
      ) : (
        <TriageHandoff {...props} />
      )}
      <Card className="sticky bottom-0 z-10">
        <CardContent
          style={{ paddingBlock: ".5rem" }}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <div className="text-xs text-[var(--text-muted)]" role="status">
            {notice
              ? t(notice)
              : record.updatedAt
                ? t("template.triage.lastSaved") +
                  " " +
                  format.dateTime(record.updatedAt) +
                  " • " +
                  record.actor
                : t("template.triage.manualPriority")}
          </div>
          <div className="flex gap-2">
            {preferences.formNavigation === "wizard" ? (
              <>
                <Button
                  disabled={index === 0}
                  onClick={() => setSection(sections[index - 1].id)}
                >
                  {t("template.previous")}
                </Button>
                <Button
                  disabled={index === sections.length - 1}
                  onClick={() => setSection(sections[index + 1].id)}
                >
                  {t("template.next")}
                </Button>
              </>
            ) : null}
            <Button
              disabled={disabled || !dirty}
              loading={busy}
              onClick={() => void save(false)}
            >
              {t("template.triage.saveDraft")}
            </Button>
            <Button
              variant="primary"
              disabled={disabled}
              onClick={() => {
                const invalid = validateTriage(
                  record.values,
                  data.config,
                  true,
                );
                if (Object.keys(invalid).length) {
                  focusErrors(invalid);
                  return;
                }
                setConfirm(true);
              }}
            >
              {t("template.triage.complete")}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Modal
        open={history}
        onClose={() => setHistory(false)}
        title={t("template.triage.history")}
      >
        <div className="space-y-3">
          <ClinicLedgerTable
            preferences={preferences}
            headers={[
              "template.triage.lastSaved",
              "template.triage.status",
              "template.triage.actor",
              "template.triage.open",
            ]}
            rows={data.assessments.map((r) => ({
              id: r.id,
              cells: [
                format.dateTime(r.updatedAt),
                t("template.triage." + r.status),
                r.actor,
                <Button
                  disabled={busy}
                  onClick={() => {
                    setHistory(false);
                    requestSwitch(r.id);
                  }}
                >
                  {t("template.triage.open")}
                </Button>,
              ],
            }))}
          />
          {record.history.map((event, i) => (
            <p key={i} className="text-xs">
              {format.dateTime(event.at)} • {event.actor} •{" "}
              {t(event.messageKey)}
            </p>
          ))}
        </div>
      </Modal>
      <Modal
        open={confirm}
        onClose={() => {
          if (!busy) setConfirm(false);
        }}
        title={t("template.triage.complete")}
        footer={
          <>
            <Button disabled={busy} onClick={() => setConfirm(false)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="primary"
              loading={busy}
              disabled={busy}
              onClick={() => void save(true)}
            >
              {t("template.clinical.confirm")}
            </Button>
          </>
        }
      >
        <p>{t("template.triage.confirmHint")}</p>
        <p className="mt-3 font-semibold">
          {t(
            data.config.priorities.find(
              (p) => p.value === record.values.priority,
            )?.label ?? "",
          )}{" "}
          •{" "}
          {t(
            data.config.destinations.find(
              (d) => d.value === record.values.destination,
            )?.label ?? "",
          )}
        </p>
      </Modal>
      <Modal
        open={switchTo !== null}
        onClose={() => setSwitchTo(null)}
        title={t("template.triage.discardTitle")}
        footer={
          <>
            <Button onClick={() => setSwitchTo(null)}>{t("Cancel")}</Button>
            <Button onClick={() => choose(switchTo ?? "new")}>
              {t("template.clinical.discard")}
            </Button>
          </>
        }
      >
        <p>{t("template.triage.discardHint")}</p>
      </Modal>
    </div>
  );
}
