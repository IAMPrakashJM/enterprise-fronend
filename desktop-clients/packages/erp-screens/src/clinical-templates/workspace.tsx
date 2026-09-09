"use client";
import React, { useState } from "react";
import {
  DEFAULT_PREFERENCES,
  createFormatters,
  type UserPreferences,
} from "@pepbits/erp-config";
import { useLocalization } from "@pepbits/ops-ui";
import type { ClinicalTemplateAdapter } from "@pepbits/erp-data";
import { PatientQueryTemplate } from "./patient-query";
import { PatientRecordTemplate } from "./patient-record";
import { Patient360Template } from "./patient-360";
import {
  ClinicalLoading,
  useClinicalLoad,
  type PatientDestination,
} from "./shared";
export interface ClinicalPatientWorkspaceProps {
  adapter: ClinicalTemplateAdapter;
  scopeKey: string;
  initialPage?: PatientDestination;
  preferences?: UserPreferences;
  preferenceControls?: React.ReactNode;
  onOpen?: (target: PatientDestination) => void;
}
/** Remount on tenant/application/user/record scope changes. No implicit browser persistence. */
export function ClinicalPatientWorkspace(props: ClinicalPatientWorkspaceProps) {
  return <ClinicalWorkspace key={props.scopeKey} {...props} />;
}
function ClinicalWorkspace({
  adapter,
  initialPage = { view: "query" },
  preferences = DEFAULT_PREFERENCES,
  onOpen,
  preferenceControls,
}: ClinicalPatientWorkspaceProps) {
  const [page, setPage] = useState(initialPage),
    { language } = useLocalization();
  const metadata = useClinicalLoad(() => adapter.metadata(), [adapter]);
  if (!metadata.value)
    return <ClinicalLoading error={metadata.error} retry={metadata.retry} />;
  const props = {
    adapter,
    metadata: metadata.value,
    preferenceControls,
    preferences,
    format: createFormatters({
      ...preferences,
      language: language as UserPreferences["language"],
    }),
    patientId: page.patientId,
    mode: page.mode,
    onOpen: onOpen ?? setPage,
  };
  return (
    <div key={[page.view, page.patientId, page.mode].join(":")}>
      {page.view === "query" ? (
        <PatientQueryTemplate {...props} />
      ) : page.view === "record" ? (
        <PatientRecordTemplate {...props} />
      ) : (
        <Patient360Template {...props} />
      )}
    </div>
  );
}
