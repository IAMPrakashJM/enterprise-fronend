"use client";
import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardGrid,
  Input,
  Select,
  Badge,
  Button,
  Modal,
  PresentationProvider,
  useLocalization,
} from "@pepbits/ops-ui";
import {
  effectivePreferences,
  createFormatters,
  type UserPreferences,
} from "@pepbits/erp-config";
import type {
  ClinicalTriageAdapter,
  ClinicalTemplateAdapter,
} from "@pepbits/erp-data";
import type { PreferenceHost } from "../preference-choice";
import { ClinicalLoading, useClinicalLoad } from "../clinical-templates/shared";
import { ClinicalTriageEditor } from "./editor";
export interface ClinicalTriageWorkspaceProps extends PreferenceHost {
  adapter: ClinicalTriageAdapter;
  patients: ClinicalTemplateAdapter;
  scopeKey: string;
  patientId?: string;
}
export function ClinicalTriageWorkspace(props: ClinicalTriageWorkspaceProps) {
  const preferences = props.preferencePolicy
    ? effectivePreferences(props.preferences, props.preferencePolicy)
    : props.preferences;
  return (
    <PresentationProvider value={preferences}>
      <TriageWorkspace
        key={props.scopeKey}
        {...props}
        preferences={preferences}
      />
    </PresentationProvider>
  );
}
function TriageWorkspace(props: ClinicalTriageWorkspaceProps) {
  const { t } = useLocalization(),
    [query, setQuery] = useState(""),
    [id, setId] = useState(props.patientId ?? ""),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [next, setNext] = useState<string | null>(null),
    list = useClinicalLoad(
      () => props.patients.search({ q: query, pageSize: 50, page: 1 }),
      [props.patients, query],
    );
  const options = [
    { value: "", label: "template.clinical.selectPatient" },
    ...(list.value?.rows ?? []).map((p) => ({
      value: p.id,
      label: p.mrn + " • " + p.name,
    })),
  ];
  if (id && !options.some((o) => o.value === id))
    options.push({ value: id, label: id });
  return (
    <div
      data-clinical-triage
      data-tour="clinical-triage"
      className="space-y-3"
      style={{ "--fs-scale": "var(--fs-form)" } as React.CSSProperties}
    >
      <Card>
        <CardContent style={{ paddingBlock: ".5rem" }}>
          <CardGrid columns={3}>
            <Input
              label="template.clinical.search"
              value={query}
              disabled={busy}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select
              label="template.clinical.selectPatient"
              placeholder=""
              value={id}
              options={options}
              disabled={busy}
              onChange={(e) => {
                if (dirty) setNext(e.target.value);
                else setId(e.target.value);
              }}
            />
            <div className="flex items-center justify-end">
              <Badge tone="warning">{t("template.triage.demo")}</Badge>
            </div>
          </CardGrid>
          {list.error ? (
            <ClinicalLoading error={list.error} retry={list.retry} />
          ) : null}
        </CardContent>
      </Card>
      {id ? (
        <TriagePatient
          key={id}
          {...props}
          patientId={id}
          onDirty={setDirty}
          onBusy={setBusy}
        />
      ) : (
        <p>{t("template.triage.choosePatient")}</p>
      )}
      <Modal
        open={next !== null}
        onClose={() => setNext(null)}
        title={t("template.triage.discardTitle")}
        footer={
          <>
            <Button onClick={() => setNext(null)}>{t("Cancel")}</Button>
            <Button
              onClick={() => {
                setId(next ?? "");
                setNext(null);
                setDirty(false);
              }}
            >
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
function TriagePatient({
  adapter,
  patientId,
  preferences,
  preferencesAvailable,
  onDirty,
  onBusy,
}: ClinicalTriageWorkspaceProps & {
  patientId: string;
  onDirty: (b: boolean) => void;
  onBusy: (b: boolean) => void;
}) {
  const { t, language } = useLocalization(),
    loaded = useClinicalLoad(
      () => adapter.load(patientId),
      [adapter, patientId],
    ),
    format = useMemo(
      () =>
        createFormatters({
          ...preferences,
          language: language as UserPreferences["language"],
        }),
      [preferences, language],
    );
  if (!loaded.value)
    return <ClinicalLoading error={loaded.error} retry={loaded.retry} />;
  const patient = loaded.value.patient;
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 px-1">
        <strong>
          {[patient.values.firstName, patient.values.lastName].join(" ")}
        </strong>
        <Badge>{patient.mrn}</Badge>
        <span className="text-xs text-[var(--text-muted)]">
          {format.date(String(patient.values.birthDate ?? ""))} •{" "}
          {t("template.clinical." + patient.values.gender)} •{" "}
          {String(patient.values.mobile ?? "")}
        </span>
      </div>
      <ClinicalTriageEditor
        initial={loaded.value}
        adapter={adapter}
        preferences={preferences}
        available={preferencesAvailable}
        format={format}
        onDirty={onDirty}
        onBusy={onBusy}
      />
    </>
  );
}
