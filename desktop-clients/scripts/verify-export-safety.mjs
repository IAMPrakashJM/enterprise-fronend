#!/usr/bin/env node
/**
 * Nothing reaches a file that may not be in one, and nothing sensitive reaches
 * one quietly.
 *
 * The third of these, over the third policy reading the one registry. The other
 * two ask whether a value may be written to a URL and whether it must be masked
 * before a provider sees it; this asks what a worklist may write to a FILE — the
 * one destination the application cannot take back, since no retention rule
 * reaches it, no revocation does, and nobody is asked again when it is
 * forwarded.
 *
 * The realistic failure is a COLUMN, not a filter: a worklist gains one next
 * month, nobody classifies it, and an unclassified column is silently dropped
 * from every export of that list. Thirty-five of them were unclassified when
 * this policy was written — `patient`, which holds an MRN, among them.
 *
 * Runs the REAL modules through Node's type stripping, so there is no second
 * copy of the rule to drift from the one that ships.
 */
import { DATA_CLASSIFICATIONS, classificationFor } from "../packages/erp-config/src/data-classification.ts";
import { NEVER_IN_A_DOCUMENT, exportAudit, reviewExport } from "../packages/erp-config/src/export-policy.ts";
import { PAGE_REGISTRY } from "../packages/erp-config/src/navigation.ts";
import { getWorklistConfig } from "../packages/erp-data/src/mock.ts";
import { readFileSync } from "node:fs";

let failed = 0;
const check = (ok, name, detail = "") => {
  console.log(`    ${ok ? "ok  " : "FAIL"}  ${name.padEnd(56)}${detail}`);
  if (!ok) failed += 1;
};

/**
 * The policy, written out as data so the checks are not self-consistent.
 *
 * Reclassify `patient` as operational and every assertion below would still be
 * green without this: the code would agree with itself that an MRN is ordinary.
 */
const POLICY = {
  neverInAFile: ["token", "apiKey", "secret", "password"],
  declaredFirst: ["patient", "dob", "gender", "prescriber", "clinician", "primaryDiagnosis", "drug", "ward"],
  silentlyFine: ["id", "status", "branch", "priority", "total", "supplier"],
};

console.log("\n  the writer agrees with the written policy\n");

for (const key of POLICY.neverInAFile) {
  const review = reviewExport([{ key, label: key }]);
  check(review.carried.length === 0 && review.withheld.length === 1, `${key} never reaches a file`, classificationFor(key));
}
for (const key of POLICY.declaredFirst) {
  const review = reviewExport([{ key, label: key }]);
  check(review.carried.length === 1 && review.declared.length === 1 && !review.silent,
    `${key} is exported, but declared first`, classificationFor(key));
}
for (const key of POLICY.silentlyFine) {
  const review = reviewExport([{ key, label: key }]);
  check(review.carried.length === 1 && review.silent, `${key} needs no announcement`, classificationFor(key));
}

console.log("\n  every column a worklist shows is classified\n");

/* Every worklist in the registry, called the way the screen calls it — the
   generator keys off title and entity as well as the id, and asking it with the
   id alone builds a different set of columns. */
const seen = new Map();
for (const page of Object.values(PAGE_REGISTRY)) {
  if (page.kind !== "worklist") continue;
  let config;
  try { config = getWorklistConfig(page.id, page.title, page.entity); } catch { continue; }
  for (const column of config.columns) {
    if (!seen.has(column.key)) seen.set(column.key, new Set());
    seen.get(column.key).add(page.id);
  }
}

check(seen.size > 0, "the registry offers some worklists", `${seen.size} distinct columns`);
for (const key of [...seen.keys()].sort()) {
  /* Unclassified is the safe default everywhere else. It is a FAILURE here,
     because the column is on somebody's screen: leaving it unclassified drops
     it from every export of that list, silently, and the first person to notice
     is whoever wonders where their column went. */
  check(DATA_CLASSIFICATIONS[key] !== undefined, `${key}`, `${classificationFor(key)} · ${[...seen.get(key)].length} list(s)`);
}

console.log("\n  no probe value survives into the audit\n");

/* One recognisable value per class, carried as each column's LABEL.
 *
 * The audit is built from columns and never sees a row, so a row value cannot
 * reach it — which made the obvious version of this check vacuous. A label can:
 * it is the nearest thing to free text the audit has any access to, and an
 * audit that recorded whole column objects rather than keys would carry it. */
const PROBES = {
  phi: "PHI_PROBE_Maya_AV204581",
  pii: "PII_PROBE_971507421840",
  clinical: "CLINICAL_PROBE_E11_9",
  credential: "CREDENTIAL_PROBE_sk_live",
  operational: "OPERATIONAL_PROBE",
};

const columns = Object.keys(DATA_CLASSIFICATIONS).map((key) => ({ key, label: PROBES[classificationFor(key)] ?? "UNCLASSIFIED_PROBE" }));
const review = reviewExport(columns);
const audit = exportAudit("verify", review, 96);
const serialised = JSON.stringify(audit);

for (const [classification, probe] of Object.entries(PROBES)) {
  check(!serialised.includes(probe), `no ${classification} value is recorded`);
}
check(audit.rows === 96 && audit.columns.length > 0, "but what was exported is", `${audit.columns.length} columns, ${audit.declared.length} sensitive`);
check(audit.withheld.length > 0, "and so is what was held back", audit.withheld.join(","));

console.log("\n  a sensitive export is never silent\n");

check(!reviewExport([{ key: "id", label: "Id" }, { key: "patient", label: "MRN" }]).silent,
  "a list with an MRN column asks first");
check(!reviewExport([{ key: "id", label: "Id" }, { key: "mysteryColumn", label: "?" }]).silent,
  "so does one with a column nobody classified");
check(reviewExport([{ key: "id", label: "Id" }, { key: "status", label: "Status" }]).silent,
  "an ordinary list does not");

/**
 * Paper.
 *
 * The same policy over a destination that cannot be recalled, and the one path
 * script does not control: a browser-initiated print cannot be cancelled, so
 * `beforeprint` can record it and nothing more. What actually keeps a class off
 * the page is a CSS rule, and what identifies the sheet is a banner already in
 * the document. Both are checked by reading the files, because neither is
 * reachable by calling a function.
 */
console.log("\n  a printed sheet is governed by the document, not by script\n");

const css = readFileSync(new URL("../packages/tokens/src/tokens.css", import.meta.url), "utf8");
const printBlock = css.slice(css.indexOf("@media print"));
check(printBlock.length > 0, "there is a print stylesheet");
for (const classification of NEVER_IN_A_DOCUMENT) {
  check(printBlock.includes(`[data-classification="${classification}"]`), `the stylesheet refuses ${classification}`);
}
check(/\[data-classification=[^\]]*\][^{]*\{[^}]*display:\s*none/.test(printBlock), "and refuses it by removing it, not by hiding it visually");

/* The rule is worthless if nothing carries the attribute. */
const table = readFileSync(new URL("../packages/erp-screens/src/worklist/data-table.tsx", import.meta.url), "utf8");
check((table.match(/data-classification=\{classificationFor\(column\.key\)\}/g) ?? []).length >= 2,
  "every header and cell is stamped with its class");

/* And the banner has to exist in the document rather than be conjured when
   printing starts, because the print that matters is the one nobody announced. */
const worklist = readFileSync(new URL("../packages/erp-screens/src/worklist/worklist-page.tsx", import.meta.url), "utf8");
check(worklist.includes('className="print-only'), "the sheet carries a banner that is always in the document");
check(/beforeprint/.test(worklist), "and an unannounced print is still recorded");
check(/exportAudit\(.{0,140}"print"/.test(worklist.replace(/\s+/g, " ")), "as a print rather than as a file");

check(!/window\.addEventListener\("beforeprint"[\s\S]{0,400}preventDefault/.test(worklist),
  "and nothing pretends it can cancel one");

console.log(failed === 0
  ? "\n  Every worklist column is classified, and nothing sensitive leaves as a document unannounced.\n"
  : `\n  ${failed} check(s) failed.\n`);
process.exit(failed === 0 ? 0 : 1);
