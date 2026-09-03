#!/usr/bin/env node
/**
 * Nexora demo auth API.
 *
 * Deliberately zero dependencies and zero persistence: it is a stand-in for a real
 * identity service so the two shells have something to log in against. Tokens live in
 * a Map that dies with the process.
 *
 * NOT a security boundary. Passwords are compared in plaintext, tokens are random hex
 * with no expiry claim, and CORS is open to every origin — the web shell, the desktop
 * dev server and the packaged Tauri app are three different origins, and enumerating
 * them buys nothing for a demo. Do not model a real service on this file.
 *
 *   node server.mjs            # :4000
 *   PORT=4100 node server.mjs
 */
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

const PORT = Number(process.env.PORT ?? 4000);

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
    },
  },
];

/** token -> user. Lost on restart, which is correct for a demo. */
const sessions = new Map();

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

  if (req.method === "GET" && pathname === "/health") {
    return send(res, 200, { ok: true, sessions: sessions.size });
  }

  send(res, 404, { error: `No route for ${req.method} ${pathname}.` });
});

server.listen(PORT, () => {
  console.log(`Nexora demo auth API on http://localhost:${PORT}`);
  console.log(`  accounts: ${ACCOUNTS.map((a) => a.username).join(", ")}  (password == username)`);
});
