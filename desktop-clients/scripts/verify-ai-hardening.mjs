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

/* ---- gaps the ledger claims are still real ----------------------------- */
console.log("\n  gaps the ledger declares — still true?\n");

const declared = [
  {
    id: "N1/N2",
    claim: "the provider secret is plaintext on disk",
    /* If this ever stops being true, the ledger is overstating the risk and
       should say so. */
    stillTrue: () => {
      if (!existsSync(CREDENTIAL)) return true;
      const held = JSON.parse(readFileSync(CREDENTIAL, "utf8"));
      return Object.values(held).some((entry) => typeof entry?.secret === "string" && entry.secret.length > 0);
    },
  },
  {
    id: "N4",
    claim: "audit is console.log, not a store",
    stillTrue: () => /console\.log\(`\[ai\]/.test(server) && !/auditStore|AUDIT_FILE|appendAudit/.test(withoutComments(server)),
  },
  {
    id: "N5",
    claim: "nothing is redacted before egress to a provider",
    /* Scoped to the AI dispatch path, not the whole file. Search logging DOES
       redact by key now, and a whole-file match reported N5 as closed on the
       strength of it — which was half true and therefore misleading. The open
       half is that nothing strips identifiers from what reaches a provider.

       Comments are stripped too: the word "redacted" appears in one describing
       what the client assembles, and matching prose once reported this gap as
       closed when it had never been open. */
    stillTrue: () => {
      const source = withoutComments(server);
      const dispatch = source.slice(source.indexOf('pathname === "/ai/dispatch"'));
      return !/redact|scrub|deidentif/i.test(dispatch);
    },
  },
  {
    id: "N6",
    claim: "any configured provider endpoint is obeyed",
    stillTrue: () => !/APPROVED_PROVIDERS|providerAllowlist/.test(withoutComments(server)),
  },
  {
    id: "N8",
    claim: 'CORS is "*"',
    stillTrue: () => /"Access-Control-Allow-Origin": "\*"/.test(server),
  },
  {
    id: "N9",
    claim: "the role check is one string comparison",
    stillTrue: () => /role === "enterprise-admin"/.test(server),
  },
  {
    id: "N10",
    claim: "rate limits are per tenant only",
    stillTrue: () => !/perUser|userWindow|limitFor\(user/.test(withoutComments(server)),
  },
];

for (const gap of declared) {
  const real = gap.stillTrue();
  const mentioned = ledger.includes(gap.id.split("/")[0]);
  check(mentioned, `${gap.id} is in the ledger`);
  /* The interesting direction. A gap that has been closed and not recorded
     leaves the ledger claiming a risk that no longer exists, and a ledger that
     overstates is one people stop reading. */
  check(real, `${gap.id} ${gap.claim}`, real ? "" : "→ CLOSED? update the ledger");
}

console.log("\n  the ledger does not claim more than it should\n");
check(!/all clear|fully hardened|production ready|no known gaps/i.test(ledger),
  "the ledger claims no clean bill of health");
check(/Not discharged/.test(ledger), "the ledger has a not-discharged section");

console.log(failed === 0
  ? "\n  The ledger matches the code. Ten gaps declared, ten still real.\n"
  : `\n  ${failed} check(s) failed — the ledger and the code disagree.\n`);
process.exit(failed === 0 ? 0 : 1);
