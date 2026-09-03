#!/usr/bin/env node
/**
 * The access rules are the security boundary of the AI capability, so they get
 * a check that RUNS rather than a table that is asserted.
 *
 * Zero dependencies, like verify-parity.mjs next to it: Node 24 strips types
 * from .ts on import, so the resolver under test is the real module rather than
 * a copy that can drift from it.
 *
 * Usage:  node scripts/verify-ai-gates.mjs
 *         npm run verify:ai-gates
 */
import { resolveAi } from "../packages/ai-config/src/gates.ts";

const CASES = [
  // --- deny wins, and the gate that decided ------------------------------
  { name: "no gate speaks",
    states: {}, expect: { allowed: false, decidedBy: "useCase" } },
  { name: "build gate off",
    states: { build: { allowed: false } }, expect: { allowed: false, decidedBy: "build" } },
  { name: "tenant off beats page on and user on",
    states: { build: { allowed: true, useCases: ["a"] }, tenant: { allowed: false },
              page: { allowed: true, useCases: ["a"] }, user: { allowed: true } },
    expect: { allowed: false, decidedBy: "tenant" } },
  { name: "user gate off",
    states: { page: { useCases: ["a"] }, user: { allowed: false } },
    expect: { allowed: false, decidedBy: "user" } },
  { name: "everything allows",
    states: { page: { useCases: ["a"] } },
    expect: { allowed: true, decidedBy: "user", useCases: ["a"] } },

  // --- the set is an intersection ----------------------------------------
  { name: "page [a,b] narrowed by role [a]",
    states: { page: { useCases: ["a", "b"] }, role: { useCases: ["a"] } },
    expect: { allowed: true, useCases: ["a"] } },
  { name: "requested id outside the set",
    states: { page: { useCases: ["a"] } }, requested: "z",
    expect: { allowed: false, decidedBy: "useCase" } },

  // --- narrowing gates must never widen ----------------------------------
  { name: "ESCALATION: role names b, page did not",
    states: { page: { useCases: ["a"] }, role: { useCases: ["a", "b"] } },
    expect: { allowed: true, useCases: ["a"] } },
  { name: "ESCALATION: role is the ONLY gate to name a set",
    states: { role: { useCases: ["a"] } },
    expect: { allowed: false, decidedBy: "useCase" } },
  { name: "ESCALATION: user is the ONLY gate to name a set",
    states: { user: { useCases: ["a"] } },
    expect: { allowed: false, decidedBy: "useCase" } },
  { name: "ESCALATION: user re-adds what role removed",
    states: { page: { useCases: ["a", "b"] }, role: { useCases: ["a"] }, user: { useCases: ["a", "b"] } },
    expect: { allowed: true, useCases: ["a"] } },

  // --- an emptied set is a denial, not a pass ----------------------------
  { name: "page names an empty set",
    states: { page: { useCases: [] } },
    expect: { allowed: false, decidedBy: "useCase" } },
];

let failed = 0;
const pad = (value, width) => String(value).padEnd(width);
console.log(`\n  ${pad("", 6)}${pad("case", 44)} ${pad("result", 22)} use cases`);
console.log(`  ${"-".repeat(6)}${"-".repeat(44)} ${"-".repeat(22)} ---------`);

for (const testCase of CASES) {
  const got = resolveAi(testCase.states, testCase.requested);
  const problems = [];
  for (const [key, want] of Object.entries(testCase.expect)) {
    const actual = key === "useCases" ? JSON.stringify(got.useCases) : got[key];
    const wanted = key === "useCases" ? JSON.stringify(want) : want;
    if (actual !== wanted) problems.push(`${key}: expected ${wanted}, got ${actual}`);
  }
  const verdict = `${got.allowed ? "allowed" : "denied"} / ${got.decidedBy}`;
  console.log(`  ${pad(problems.length ? "FAIL" : "ok", 6)}${pad(testCase.name, 44)} ${pad(verdict, 22)} [${got.useCases.join(",")}]`);
  for (const problem of problems) console.log(`        ${problem}`);
  if (problems.length) failed += 1;
}

console.log();
if (failed) {
  console.error(`  ${failed} of ${CASES.length} cases failed.\n`);
  console.error("  A failure among the ESCALATION cases means a narrowing gate can widen the");
  console.error("  allowed set, which makes 'enable at user level' a route around a tenant");
  console.error("  policy. Do not proceed past Task 1 until it passes.\n");
  process.exit(1);
}
console.log(`  ${CASES.length} cases passed.\n`);
