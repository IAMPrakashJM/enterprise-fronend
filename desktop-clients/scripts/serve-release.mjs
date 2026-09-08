#!/usr/bin/env node
import { spawn } from "node:child_process";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readRelease } from "./deployment/release.mjs";

const repository = fileURLToPath(new URL("../..", import.meta.url));
const root = resolve(process.env.NEXORA_DEPLOY_ROOT ?? join(repository, ".deploy"));
const service = process.argv[2];
if (!["web", "desktop"].includes(service)) throw new Error("Usage: serve-release.mjs web|desktop [--check]");
try {
  // Resolve once. Changing current never changes assets under an existing process.
  const { directory } = await readRelease(join(root, "current"));
  if (!process.argv.includes("--check")) {
    const web = service === "web";
    const entry = web ? join(directory, "web/apps/web/server.js") : join(directory, "desktop-server.mjs");
    const child = spawn(process.execPath, [entry, ...(web ? [] : [join(directory, "desktop")])], {
      cwd: directory,
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production", HOSTNAME: process.env.NEXORA_BIND_HOST ?? "0.0.0.0", PORT: web ? (process.env.NEXORA_WEB_PORT ?? "3100") : (process.env.NEXORA_DESKTOP_PORT ?? "3101") },
    });
    for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => child.kill(signal));
    child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
    child.on("exit", (code, signal) => { process.exitCode = code ?? (signal === "SIGTERM" || signal === "SIGINT" ? 0 : 1); });
  }
} catch (error) {
  console.error(`No usable deployed release: ${error.message}\nRun npm run deploy from desktop-clients first.`);
  process.exitCode = 1;
}
