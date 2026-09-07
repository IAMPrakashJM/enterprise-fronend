#!/usr/bin/env node
/**
 * The build on disk is the one this machine serves.
 *
 * This working tree is also the deployment: nginx serves `apps/web/.next` and
 * `apps/desktop/dist` from here. So a build made for a local experiment does
 * not stay local — it goes live at the next request.
 *
 * `NEXT_PUBLIC_*` and `VITE_*` are INLINED at build time, so which API the
 * shells call is decided by whatever the environment said when they were last
 * built. Building once with the API pointed at localhost, to run the browser
 * suites against the dummy API, replaced the public bundle with one that tells
 * every visitor's browser to call 127.0.0.1:3200 — on their machine, where
 * nothing is listening. The site loaded, looked fine, and could not sign anyone
 * in.
 *
 * Nothing noticed for an hour. This is what notices: it compares the API base
 * baked into the artefact against the one the app's own env file declares, and
 * fails when they differ. Expected to fail while browser suites are being run
 * against a local build — that is the reminder to rebuild before walking away.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

let failed = 0;
const check = (ok, name, detail = "") => {
  console.log(`    ${ok ? "ok  " : "FAIL"}  ${name.padEnd(56)}${detail}`);
  if (!ok) failed += 1;
};

const here = new URL("..", import.meta.url).pathname;

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
  ? "\n  Both shells are built for the host that serves them.\n"
  : `\n  ${failed} check(s) failed. Rebuild before this is served:\n\n    npm run build\n`);
process.exit(failed === 0 ? 0 : 1);
