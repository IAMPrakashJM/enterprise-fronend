import type { DataClassification } from "./filter-policy.ts";

/**
 * What every field key IS, in one place.
 *
 * Keyed by the key rather than declared beside each screen, because a key means
 * the same thing everywhere it appears: `mrn` on the pharmacy list is the same
 * medical record number as `mrn` on the encounter record, and a classification
 * that could differ between screens is one somebody will eventually get wrong
 * on one of them.
 *
 * TWO policies read this table and ask different questions of the same answer:
 *
 *   URL persistence  — may this be written to a query string, a bookmark, an
 *                      access log? Only `operational` may. See filter-policy.
 *   Provider egress  — must this be masked before it reaches a model vendor?
 *                      `phi`, `pii` and `credential` must. See ai-client's
 *                      redact. `clinical` must NOT: the use case that reads a
 *                      diagnosis exists to reason about the diagnosis, and a
 *                      masked one makes the feature pointless while protecting
 *                      nobody. Clinical content is governed instead by the
 *                      clinical gate and its named-record confirmation.
 *
 * So `clinical` is the entry that separates the two policies: never in a URL,
 * always legible to the provider. Everything else answers both the same way.
 *
 * A key absent from this table resolves to `unclassified`, which is not
 * url-safe and IS masked. That is the safe default in both directions, and
 * verify:filter-safety and verify:ai-egress each fail on it, so a dropped
 * classification is noticed rather than discovered by a broken bookmark or a
 * name in someone else's log.
 */
export const DATA_CLASSIFICATIONS: Record<string, DataClassification> = {
  /* ---- Filtering, sorting, paging. Nothing here identifies a person. ---- */
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

  /* ---- Record and form fields the assistant is allowed to read. ---- */

  /* Business records. `name` and `customer` are a counterparty, not a patient:
     no clinical use case reads either, which is what makes it safe to leave
     them legible. If one ever does, verify:ai-egress fails rather than
     silently sending a patient's name under a business key. */
  id: "operational",
  name: "operational",
  customer: "operational",
  type: "operational",
  segment: "operational",
  risk: "operational",
  creditLimit: "operational",
  outstanding: "operational",
  lastInvoice: "operational",
  reference: "operational",
  terms: "operational",
  jurisdiction: "operational",
  payer: "operational",

  /* Figures a page is displaying, and inbox items. Free text, and operational
     rather than phi: a business note is not clinical information, and the
     distinction from `query` above is the screen it belongs to rather than the
     shape of what is typed. The inbox is an operations inbox; the search box
     that is classified phi is the one on a clinical worklist. */
  label: "operational",
  value: "operational",
  delta: "operational",
  note: "operational",
  dimension: "operational",
  current: "operational",
  previous: "operational",
  budget: "operational",
  variance: "operational",
  contribution: "operational",
  title: "operational",
  preview: "operational",
  time: "operational",
  kind: "operational",
  role: "operational",

  /* Who, and when. A treating clinician is a named person and narrows the
     population sharply; an admission date is a date attached to an individual.
     Neither is needed to summarise an encounter, so both are masked. */
  clinician: "pii",
  admitted: "phi",

  /* What is wrong with them. Clinical, so: never in a URL, and legible to the
     provider because that is what the use case is for. */
  ward: "clinical",
  acuity: "clinical",
  lengthOfStay: "clinical",
  specialty: "clinical",
  primaryDiagnosis: "clinical",
  problem: "clinical",
  complaint: "clinical",
  findings: "clinical",
  candidateCodes: "clinical",
  candidateOrders: "clinical",
};

/**
 * The classification of one key.
 *
 * An exact lookup, deliberately: a prefix or case-insensitive match would
 * classify `statusReason` from `status` and declare url-safe a field nobody
 * entered.
 */
export function classificationFor(key: string): DataClassification {
  return DATA_CLASSIFICATIONS[key] ?? "unclassified";
}
