#!/usr/bin/env node
/**
 * Every browser suite, in order, against a running stack.
 *
 * Separate from `npm test` on purpose: these need the shells up, a browser
 * installed, and about a minute. Making `npm test` depend on all three would
 * mean the fast suite stops being run.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const suites = readdirSync(HERE).filter((name) => name.endsWith(".e2e.mjs")).sort();

let failed = 0;
for (const suite of suites) {
  try {
    execFileSync("node", [join(HERE, suite)], { stdio: "inherit" });
  } catch {
    failed += 1;
  }
}

console.log(failed === 0 ? `\n  ${suites.length} browser suite(s) passed.\n` : `\n  ${failed} of ${suites.length} browser suite(s) failed.\n`);
process.exit(failed === 0 ? 0 : 1);
