"use client";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardGrid,
  Input,
  Textarea,
  Select,
} from "@pepbits/ops-ui";
import type {
  ConsultationValues,
  ConsultationConfiguration,
} from "@pepbits/erp-config";
import type { DocumentFieldsProps } from "../clinical-document/editor";
type Props = DocumentFieldsProps<ConsultationValues, ConsultationConfiguration>;
export const consultationSections = [
  { id: "history", label: "template.consultation.historySection" },
  { id: "assessment", label: "template.consultation.assessmentSection" },
  { id: "plan", label: "template.consultation.planSection" },
];
export const fieldSections: Record<keyof ConsultationValues, string> = {
  clinician: "history",
  visitType: "history",
  complaint: "history",
  history: "history",
  examination: "assessment",
  diagnosis: "assessment",
  allergyReview: "assessment",
  treatment: "plan",
  investigations: "plan",
  followUp: "plan",
  safetyAdvice: "plan",
};
const required = new Set([
  "clinician",
  "visitType",
  "complaint",
  "examination",
  "diagnosis",
  "treatment",
  "followUp",
  "allergyReview",
]);
function NoteField({
  field,
  multiline = true,
  ...props
}: Props & { field: keyof ConsultationValues; multiline?: boolean }) {
  const common = {
    name: field,
    label: "template.consultation." + (field === "history" ? "historyNotes" : field),
    value: props.values[field],
    disabled: props.disabled,
    error: props.errors[field],
    required: required.has(field),
    maxLength: 2000,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      props.change(field, e.target.value),
  };
  return multiline ? (
    <Textarea
      {...common}
      rows={2}
      style={{
        height: "calc(3.5rem * var(--fs-scale))",
        minHeight: "calc(3.5rem * var(--fs-scale))",
      }}
    />
  ) : (
    <Input {...common} />
  );
}
export function ConsultationSection({
  section,
  ...props
}: Props & { section: string }) {
  const choice = (
    field: "clinician" | "visitType" | "allergyReview",
    options: Array<{ value: string; label: string }>,
  ) => (
    <Select
      name={field}
      label={"template.consultation." + field}
      required
      value={props.values[field]}
      options={options}
      disabled={props.disabled}
      error={props.errors[field]}
      onChange={(e) => props.change(field, e.target.value)}
    />
  );
  return (
    <Card>
      <CardHeader style={{ minHeight: 0, paddingBlock: ".5rem" }}>
        <CardTitle
          title={
            consultationSections.find((s) => s.id === section)?.label ?? ""
          }
        />
      </CardHeader>
      <CardContent className="space-y-3" style={{ paddingBlock: ".5rem" }}>
        {section === "history" ? (
          <>
            <CardGrid columns={2}>
              {choice("clinician", props.config.clinicians)}
              {choice("visitType", props.config.visitTypes)}
            </CardGrid>
            <NoteField {...props} field="complaint" />
            <NoteField {...props} field="history" />
          </>
        ) : section === "assessment" ? (
          <>
            <NoteField {...props} field="examination" />
            <NoteField {...props} field="diagnosis" />
            {choice("allergyReview", [
              { value: "reviewed", label: "template.consultation.reviewed" },
              {
                value: "unavailable",
                label: "template.consultation.unavailable",
              },
            ])}
          </>
        ) : (
          <>
            <NoteField {...props} field="treatment" />
            <NoteField {...props} field="investigations" multiline={false} />
            <CardGrid columns={2}>
              <NoteField {...props} field="followUp" multiline={false} />
              <NoteField {...props} field="safetyAdvice" multiline={false} />
            </CardGrid>
          </>
        )}
      </CardContent>
    </Card>
  );
}
