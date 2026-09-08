import { cp, mkdir, readFile, readdir, realpath, rename, rm, stat, symlink, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";

export function validateConfig(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Deployment config must be an object.");
  for (const key of ["webApiUrl", "desktopApiUrl"]) {
    const api = value[key];
    if (typeof api !== "string" || !api || api !== api.trim()) throw new Error(`${key} must explicitly name the browser's API URL.`);
    if (/^\/(?!\/)[^\s\\?#]*$/.test(api)) continue;
    let url;
    try { url = new URL(api); } catch { throw new Error(`${key} is not an absolute HTTP(S) URL or a same-origin path.`); }
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error(`${key} must be an HTTP(S) URL without credentials, query, or fragment.`);
    }
    const local = /^(localhost|.*\.localhost|127\..*|0\.0\.0\.0|\[::1\])$/.test(url.hostname);
    if (local && value.allowLocalApi !== true) throw new Error(`${key} points to the visitor's own machine. Set allowLocalApi only for an isolated local deployment.`);
  }
  return { webApiUrl: value.webApiUrl, desktopApiUrl: value.desktopApiUrl, allowLocalApi: value.allowLocalApi === true };
}

export async function verifyBuild(workspace, config) {
  for (const [artifact, expected] of [["apps/web/.next", config.webApiUrl], ["apps/desktop/dist", config.desktopApiUrl]]) {
    const stamp = await readFile(join(workspace, artifact, "BUILD_API"), "utf8").catch(() => null);
    if (stamp?.trim() !== expected) throw new Error(`${artifact}: missing or mismatched BUILD_API; refusing release.`);
  }
  await stat(join(workspace, "apps/web/.next/standalone/apps/web/server.js"));
  await stat(join(workspace, "apps/web/.next/static"));
  await stat(join(workspace, "apps/desktop/dist/index.html"));
}

/** Copy source, never live output, dependencies, secrets, or the reference apps. */
export async function snapshotWorkspace(source, destination) {
  const ignored = new Set(["node_modules", ".next", "dist", ".turbo", ".git", ".deploy", ".run", "source", "target", "gen"]);
  await cp(source, destination, {
    recursive: true,
    filter: (path) => {
      const parts = relative(source, path).split(sep);
      return !parts.some((part) => ignored.has(part) || part === ".env" || part.startsWith(".env.") || part === "deploy.config.json" || part.endsWith(".tsbuildinfo") || part.endsWith(".log"));
    },
  });
}

/** Next may trace env files. Deployment only uses the two explicit public values. */
async function removeEnvFiles(root) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.name === ".env" || entry.name.startsWith(".env.")) await rm(path, { recursive: true, force: true });
    else if (entry.isDirectory()) await removeEnvFiles(path);
  }
}

export async function packageRelease(workspace, destination, config, id) {
  await verifyBuild(workspace, config);
  await mkdir(destination, { recursive: true });
  // Dereference: a release must not depend on the build tree surviving cleanup.
  await cp(join(workspace, "apps/web/.next/standalone"), join(destination, "web"), { recursive: true, dereference: true });
  await cp(join(workspace, "apps/web/.next/static"), join(destination, "web/apps/web/.next/static"), { recursive: true });
  const publicDir = join(workspace, "apps/web/public");
  if (await stat(publicDir).catch(() => null)) await cp(publicDir, join(destination, "web/apps/web/public"), { recursive: true });
  await cp(join(workspace, "apps/desktop/dist"), join(destination, "desktop"), { recursive: true });
  await cp(join(workspace, "scripts/deployment/desktop-server.mjs"), join(destination, "desktop-server.mjs"));
  await removeEnvFiles(join(destination, "web"));
  const webPublic = join(destination, "web/apps/web/public");
  await mkdir(webPublic, { recursive: true });
  for (const directory of [webPublic, join(destination, "desktop")]) {
    await writeFile(join(directory, "__nexora-release.json"), JSON.stringify({ id }));
  }
  await writeFile(join(destination, "release.json"), JSON.stringify({ id, createdAt: new Date().toISOString(), ...config }, null, 2) + "\n");
}

export async function readRelease(root) {
  const directory = await realpath(root);
  const manifest = JSON.parse(await readFile(join(directory, "release.json"), "utf8"));
  validateConfig(manifest);
  await stat(join(directory, "web/apps/web/server.js"));
  await stat(join(directory, "desktop/index.html"));
  await stat(join(directory, "desktop-server.mjs"));
  return { directory, manifest };
}

export function within(root, path) {
  const rel = relative(resolve(root), resolve(path));
  return rel === "" || (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`));
}

export async function currentRelease(root) {
  try { return (await readRelease(join(root, "current"))).directory; }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

/** POSIX rename swaps the pointer; running servers retain their resolved directory. */
export async function selectRelease(root, release) {
  if (release === null) { await rm(join(root, "current"), { force: true }); return; }
  const temporary = join(root, `.current-${randomUUID()}`);
  await symlink(release, temporary, "dir");
  try { await rename(temporary, join(root, "current")); }
  finally { await rm(temporary, { force: true }); }
}

export async function activateRelease(root, candidate, { stop, start, health, check = () => {} }) {
  await readRelease(candidate);
  const previous = await currentRelease(root);
  try {
    await stop();
    check();
    await selectRelease(root, candidate);
    await start();
    check();
    await health();
    check();
  } catch (error) {
    try {
      await stop();
      await selectRelease(root, previous);
      if (previous) { await start(); await health(); }
    } catch (rollbackError) {
      throw new AggregateError([error, rollbackError], "Activation and rollback failed; inspect the service logs.");
    }
    throw new Error(previous ? "Activation failed; the previous release was restored." : "First activation failed; no release is running.", { cause: error });
  }
  return previous;
}
