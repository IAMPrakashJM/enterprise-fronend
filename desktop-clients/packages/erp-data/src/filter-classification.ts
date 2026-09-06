import type { FilterClassification } from "@pepbits/erp-config";

/**
 * What every filter key IS, in one place.
 *
 * Keyed by the filter key rather than declared beside each worklist, because a
 * key means the same thing everywhere it appears: `mrn` on the pharmacy list is
 * the same medical record number as `mrn` on the encounter list, and a
 * classification that could differ between screens is a classification someone
 * will eventually get wrong on one of them.
 *
 * A key absent from this map resolves to "unclassified", which is not url-safe.
 * That is the safe default, and verify:filter-safety fails on it so the drop
 * is noticed rather than discovered by a broken bookmark.
 */
export const FILTER_CLASSIFICATIONS: Record<string, FilterClassification> = {
  /* Operational: nothing here identifies a person or says anything clinical. */
  status: "operational",
  branch: "operational",
  department: "operational",
  owner: "operational",
  priority: "operational",
  from: "operational",
  to: "operational",
  sort: "operational",
  page: "operational",
  pageSize: "operational",

  /* A free-text box a user can type anything into — including a name. It is
     the single most likely place for PHI to arrive by accident, so it is
     classified for what it can hold rather than for what it is called. */
  query: "phi",
  tags: "phi",
  recordRef: "phi",
  createdBy: "pii",

  /* The policy's table, verbatim. */
  patientName: "phi",
  mrn: "phi",
  dob: "phi",
  emiratesId: "pii",
  phone: "pii",
  email: "pii",
  memberId: "pii",
  insuranceId: "pii",
  diagnosis: "clinical",
  medication: "clinical",
  procedure: "clinical",
};
