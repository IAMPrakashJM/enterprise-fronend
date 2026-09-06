/**
 * axe-core, driven from the browser suites.
 *
 * Everything the unit suite can say about accessibility is about the markup a
 * component returns. What it cannot say is anything that depends on the page:
 * whether a control ends up with an accessible name once its label renders
 * elsewhere, whether text has enough contrast against the theme that actually
 * applied, whether two elements collided into the same id, whether the heading
 * order makes sense once three components are on screen together. All of that
 * is a property of the assembled document, and jsdom has neither layout nor
 * computed colour.
 *
 * axe-core IS a dependency, unlike Playwright: it is a couple of megabytes
 * rather than a browser, so `npm ci` in CI already has it and the check runs
 * without anyone installing anything.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

/**
 * The rules this codebase is held to.
 *
 * WCAG 2.1 A and AA, plus axe's "best-practice" set left OUT: it contains
 * opinions (a page must have one main landmark, lists must not be nested) that
 * are worth knowing and are not a standard anyone is held to. Adding them here
 * would put advice and obligation in the same list, and the first person to
 * silence one would silence both.
 */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/** Anything at these levels is a defect. `moderate` and `minor` are reported. */
const BLOCKING = ["critical", "serious"];

/**
 * Run axe over the current page.
 *
 * `include`/`exclude` are CSS selectors, so a suite can audit one dialog rather
 * than the whole shell — useful when an overlay is the thing under test and the
 * page behind it is not.
 */
export async function audit(page, { include, exclude } = {}) {
  await page.evaluate((source) => {
    if (!window.axe) new Function(source)();
  }, AXE);

  return page.evaluate(async ({ tags, include, exclude }) => {
    const context = {};
    if (include) context.include = [include];
    if (exclude) context.exclude = [exclude];
    const result = await window.axe.run(Object.keys(context).length ? context : document, {
      runOnly: { type: "tag", values: tags },
      /* Off: it re-runs the whole audit inside every iframe, and the shells have
         none. On a page that did, this would double the runtime for nothing. */
      iframes: false,
    });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      count: violation.nodes.length,
      /* One example is enough to find it; the full list is noise in a terminal. */
      example: (violation.nodes[0]?.target ?? []).join(" "),
    }));
  }, { tags: TAGS, include, exclude });
}

/**
 * Report an audit, splitting what must be fixed from what is worth knowing.
 *
 * The baseline is a FIXED list of rule ids, not a count and not a snapshot. A
 * baseline that regenerates itself records whatever the code does today and
 * calls it correct; this one fails when something new appears, which is the
 * only version that keeps working after the person who wrote it has moved on.
 */
export function report(t, label, violations, baseline = []) {
  const blocking = violations.filter((violation) => BLOCKING.includes(violation.impact));
  const unexpected = blocking.filter((violation) => !baseline.includes(violation.id));
  const known = blocking.filter((violation) => baseline.includes(violation.id));

  t.say(`${label}: no new serious problem`, unexpected.length === 0,
    unexpected.map((violation) => `${violation.id}(${violation.count}) ${violation.example}`).join(" · "));

  for (const violation of known) {
    /* Named, counted and still failing nothing — but printed every run, so a
       baseline entry cannot quietly become permanent furniture. */
    t.say(`${label}: known · ${violation.id}`, true, `${violation.count} node(s) — ${violation.help}`);
  }

  const advisory = violations.filter((violation) => !BLOCKING.includes(violation.impact));
  if (advisory.length) {
    console.log(`      ${label}: ${advisory.map((violation) => `${violation.id}(${violation.count})`).join(", ")}`);
  }
  return blocking;
}
