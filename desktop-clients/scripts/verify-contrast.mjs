#!/usr/bin/env node
/**
 * Every theme's text is readable on every surface that theme paints.
 *
 * axe checks the page in front of it, which is one theme at a time — and there
 * are fifteen. Auditing them all in a browser would mean fifteen browser runs;
 * the ratio is arithmetic over two hex values, so it is cheaper and more
 * complete to do it here.
 *
 * WCAG 2.1 AA: 4.5:1 for body text, 3:1 for large text. Everything checked here
 * is body text or smaller — the shell's type scale starts at 8.5px — so 4.5 is
 * the number, and the "large text" allowance never applies.
 *
 * This reads the stylesheet rather than a copy of the palette, because a copy is
 * a second place for a colour to live and the wrong one would be the one that
 * passes.
 */
import { readFileSync } from "node:fs";

let failed = 0;
const check = (ok, name, detail = "") => {
  console.log(`    ${ok ? "ok  " : "FAIL"}  ${name.padEnd(56)}${detail}`);
  if (!ok) failed += 1;
};

const css = readFileSync(new URL("../packages/tokens/src/tokens.css", import.meta.url), "utf8");

/* Relative luminance and contrast, straight from WCAG 2.1. */
function luminance(hex) {
  const channels = [1, 3, 5]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((first, second) => second - first);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Every theme block, as a map of the tokens it declares.
 *
 * A theme inherits whatever it does not override from the default block, so the
 * default is merged in first — otherwise a theme that redefines only its text
 * colours would look like it has no surfaces and pass by having nothing to check.
 */
function blocks() {
  const found = [];
  const pattern = /(:root(?:\s*,\s*\[data-theme="[^"]+"\])?|\[data-theme="[^"]+"\])\s*\{([^}]*)\}/g;
  let match;
  while ((match = pattern.exec(css)) !== null) {
    const declarations = {};
    for (const line of match[2].split(";")) {
      const [name, value] = line.split(":").map((part) => part?.trim());
      if (name?.startsWith("--") && /^#[0-9a-f]{6}$/i.test(value ?? "")) declarations[name] = value;
    }
    if (Object.keys(declarations).length === 0) continue;
    const label = (/\[data-theme="([^"]+)"\]/.exec(match[1]) ?? [])[1] ?? "root";
    found.push({ label, declarations });
  }
  return found;
}

const all = blocks();
const base = all.find((block) => block.label === "nexora" || block.label === "root")?.declarations ?? {};

console.log("\n  every theme's text is readable on its own surfaces\n");

check(all.length >= 10, "the stylesheet declares some themes", `${all.length} blocks`);

const TEXT = ["--text", "--text-muted", "--text-subtle"];
const SURFACES = ["--surface", "--surface-2", "--surface-3"];
const MINIMUM = 4.5;

for (const { label, declarations } of all) {
  const palette = { ...base, ...declarations };
  const worst = [];
  for (const text of TEXT) {
    for (const surface of SURFACES) {
      if (!palette[text] || !palette[surface]) continue;
      const ratio = contrast(palette[text], palette[surface]);
      if (ratio < MINIMUM) worst.push(`${text.slice(2)} on ${surface.slice(2)} ${ratio.toFixed(2)}`);
    }
  }
  check(worst.length === 0, `${label}`, worst.join(" · "));
}

/**
 * The three steps have to stay three steps.
 *
 * Raising a failing token is the obvious fix and the obvious way to break the
 * hierarchy: make `--text-subtle` readable by darkening it past `--text-muted`
 * and the two swap places, which is legible and wrong. Nothing else would
 * notice.
 */
console.log("\n  and the hierarchy still descends\n");

for (const { label, declarations } of all) {
  const palette = { ...base, ...declarations };
  if (!palette["--surface"] || !palette["--text"]) continue;
  const against = palette["--surface"];
  const steps = TEXT.map((token) => contrast(palette[token] ?? palette["--text"], against));
  check(steps[0] > steps[1] && steps[1] > steps[2], `${label}`, steps.map((step) => step.toFixed(1)).join(" > "));
}

console.log(failed === 0
  ? "\n  Every theme's text meets AA on every surface it paints, and still reads as three steps.\n"
  : `\n  ${failed} check(s) failed.\n`);
process.exit(failed === 0 ? 0 : 1);
