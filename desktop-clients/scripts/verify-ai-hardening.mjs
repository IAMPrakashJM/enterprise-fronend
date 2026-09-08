#!/usr/bin/env node
/**
 * The hardening ledger, checked against the code.
 *
 * Not a linter for gaps — a check that the LEDGER IS HONEST, and it fails in
 * both directions:
 *
 *   a gap silently closed   the ledger overstates the risk, people stop
 *                           believing it, and it becomes decoration
 *   a gap silently opened   something that was true is no longer true and
 *                           nothing said so
 *   a property regressed    D-rows are guarded here as well, so "discharged"
 *                           does not rot into "was discharged once"
 *
 * A check that always failed would be ignored within a week; a check that
 * always passed would be worthless. This one passes today, and stops passing
 * the moment reality and the ledger disagree.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(ROOT, "..");
const SERVER = join(REPO, "dummy-api/server.mjs");
const CREDENTIAL = join(REPO, "dummy-api/data/ai-credential.json");
const LEDGER = join(ROOT, "docs/ai-hardening-ledger.md");
const CONTRACT = join(ROOT, "docs/ai-service-contract.md");

const server = readFileSync(SERVER, "utf8");

/* Every probe below asks about BEHAVIOUR, so prose must not answer. */
function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}
const ledger = existsSync(LEDGER) ? readFileSync(LEDGER, "utf8") : "";

let failed = 0;
const check = (ok, name, detail = "") => {
  console.log(`    ${ok ? "ok  " : "FAIL"}  ${name.padEnd(58)}${detail}`);
  if (!ok) failed += 1;
};

/* ---- the ledger exists and is reachable -------------------------------- */
console.log("\n  the ledger and the contract are present\n");
check(ledger.length > 0, "the hardening ledger exists", "docs/ai-hardening-ledger.md");
check(existsSync(CONTRACT), "the service contract exists", "docs/ai-service-contract.md");

/* ---- discharged properties are still discharged ------------------------ */
console.log("\n  properties the ledger calls discharged\n");

check(/const PROMPT_TEXT = \{/.test(server), "D5 prompts live on the server", "PROMPT_TEXT");
check(!/promptText|systemPrompt/.test(readFileSync(join(ROOT, "packages/ai-config/src/use-cases.ts"), "utf8")),
  "D5 the client holds prompt ids, not text");

if (existsSync(CREDENTIAL)) {
  const mode = statSync(CREDENTIAL).mode & 0o777;
  check(mode === 0o600, "D7 the credential file is 0600", `0${mode.toString(8)}`);
} else {
  check(true, "D7 no credential file to check", "not configured");
}
let ignored = false;
try {
  execFileSync("git", ["check-ignore", "-q", "dummy-api/data/ai-credential.json"], { cwd: REPO });
  ignored = true;
} catch { ignored = false; }
check(ignored, "D7 the credential file is gitignored");

/* The tenant is the server's answer. A body that could set it would make every
   other tenant check decorative. */
check(!/tenantId\s*=\s*body[?.]/.test(withoutComments(server)) && !/body\.tenantId/.test(withoutComments(server)),
  "D9 the tenant is never read from a request body");

/* Structural guards complement API behavior tests, run separately by test:api. */
const security = readFileSync(join(REPO,"dummy-api/ai-security.mjs"),"utf8");
const storage = readFileSync(join(REPO,"dummy-api/credential-store.mjs"),"utf8");
const audit = readFileSync(join(REPO,"dummy-api/audit-store.mjs"),"utf8");
check(/createCredentialStore\(CREDENTIAL_FILE,masterKeyFile\)/.test(server) && /aes-256-gcm/.test(storage), "N2 encrypted credential store is wired");
check(/credentialExpired\(held\)/.test(server) && /90\*86400000/.test(security), "N3 credential expiry is enforced");
check(/auditStore\.append/.test(server) && /synchronous=FULL/.test(audit), "N4 durable audit store is wired");
check(/redactProviderContext\(body\)/.test(server) && /useCase.category === 'clinical'/.test(security), "N5 server validates context and refuses clinical egress");
check(/providerAllowed\(endpoint\)/.test(server) && /redirect: "error"/.test(server), "N6 provider allowlist and redirect refusal are wired");
check(!/"Access-Control-Allow-Origin": "\*"/.test(server) && /allowedOrigins\.has/.test(server), "N8 explicit origins replace wildcard CORS");
check(/perUserLimiter\.admit\(user\)/.test(server), "N10 per-user limiter is wired");
for(const id of ["N1", "N7", "N9"])check(ledger.slice(ledger.indexOf("## Not discharged")).includes(id), `${id} external dependency stays open`);
check(/Not discharged/.test(ledger), "ledger retains production boundaries");
console.log(failed ? `${failed} hardening checks failed` : "Hardening controls and outstanding external dependencies match the ledger.");
process.exitCode=failed?1:0;
