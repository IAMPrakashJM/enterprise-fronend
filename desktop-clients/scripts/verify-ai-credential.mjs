#!/usr/bin/env node
/**
 * A provider secret must never come BACK.
 *
 * This check changed shape when storage was implemented. It used to assert the
 * canary existed nowhere at all, which was easy while nothing could be stored.
 * Now a credential is held in a 0600 file under data/, so the invariant is
 * narrower and worth stating exactly:
 *
 *   the secret lives in exactly ONE file, and in no response, no other file
 *   and no log.
 *
 * The status shape is the thing under test. `hint` is four characters and
 * `fingerprint` is a hash prefix; neither can be reversed, and no endpoint
 * returns anything else. This is the check that the design still holds after
 * someone adds "just one field" to help an admin screen.
 *
 * DESTRUCTIVE. Writing a canary replaces whatever key is stored, and the design
 * makes the old value unreadable, so it cannot be put back. That is not a flaw
 * in the test -- it is write-only working -- so the script refuses to run over a
 * configured credential unless you say so.
 *
 * Zero dependencies. Paths resolve from this file, so it runs from anywhere.
 * Needs the demo API up:  ./run.sh start api
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const API = process.env.AI_API ?? "http://localhost:3200";
const FORCE = process.env.AI_CANARY_FORCE === "1";
const CANARY = `sk-live-CANARY-${Math.random().toString(36).slice(2, 10)}`;

/* Takes the auth headers rather than being spread alongside them. The previous
   form -- { headers: auth, ...json(body) } -- put a SECOND `headers` key in the
   object literal, so the Authorization header was silently replaced by the
   Content-Type one and every write went out unauthenticated. The test passed
   because nothing was ever submitted, which is the worst way for a security
   check to pass. */
const json = (body, headers = {}) => ({
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const login = await fetch(`${API}/auth/login`, { method: "POST", ...json({ username: "admin", password: "admin" }) })
  .then((response) => response.json())
  .catch(() => null);

if (!login?.token) {
  console.error(`\n  Could not sign in to ${API}. Start it with:  ./run.sh start api\n`);
  process.exit(1);
}
const auth = { Authorization: `Bearer ${login.token}` };

/* Refuse to clobber a working key by accident. */
const before = await fetch(`${API}/ai/config/credential`, { headers: auth }).then((r) => r.json()).catch(() => null);
if (before?.configured && !FORCE) {
  console.error(`\n  A credential is already configured (ending ${before.hint}, set ${before.setAt}).`);
  console.error("  Running this test REPLACES it, and the stored value cannot be read back");
  console.error("  to restore it -- that is write-only behaving correctly.\n");
  console.error("  To run anyway, and re-set the real key afterwards:\n");
  console.error("      AI_CANARY_FORCE=1 npm run verify:ai-credential\n");
  process.exit(2);
}

/* Both write paths, so neither can be the one that quietly mishandles it. */
const wrote = await fetch(`${API}/ai/config/credential`, { method: "PUT", ...json({ secret: CANARY }, auth) });
await fetch(`${API}/ai/config`, { method: "PUT", ...json({ credential: { secret: CANARY }, model: { id: "unset", label: "unset", contextWindow: 0 } }, auth) });

/* If the write itself was refused there is nothing to look for, and "found it
   nowhere" would mean nothing. Fail loudly instead of passing vacuously. */
if (!wrote.ok) {
  console.error(`\n  The canary could not be written: HTTP ${wrote.status}.`);
  console.error("  Nothing was submitted, so finding it nowhere would prove nothing.\n");
  process.exit(1);
}

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

const CREDENTIAL_FILE = join(ROOT, "dummy-api", "data", "ai-credential.json");
const otherDataFiles = filesUnder(join(ROOT, "dummy-api", "data")).filter((path) => path !== CREDENTIAL_FILE);

/* MUST NOT contain the canary. */
const mustNotLeak = [
  ["GET /ai/config", await body("/ai/config")],
  ["GET /ai/config/credential", await body("/ai/config/credential")],
  ["GET /ai/policy", await body("/ai/policy")],
  ["GET /auth/me", await body("/auth/me")],
  ["GET /health", await body("/health")],
  ["every other file in data/", otherDataFiles.map(readOrEmpty).join("\n")],
  [".run/api.log", readOrEmpty(join(ROOT, ".run", "api.log"))],
];

let failures = 0;
console.log(`\n  canary: ${CANARY}\n`);
console.log("  must not carry it");
for (const [where, haystack] of mustNotLeak) {
  const found = haystack.includes(CANARY);
  if (found) failures += 1;
  console.log(`    ${found ? "LEAKED" : "ok    "} ${where}`);
}

/* MUST contain it -- one file, and only this one. */
console.log("\n  the one place it may live");
const stored = readOrEmpty(CREDENTIAL_FILE);
const held = stored.includes(CANARY);
if (!held) failures += 1;
console.log(`    ${held ? "ok    " : "MISSING"} data/ai-credential.json holds it`);

let mode = null;
try { mode = (statSync(CREDENTIAL_FILE).mode & 0o777).toString(8); } catch { /* reported below */ }
const modeOk = mode === "600";
if (!modeOk) failures += 1;
console.log(`    ${modeOk ? "ok    " : "BAD   "} file mode is ${mode ?? "unreadable"} (want 600)`);

/* The status must be derived, never the value. */
console.log("\n  the status is derived, not the secret");
const status = await fetch(`${API}/ai/config/credential`, { headers: auth }).then((r) => r.json()).catch(() => ({}));
const hintOk = status.hint === CANARY.slice(-4);
const shortOk = typeof status.hint === "string" && status.hint.length === 4;
const printOk = typeof status.fingerprint === "string" && status.fingerprint.startsWith("sha256:") && !status.fingerprint.includes(CANARY);
for (const [ok, label] of [[hintOk && shortOk, `hint is the last four characters only ("${status.hint}")`], [printOk, "fingerprint is a hash prefix, not the value"]]) {
  if (!ok) failures += 1;
  console.log(`    ${ok ? "ok    " : "FAIL  "} ${label}`);
}

/* Leave nothing behind. */
await fetch(`${API}/ai/config/credential`, { method: "DELETE", headers: auth });

console.log();
if (failures) {
  console.error(`  ${failures} check(s) failed.\n`);
  console.error("  A provider token is write-only (spec constraint 8): it lives in one 0600");
  console.error("  file and is never returned. If this fails, some path now returns, copies");
  console.error("  or logs one. Find it before anything ships.\n");
  process.exit(1);
}
console.log(`  ${mustNotLeak.length} places checked for the canary, it is in none of them;`);
console.log("  it is in the one file that may hold it, at 0600; the status is derived.");
console.log("\n  The canary has been removed. Any real key must be set again.\n");
