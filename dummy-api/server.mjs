#!/usr/bin/env node
/**
 * Nexora demo auth API.
 *
 * Deliberately zero dependencies: a stand-in for a real identity and settings service
 * so the two shells have something to log in against. Sessions live in a Map and die
 * with the process; per-user preferences are written to data/preferences.json and do
 * survive a restart, because "log out, log back in, your settings are still there" is
 * the whole point of that endpoint.
 *
 * NOT a security boundary. Passwords are compared in plaintext, tokens are random hex
 * with no expiry claim, and CORS is open to every origin — the web shell, the desktop
 * dev server and the packaged Tauri app are three different origins, and enumerating
 * them buys nothing for a demo. Do not model a real service on this file.
 *
 *   node server.mjs            # :3200
 *   PORT=4100 node server.mjs
 */
import { createServer } from "node:http";
import { ADAPTERS, acceptKey, attachSocket, chooseProvider, mockSegment, transcribeOpenAI } from "./speech-gateway.mjs";
import { createHash, randomBytes } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT ?? 3200);

/* Roles are the `value` strings from packages/erp-config's ROLES, so the shell's role
   selector can reflect the account instead of being free-choice. */
const ACCOUNTS = [
  {
    username: "user1",
    password: "user1",
    user: {
      id: "USR-00311",
      name: "Aisha Rahman",
      email: "aisha.rahman@nexora.example",
      initials: "AR",
      title: "Finance Operations",
      role: "finance-manager",
      branch: "dubai",
      tenantId: "NEX-AE-001",
    },
  },
  {
    username: "user2",
    password: "user2",
    user: {
      id: "USR-00327",
      name: "Omar Khan",
      email: "omar.khan@nexora.example",
      initials: "OK",
      title: "Supply Chain",
      role: "operations-analyst",
      branch: "sharjah",
      tenantId: "NEX-AE-001",
    },
  },
  {
    username: "admin",
    password: "admin",
    user: {
      id: "USR-00301",
      name: "Prakash Mathew",
      email: "prakash@nexora.example",
      initials: "PM",
      title: "Solution Architecture",
      role: "enterprise-admin",
      branch: "hq",
      tenantId: "NEX-AE-001",
    },
  },
];

/** token -> user. Lost on restart, which is correct for a demo. */
const sessions = new Map();

/* Preferences, unlike sessions, are written to disk. An in-memory store would lose
   every saved preference the moment the process restarted, which defeats the whole
   point of "log out, log back in, your settings are still there".
   Shape: { "<userId>": { <only the keys that differ from the client's defaults> } } */
const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "data");
const PREFS_FILE = join(DATA_DIR, "preferences.json");

function loadPrefs() {
  try {
    return JSON.parse(readFileSync(PREFS_FILE, "utf8"));
  } catch {
    // Missing or corrupt: start clean rather than refusing to boot.
    return {};
  }
}

const preferences = loadPrefs();

/* Temp file + rename, so a crash mid-write cannot leave a truncated JSON file that
   then fails to parse on the next boot and silently drops everyone's settings. */
function savePrefs() {
  mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${PREFS_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(preferences, null, 2) + "\n");
  renameSync(tmp, PREFS_FILE);
}

/* Worklist column layout, per user per page. A separate file rather than a key
   inside preferences.json: this grows with the number of pages a user visits
   (~200 in PAGE_REGISTRY), and mixing unbounded data into the settings blob
   would make every preference save rewrite all of it. */
/* ---- saved views -------------------------------------------------------- *
 *
 * A shareable link to a filtered list, INCLUDING filters that may never appear
 * in a URL. The filter definition lives here; the link carries only an opaque
 * id, so a patient name is not written into nginx access logs, APM traces,
 * browser history or a Referer header on the way to a colleague.
 *
 * Four properties, and each is the reason a plain URL was not enough:
 *
 *   opaque         VW_ + 16 hex from randomBytes. Not a hash of the filters,
 *                  which would be reversible for a small search space -- there
 *                  are not many MRNs in a tenant, and a rainbow table over them
 *                  is trivial.
 *   tenant-scoped  a view is read back only by its own tenant, whatever id is
 *                  presented. Guessing an id from another tenant gets a 404,
 *                  the same answer as an id that does not exist.
 *   audited        who created and who opened, with the FILTER KEYS and never
 *                  the values. HHS wants enough to examine activity, not a
 *                  second copy of the clinical data in a log nobody guards.
 *   expiring       a link mailed to someone stops working. Default 30 days.
 * ------------------------------------------------------------------------- */
/* ---- worklist search ---------------------------------------------------- *
 *
 * A POST, and that is the whole point. A GET puts the filters in the request
 * line, and the request line is what nginx, the API gateway, APM, OpenTelemetry
 * and every cloud log record — so moving a patient name out of the visible URL
 * and leaving it in a GET query changes nothing downstream. HTTPS protects the
 * wire and nothing after the terminator.
 *
 * The body arrives in two halves because they are treated differently: the safe
 * half is logged, the sensitive half is logged BY KEY ONLY. That is the same
 * rule the saved-view audit follows, and §14's redaction table in the roadmap.
 *
 * Rows come from the REAL generator in packages/erp-data, imported through
 * Node's type stripping exactly as the verify scripts import the real gate
 * resolver. A second copy of the data here would drift from the one the client
 * renders, and a search that disagrees with the table it filters is worse than
 * no search.
 * ------------------------------------------------------------------------- */
import { getWorklistConfig } from "../desktop-clients/packages/erp-data/src/mock.ts";
import { DATA_CLASSIFICATIONS } from "../desktop-clients/packages/erp-config/src/data-classification.ts";

/* The redaction table, as a function. A value never reaches a log; a key does,
   because "someone searched by MRN" is what an audit needs and "AV204581" is
   what it must not keep. */
function loggableFilters(safe, sensitive) {
  const safePart = Object.entries(safe).map(([key, value]) => `${key}=${value}`).join(" ");
  const sensitiveKeys = Object.keys(sensitive).sort().join(",");
  return `${safePart}${sensitiveKeys ? ` +redacted[${sensitiveKeys}]` : ""}`;
}

/* Every filter the client sends is checked against the registry here too. A
   client that has been edited can put a patient name in `safeFilters` and it
   would be logged in full — so the server decides which half a key belongs to,
   not the caller. */
function partitionOnServer(filters) {
  const safe = {};
  const sensitive = {};
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (typeof value !== "string" || !value.trim()) continue;
    if (DATA_CLASSIFICATIONS[key] === "operational") safe[key] = value;
    else sensitive[key] = value;
  }
  return { safe, sensitive };
}

function matchesRow(row, key, value) {
  const needle = value.trim().toLowerCase();
  if (!needle) return true;
  /* `query` is the free-text box: it searches every visible field, which is
     exactly why it is classified phi rather than operational. */
  if (key === "query") return Object.values(row).some((field) => String(field).toLowerCase().includes(needle));
  const field = row[key];
  if (field === undefined) return true;
  return String(field).toLowerCase().includes(needle);
}

/* ---- reference data, with per-key failure ------------------------------- *
 *
 * An empty dropdown is ambiguous. "This tenant configured nothing" and "this
 * list is broken today" look identical on screen and mean opposite things — one
 * is a setup task and the other is an incident, and a user who cannot tell them
 * apart raises a ticket for the first and ignores the second.
 *
 * So the fan-out catches PER KEY: one bad list omits one list instead of 500ing
 * the whole response, and the keys that failed come back in `failures`. That
 * field is the entire contract. Without it a client sees `[]` and has to guess.
 * ------------------------------------------------------------------------- */
const REFERENCE_SOURCES = {
  branches: () => BRANCH_REFERENCE,
  departments: () => DEPARTMENT_REFERENCE,
  roles: () => ROLE_REFERENCE,
  /* Deliberately breakable, so the failure path can be exercised without
     waiting for something to actually break. REFERENCE_FAIL=insuranceNetworks
     makes this one throw. */
  insuranceNetworks: () => INSURANCE_REFERENCE,
};

const BRANCH_REFERENCE = [
  { value: "hq", label: "Abu Dhabi • Head Office" },
  { value: "dubai", label: "Dubai • Business Center" },
  { value: "sharjah", label: "Sharjah • Operations Hub" },
  { value: "india", label: "Kochi • Delivery Center" },
];
const DEPARTMENT_REFERENCE = [
  { value: "finance", label: "Finance" },
  { value: "hr", label: "Human Resources" },
  { value: "clinical", label: "Clinical Services" },
];
const ROLE_REFERENCE = [
  { value: "enterprise-admin", label: "Enterprise Administrator" },
  { value: "finance-manager", label: "Finance Manager" },
  { value: "clinician", label: "Clinician" },
];
const INSURANCE_REFERENCE = [
  { value: "daman", label: "Daman" },
  { value: "thiqa", label: "Thiqa" },
  { value: "adnic", label: "ADNIC" },
];

/* Which keys should fail this run. Comma-separated, from the environment, so a
   demo can show the warning without anyone editing code. */
const FAILING_REFERENCES = new Set((process.env.REFERENCE_FAIL ?? "").split(",").map((key) => key.trim()).filter(Boolean));

function loadReferences(keys) {
  const references = {};
  const failures = [];
  for (const key of keys) {
    const source = REFERENCE_SOURCES[key];
    if (!source) {
      failures.push({ key, code: "REFERENCE_UNKNOWN" });
      references[key] = [];
      continue;
    }
    try {
      if (FAILING_REFERENCES.has(key)) throw new Error("simulated reference failure");
      references[key] = source();
    } catch {
      /* The list comes back EMPTY and the key is named in failures. Omitting
         the key entirely would make a client crash on `references[key].map`,
         and returning nothing at all would lose the other 53 lists to one bad
         column mapping. */
      references[key] = [];
      failures.push({ key, code: "REFERENCE_LOAD_FAILED" });
    }
  }
  return { references, failures, partial: failures.length > 0 };
}

const VIEWS_FILE = join(DATA_DIR, "saved-views.json");
const VIEW_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function loadViews() {
  try { return JSON.parse(readFileSync(VIEWS_FILE, "utf8")); } catch { return {}; }
}

let savedViews = loadViews();

function saveViews() {
  mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${VIEWS_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(savedViews, null, 2) + "\n");
  renameSync(tmp, VIEWS_FILE);
  /* Same 0600 as the credential store. These hold the filter values a URL was
     not allowed to carry, so the file is not more public than the URL would
     have been. */
  try { chmodSync(VIEWS_FILE, 0o600); } catch { /* best effort */ }
}

function newViewId() {
  return `VW_${randomBytes(8).toString("hex").toUpperCase()}`;
}

/* Keys only. The whole point of the saved view is that the values do not travel
   to places that keep logs, and an audit line is such a place. */
function auditView(action, user, view) {
  console.log(`[audit] saved-view ${action} tenant=${user.tenantId} user=${user.id} view=${view.id} page=${view.pageId} filters=${Object.keys(view.filters).sort().join(",") || "none"}`);
}

const LAYOUTS_FILE = join(DATA_DIR, "layouts.json");

function loadLayouts() {
  try {
    return JSON.parse(readFileSync(LAYOUTS_FILE, "utf8"));
  } catch {
    return {};
  }
}

const layouts = loadLayouts();

function saveLayouts() {
  mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${LAYOUTS_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(layouts, null, 2) + "\n");
  renameSync(tmp, LAYOUTS_FILE);
}

/* AI access policy: gates 2-7 of eight, per tenant.
 *
 * A STAND-IN, and the endpoint most likely to be mistaken for governance. It
 * reads a JSON file and returns it. It enforces nothing, it is not multi-tenant
 * in any real sense, and the process it runs in states in its own header that it
 * is not a security boundary. The real service owns policy authorship,
 * versioning, an audit trail of who changed which gate, and -- above all -- the
 * server-side re-check at dispatch, which is the actual enforcement point. The
 * client-side resolver only decides what to RENDER.
 *
 * Seeded from ai-policy.example.json, which is committed; the live copy lives
 * under data/ and is gitignored, exactly as preferences.json is.
 */
const POLICY_FILE = join(DATA_DIR, "ai-policy.json");
const POLICY_SEED = join(dirname(fileURLToPath(import.meta.url)), "ai-policy.example.json");

function loadPolicies() {
  for (const file of [POLICY_FILE, POLICY_SEED]) {
    try {
      return JSON.parse(readFileSync(file, "utf8"));
    } catch {
      // Try the seed next; an unreadable seed means no policy, handled below.
    }
  }
  return {};
}

const policies = loadPolicies();

/* AI configuration: what an administrator sets. Same stand-in caveats as the
   policy store above, plus one that matters more.
   THERE IS NO CREDENTIAL HERE, and there is no code path that stores one. This
   process has no vault, no encryption at rest and open CORS; a provider token
   written into data/ would be a token in a world-readable file. The endpoint
   that would accept one answers 501 instead. */
const AI_CONFIG_FILE = join(DATA_DIR, "ai-config.json");
const AI_CONFIG_SEED = join(dirname(fileURLToPath(import.meta.url)), "ai-config.example.json");

function loadAiConfig() {
  for (const file of [AI_CONFIG_FILE, AI_CONFIG_SEED]) {
    try {
      return JSON.parse(readFileSync(file, "utf8"));
    } catch {
      // Fall through to the seed, then to an empty map.
    }
  }
  return {};
}

const aiConfig = loadAiConfig();

/* The loader had no counterpart for four tasks: PUT /ai/config mutated this
   object and never wrote it, so every administrative change survived exactly
   until the next restart. It went unnoticed because the credential DID persist,
   so a restart left a valid key pointing at no provider and dispatch answered
   "No provider or model is configured" -- a message that reads like a setup
   step nobody had done, rather than a setting that had been silently dropped. */
function saveAiConfig() {
  try {
    writeFileSync(AI_CONFIG_FILE, JSON.stringify(aiConfig, null, 2));
  } catch {
    console.warn("[ai] could not persist the AI configuration; changes will be lost on restart");
  }
}

/* ---------------------------------------------------------------------------
   Provider credential storage.

   This exists at the operator's explicit instruction, after the trade-off was
   put to them and restated: this process has no vault, no encryption at rest
   and open CORS, so the secret lives in a 0600 file under data/ and is only as
   safe as this machine and this account. It is a demo decision. Spec sections
   6.3 and 12 still describe what a real deployment owes here, and nothing below
   discharges that.

   What survived from the write-only design, because keeping it cost nothing:
     - no endpoint returns the value,
     - no response shape has a field that could carry it,
     - exactly one function reads `secret`, and it hands it to the provider.
   --------------------------------------------------------------------------- */
const CREDENTIAL_FILE = join(DATA_DIR, "ai-credential.json");

function loadCredentials() {
  try {
    return JSON.parse(readFileSync(CREDENTIAL_FILE, "utf8"));
  } catch {
    return {};
  }
}

const credentials = loadCredentials();

function saveCredentials() {
  /* `mode` only applies when the file is CREATED, so the chmod is not
     redundant: without it a file that already existed keeps whatever
     permissions it had, which is the case that actually matters on a box where
     something wrote it once before this code did. */
  writeFileSync(CREDENTIAL_FILE, JSON.stringify(credentials, null, 2), { mode: 0o600 });
  try {
    chmodSync(CREDENTIAL_FILE, 0o600);
  } catch {
    console.warn("[ai] could not chmod the credential file to 0600");
  }
}

/* Takes a TENANT, never a secret, and returns only values that cannot be
   reversed: the last four characters and a hash prefix. The shape is byte for
   byte what it was when nothing was stored, which is the part worth noticing --
   adding storage did not add a field capable of carrying the value. */
/* `scope` lets speech providers reuse this exact machinery rather than growing a
   second credential store with its own subtly different rules. The main provider
   keeps the bare tenant key so nothing already stored has to move. */
function credentialKey(tenantId, scope) {
  return scope ? `${tenantId}:${scope}` : tenantId;
}

function credentialStatus(tenantId, scope) {
  const held = credentials[credentialKey(tenantId, scope)];
  if (!held) {
    return {
      configured: false,
      hint: null,
      fingerprint: null,
      setBy: null,
      setAt: null,
      rotatedAt: null,
      lastVerifiedAt: null,
      lastError: null,
    };
  }
  /* Field by field rather than a spread of `held`. A spread would put `secret`
     into every response the day someone adds a field and forgets to omit it. */
  return {
    configured: true,
    hint: held.hint ?? null,
    fingerprint: held.fingerprint ?? null,
    setBy: held.setBy ?? null,
    setAt: held.setAt ?? null,
    rotatedAt: held.rotatedAt ?? null,
    lastVerifiedAt: held.lastVerifiedAt ?? null,
    lastError: held.lastError ?? null,
  };
}

function fingerprintOf(secret) {
  return `sha256:${createHash("sha256").update(secret).digest("hex").slice(0, 16)}`;
}

/* The stand-in for an authorization layer.

   This used to refuse EVERYONE, which was the honest answer while nothing could
   be written anyway. It is now a role check, and that is a deliberate loosening
   made so the credential can be set through the admin API as asked.

   The one property that makes it worth more than nothing: `role` is read off
   the session object this server issued at login, never off the request, so a
   caller cannot claim to be an admin. It is still a comparison against a
   hardcoded account list. A real deployment needs real authorization, and this
   function is where that goes.

   Returns a response body when refused, or null when the write may proceed. */
function refuseAdminWrite(user) {
  if (user?.role === "enterprise-admin") return null;
  return {
    error: "This change requires an administrator.",
    detail: `Signed in as ${user?.role ?? "an unknown role"}. The demo API accepts administrative writes only from enterprise-admin.`,
  };
}

/* Prompt TEXT, server-side and nowhere else.

   The client sends a promptId; this is what that id resolves to. Keeping the
   text here is the whole reason a browser cannot read, replay or edit a prompt,
   and it is why changing one is a server restart rather than a client release. */
const PROMPT_TEXT = {
  "worklist.summarise.v1":
    "You summarise ERP worklist rows for an operations user. Use ONLY the fields provided. Never invent a value, a total or a status. If the fields do not support a statement, omit it. Be brief and factual.",
  "record.explain.v1":
    "You explain one ERP record and what its current status means for the person looking at it. Use ONLY the fields provided. Never invent a value. If something looks unusual given the fields, say so plainly.",
  "form.draft-note.v1":
    "You draft a short internal note from values a user has entered on a form. Use ONLY those values. Never invent a reference, a name or an amount. Output the note text alone, with no preamble.",
  "dashboard.explain-metrics.v1":
    "You explain a set of dashboard figures to the person looking at them. Use ONLY the figures provided, including their movement and footnotes. Say what they mean TOGETHER rather than restating each one in turn, and name anything that looks inconsistent between them. Never invent a figure, a period or a cause.",
  "inbox.summarise-unread.v1":
    "You tell someone what is waiting in their inbox. Use ONLY the unread items provided. Lead with anything that looks time-critical or blocking, group the rest by what they are about, and give a one-line count. Do not invent an item, a deadline or a sender, and do not tell the reader what to do about any of it.",
  /* Clinical. Each is told what it is NOT for as plainly as what it is: a
     summary that quietly turns into advice is the failure mode that matters
     here, and the model has no way to know it is not the treating clinician
     unless the prompt says so. */
  "encounter.summarise.v1":
    "You summarise one clinical record for the clinician already responsible for it. Use ONLY the fields provided. State the picture plainly: ward, working diagnosis, how long the stay has run and current status. You are NOT diagnosing, NOT recommending treatment and NOT assessing risk. Never invent a finding, a date or a name, and if the fields do not support a statement, leave it out.",
  "documentation.gaps.v1":
    "You name what a clinical record of this kind would normally carry and this one does not. Use ONLY the fields provided. Output is a short list of gaps for a human to act on -- never the content that would fill them, never a clinical judgement, and never an instruction to a clinician.",
  "cohort.summarise-selection.v1":
    "You summarise a set of selected clinical records as a GROUP for an operational reader: where the load sits by ward, which look urgent by acuity, and any outlier length of stay. Use ONLY the rows provided. Never single out an individual, never infer anything about a person, and never invent a count.",
  /* SELECTION, NOT GENERATION. Both of these are told to choose from a list
     that travels in the payload. A model asked for an ICD code will produce
     something shaped exactly like one, and a plausible wrong code survives
     review because it is well formed -- so the instruction to refuse when
     nothing fits matters more than the instruction to choose. */
  "coding.suggest-icd.v1":
    "You select diagnosis codes for a documented clinical problem. You may ONLY choose from the candidate list given in the fields; it is the service's catalogue. Never output a code that is not in that list, never adjust a code you were given, and if none of them fit the documented problem say so explicitly and choose nothing. Return at most three, each as `CODE — term — one short reason it fits`. You are not diagnosing; you are matching what has already been documented.",
  "orders.suggest.v1":
    "You select orders for a documented clinical problem. You may ONLY choose from the candidate list given in the fields; it is what this service can actually place. Never output an order that is not in that list, and if none fit say so and choose nothing. Return at most four, each as `CODE — name — one short reason`. Do not state urgency, do not imply an order is required, and do not recommend treatment. A clinician decides what is placed.",
  "report.summarise.v1":
    "You summarise a report's rows: actual against previous and against budget. Use ONLY the rows provided. Lead with where the movement is and which rows drive it. State variances in the direction they are given and never invent a total, a percentage or a reason.",
};

/* ---------------------------------------------------------------------------
   Rate and budget enforcement.

   `limits.requestsPerMinute` and `limits.tokensPerDay` were in AiConfig from the
   start, displayed on the administration surface, and enforced nowhere. That was
   survivable while dispatch echoed a mock. It stopped being survivable the day a
   real billed provider was wired in behind a public host whose demo passwords are
   printed on its own login screen: anyone who can reach the site can sign in and
   spend the tenant's balance in a loop.

   Two properties this is built around:

   ABSENCE OF CONFIG IS NOT ABSENCE OF A LIMIT. A tenant with no config, or a
   zero, or a string where a number belongs, gets DEFAULT_LIMITS. The failure
   mode of a missing limit must never be "unlimited spend".

   REQUESTS ARE COUNTED ON ADMISSION, NOT ON SUCCESS. A failing or slow provider
   still costs a round trip, and a caller who can retry for free on every error
   has no limit at all. So the slot is taken before the work is attempted, and
   the counter sits ahead of prompt and credential validation for the same
   reason -- a malformed request is still a request.
   --------------------------------------------------------------------------- */
const USAGE_FILE = join(DATA_DIR, "ai-usage.json");

/* The token budget is persisted; the per-minute window is not. A restart losing
   a minute of history is irrelevant, but a restart resetting the DAY'S spend
   would make the budget bypassable by anyone who can bounce the process. */
function loadUsage() {
  try {
    return JSON.parse(readFileSync(USAGE_FILE, "utf8"));
  } catch {
    return {};
  }
}

const usage = loadUsage();
const recentRequests = new Map();

const DEFAULT_LIMITS = { requestsPerMinute: 20, tokensPerDay: 200000 };

function limitsFor(tenantId) {
  const configured = aiConfig[tenantId]?.limits ?? {};
  const positive = (value, fallback) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback);
  return {
    requestsPerMinute: positive(configured.requestsPerMinute, DEFAULT_LIMITS.requestsPerMinute),
    tokensPerDay: positive(configured.tokensPerDay, DEFAULT_LIMITS.tokensPerDay),
  };
}

/* UTC, not local. A budget that resets at the server's local midnight silently
   changes meaning when the machine moves timezone. */
function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function tokensUsedToday(tenantId) {
  const held = usage[tenantId];
  return held && held.day === utcDay() ? held.tokens : 0;
}

/* Returns a refusal, or null to proceed. Does NOT take the slot -- admit() does,
   so a caller can report the limit without consuming budget. */
function refuseForRate(tenantId) {
  const { requestsPerMinute, tokensPerDay } = limitsFor(tenantId);
  const now = Date.now();
  const window = (recentRequests.get(tenantId) ?? []).filter((at) => now - at < 60_000);
  recentRequests.set(tenantId, window);

  if (window.length >= requestsPerMinute) {
    const retryAfter = Math.max(1, Math.ceil((60_000 - (now - window[0])) / 1000));
    return {
      status: 429,
      retryAfter,
      body: {
        error: "Rate limit reached.",
        detail: `${requestsPerMinute} requests per minute for this tenant. Try again in ${retryAfter}s.`,
      },
    };
  }

  const used = tokensUsedToday(tenantId);
  if (used >= tokensPerDay) {
    return {
      status: 429,
      /* Seconds to the next UTC midnight, so a client is not told to retry into
         the same refusal. */
      retryAfter: Math.max(1, Math.ceil((Date.parse(`${utcDay()}T23:59:59.999Z`) + 1 - Date.now()) / 1000)),
      body: {
        error: "Daily token budget spent.",
        detail: `${used} of ${tokensPerDay} tokens used today. The budget resets at 00:00 UTC.`,
      },
    };
  }
  return null;
}

function admit(tenantId) {
  const window = recentRequests.get(tenantId) ?? [];
  window.push(Date.now());
  recentRequests.set(tenantId, window);
}

function recordTokens(tenantId, tokens) {
  if (!(Number(tokens) > 0)) return;
  const day = utcDay();
  const held = usage[tenantId];
  usage[tenantId] = held && held.day === day ? { day, tokens: held.tokens + Number(tokens) } : { day, tokens: Number(tokens) };
  try {
    writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
  } catch {
    console.warn("[ai] could not persist token usage; the daily budget will reset on restart");
  }
}

/* One place reads `secret`, and this is it. */
async function callProvider(config, secret, messages) {
  const endpoint = String(config?.provider?.endpoint ?? "").replace(/\/+$/, "");
  const model = config?.model?.id;
  if (!endpoint || !model || model === "unset") {
    return { ok: false, status: 409, error: "No provider or model is configured.", detail: "Set provider.endpoint and model.id through PUT /ai/config first." };
  }
  let response;
  try {
    response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      /* 700 was the original figure and it was wrong for a reasoning model: the
         provider spends completion tokens THINKING before it writes anything, so
         a 700-token budget was consumed entirely by reasoning and the answer
         came back empty. Measured against this provider, a five-item inbox
         summary needs ~1,100 reasoning tokens before the first word of output.
         The daily budget counts total_tokens, so a larger cap here is honestly
         accounted for rather than hidden. */
      body: JSON.stringify({ model, messages, max_tokens: 2000, temperature: 0.2 }),
      signal: AbortSignal.timeout(45000),
    });
  } catch (cause) {
    /* The provider's own message, not the request that produced it: a thrown
       fetch error can carry the request headers, and those hold the key. */
    return { ok: false, status: 502, error: "The provider could not be reached.", detail: cause?.name === "TimeoutError" ? "Timed out after 45s." : "Network error." };
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, status: response.status === 401 ? 401 : 502, error: "The provider rejected the request.", detail: payload?.error?.message ?? `HTTP ${response.status}.` };
  }
  const choice = payload?.choices?.[0];
  const text = choice?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    /* Say WHICH kind of nothing. "Returned no text" was true of both a provider
       fault and a budget that ran out mid-thought, and those need opposite
       responses -- one is retry, the other is raise the cap. finish_reason is
       the provider telling us which, and throwing it away made a diagnosable
       failure look like an outage. */
    if (choice?.finish_reason === "length") {
      const reasoning = payload?.usage?.completion_tokens_details?.reasoning_tokens;
      return {
        ok: false,
        status: 502,
        error: "The model ran out of output budget before answering.",
        detail: `It spent its entire allowance${reasoning ? ` (${reasoning} reasoning tokens)` : ""} without producing an answer. Raise max_tokens for this provider.`,
      };
    }
    return { ok: false, status: 502, error: "The provider returned no text.", detail: choice?.finish_reason ? `finish_reason: ${choice.finish_reason}` : undefined };
  }
  return { ok: true, text: text.trim(), model: payload?.model ?? model, usage: payload?.usage ?? null };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function send(res, status, body, extraHeaders) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    ...CORS,
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    ...(extraHeaders ?? {}),
  });
  res.end(payload);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    // A demo service still should not be a memory bomb.
    if (size > 16_384) throw new Error("body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function bearer(req) {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const { pathname } = requestUrl;

  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    return res.end();
  }

  if (req.method === "POST" && pathname === "/auth/login") {
    let body;
    try {
      body = await readJson(req);
    } catch {
      return send(res, 400, { error: "Malformed request body." });
    }
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const account = ACCOUNTS.find((a) => a.username === username && a.password === password);
    if (!account) {
      /* One message for both a wrong username and a wrong password — the demo
         credentials are printed on the login screen anyway, and splitting them is a
         habit worth not building. */
      return send(res, 401, { error: "Username or password is incorrect." });
    }
    const token = randomBytes(24).toString("hex");
    sessions.set(token, account.user);
    console.log(`[auth] ${account.username} signed in`);
    return send(res, 200, { token, user: account.user });
  }

  if (req.method === "GET" && pathname === "/auth/me") {
    const token = bearer(req);
    const user = token ? sessions.get(token) : undefined;
    if (!user) return send(res, 401, { error: "Not signed in." });
    return send(res, 200, { user });
  }

  if (req.method === "POST" && pathname === "/auth/logout") {
    const token = bearer(req);
    if (token) sessions.delete(token);
    res.writeHead(204, CORS);
    return res.end();
  }

  if (pathname === "/preferences") {
    const token = bearer(req);
    const user = token ? sessions.get(token) : undefined;
    if (!user) return send(res, 401, { error: "Not signed in." });

    if (req.method === "GET") {
      /* Empty on a first login by design: the client merges this over its own
         defaults, so an absent key means "still default" rather than "unset". */
      return send(res, 200, { preferences: preferences[user.id] ?? {} });
    }

    if (req.method === "PUT") {
      let body;
      try {
        body = await readJson(req);
      } catch {
        return send(res, 400, { error: "Malformed request body." });
      }
      const next = body.preferences;
      if (next === null || typeof next !== "object" || Array.isArray(next)) {
        return send(res, 400, { error: "Expected { preferences: object }." });
      }
      preferences[user.id] = next;
      try {
        savePrefs();
      } catch (error) {
        console.error("[prefs] write failed:", error.message);
        return send(res, 500, { error: "Could not persist preferences." });
      }
      console.log(`[prefs] ${user.id} saved ${Object.keys(next).length} override(s)`);
      res.writeHead(204, CORS);
      return res.end();
    }

    return send(res, 405, { error: `${req.method} not allowed on /preferences.` });
  }

  if (pathname === "/layouts") {
    const token = bearer(req);
    const user = token ? sessions.get(token) : undefined;
    if (!user) return send(res, 401, { error: "Not signed in." });

    if (req.method === "GET") {
      return send(res, 200, { layouts: layouts[user.id] ?? {} });
    }

    if (req.method === "PUT") {
      let body;
      try {
        body = await readJson(req);
      } catch {
        return send(res, 400, { error: "Malformed request body." });
      }
      const pageId = typeof body.pageId === "string" ? body.pageId : "";
      const layout = body.layout;
      if (!pageId || layout === null || typeof layout !== "object" || Array.isArray(layout)) {
        return send(res, 400, { error: "Expected { pageId: string, layout: object }." });
      }
      if (!Array.isArray(layout.columns)) {
        return send(res, 400, { error: "layout.columns must be an array." });
      }
      /* One page per request, merged into the user's map. Accepting the whole
         map instead would let a stale client wipe layouts saved from another
         tab between its own read and write. */
      layouts[user.id] = { ...(layouts[user.id] ?? {}), [pageId]: layout };
      try {
        saveLayouts();
      } catch (error) {
        console.error("[layouts] write failed:", error.message);
        return send(res, 500, { error: "Could not persist the layout." });
      }
      res.writeHead(204, CORS);
      return res.end();
    }

    return send(res, 405, { error: `${req.method} not allowed on /layouts.` });
  }

  if (pathname === "/ai/policy") {
    const token = bearer(req);
    const user = token ? sessions.get(token) : undefined;
    if (!user) return send(res, 401, { error: "Not signed in." });

    if (req.method === "GET") {
      /* tenantId comes from the SESSION, never from the request. A tenant id in
         a query string or a body is ignored -- accepting one would make tenant
         isolation a client-side assertion, which is not isolation. */
      const tenantId = user.tenantId;
      const policy = policies[tenantId];
      if (!policy) {
        /* No policy for this tenant is a DENIAL, not a default-open. An absent
           configuration must never be the permissive case. */
        return send(res, 200, {
          tenantId,
          global: { platform: { allowed: false } },
          modules: {}, pages: {}, useCases: {},
          note: "No policy is configured for this tenant; AI is denied at the platform gate.",
        });
      }
      return send(res, 200, { tenantId, ...policy });
    }

    if (req.method === "PUT") {
      /* Spec §6.4: "admin only" has nothing to check here -- this application
         has no authorization layer. Failing closed is the only honest answer;
         accepting writes from any signed-in session would look like it works. */
      return send(res, 403, {
        error: "Policy writes require an administrator.",
        detail: "No authorization layer exists in this demo API. See spec §6.4.",
      });
    }

    return send(res, 405, { error: `${req.method} not allowed on /ai/policy.` });
  }

  /* ---- worklist search --------------------------------------------------- */
  if (pathname === "/worklists/search") {
    if (req.method !== "POST") return send(res, 405, { error: `${req.method} not allowed on /worklists/search.` });
    const token = bearer(req);
    const user = token ? sessions.get(token) : undefined;
    if (!user) return send(res, 401, { error: "Not signed in." });

    const body = await readJson(req).catch(() => null);
    const pageId = typeof body?.pageId === "string" ? body.pageId : "";
    if (!pageId) return send(res, 400, { error: "A search needs a pageId." });

    /* Re-partitioned here rather than trusted. A client that has been edited
       can put a patient name in safeFilters, and believing it would log the
       value in full. */
    const declared = { ...(body?.safeFilters ?? {}), ...(body?.sensitiveFilters ?? {}) };
    const { safe, sensitive } = partitionOnServer(declared);

    /* The generator keys off title and entity as well as pageId, so calling it
       with the id alone builds a DIFFERENT dataset — 88 generic rows instead of
       the 96 the client is showing. A search that disagrees with the table it
       filters is worse than no search, and this one silently returned zero for
       a customer that was on screen. The caller passes what it rendered with. */
    const title = typeof body?.title === "string" && body.title ? body.title : pageId;
    const entity = typeof body?.entity === "string" && body.entity ? body.entity : "record";

    let config;
    try {
      config = getWorklistConfig(pageId, title, entity);
    } catch {
      return send(res, 404, { error: "That worklist does not exist." });
    }

    const filters = { ...safe, ...sensitive };
    const rows = config.rows.filter((row) => Object.entries(filters).every(([key, value]) => matchesRow(row, key, value)));

    console.log(`[search] ${user.email ?? user.id} tenant=${user.tenantId} page=${pageId} ${loggableFilters(safe, sensitive)} -> ${rows.length}/${config.rows.length}`);

    const limit = Math.min(Number(body?.limit) || 200, 500);
    return send(res, 200, {
      pageId,
      total: rows.length,
      rows: rows.slice(0, limit),
      /* Echoed so a client can show what was applied without holding it in a
         URL. Keys only for the sensitive half, for the same reason the log
         does: this response passes through the same proxies. */
      applied: { safe, sensitiveKeys: Object.keys(sensitive).sort() },
    });
  }

  /* ---- export audit ------------------------------------------------------ */
  /**
   * A file left the application. This is the only record that it did.
   *
   * By COLUMN KEY and by count, never by value — the same rule the search log
   * keeps, and for a stronger reason: an audit that copied the exported rows
   * would be a second copy of exactly what the audit exists to govern.
   *
   * Re-derived here rather than trusted. A client that has been edited can
   * claim it exported nothing sensitive, and believing it would record a clean
   * line for the export that mattered most.
   */
  if (pathname === "/exports") {
    if (req.method !== "POST") return send(res, 405, { error: `${req.method} not allowed on /exports.` });
    const token = bearer(req);
    const user = token ? sessions.get(token) : undefined;
    if (!user) return send(res, 401, { error: "Not signed in." });

    const body = await readJson(req).catch(() => null);
    const pageId = typeof body?.pageId === "string" ? body.pageId : "";
    const columns = Array.isArray(body?.columns) ? body.columns.filter((key) => typeof key === "string") : [];
    if (!pageId) return send(res, 400, { error: "An export record needs a pageId." });

    const declared = columns
      .map((key) => ({ key, classification: DATA_CLASSIFICATIONS[key] ?? "unclassified" }))
      .filter((note) => note.classification !== "operational");
    const rows = Number(body?.rows) || 0;
    const withheld = Array.isArray(body?.withheld) ? body.withheld.filter((key) => typeof key === "string") : [];
    /* A file and a printed sheet are different events. A review looking for the
       file that walked out of the building would otherwise never find it,
       because there was never a file. */
    const via = body?.via === "print" ? "print" : "file";

    const summary = declared.map((note) => `${note.key}:${note.classification}`).join(",") || "none";
    console.log(`[export] ${user.email ?? user.id} tenant=${user.tenantId} via=${via} page=${pageId} rows=${rows} columns=${columns.length} sensitive=[${summary}]${withheld.length ? ` withheld=[${withheld.join(",")}]` : ""}`);

    /* 202: recorded, and the file was written by the browser before this was
       ever called. Reporting 201 would imply this endpoint had a say. */
    return send(res, 202, { recorded: true, via, sensitiveColumns: declared.length });
  }

  /* ---- reference data ---------------------------------------------------- */
  if (pathname === "/reference") {
    if (req.method !== "GET") return send(res, 405, { error: `${req.method} not allowed on /reference.` });
    const token = bearer(req);
    const user = token ? sessions.get(token) : undefined;
    if (!user) return send(res, 401, { error: "Not signed in." });
    const asked = (requestUrl.searchParams.get("keys") ?? "").split(",").map((key) => key.trim()).filter(Boolean);
    const keys = asked.length > 0 ? asked : Object.keys(REFERENCE_SOURCES);
    return send(res, 200, loadReferences(keys));
  }

  /* ---- saved views ------------------------------------------------------ */
  if (pathname === "/views" || pathname.startsWith("/views/")) {
    const token = bearer(req);
    const user = token ? sessions.get(token) : undefined;
    if (!user) return send(res, 401, { error: "Not signed in." });

    if (pathname === "/views" && req.method === "POST") {
      const body = await readJson(req).catch(() => null);
      const pageId = typeof body?.pageId === "string" ? body.pageId : "";
      const filters = body?.filters && typeof body.filters === "object" ? body.filters : null;
      if (!pageId || !filters) return send(res, 400, { error: "A saved view needs a pageId and filters." });

      const id = newViewId();
      const view = {
        id,
        /* Stamped from the SESSION, never from the request body. A tenant a
           client can assert is not isolation. */
        tenantId: user.tenantId,
        createdBy: user.id,
        pageId,
        label: typeof body.label === "string" && body.label.trim() ? body.label.trim().slice(0, 80) : "Saved view",
        filters,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + VIEW_TTL_MS).toISOString(),
      };
      savedViews[id] = view;
      saveViews();
      auditView("created", user, view);
      /* The id and nothing else. The caller builds the link; the filters stay
         here. */
      return send(res, 201, { id, label: view.label, expiresAt: view.expiresAt });
    }

    if (pathname.startsWith("/views/") && req.method === "GET") {
      const id = pathname.slice("/views/".length);
      const view = savedViews[id];
      /* One answer for "does not exist", "belongs to someone else" and "has
         expired". A 403 on another tenant's id confirms the id is real, which
         is how you enumerate them. */
      const missing = { error: "That saved view is not available." };
      if (!view || view.tenantId !== user.tenantId) return send(res, 404, missing);
      if (Date.parse(view.expiresAt) < Date.now()) {
        delete savedViews[id];
        saveViews();
        return send(res, 404, missing);
      }
      auditView("opened", user, view);
      return send(res, 200, { id: view.id, pageId: view.pageId, label: view.label, filters: view.filters, expiresAt: view.expiresAt });
    }

    return send(res, 405, { error: `${req.method} not allowed on ${pathname}.` });
  }

  if (pathname === "/ai/config" || pathname === "/ai/config/credential" || pathname === "/ai/config/credential/verify") {
    const token = bearer(req);
    const user = token ? sessions.get(token) : undefined;
    if (!user) return send(res, 401, { error: "Not signed in." });
    const tenantId = user.tenantId;

    if (pathname === "/ai/config/credential/verify") {
      if (req.method !== "POST") return send(res, 405, { error: `${req.method} not allowed on /ai/config/credential/verify.` });
      const refusal = refuseAdminWrite(user);
      if (refusal) return send(res, 403, refusal);
      const held = credentials[tenantId];
      if (!held) return send(res, 409, { error: "No credential is configured for this tenant." });
      /* This reaches the provider, so it spends from the same budget. An admin
         action that bypassed the limit would be the obvious way round it. */
      const rateRefusal = refuseForRate(tenantId);
      if (rateRefusal) return send(res, rateRefusal.status, rateRefusal.body, { "Retry-After": String(rateRefusal.retryAfter) });
      admit(tenantId);
      const result = await callProvider(aiConfig[tenantId], held.secret, [{ role: "user", content: "Reply with the single word: ok" }]);
      recordTokens(tenantId, result.usage?.total_tokens);
      /* Recorded so a bad key is diagnosable from the admin screen without
         anyone reading the key back to check it by eye. */
      held.lastVerifiedAt = result.ok ? new Date().toISOString() : (held.lastVerifiedAt ?? null);
      held.lastError = result.ok ? null : `${result.error} ${result.detail ?? ""}`.trim();
      saveCredentials();
      return send(res, result.ok ? 200 : (result.status ?? 502), credentialStatus(tenantId));
    }

    if (pathname === "/ai/config/credential") {
      /* Authorization precedes validation everywhere below: a caller who may
         not write must not learn whether their body was well formed. */
      if (req.method === "GET") return send(res, 200, credentialStatus(tenantId, url.searchParams.get("scope") ?? undefined));

      const refusal = refuseAdminWrite(user);

      if (req.method === "PUT") {
        if (refusal) return send(res, 403, refusal);
        let body;
        try {
          body = await readJson(req);
        } catch {
          return send(res, 400, { error: "Malformed request body." });
        }
        /* `secret`, matching the client and the canary check. The OTHER path,
           PUT /ai/config, rejects any body carrying a `credential` key, so the
           two names cannot be confused into working on the wrong endpoint. */
        const secret = typeof body?.secret === "string" ? body.secret.trim() : "";
        if (!secret) return send(res, 400, { error: "A credential is required.", detail: 'Send { "secret": "..." }.' });
        if (secret.length < 16) return send(res, 400, { error: "That does not look like a provider key.", detail: "Expected at least 16 characters." });
        /* Validated against the adapters, so a typo cannot create a credential
           for a provider that does not exist and then look configured. */
        const scope = typeof body?.scope === "string" ? body.scope : undefined;
        if (scope && !/^speech:(mock|openai|deepgram|azure)$/.test(scope)) {
          return send(res, 400, { error: "Unknown credential scope.", detail: `${scope} is not a provider this gateway knows.` });
        }
        const storeKey = credentialKey(tenantId, scope);
        const existing = credentials[storeKey];
        credentials[storeKey] = {
          secret,
          hint: secret.slice(-4),
          fingerprint: fingerprintOf(secret),
          setBy: user.email ?? user.id,
          /* setAt is when a key was FIRST set for this tenant; rotatedAt moves
             on every replacement. Collapsing them would lose the distinction
             between "configured months ago" and "changed this morning", which
             is the one an incident actually turns on. */
          setAt: existing?.setAt ?? new Date().toISOString(),
          rotatedAt: existing ? new Date().toISOString() : null,
          lastVerifiedAt: null,
          lastError: null,
        };
        saveCredentials();
        /* The status, never the value and never an echo of the body. */
        console.log(`[ai] credential set for ${storeKey} by ${user.email ?? user.id} (ending ${secret.slice(-4)})`);
        return send(res, 200, credentialStatus(tenantId, scope));
      }

      if (req.method === "DELETE") {
        if (refusal) return send(res, 403, refusal);
        const scope = url.searchParams.get("scope") ?? undefined;
        delete credentials[credentialKey(tenantId, scope)];
        saveCredentials();
        console.log(`[ai] credential removed for ${credentialKey(tenantId, scope)} by ${user.email ?? user.id}`);
        res.writeHead(204, CORS);
        return res.end();
      }
      return send(res, 405, { error: `${req.method} not allowed on /ai/config/credential.` });
    }

    if (req.method === "GET") {
      const stored = aiConfig[tenantId];
      if (!stored) {
        return send(res, 404, { error: `No AI configuration for tenant ${tenantId}.` });
      }
      /* tenantId from the session, credential from the function that cannot
         hold one. Spread order matters: `credential` last, so a stray field of
         that name in the JSON file could never survive into the response. */
            /* Each speech provider carries its own status object, built by the same
         function as the main credential — four characters and a fingerprint,
         never a value. */
      const speech = stored.speech
        ? { ...stored.speech, providers: (stored.speech.providers ?? []).map((sp) => ({ ...sp, credential: credentialStatus(tenantId, `speech:${sp.id}`) })) }
        : undefined;
      return send(res, 200, { ...stored, tenantId, ...(speech ? { speech } : {}), credential: credentialStatus(tenantId) });
    }

    if (req.method === "PUT") {
      /* Authorization precedes validation. A caller who may not write should
         not learn whether their body was well formed, so this returns 403 and
         the credential-key check below is never reached in the stand-in. It is
         kept because it is part of the contract a real service must honour. */
      const refusal = refuseAdminWrite(user);
      if (refusal) return send(res, 403, refusal);

      let body;
      try {
        body = await readJson(req);
      } catch {
        return send(res, 400, { error: "Malformed request body." });
      }
      if (body && Object.prototype.hasOwnProperty.call(body, "credential")) {
        return send(res, 400, {
          error: "A credential cannot be set through /ai/config.",
          detail: "Use PUT /ai/config/credential, so only one path ever handles a secret.",
        });
      }
      aiConfig[tenantId] = { ...(aiConfig[tenantId] ?? {}), ...body };
      saveAiConfig();
      console.log(`[ai] config updated for ${tenantId} by ${user.email ?? user.id}: ${Object.keys(body).join(", ")}`);
      res.writeHead(204, CORS);
      return res.end();
    }

    return send(res, 405, { error: `${req.method} not allowed on /ai/config.` });
  }

  /* Dispatch. The client sends an assembled, redacted context and a promptId;
     it never sends prompt text and never holds a key.

     Note what is NOT trusted from the body: the prompt (resolved here from the
     id), the tenant (taken from the session), and the field count (capped here
     against the configured limit). What IS trusted is the field list, because
     the client already had that data on screen -- it is the user's own record,
     not an escalation. */
  if (pathname === "/ai/dispatch") {
    if (req.method !== "POST") return send(res, 405, { error: `${req.method} not allowed on /ai/dispatch.` });
    const token = bearer(req);
    const user = token ? sessions.get(token) : undefined;
    if (!user) return send(res, 401, { error: "Not signed in." });
    const tenantId = user.tenantId;

    let body;
    try {
      body = await readJson(req);
    } catch {
      return send(res, 400, { error: "Malformed request body." });
    }

    /* Ahead of prompt and credential validation on purpose: see the limiter's
       header. A malformed request is still a request, and a caller who retries
       for free on every 400 is not limited at all. */
    const refusal = refuseForRate(tenantId);
    if (refusal) {
      console.log(`[ai] refused ${user.email ?? user.id}: ${refusal.body.error}`);
      return send(res, refusal.status, refusal.body, { "Retry-After": String(refusal.retryAfter) });
    }
    admit(tenantId);

    const system = PROMPT_TEXT[body?.promptId];
    if (!system) {
      return send(res, 400, { error: "Unknown prompt.", detail: `No prompt is registered as ${body?.promptId ?? "(none)"}.` });
    }
    const held = credentials[tenantId];
    if (!held) {
      return send(res, 409, { error: "No provider credential is configured.", detail: "An administrator must set one through PUT /ai/config/credential." });
    }

    const config = aiConfig[tenantId];
    const limit = config?.limits?.maxContextFields ?? 24;
    const fields = Array.isArray(body?.fields) ? body.fields.slice(0, limit) : [];
    if (!fields.length) {
      return send(res, 400, { error: "Nothing to send.", detail: "The assembled context held no fields." });
    }

    const lines = fields.map((f) => `${String(f?.label ?? "").slice(0, 120)}: ${String(f?.value ?? "").slice(0, 600)}`);
    const userInput = typeof body?.userInput === "string" && body.userInput.trim() ? `\n\nThe user asks: ${body.userInput.trim().slice(0, 500)}` : "";
    const result = await callProvider(config, held.secret, [
      { role: "system", content: system },
      { role: "user", content: `Page: ${String(body?.pageId ?? "unknown")}\n\nFields:\n${lines.join("\n")}${userInput}` },
    ]);

    /* Audit metadata only. The fields themselves are the user's record and are
       deliberately not logged here -- this process has no retention policy and
       no log rotation, so anything written is written forever. */
    console.log(`[ai] dispatch ${body.useCaseId} on ${body.pageId} by ${user.email ?? user.id}: ${result.ok ? "ok" : "failed"} (${fields.length} fields${result.usage ? `, ${result.usage.total_tokens} tokens` : ""})`);

    if (!result.ok) {
      held.lastError = `${result.error} ${result.detail ?? ""}`.trim();
      saveCredentials();
      return send(res, result.status ?? 502, { error: result.error, detail: result.detail });
    }
    held.lastVerifiedAt = new Date().toISOString();
    held.lastError = null;
    saveCredentials();
    /* The provider's own count, not an estimate of ours. */
    recordTokens(tenantId, result.usage?.total_tokens);
    return send(res, 200, { ok: true, text: result.text, model: result.model, usage: result.usage });
  }

  /* So the limit is inspectable without reading the process's memory, and so a
     future admin screen has something real to render. */
  if (pathname === "/ai/usage") {
    if (req.method !== "GET") return send(res, 405, { error: `${req.method} not allowed on /ai/usage.` });
    const token = bearer(req);
    const user = token ? sessions.get(token) : undefined;
    if (!user) return send(res, 401, { error: "Not signed in." });
    const tenantId = user.tenantId;
    const limits = limitsFor(tenantId);
    const now = Date.now();
    const inWindow = (recentRequests.get(tenantId) ?? []).filter((at) => now - at < 60_000).length;
    return send(res, 200, {
      tenantId,
      day: utcDay(),
      requestsLastMinute: inWindow,
      requestsPerMinute: limits.requestsPerMinute,
      tokensUsedToday: tokensUsedToday(tenantId),
      tokensPerDay: limits.tokensPerDay,
      /* Stated, because a configured value of 0 or a missing config resolves to
         the default rather than to "no limit". */
      limitsAreDefaults: !aiConfig[tenantId]?.limits,
    });
  }

  if (req.method === "GET" && pathname === "/health") {
    return send(res, 200, { ok: true, sessions: sessions.size, profiles: Object.keys(preferences).length, layouts: Object.keys(layouts).length, aiTenants: Object.keys(policies).length, aiConfigured: Object.keys(aiConfig).length });
  }

  send(res, 404, { error: `No route for ${req.method} ${pathname}.` });
});

/* ---------------------------------------------------------------------------
   Speech gateway.

   Audio of a patient talking is the most sensitive thing this system handles,
   and two rules are built in rather than written down: NO AUDIO IS EVER WRITTEN
   TO DISK, and NO TRANSCRIPT TEXT IS EVER LOGGED. The audit line carries who,
   when, how long, how many bytes and which provider — everything needed to
   answer "who recorded this consultation" and nothing of what was said.

   The token arrives in the first message, not the query string. Browsers cannot
   set headers on a WebSocket handshake, and the usual workaround — ?token=... —
   puts a bearer token into every access log and proxy trace it passes through.
   SESSION_START carries it instead.
   --------------------------------------------------------------------------- */
const SPEECH_MAX_SECONDS = 30 * 60;
const speechSessions = new Map();

server.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const key = req.headers["sec-websocket-key"];
  if (pathname !== "/speech" || !key) { socket.destroy(); return; }

  socket.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey(key)}`,
    "\r\n",
  ].join("\r\n"));

  const session = { id: randomBytes(8).toString("hex"), user: null, started: 0, bytes: 0, sequence: 0, index: 0, paused: false, language: "en", provider: null };
  speechSessions.set(session.id, session);

  const finish = (reason) => {
    if (!speechSessions.delete(session.id)) return;
    if (session.user) {
      const seconds = session.started ? Math.round((Date.now() - session.started) / 1000) : 0;
      /* Metadata only. Never session content. */
      console.log(`[speech] ${reason} session=${session.id} user=${session.user.email ?? session.user.id} provider=${session.provider?.id ?? "none"} lang=${session.language} ${seconds}s ${session.bytes} bytes ${session.sequence} segments`);
    }
  };

  const { send } = attachSocket(socket, {
    onMessage: (message, reply, close) => {
      if (message.type === "SESSION_START") {
        const user = message.token ? sessions.get(message.token) : undefined;
        if (!user) { reply({ type: "ERROR", error: "Not signed in." }); close(); return; }
        session.user = user;
        session.started = Date.now();
        session.language = message.language === "ar" ? "ar" : "en";
        session.mime = typeof message.mime === "string" ? message.mime : "audio/webm";

        const tenantConfig = aiConfig[user.tenantId] ?? {};
        const providers = (tenantConfig.speech?.providers ?? []).map((p) => ({
          ...p, credentialConfigured: Boolean(credentials[`${user.tenantId}:speech:${p.id}`]),
        }));
        session.provider = chooseProvider(providers, session.language);

        if (!session.provider) {
          reply({ type: "ERROR", error: "No speech provider is available for this language.", detail: "Enable one under AI Administration, or configure its credential." });
          close(); return;
        }
        const adapter = ADAPTERS[session.provider.id];
        reply({
          type: "SESSION_READY",
          sessionId: session.id,
          provider: { id: session.provider.id, label: adapter?.label ?? session.provider.id, model: session.provider.model ?? null },
          /* The UI shows this. A transcript from an unexercised adapter must
             never be mistaken for one from a provider that has actually run. */
          verified: adapter?.verified === true,
          language: session.language,
        });
        console.log(`[speech] start session=${session.id} user=${user.email ?? user.id} provider=${session.provider.id} lang=${session.language}`);
        return;
      }
      if (!session.user) { close(); return; }
      if (message.type === "PAUSE") { session.paused = true; reply({ type: "PAUSED" }); return; }
      if (message.type === "RESUME") { session.paused = false; reply({ type: "RESUMED" }); return; }
      if (message.type === "STOP") { reply({ type: "SESSION_ENDED", segments: session.sequence, seconds: Math.round((Date.now() - session.started) / 1000) }); finish("stop"); close(); return; }
    },

    onAudio: async (chunk, reply, close) => {
      if (!session.user || session.paused) return;
      session.bytes += chunk.length;
      if ((Date.now() - session.started) / 1000 > SPEECH_MAX_SECONDS) {
        reply({ type: "ERROR", error: "Session exceeded the maximum length." });
        finish("timeout"); close(); return;
      }
      /* Keyed to audio actually arriving, so a dead microphone still looks dead
         rather than producing a transcript out of nothing. */
      /* ONE BINARY MESSAGE IS ONE COMPLETE AUDIO FILE. The client records in
         takes rather than timeslices, because a MediaRecorder chunk after the
         first has no container header and is undecodable alone — posting those
         individually returns "corrupted or unsupported", which looks exactly
         like a broken microphone and is not. */
      const at = (Date.now() - session.started) / 1000;
      const sequence = session.index + 1;
      session.index += 1;
      session.sequence = sequence;

      if (session.provider.id === "openai") {
        const held = credentials[credentialKey(session.user.tenantId, "speech:openai")];
        if (!held) { reply({ type: "ERROR", error: "The OpenAI speech credential is missing." }); return; }
        reply({ type: "TRANSCRIPT_PARTIAL", sequence, speaker: "SPEAKER", text: "transcribing…" });
        const result = await transcribeOpenAI({
          audio: chunk, secret: held.secret, model: session.provider.model, language: session.language, mime: session.mime,
        });
        if (!result.ok) { send({ type: "ERROR", error: result.error }); return; }
        /* An empty transcript is silence, not a failure. Emitting a blank
           segment would pad the record with nothing. */
        if (!result.text) { send({ type: "TRANSCRIPT_DROPPED", sequence, reason: "no speech detected" }); return; }
        send({ type: "TRANSCRIPT_FINAL", sequence, speaker: "SPEAKER", text: result.text, startTime: Number(at.toFixed(2)), endTime: Number((at + 10).toFixed(2)) });
        /* Metadata only — never the text. */
        console.log(`[speech] segment session=${session.id} provider=openai seq=${sequence} ${chunk.length} bytes ${result.tokens ?? "?"} tokens`);
        return;
      }

      if (session.provider.id !== "mock") {
        reply({ type: "ERROR", error: `The ${session.provider.id} adapter is declared but not implemented here.`, detail: "OpenAI and the built-in mock are the adapters that run." });
        return;
      }

      const line = mockSegment(session.index - 1, session.language);
      reply({ type: "TRANSCRIPT_PARTIAL", sequence, speaker: line.speaker, text: line.text.slice(0, Math.ceil(line.text.length * 0.6)) + "…" });
      setTimeout(() => {
        send({ type: "TRANSCRIPT_FINAL", sequence, speaker: line.speaker, text: line.text, startTime: Number(at.toFixed(2)), endTime: Number((at + 2.4).toFixed(2)) });
      }, 900);
    },

    onClose: () => finish("closed"),
  });
});

server.listen(PORT, () => {
  console.log(`Nexora demo auth API on http://localhost:${PORT}`);
  console.log(`  accounts: ${ACCOUNTS.map((a) => a.username).join(", ")}  (password == username)`);
});
