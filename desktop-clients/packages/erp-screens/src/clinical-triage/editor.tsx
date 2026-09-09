"use client";
import React from "react";
import { CardGrid } from "@pepbits/ops-ui";
import {
  validateTriage,
  type TriageValues,
  type TriageConfiguration,
} from "@pepbits/erp-config";
import {
  ClinicalDocumentEditor,
  type ClinicalDocumentDefinition,
} from "../clinical-document/editor";
import { TriageIntake, TriageVitals, TriageHandoff } from "./fields";
export const triageDefinition: ClinicalDocumentDefinition<
  TriageValues,
  TriageConfiguration
> = {
  prefix: "template.triage.",
  sections: [
    { id: "intake", label: "template.triage.intake" },
    { id: "vitals", label: "template.triage.vitals" },
    { id: "handoff", label: "template.triage.handoffSection" },
  ],
  validate: validateTriage,
  sectionFor: (field) =>
    ["destination", "precautions", "handoff"].includes(field)
      ? "handoff"
      : [
            "complaint",
            "onset",
            "priority",
            "allergyStatus",
            "allergies",
          ].includes(field)
        ? "intake"
        : "vitals",
  fresh: (values) => ({ ...values, measuredAt: new Date().toISOString() }),
  render: (props, section, flat) =>
    flat ? (
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
    ) : section === "intake" ? (
      <TriageIntake {...props} />
    ) : section === "vitals" ? (
      <TriageVitals {...props} />
    ) : (
      <TriageHandoff {...props} />
    ),
  confirmation: (values, config, t) => (
    <>
      {t(
        config.priorities.find((p) => p.value === values.priority)?.label ?? "",
      )}{" "}
      •{" "}
      {t(
        config.destinations.find((d) => d.value === values.destination)
          ?.label ?? "",
      )}
    </>
  ),
};
export function ClinicalTriageEditor(
  props: Omit<
    React.ComponentProps<
      typeof ClinicalDocumentEditor<TriageValues, TriageConfiguration>
    >,
    "definition"
  >,
) {
  return <ClinicalDocumentEditor {...props} definition={triageDefinition} />;
}
