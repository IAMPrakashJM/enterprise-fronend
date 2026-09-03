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
function credentialStatus(tenantId) {
  const held = credentials[tenantId];
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
      body: JSON.stringify({ model, messages, max_tokens: 700, temperature: 0.2 }),
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
  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, status: 502, error: "The provider returned no text." };
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
  const { pathname } = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

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
      if (req.method === "GET") return send(res, 200, credentialStatus(tenantId));

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
        const existing = credentials[tenantId];
        credentials[tenantId] = {
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
        console.log(`[ai] credential set for ${tenantId} by ${user.email ?? user.id} (ending ${secret.slice(-4)})`);
        return send(res, 200, credentialStatus(tenantId));
      }

      if (req.method === "DELETE") {
        if (refusal) return send(res, 403, refusal);
        delete credentials[tenantId];
        saveCredentials();
        console.log(`[ai] credential removed for ${tenantId} by ${user.email ?? user.id}`);
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
      return send(res, 200, { ...stored, tenantId, credential: credentialStatus(tenantId) });
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

server.listen(PORT, () => {
  console.log(`Nexora demo auth API on http://localhost:${PORT}`);
  console.log(`  accounts: ${ACCOUNTS.map((a) => a.username).join(", ")}  (password == username)`);
});
