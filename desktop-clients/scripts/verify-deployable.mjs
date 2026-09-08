#!/usr/bin/env node
/**
 * Check build API identity. --config is the strict deployment gate: artifacts,
 * stamps and explicit URLs are all required. Without it, compare local builds
 * to app env files as a development diagnostic (missing builds may be skipped).
 * Production is served from a selected release; see docs/deployment.md.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { validateConfig, verifyBuild } from "./deployment/release.mjs";

// Deployment is strict: no missing config, missing build, or mismatched stamp can pass.
const { values } = parseArgs({ options: { config: { type: "string" } } });
if (values.config) {
  try {
    const config = validateConfig(JSON.parse(readFileSync(resolve(values.config), "utf8")));
    await verifyBuild(fileURLToPath(new URL("..", import.meta.url)), config);
    console.log("Both release builds match the explicit deployment API URLs.");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  process.exit(0);
}

let failed = 0;
const check = (ok, name, detail = "") => {
  console.log(`    ${ok ? "ok  " : "FAIL"}  ${name.padEnd(56)}${detail}`);
  if (!ok) failed += 1;
};

const here = fileURLToPath(new URL("..", import.meta.url));

/** What the app's env file declares, when nothing overrides it. */
function declared(envPath, variable) {
  if (!existsSync(envPath)) return null;
  const match = new RegExp(`^${variable}=(.+)$`, "m").exec(readFileSync(envPath, "utf8"));
  return match ? match[1].trim() : null;
}

/** What the build recorded about itself. See scripts/stamp-api.mjs. */
function stamped(root) {
  const path = join(root, "BUILD_API");
  return existsSync(path) ? readFileSync(path, "utf8").trim() : null;
}

const SHELLS = [
  { name: "apps/web", root: join(here, "apps/web/.next"), env: join(here, "apps/web/.env.local"), variable: "NEXT_PUBLIC_API_URL" },
  { name: "apps/desktop", root: join(here, "apps/desktop/dist"), env: join(here, "apps/desktop/.env.local"), variable: "VITE_API_URL" },
];

console.log("\n  the built shells call the API their env file declares\n");

for (const shell of SHELLS) {
  const want = declared(shell.env, shell.variable);
  if (!want) { check(true, `${shell.name} declares no API`, "skipped"); continue; }
  if (!existsSync(shell.root)) { check(true, `${shell.name} has no build`, "skipped"); continue; }

  const built = stamped(shell.root);
  check(built !== null, `${shell.name} recorded what it was built for`, built === null ? "no BUILD_API — rebuild" : "");
  if (built === null) continue;
  check(built === want, `${shell.name} calls ${want}`, built === want ? "" : `built for ${built || "nothing"}`);
}

console.log(failed === 0
  ? "\n  Available local builds match their declared API settings.\n"
  : `\n  ${failed} check(s) failed. Rebuild before this is served:\n\n    npm run build\n`);
process.exit(failed === 0 ? 0 : 1);
