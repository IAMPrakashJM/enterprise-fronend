#!/usr/bin/env node
/**
 * A provider secret must never come back.
 *
 * Constraint 8 says credentials are write-only, and the shapes are built so a
 * value has nowhere to live. That is the design; this is the check that the
 * design still holds after someone adds "just one field" to help an admin
 * screen. It submits a canary through both write paths, then looks for it in
 * every place a response, a file or a log could carry it.
 *
 * Zero dependencies. Paths resolve from this file, so it runs from anywhere.
 * Needs the demo API up:  ./run.sh start api
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const API = process.env.AI_API ?? "http://localhost:3200";
const CANARY = `sk-live-CANARY-${Math.random().toString(36).slice(2, 10)}`;

const json = (body) => ({ headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

const login = await fetch(`${API}/auth/login`, { method: "POST", ...json({ username: "admin", password: "admin" }) })
  .then((response) => response.json())
  .catch(() => null);

if (!login?.token) {
  console.error(`\n  Could not sign in to ${API}. Start it with:  ./run.sh start api\n`);
  process.exit(1);
}
const auth = { Authorization: `Bearer ${login.token}` };

/* Both write paths, so neither can be the one that quietly stores it. */
await fetch(`${API}/ai/config/credential`, { method: "PUT", headers: auth, ...json({ secret: CANARY }) });
await fetch(`${API}/ai/config`, { method: "PUT", headers: auth, ...json({ credential: { secret: CANARY } }) });

function filesUnder(dir) {
  let found = [];
  try {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      found = found.concat(statSync(path).isDirectory() ? filesUnder(path) : [path]);
    }
  } catch {
    // An absent directory is a pass: nothing was written there.
  }
  return found;
}

const readOrEmpty = (path) => { try { return readFileSync(path, "utf8"); } catch { return ""; } };
const body = async (path) => fetch(`${API}${path}`, { headers: auth }).then((r) => r.text()).catch(() => "");

const checks = [
  ["GET /ai/config", await body("/ai/config")],
  ["GET /ai/policy", await body("/ai/policy")],
  ["GET /auth/me", await body("/auth/me")],
  ["GET /health", await body("/health")],
  ["dummy-api/data on disk", filesUnder(join(ROOT, "dummy-api", "data")).map(readOrEmpty).join("\n")],
  [".run/api.log", readOrEmpty(join(ROOT, ".run", "api.log"))],
];

let leaked = 0;
console.log(`\n  canary: ${CANARY}\n`);
for (const [where, haystack] of checks) {
  const found = haystack.includes(CANARY);
  if (found) leaked += 1;
  console.log(`  ${found ? "LEAKED" : "ok    "} ${where}`);
}

console.log();
if (leaked) {
  console.error(`  The canary surfaced in ${leaked} place(s).\n`);
  console.error("  A provider token is write-only (spec constraint 8). If this fails, some");
  console.error("  path now returns, stores or logs one. Find it before anything ships.\n");
  process.exit(1);
}
console.log(`  ${checks.length} places checked, the canary is in none of them.\n`);
