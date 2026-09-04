#!/usr/bin/env node
/**
 * The E/M level rule is "two of three", and there are two wrong answers plausible
 * enough that a reader would not notice either:
 *
 *   MAXIMUM  lets one high element carry the visit alone. High risk with minimal
 *            problems and no data would read as a high-level visit.
 *   AVERAGE  lands between levels and invites rounding, which is the exact motion
 *            this panel exists to make visible rather than easy.
 *
 * The rule is the MEDIAN of the three. This checks that against every one of the
 * 64 element combinations, both patient types, and the time bands — including the
 * boundaries, which is where an off-by-one hides.
 *
 * Zero dependencies. Imports the real module.
 */
import { EM_LEVELS, deriveFromMdm, deriveFromTime, timeBandsFor } from "../packages/erp-config/src/em-coding.ts";

const RANK = { straightforward: 1, low: 2, moderate: 3, high: 4 };
let failed = 0;
const check = (ok, label, detail = "") => { if (!ok) failed += 1; console.log(`  ${(ok ? "ok" : "FAIL").padEnd(6)}${label.padEnd(58)}${detail}`); };

console.log("\n  the level is the median of three, over all 64 combinations\n");
let cases = 0, differsFromMax = 0, differsFromMin = 0;
for (const p of EM_LEVELS) for (const d of EM_LEVELS) for (const r of EM_LEVELS) {
  const got = deriveFromMdm(p, d, r, "new");
  const ranks = [RANK[p], RANK[d], RANK[r]].sort((a, b) => a - b);
  const median = ranks[1];
  if (RANK[got.level] !== median) { check(false, `${p}/${d}/${r}`, `got ${got.level}, expected rank ${median}`); }
  if (median !== ranks[2]) differsFromMax += 1;
  if (median !== ranks[0]) differsFromMin += 1;
  cases += 1;
}
check(true, `${cases} combinations all resolve to the median`);
/* If the median never differed from the max, this test could not tell the two
   rules apart and would pass against the wrong implementation. */
check(differsFromMax > 0, "the test can distinguish median from maximum", `${differsFromMax} cases differ`);
check(differsFromMin > 0, "the test can distinguish median from minimum", `${differsFromMin} cases differ`);

console.log("\n  a single high element does not carry a visit");
const one = deriveFromMdm("straightforward", "straightforward", "high", "new");
check(one.level === "straightforward", "minimal/minimal/high stays straightforward", `got ${one.level} (${one.code})`);
check(one.carriedBy.length >= 2, "the derivation names which elements carried it", one.carriedBy.join(" + "));

console.log("\n  codes, and the one that should not exist");
check(deriveFromMdm("high", "high", "high", "new").code === "99205", "new + high = 99205");
check(deriveFromMdm("low", "low", "low", "established").code === "99213", "established + low = 99213");
const src = (await import("node:fs")).readFileSync(new URL("../packages/erp-config/src/em-coding.ts", import.meta.url), "utf8");
check(!/"99201"/.test(src), "99201 is absent — deleted in the 2021 revision");

console.log("\n  time bands, at their boundaries");
for (const type of ["new", "established"]) {
  for (const band of timeBandsFor(type)) {
    const lo = deriveFromTime(band.min, type);
    const hi = deriveFromTime(band.max, type);
    check(lo?.level === band.level && hi?.level === band.level,
      `${type}: ${band.min}–${band.max} → ${band.level}`, `${lo?.code} / ${hi?.code}`);
  }
}
const belowNew = timeBandsFor("new")[0].min - 1;
check(deriveFromTime(belowNew, "new") === null, `under the lowest band supports no level`, `${belowNew} min → null`);
check(deriveFromTime(Number.NaN, "new") === null, "a non-number supports no level");

console.log();
if (failed) {
  console.error(`  ${failed} check(s) failed.\n`);
  console.error("  A level derived by the wrong rule is worse than no panel: it reads as");
  console.error("  authoritative and is wrong in the direction of a higher code.\n");
  process.exit(1);
}
console.log("  Two of three is the median, a single element cannot carry a visit,");
console.log("  and the time bands hold at their boundaries.\n");
