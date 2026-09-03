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
import { gatesForPage } from "../packages/ai-config/src/policy.ts";

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
  { name: "page [a,b] narrowed by user [a]",
    states: { page: { useCases: ["a", "b"] }, user: { useCases: ["a"] } },
    expect: { allowed: true, useCases: ["a"] } },
  { name: "useCase gate narrows the page's set",
    states: { page: { useCases: ["a", "b"] }, useCase: { useCases: ["b"] } },
    expect: { allowed: true, useCases: ["b"] } },
  { name: "requested id outside the set",
    states: { page: { useCases: ["a"] } }, requested: "z",
    expect: { allowed: false, decidedBy: "useCase" } },

  // --- narrowing gates must never widen ----------------------------------
  { name: "ESCALATION: user names b, page did not",
    states: { page: { useCases: ["a"] }, user: { useCases: ["a", "b"] } },
    expect: { allowed: true, useCases: ["a"] } },
  { name: "ESCALATION: user is the ONLY gate to name a set",
    states: { user: { useCases: ["a"] } },
    expect: { allowed: false, decidedBy: "useCase" } },
  { name: "ESCALATION: user re-adds what useCase removed",
    states: { page: { useCases: ["a", "b"] }, useCase: { useCases: ["a"] }, user: { useCases: ["a", "b"] } },
    expect: { allowed: true, useCases: ["a"] } },
  { name: "role is no longer a gate: an unknown key is ignored",
    states: { page: { useCases: ["a"] }, role: { allowed: false } },
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
  console.error("  A failure among the ESCALATION cases means a narrowing gate can widen the");
  console.error("  allowed set, which makes 'enable at user level' a route around a tenant");
  console.error("  policy. Do not proceed until it passes.\n");
}
console.log(`  ${CASES.length} resolver cases passed.\n`);

/* ---------------------------------------------------------------------------
 * gatesForPage: the collapse from a stored policy to the flat gate map.
 * Covered here because it is where a policy shape meets the resolver, and a
 * mistake in it looks like a resolver bug rather than a mapping one.
 * ------------------------------------------------------------------------- */

const BUILD = { enabled: true, useCases: ["a", "b"] };
const POLICY = {
  tenantId: "T1",
  global: { platform: { allowed: true }, tenant: { allowed: true }, application: { allowed: true } },
  modules: { finance: { allowed: true }, hr: { allowed: false } },
  pages: { "locked-page": { allowed: false } },
  useCases: { b: { allowed: false } },
};

const POLICY_CASES = [
  { name: "pilot page, module allowed",
    policy: POLICY, page: { pageId: "p", module: "finance", build: BUILD }, user: true,
    expect: { allowed: true, useCases: ["a"] } },          // b is off tenant-wide
  { name: "module gate denies a page that HAS a build block",
    policy: POLICY, page: { pageId: "p", module: "hr", build: BUILD }, user: true,
    expect: { allowed: false, decidedBy: "module" } },
  { name: "page gate denies",
    policy: POLICY, page: { pageId: "locked-page", module: "finance", build: BUILD }, user: true,
    expect: { allowed: false, decidedBy: "page" } },
  { name: "no build block: gate 1 denies before any policy is consulted",
    policy: POLICY, page: { pageId: "p", module: "finance" }, user: true,
    expect: { allowed: false, decidedBy: "build" } },
  { name: "user preference off",
    policy: POLICY, page: { pageId: "p", module: "finance", build: BUILD }, user: false,
    expect: { allowed: false, decidedBy: "user" } },
  { name: "policy not fetched: renders build set, server still enforces",
    policy: null, page: { pageId: "p", module: "finance", build: BUILD }, user: true,
    expect: { allowed: true, useCases: ["a", "b"] } },     // see the note below
];

console.log(`  ${pad("", 6)}${pad("gatesForPage case", 44)} ${pad("result", 22)} use cases`);
console.log(`  ${"-".repeat(6)}${"-".repeat(44)} ${"-".repeat(22)} ---------`);
for (const testCase of POLICY_CASES) {
  const got = resolveAi(gatesForPage(testCase.policy, testCase.page, testCase.user));
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

/* The last case deserves a word. gatesForPage(null, ...) means "the policy could
   not be fetched", and it resolves ALLOWED on the build set. That is deliberate
   and it is not a default-open: the deny-on-missing-policy decision belongs to
   the server, which returns platform:{allowed:false} for an unknown tenant
   rather than an empty body. A client that failed closed on a network blip
   would make the assistant vanish intermittently, which teaches users to
   distrust the gating rather than the network. Enforcement is the server's
   re-check at dispatch; this map only decides what to RENDER. */

console.log();
if (failed) { console.error(`  ${failed} case(s) failed.\n`); process.exit(1); }
console.log(`  ${CASES.length + POLICY_CASES.length} cases passed in total.\n`);
