/** Clinical Library contracts: serializable, independent of any shell or HTTP transport. */
export const CLINICAL_TEMPLATE_PAGES = [
  { id: "allyvora-patient-query", title: "template.clinical.query" },
  { id: "allyvora-patient-record", title: "template.clinical.record" },
  { id: "allyvora-patient-360", title: "template.clinical.overview" },
] as const;
export type PatientValue = string | boolean;
export interface PatientField {
  id: string;
  label: string;
  type: "text" | "email" | "date" | "select" | "textarea" | "checkbox";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}
export interface PatientSection {
  id: string;
  title: string;
  subtitle: string;
  fields: PatientField[];
  collections: string[];
}
export interface PatientCollection {
  id: string;
  title: string;
  fields: PatientField[];
}
export interface PatientActivity {
  id: string;
  at: string;
  messageKey: string;
  detail?: string;
  actor: string;
}
export interface PatientRecord {
  id: string;
  mrn: string;
  internalCode: string;
  version: number;
  values: Record<string, PatientValue>;
  collections: Record<string, Array<Record<string, string>>>;
  activity: PatientActivity[];
}
export interface PatientSummary {
  id: string;
  mrn: string;
  internalCode: string;
  name: string;
  birthDate: string;
  gender: string;
  mobile: string;
  email: string;
  nationality: string;
  status: string;
  registeredAt: string;
  version: number;
}
export interface PatientFilters {
  q?: string;
  mrn?: string;
  firstName?: string;
  lastName?: string;
  identity?: string;
  mobile?: string;
  gender?: string;
  nationality?: string;
  birthDate?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  direction?: "asc" | "desc";
}
export interface PatientSearchResult {
  rows: PatientSummary[];
  total: number;
  page: number;
  pageSize: number;
}
export interface PatientCareRow {
  id: string;
  kind:
    | "encounter"
    | "appointment"
    | "episode"
    | "order"
    | "billing"
    | "pharmacy"
    | "team"
    | "location"
    | "clinical";
  date: string;
  title: string;
  detail: string;
  status: string;
  provider?: string;
  amount?: number;
}
export interface PatientOverview {
  patient: PatientRecord;
  rows: PatientCareRow[];
  loadedAt: string;
}
export interface PatientMetadata {
  sections: PatientSection[];
  collections: PatientCollection[];
  providers: Array<{ value: string; label: string }>;
  canWrite: boolean;
  schemaVersion: number;
}
export interface PatientSavedSearch {
  id: string;
  name: string;
  filters: PatientFilters;
}
export interface PatientSave {
  record: PatientRecord;
  expectedVersion: number;
  operationId: string;
}
export interface PatientCareRequest {
  patientId: string;
  kind: "appointment" | "encounter";
  date: string;
  time: string;
  provider: string;
  notes: string;
  operationId: string;
}

export interface PatientEligibility {
  status: "eligible" | "expired" | "unknown";
  checkedAt: string;
  reference: string;
}
