import type {
  ClinicalDocument,
  ClinicalDocumentView,
  ClinicalDocumentSave,
} from "./clinical-document";
export const CONSULTATION_FIELDS = [
  "clinician",
  "visitType",
  "complaint",
  "history",
  "examination",
  "diagnosis",
  "treatment",
  "investigations",
  "followUp",
  "safetyAdvice",
  "allergyReview",
] as const;
export type ConsultationValues = Record<
  (typeof CONSULTATION_FIELDS)[number],
  string
>;
export interface ConsultationConfiguration {
  clinicians: Array<{ value: string; label: string }>;
  visitTypes: Array<{ value: string; label: string }>;
}
export type ConsultationRecord = ClinicalDocument<ConsultationValues>;
export type ConsultationView = ClinicalDocumentView<
  ConsultationValues,
  ConsultationConfiguration
>;
export type ConsultationSave = ClinicalDocumentSave<ConsultationValues>;
export function blankConsultation(): ConsultationValues {
  return Object.fromEntries(
    CONSULTATION_FIELDS.map((k) => [k, ""]),
  ) as ConsultationValues;
}
export function validateConsultation(
  values: ConsultationValues,
  config: ConsultationConfiguration,
  complete: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {},
    invalid = "template.consultation.invalid";
  for (const key of CONSULTATION_FIELDS)
    if (typeof values?.[key] !== "string" || values[key].length > 2000)
      errors[key] = invalid;
  if (Object.keys(errors).length) return errors;
  if (
    values.clinician &&
    !config.clinicians.some((c) => c.value === values.clinician)
  )
    errors.clinician = invalid;
  if (
    values.visitType &&
    !config.visitTypes.some((c) => c.value === values.visitType)
  )
    errors.visitType = invalid;
  if (
    values.allergyReview &&
    !["reviewed", "unavailable"].includes(values.allergyReview)
  )
    errors.allergyReview = invalid;
  if (complete)
    for (const key of [
      "clinician",
      "visitType",
      "complaint",
      "examination",
      "diagnosis",
      "treatment",
      "followUp",
      "allergyReview",
    ] as const)
      if (!values[key].trim()) errors[key] = "template.consultation.required";
  return errors;
}
