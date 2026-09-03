#!/usr/bin/env node
/**
 * Presentation is frozen (spec §2.1). This proves it two ways, with no new dependency:
 *
 *   SOURCE  every moved file is identical to its pre-migration original once import
 *           lines are stripped. Stronger than a screenshot: a screenshot shows one
 *           viewport of one theme, this covers every class string in the file.
 *
 *   CSS     the emitted stylesheet's utility selectors are compared against the
 *           baseline build's. Catches the failure a source diff cannot — Tailwind
 *           silently purging package utilities because an @source line is missing.
 *
 * Usage:  node scripts/verify-parity.mjs [--css]
 *         BASELINE_REF=<sha> node scripts/verify-parity.mjs
 *
 * --css needs a baseline build; it prints how to make one if it is not there.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BASELINE = process.env.BASELINE_REF ?? "7951db3";
const CHECK_CSS = process.argv.includes("--css");

const MOVES = [
  ["webapp/app/globals.css", "packages/tokens/src/tokens.css"],
  ["webapp/src/lib/cn.ts", "packages/ops-ui/src/cn.ts"],
  ...["badge", "button", "card", "dropdown", "empty-state", "overlay", "pagination", "tabs"]
    .map((f) => [`webapp/src/components/ui/${f}.tsx`, `packages/ops-ui/src/${f}.tsx`]),
  ...["navigation", "entity-schemas", "themes", "i18n"]
    .map((f) => [`webapp/src/config/${f}.ts`, `packages/erp-config/src/${f}.ts`]),
  ["webapp/src/types/index.ts", "packages/erp-config/src/types.ts"],
  ["webapp/src/data/mock.ts", "packages/erp-data/src/mock.ts"],
  ["webapp/src/components/layout/footer.tsx", "packages/erp-shell/src/footer.tsx"],
  ["webapp/src/components/billing/billing-page.tsx", "packages/erp-screens/src/billing/billing-page.tsx"],
  ["webapp/src/components/reports/reports-page.tsx", "packages/erp-screens/src/reports/reports-page.tsx"],
  ["webapp/src/components/worklist/filter-panel.tsx", "packages/erp-screens/src/worklist/filter-panel.tsx"],
  ["webapp/src/components/worklist/column-manager.tsx", "packages/erp-screens/src/worklist/column-manager.tsx"],
  ["webapp/src/components/worklist/record-preview.tsx", "packages/erp-screens/src/worklist/record-preview.tsx"],
  ["webapp/src/components/worklist/data-table.tsx", "packages/erp-screens/src/worklist/data-table.tsx"],
  ["webapp/src/components/worklist/card-grid.tsx", "packages/erp-screens/src/worklist/card-grid.tsx"],
  ["webapp/src/components/forms/form-navigation.tsx", "packages/erp-screens/src/forms/form-navigation.tsx"],
];

/** Files with a deliberate, spec-sanctioned change. Anything not listed must match. */
const ALLOWED = {
  "packages/tokens/src/tokens.css": "the @import \"tailwindcss\" line moved to each app's entry stylesheet",
  "packages/ops-ui/src/form-controls.tsx": "FormOption replaced by a local Option (ops-ui stays dependency-free); Input omits the native prefix/suffix attributes so the props accept an element",
};

/* Utilities that appear ONLY in apps/desktop/src/mdi/workspace-tabs.tsx, so their
   absence from the web build is accepted delta 1 (§9.1) rather than a regression.
   Each was checked against packages/ and apps/web/ before being listed here. */
const TAB_STRIP_ONLY = new Set([
  ".max-w-56", ".mb-1", ".overflow-y-hidden", ".pl-1\\.5", ".pt-1\\.5",
  ".h-\\[var\\(--tabbar-height\\)\\]", ".rounded-t-\\[11px\\]",
  ".border-b-\\[var\\(--surface\\)\\]", ".bg-\\[var\\(--text-subtle\\)\\]",
]);
/** Added by NavLink's reset so an <a> renders identically to a <button>. */
const NAV_LINK_ADDED = new Set([".no-underline", ".underline"]);

const normalize = (text) => text
  .split("\n")
  .filter((line) => !/^\s*import\b/.test(line))
  .join("\n")
  .replace(/\n{2,}/g, "\n")
  .trim();

let failures = 0;

console.log(`source parity vs ${BASELINE}\n`);
for (const [before, after] of MOVES) {
  if (ALLOWED[after]) {
    console.log(`~ ${after}\n    allowed: ${ALLOWED[after]}`);
    continue;
  }
  let original;
  try {
    original = execFileSync("git", ["show", `${BASELINE}:${before}`], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  } catch {
    console.error(`! ${before} not found at ${BASELINE}`);
    failures += 1;
    continue;
  }
  if (!existsSync(after)) {
    console.error(`! ${after} does not exist`);
    failures += 1;
    continue;
  }
  if (normalize(original) === normalize(readFileSync(after, "utf8"))) {
    console.log(`✓ ${after}`);
  } else {
    console.error(`✗ ${after} differs from ${BASELINE}:${before} beyond its imports`);
    failures += 1;
  }
}
console.log(`\n${MOVES.length - failures}/${MOVES.length} files identical modulo imports`);

if (CHECK_CSS) {
  const selectors = (file) => {
    const css = readFileSync(file, "utf8");
    return new Set((css.match(/\.[a-zA-Z][a-zA-Z0-9\\:_.%()[\]-]*\{/g) ?? []).map((s) => s.slice(0, -1)));
  };
  const findCss = (dir) => {
    if (!existsSync(dir)) return null;
    const stack = [dir];
    while (stack.length) {
      const here = stack.pop();
      for (const entry of readdirSync(here)) {
        const full = join(here, entry);
        if (statSync(full).isDirectory()) stack.push(full);
        else if (entry.endsWith(".css")) return full;
      }
    }
    return null;
  };

  const baseDir = process.env.BASELINE_BUILD ?? ".baseline-build/webapp/.next";
  const baseCss = findCss(baseDir);
  if (!baseCss) {
    console.log(`\ncss parity SKIPPED — no baseline build at ${baseDir}`);
    console.log(`  git worktree add .baseline-build ${BASELINE} \\`);
    console.log(`    && (cd .baseline-build/webapp && npm install && npm run build)`);
  } else {
    const base = selectors(baseCss);
    for (const [label, dir, ignore] of [
      ["web", "apps/web/.next", TAB_STRIP_ONLY],
      ["desktop", "apps/desktop/dist", new Set()],
    ]) {
      const css = findCss(dir);
      if (!css) { console.log(`\ncss parity ${label}: SKIPPED — no build at ${dir}`); continue; }
      const got = selectors(css);
      const missing = [...base].filter((s) => !got.has(s) && !ignore.has(s));
      const added = [...got].filter((s) => !base.has(s) && !NAV_LINK_ADDED.has(s));
      console.log(`\ncss parity ${label}: ${base.size} baseline selectors, ${missing.length} missing, ${added.length} unexpected`);
      for (const s of missing) { console.error(`  ✗ missing ${s}`); failures += 1; }
      for (const s of added) { console.error(`  ? added   ${s}`); }
    }
  }
}

process.exit(failures ? 1 : 0);
