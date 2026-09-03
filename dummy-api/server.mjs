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
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
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

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function send(res, status, body) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    ...CORS,
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
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

  if (req.method === "GET" && pathname === "/health") {
    return send(res, 200, { ok: true, sessions: sessions.size, profiles: Object.keys(preferences).length, layouts: Object.keys(layouts).length, aiTenants: Object.keys(policies).length });
  }

  send(res, 404, { error: `No route for ${req.method} ${pathname}.` });
});

server.listen(PORT, () => {
  console.log(`Nexora demo auth API on http://localhost:${PORT}`);
  console.log(`  accounts: ${ACCOUNTS.map((a) => a.username).join(", ")}  (password == username)`);
});
