import type { PatientRecord, PatientCareRow } from "./clinical-templates";
export const TRIAGE_VITALS = [
  "systolic",
  "diastolic",
  "pulse",
  "respiratoryRate",
  "oxygenSaturation",
  "temperature",
  "pain",
  "weight",
] as const;
export type TriageVital = (typeof TRIAGE_VITALS)[number];
export interface TriageValues {
  complaint: string;
  onset: string;
  priority: string;
  allergyStatus: "" | "unknown" | "noneKnown" | "reported";
  allergies: string;
  precautions: string;
  destination: string;
  handoff: string;
  missingReason: string;
  measuredAt: string;
  vitals: Record<TriageVital, string>;
}
export interface TriageAssessment {
  id: string;
  patientId: string;
  encounterId: string;
  version: number;
  status: "draft" | "completed";
  values: TriageValues;
  updatedAt: string;
  actor: string;
  history: Array<{ at: string; actor: string; messageKey: string }>;
}
export interface TriageField {
  id: TriageVital;
  label: string;
  unit: string;
  requiredReading: boolean;
  max?: number;
  step: string;
}
export interface TriageConfiguration {
  vitals: TriageField[];
  priorities: Array<{ value: string; label: string }>;
  destinations: Array<{ value: string; label: string }>;
}
export interface TriageView {
  patient: PatientRecord;
  encounters: PatientCareRow[];
  assessments: TriageAssessment[];
  blank: TriageAssessment;
  config: TriageConfiguration;
  canWrite: boolean;
}
export interface TriageSave {
  patientId: string;
  assessment: TriageAssessment;
  expectedVersion: number;
  operationId: string;
  complete: boolean;
}
/** Data-entry validation only. No vital-based diagnosis, score, priority or treatment recommendation. */
export function validateTriage(
  values: TriageValues,
  config: TriageConfiguration,
  complete: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {},
    required = "template.triage.required",
    invalid = "template.triage.invalid";
  for (const key of [
    "complaint",
    "onset",
    "priority",
    "allergyStatus",
    "allergies",
    "precautions",
    "destination",
    "handoff",
    "missingReason",
    "measuredAt",
  ] as const)
    if (typeof values[key] !== "string" || values[key].length > 2000)
      errors[key] = invalid;
  if (Object.keys(errors).length) return errors;
  if (values.measuredAt && !Number.isFinite(Date.parse(values.measuredAt)))
    errors.measuredAt = invalid;
  if (
    values.priority &&
    !config.priorities.some((p) => p.value === values.priority)
  )
    errors.priority = invalid;
  if (
    values.destination &&
    !config.destinations.some((p) => p.value === values.destination)
  )
    errors.destination = invalid;
  if (!["", "unknown", "noneKnown", "reported"].includes(values.allergyStatus))
    errors.allergyStatus = invalid;
  for (const field of config.vitals) {
    const value = values.vitals?.[field.id];
    if (
      typeof value !== "string" ||
      (value !== "" &&
        (!/^\d+(\.\d{1,2})?$/.test(value) ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0 ||
          (field.max !== undefined && Number(value) > field.max)))
    )
      errors[field.id] = invalid;
  }
  if (values.allergyStatus === "noneKnown" && values.allergies.trim())
    errors.allergies = invalid;
  if (complete) {
    for (const key of [
      "complaint",
      "priority",
      "allergyStatus",
      "destination",
      "measuredAt",
    ] as const)
      if (typeof values[key] === "string" && !values[key].trim())
        errors[key] = required;
    if (values.allergyStatus === "reported" && !values.allergies?.trim())
      errors.allergies = required;
    if (
      config.vitals.some((f) => f.requiredReading && !values.vitals?.[f.id]) &&
      !values.missingReason?.trim()
    )
      errors.missingReason = required;
  }
  return errors;
}
