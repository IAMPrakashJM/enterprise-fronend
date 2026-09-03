#!/usr/bin/env node
/**
 * Context assembly reads ONLY what a use case names, and the transparency panel
 * renders the object that is sent.
 *
 * The second half is structural — the panel takes `context.fields` and has no
 * other source — so what is checkable here is the first: that a field absent
 * from `reads` never reaches the context however much the page hands over, and
 * that removing one from the use case removes it from the payload.
 *
 * Zero dependencies. Node 24 strips types, so these are the real modules.
 */
import { assembleContext } from "../packages/ai-client/src/assemble.ts";
import { redactField } from "../packages/ai-client/src/redact.ts";

const pad = (value, width) => String(value).padEnd(width);
let failed = 0;
const check = (name, condition, detail = "") => {
  if (!condition) failed += 1;
  console.log(`  ${pad(condition ? "ok" : "FAIL", 6)}${pad(name, 52)}${detail}`);
};

/* A page that hands over far more than the use case asks for. */
const RECORD = {
  id: "CUS-1042", name: "Northgate Retail", type: "Corporate", segment: "Retail",
  status: "Active", risk: "Low", creditLimit: 480000, outstanding: 184200,
  contact: "Maya Thomas", email: "maya.thomas@northgate.example", phone: "+971 50 555 0134",
  iban: "AE070331234567890123456", notes: "Internal: renegotiating terms",
};

const useCase = {
  id: "record.explain", label: "Explain this record", description: "...",
  reads: [{ source: "page-record", fields: ["id", "name", "status", "email", "iban", "missingField"] }],
  promptId: "record.explain.v1", category: "general",
};

const context = assembleContext(useCase, "customer-master", { "page-record": RECORD });
const labels = context.fields.map((f) => f.label);
const values = JSON.stringify(context);

console.log("\n  assembly\n");
check("only named fields appear", context.fields.length === 5, `${context.fields.length} fields`);
check("a field the page has but reads omits is absent", !values.includes("Northgate") ? false : !labels.includes("Segment") && !labels.includes("Notes"));
check("the internal note never reaches the payload", !values.includes("renegotiating"));
check("credit limit was not read", !labels.includes("Credit Limit"));
check("an absent named field is omitted, not sent empty", !labels.includes("Missing Field"));

console.log("\n  redaction runs during assembly, so the panel shows what is sent\n");
const email = context.fields.find((f) => f.label === "Email");
const iban = context.fields.find((f) => f.label === "Iban");
check("email is masked in the payload", email?.value !== RECORD.email, email?.value);
check("email is flagged redacted", email?.redacted === true);
check("the raw email is nowhere in the context", !values.includes(RECORD.email));
check("iban is masked", iban?.value !== RECORD.iban, iban?.value);
check("the raw iban is nowhere in the context", !values.includes(RECORD.iban));
check("a non-sensitive field is untouched", context.fields.find((f) => f.label === "Name")?.value === "Northgate Retail");
check("redactField leaves ordinary keys alone", redactField("name", "Northgate").redacted === false);

console.log("\n  removing a field from the use case removes it from the payload\n");
const narrowed = { ...useCase, reads: [{ source: "page-record", fields: ["id", "name"] }] };
const after = assembleContext(narrowed, "customer-master", { "page-record": RECORD });
check("field count drops", after.fields.length === 2, `${context.fields.length} -> ${after.fields.length}`);
check("the removed field is gone", !after.fields.some((f) => f.label === "Email"));
check("its value is gone from the payload too", !JSON.stringify(after).includes(RECORD.email));

console.log("\n  worklist selection\n");
const rows = [{ id: "A", name: "One", secretish: "x" }, { id: "B", name: "Two", secretish: "y" }];
const listCase = { ...useCase, reads: [{ source: "worklist-selection", fields: ["id", "name"] }] };
const listContext = assembleContext(listCase, "customer-master", { "worklist-selection": rows });
check("one entry per row per named field", listContext.fields.length === 4, `${listContext.fields.length} fields`);
check("rows are labelled so a user can match them", listContext.fields[0].label.includes("row 1"));
check("unnamed row keys never appear", !JSON.stringify(listContext).includes("secretish"));

console.log();
if (failed) { console.error(`  ${failed} check(s) failed.\n`); process.exit(1); }
console.log("  all context checks passed.\n");
