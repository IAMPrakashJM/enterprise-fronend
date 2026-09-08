#!/usr/bin/env node
import { mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";
import { activateRelease, packageRelease, readRelease, snapshotWorkspace, validateConfig, within } from "./deployment/release.mjs";
import { run, smokeRelease, waitForShell } from "./deployment/process.mjs";

const workspace = fileURLToPath(new URL("..", import.meta.url));
const repository = resolve(workspace, "..");
const { values } = parseArgs({ options: {
  config: { type: "string", default: join(workspace, "deploy.config.json") },
  "prepare-only": { type: "boolean", default: false },
  activate: { type: "string" },
  help: { type: "boolean", short: "h" },
} });

if (values.help) {
  console.log(`Usage: npm run deploy -- [--config FILE] [--prepare-only | --activate RELEASE_ID]

Copies source into an isolated build directory, installs the lockfile, builds and
verifies both shells, packages them without source-tree dependencies, tests their
HTML/assets on temporary ports, and restarts only web and desktop.

--prepare-only  Build and smoke-test a release without changing running services.
--activate ID   Activate a previously prepared release (also used for rollback).

Copy deploy.config.example.json to deploy.config.json and set the browser API URLs.
NEXORA_DEPLOY_ROOT defaults to ../.deploy; NEXORA_WEB_PORT / NEXORA_DESKTOP_PORT
 default to 3100 / 3101. Keep these settings identical for run.sh and deploy.`);
} else {
  const abort = new AbortController();
  const interrupt = () => abort.abort(new Error("Deployment interrupted."));
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", interrupt);
  let lock;
  let build;
  let candidate;
  try {
    if (Number(process.versions.node.split(".")[0]) < 24) throw new Error("Deployment requires Node 24 or newer.");
    if (values.activate && values["prepare-only"]) throw new Error("Choose --activate or --prepare-only, not both.");
    const config = validateConfig(JSON.parse(await readFile(resolve(values.config), "utf8").catch(() => {
      throw new Error("Missing deployment config. Copy deploy.config.example.json to deploy.config.json and set the browser API URLs.");
    })));
    const root = resolve(process.env.NEXORA_DEPLOY_ROOT ?? join(repository, ".deploy"));
    if (within(workspace, root)) throw new Error("NEXORA_DEPLOY_ROOT must be outside desktop-clients so build snapshots cannot include releases.");
    await mkdir(root, { recursive: true });
    if (within(await realpath(workspace), await realpath(root))) throw new Error("Deployment root resolves inside the workspace.");
    const lockPath = join(root, ".lock");
    await mkdir(lockPath).catch((error) => { throw new Error(`Could not acquire deployment lock (${error.code}). Check ${lockPath}; another deployment may be running.`); });
    lock = lockPath;
    await writeFile(join(lock, "owner.json"), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    await mkdir(join(root, "releases"), { recursive: true });
    let release;
    if (values.activate) {
      if (!/^[A-Za-z0-9-]+$/.test(values.activate)) throw new Error("Invalid release ID.");
      release = (await readRelease(join(root, "releases", values.activate))).directory;
      if (!within(await realpath(join(root, "releases")), release)) throw new Error("Release is outside the deployment directory.");
      const { manifest } = await readRelease(release);
      if (manifest.webApiUrl !== config.webApiUrl || manifest.desktopApiUrl !== config.desktopApiUrl) throw new Error("Release API URLs differ from deployment config; refusing activation.");
      await smokeRelease(release, abort.signal);
    } else {
      const id = `${new Date().toISOString().replace(/[^0-9]/g, "")}-${randomUUID().slice(0, 8)}`;
      build = await mkdtemp(join(root, "build-"));
      const staged = join(build, "desktop-clients");
      console.log(`Preparing release ${id} in isolation.`);
      await snapshotWorkspace(workspace, staged);
      const env = { ...process.env, NODE_ENV: "production", NEXT_PUBLIC_API_URL: config.webApiUrl, VITE_API_URL: config.desktopApiUrl, NEXT_TELEMETRY_DISABLED: "1" };
      // npm ci needs dev dependencies even on a host configured NODE_ENV=production.
      const options = { cwd: staged, env, signal: abort.signal };
      await run("npm", ["ci", "--include=dev", "--no-audit", "--no-fund"], options);
      // Avoid Turbo's remote/local cache for releases: verify the exact source snapshot.
      await run("npm", ["run", "build", "--workspace=web"], options);
      await run("npm", ["run", "build", "--workspace=desktop"], options);
      await run(process.execPath, ["scripts/verify-deployable.mjs", "--config", resolve(values.config)], options);
      await run(process.execPath, ["scripts/verify-parity.mjs"], options);
      candidate = join(root, "releases", `.candidate-${id}`);
      await packageRelease(staged, candidate, config, id);
      // Smoke-test only AFTER deleting the build, proving the package stands alone.
      await rm(build, { recursive: true, force: true });
      build = null;
      await smokeRelease(candidate, abort.signal);
      release = join(root, "releases", id);
      await rename(candidate, release);
      candidate = null;
    }
    abort.signal.throwIfAborted();
    if (values["prepare-only"]) {
      console.log(`Prepared and verified: ${release}\nRunning services were not changed.`);
    } else {
      const env = { ...process.env, MODE: "prod", NEXORA_DEPLOY_ROOT: root };
      const command = (action) => run("bash", [join(repository, "run.sh"), action, "web", "desktop"], { cwd: repository, env });
      const previous = await activateRelease(root, release, {
        check: () => abort.signal.throwIfAborted(),
        stop: () => command("stop"),
        start: () => command("start"),
        health: async () => {
          // During rollback health still runs even if the original command was interrupted.
          const { manifest } = await readRelease(join(root, "current"));
          await waitForShell(`http://127.0.0.1:${env.NEXORA_WEB_PORT ?? 3100}/`, { releaseId: manifest.id });
          await waitForShell(`http://127.0.0.1:${env.NEXORA_DESKTOP_PORT ?? 3101}/`, { releaseId: manifest.id });
        },
      });
      console.log(`Deployed: ${release}\nBoth shells answer with their application assets.${previous ? `\nPrevious release retained: ${previous}` : ""}`);
    }
  } catch (error) {
    console.error(error.message);
    if (error.cause) console.error(error.cause.message);
    process.exitCode = 1;
  } finally {
    if (candidate) await rm(candidate, { recursive: true, force: true });
    if (build) await rm(build, { recursive: true, force: true });
    if (lock) await rm(lock, { recursive: true, force: true });
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
  }
}
