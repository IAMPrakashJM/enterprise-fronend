#!/usr/bin/env node
/**
 * One removal, three disappearances.
 *
 * Panel, terminal and inline action must be affordances over ONE engine. If any
 * of them resolved its own use-case set, the three would eventually disagree —
 * and the one that disagreed would be the one nobody checked, which is how a
 * "terminal bypass" gets built by accident rather than by malice.
 *
 * Two halves:
 *   BEHAVIOUR   removing a use case at a gate removes it from the resolved set
 *   STRUCTURE   no surface resolves anything itself; all three read useAssistant
 *
 * The structural half is the one that survives a refactor, because the
 * behavioural half would still pass if someone added a second resolver.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gatesForPage } from "../packages/ai-config/src/policy.ts";
import { resolveAi } from "../packages/ai-config/src/gates.ts";
import { USE_CASES } from "../packages/ai-config/src/use-cases.ts";

const UI = join(dirname(fileURLToPath(import.meta.url)), "..", "packages", "ai-ui", "src");
const pad = (value, width) => String(value).padEnd(width);
let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed += 1;
  console.log(`  ${pad(ok ? "ok" : "FAIL", 6)}${pad(name, 56)}${detail}`);
};

/* ---- behaviour ---------------------------------------------------------- */
console.log("\n  removing a use case at the use-case gate\n");
const page = { pageId: "customer-master", module: "finance",
  build: { enabled: true, useCases: ["worklist.summarise-selection", "record.explain"] } };
const base = { tenantId: "T", global: {}, modules: {}, pages: {}, useCases: {} };

const before = resolveAi(gatesForPage(base, page, true));
const after = resolveAi(gatesForPage({ ...base, useCases: { "record.explain": { allowed: false } } }, page, true));

check("both use cases resolve to begin with", before.useCases.length === 2, before.useCases.join(", "));
check("the disabled one is gone from the set", !after.useCases.includes("record.explain"), after.useCases.join(", "));
check("the other survives", after.useCases.includes("worklist.summarise-selection"));
check("a set emptied by the gate denies outright",
  resolveAi(gatesForPage({ ...base, useCases: { "record.explain": { allowed: false }, "worklist.summarise-selection": { allowed: false } } }, page, true)).allowed === false);

/* ---- structure ---------------------------------------------------------- */
console.log("\n  every surface reads the same engine\n");
const source = (file) => readFileSync(join(UI, file), "utf8");
const SURFACES = ["assistant-panel.tsx", "terminal.tsx", "inline-action.tsx"];

for (const file of SURFACES) {
  const text = source(file);
  const resolves = /\bresolveAi\s*\(/.test(text) || /\bgatesForPage\s*\(/.test(text) || /\bgetUseCase\s*\(/.test(text);
  check(`${file} does not resolve access itself`, !resolves, resolves ? "calls a resolver directly" : "");
}
for (const file of SURFACES) {
  const text = source(file);
  const reads = text.includes("useAssistant") || /assistant[.:]/.test(text);
  check(`${file} reads the shared assistant`, reads);
}

const engine = source("use-assistant.ts");
check("the engine is the only place that resolves", /\bresolveAi\s*\(/.test(engine) && /\bgatesForPage\s*\(/.test(engine));
check("terminal builds its command list from the resolved set",
  source("terminal.tsx").includes("assistant.useCases"));
check("inline checks membership rather than re-resolving",
  /assistant\.useCases\.find\(/.test(source("inline-action.tsx")));
check("inline refuses to surface a clinical use case",
  source("inline-action.tsx").includes('category === "clinical"'));

/* ---- reachability -------------------------------------------------------
   A surface nobody mounts is not a surface. `inline-action.tsx` passed every
   structural check above while being reachable from nowhere -- the checks read
   the file, and the file was fine; what was missing was a call site.

   This also guards against a subtler thing that actually happened: the export
   is `InlineAiAction`, and a search for "InlineAction" finds nothing. A grep
   that misses by two characters reads exactly like a component that is dead,
   and I concluded the wrong thing from it more than once. A script that names
   the symbol cannot make that mistake. */
const SCREENS = join(dirname(fileURLToPath(import.meta.url)), "..", "packages", "erp-screens", "src");
function filesUnder(dir) {
  let found = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      found = found.concat(entry.isDirectory() ? filesUnder(path) : [path]);
    }
  } catch { /* absent directory is a failure below, not a crash here */ }
  return found;
}
const screenSource = filesUnder(SCREENS).filter((f) => f.endsWith(".tsx")).map((f) => readFileSync(f, "utf8")).join("\n");
const mounted = [...screenSource.matchAll(/<InlineAiAction[^>]*useCaseId="([^"]+)"/g)].map((m) => m[1]);

check("the inline surface is mounted somewhere", mounted.length > 0, mounted.length ? `${mounted.length} call site(s)` : "exported and never rendered");
for (const id of USE_CASES.map((useCase) => useCase.id)) {
  check(`${id} has an inline affordance`, mounted.includes(id), mounted.includes(id) ? "" : "no <InlineAiAction> names it");
}

console.log();
if (failed) {
  console.error(`  ${failed} check(s) failed.\n`);
  console.error("  If a surface resolves its own set, the three modes can disagree about");
  console.error("  what is allowed, and terminal mode becomes a way around a gate.\n");
  process.exit(1);
}
console.log("  panel, terminal and inline share one engine.\n");
