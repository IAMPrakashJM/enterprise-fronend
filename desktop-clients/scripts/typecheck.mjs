#!/usr/bin/env node
/**
 * Typecheck every package, and the desktop app.
 *
 * `npm test` transpiles and does not typecheck — vitest strips types and runs.
 * So a package can be green in the suite and red in tsc, which has caught this
 * repository out three times: once on jest-dom matchers, once on a spread that
 * silently overwrote a key, once on erp-shell after it grew tests. One command,
 * so CI and a person run the same thing.
 *
 * apps/web is absent on purpose: `next build` typechecks it, and running tsc
 * over it separately would need Next's own generated types.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = join(ROOT, "packages");

const targets = [
  ...readdirSync(PACKAGES, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(PACKAGES, entry.name, "tsconfig.json")))
    .map((entry) => ({ name: `packages/${entry.name}`, path: join(PACKAGES, entry.name) })),
  { name: "apps/desktop", path: join(ROOT, "apps/desktop") },
];

console.log("\n  typecheck\n");
let failed = 0;

for (const target of targets) {
  try {
    execFileSync("npx", ["tsc", "-p", target.path, "--noEmit"], { cwd: ROOT, stdio: "pipe" });
    console.log(`    ok    ${target.name}`);
  } catch (error) {
    failed += 1;
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
    console.log(`    FAIL  ${target.name}`);
    for (const line of output.split("\n").slice(0, 8)) console.log(`          ${line}`);
  }
}

console.log(failed === 0 ? "\n  Every package typechecks.\n" : `\n  ${failed} package(s) failed to typecheck.\n`);
process.exit(failed === 0 ? 0 : 1);
