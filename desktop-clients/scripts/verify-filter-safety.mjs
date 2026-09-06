#!/usr/bin/env node
/**
 * No sensitive filter can reach a URL, and none is left unclassified.
 *
 * The tests prove the functions behave; this proves the DATA does. A filter
 * added to a worklist config next month is the realistic failure — nobody
 * writing it will remember this policy exists, and an unclassified key is
 * treated as sensitive, which is safe but silently drops the filter from links
 * that used to carry it. Better to fail here than to be discovered by someone
 * wondering why their bookmark stopped working.
 *
 * Runs the REAL modules through Node's type stripping, so there is no second
 * copy of the rule to drift from the one that ships.
 */
import { DATA_CLASSIFICATIONS } from "../packages/erp-config/src/data-classification.ts";
import { CLASSIFICATIONS, isUrlSafe, toQuery } from "../packages/erp-config/src/filter-policy.ts";

let failed = 0;
const check = (ok, name, detail = "") => {
  console.log(`    ${ok ? "ok  " : "FAIL"}  ${name.padEnd(56)}${detail}`);
  if (!ok) failed += 1;
};

/**
 * The policy's own table, as data.
 *
 * Without this the check is self-consistent and proves nothing: reclassify mrn
 * as operational and it becomes a filter that is "correctly" carried in a URL,
 * with every assertion still green. The rule being enforced is not "the code
 * agrees with itself" — it is "the code agrees with the policy", and the policy
 * has to be written down separately to be disagreed with.
 */
const POLICY = {
  operational: ["status", "branch", "department", "from", "to", "sort", "page", "pageSize"],
  neverInUrl: [
    "patientName", "mrn", "emiratesId", "dob", "phone", "diagnosis", "medication",
    "insuranceId", "memberId", "email",
    /* Free-text boxes. Classified for what a user can type into them rather
       than for what they are called. */
    "query", "tags", "recordRef",
  ],
};

console.log("\n  the registry agrees with the written policy\n");

for (const key of POLICY.operational) {
  const classification = DATA_CLASSIFICATIONS[key];
  check(classification === "operational", `${key} is operational`, classification ?? "MISSING");
}
for (const key of POLICY.neverInUrl) {
  const classification = DATA_CLASSIFICATIONS[key];
  check(classification !== undefined && !isUrlSafe({ classification }), `${key} never reaches a URL`, classification ?? "MISSING");
}

console.log("\n  every filter key carries a classification\n");

const keys = Object.keys(DATA_CLASSIFICATIONS).sort();
check(keys.length > 0, "the registry is not empty", `${keys.length} keys`);

for (const key of keys) {
  const classification = DATA_CLASSIFICATIONS[key];
  check(CLASSIFICATIONS.includes(classification), `${key}`, classification);
}

console.log("\n  the sensitive ones cannot be serialised\n");

/* Values chosen to be recognisable in a query string: if any of them appears,
   the allowlist let something through. */
const PROBES = {
  operational: "OPERATIONAL_PROBE",
  phi: "PHI_PROBE_Maya_AV204581",
  pii: "PII_PROBE_971507421840",
  clinical: "CLINICAL_PROBE_E11_9",
  credential: "CREDENTIAL_PROBE_sk_live",
  unclassified: "UNCLASSIFIED_PROBE",
};

const definitions = keys.map((key) => ({ key, label: key, type: "text", classification: DATA_CLASSIFICATIONS[key] }));
const values = Object.fromEntries(keys.map((key) => [key, PROBES[DATA_CLASSIFICATIONS[key]]]));
const serialised = toQuery(definitions, values).toString();

for (const [classification, probe] of Object.entries(PROBES)) {
  if (classification === "operational") continue;
  check(!serialised.includes(probe), `no ${classification} value is serialised`);
}

/* The KEY is as telling as the value: "?mrn=" in a log says someone searched by
   MRN even with nothing after the equals sign. */
for (const key of keys) {
  if (isUrlSafe({ classification: DATA_CLASSIFICATIONS[key] })) continue;
  check(!serialised.includes(key), `no ${key} key appears in the query string`);
}

const carried = keys.filter((key) => isUrlSafe({ classification: DATA_CLASSIFICATIONS[key] }));
check(carried.every((key) => serialised.includes(key)), "operational filters ARE carried", `${carried.length} of ${keys.length}`);

console.log(failed === 0
  ? "\n  Every filter is classified, and only operational ones reach a URL.\n"
  : `\n  ${failed} check(s) failed.\n`);
process.exit(failed === 0 ? 0 : 1);
