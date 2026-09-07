#!/usr/bin/env node
/**
 * Write down which API this build was made for.
 *
 * `NEXT_PUBLIC_*` and `VITE_*` are inlined, so after the fact the only record
 * of what a build calls is the bundle itself — and reading that back turned out
 * to be a poor idea twice over: neither bundler prunes its output, and turbo
 * restores a cache entry by adding its files rather than by replacing the
 * directory, so a chunk from an older build with a different API in it survives
 * every rebuild and reads as the truth.
 *
 * A stamp written by the build has none of those problems. It is inside the
 * cached output, so restoring a cache entry restores the stamp that belongs to
 * it, and a build for a different API cannot be mistaken for this one.
 *
 * Usage: node scripts/stamp-api.mjs VITE_API_URL dist
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const [variable, outDir] = process.argv.slice(2);
if (!variable || !outDir) {
  console.error("usage: stamp-api.mjs <ENV_VAR> <output-dir>");
  process.exit(2);
}

/* The same order the bundlers resolve in: a real environment variable wins over
   the app's env file, which is what makes a one-off local build possible in the
   first place. */
function resolve() {
  if (process.env[variable]) return process.env[variable];
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    const match = new RegExp(`^${variable}=(.+)$`, "m").exec(readFileSync(file, "utf8"));
    if (match) return match[1].trim();
  }
  return "";
}

writeFileSync(join(outDir, "BUILD_API"), `${resolve()}\n`);
