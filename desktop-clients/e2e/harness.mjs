/**
 * The shared half of the browser checks.
 *
 * A real browser, driven against the running shell, asserting the things jsdom
 * structurally cannot see: whether an element is actually visible, what is in
 * the address bar, what is in localStorage, and whether a component survived a
 * re-render or was rebuilt.
 *
 * That distinction is not academic. Every bug in `e2e/README.md` was green in
 * the unit suite at the moment it was found.
 *
 * Playwright is resolved rather than imported: it is a ~300MB browser download
 * that most people running `npm test` do not need, so it is not a dependency of
 * this package. `npm run e2e` says clearly what to install when it is absent.
 */
import { createRequire } from "node:module";

export const BASE = process.env.E2E_BASE ?? "http://127.0.0.1:3100";
export const DESKTOP = process.env.E2E_DESKTOP ?? "http://127.0.0.1:3101";

export function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const specifier of ["playwright", "playwright-core"]) {
    try { return require(specifier); } catch { /* try the next */ }
  }
  if (process.env.PLAYWRIGHT_PATH) {
    try { return require(`${process.env.PLAYWRIGHT_PATH}/index.js`); } catch { /* fall through */ }
  }
  console.error(`
  Playwright is not installed.

    npx playwright install --with-deps chromium

  or point PLAYWRIGHT_PATH at an existing copy. It is deliberately not a
  dependency of this package: it is a large browser download, and \`npm test\`
  does not need it.
`);
  process.exit(2);
}

/** Fails the run rather than reporting a pass against a shell that is not up. */
export async function requireShell(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (response.ok || response.status === 307) return;
    throw new Error(`status ${response.status}`);
  } catch (error) {
    console.error(`\n  ${url} is not answering (${error.message}).\n  Start it with:  ./run.sh start\n`);
    process.exit(2);
  }
}

export function reporter(title) {
  const results = [];
  console.log(`\n  ${title}\n`);
  return {
    say(name, ok, detail = "") {
      results.push([name, ok]);
      console.log(`    ${ok ? "ok  " : "FAIL"}  ${name.padEnd(56)}${detail}`);
    },
    finish(errors = []) {
      const passed = results.filter(([, ok]) => ok).length;
      console.log(`\n    ${passed}/${results.length} passed`);
      if (errors.length) {
        console.log("    console errors:");
        for (const error of [...new Set(errors)].slice(0, 5)) console.log(`      ${error}`);
      }
      return passed === results.length && errors.length === 0;
    },
  };
}

/** Signs in and returns a page. The demo shell has one account. */
export async function signIn(browser, url = BASE, viewport = { width: 1500, height: 950 }) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`PAGEERROR: ${error.message.slice(0, 180)}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`CONSOLE: ${message.text().slice(0, 180)}`); });

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  const password = page.locator('input[type="password"]');
  if (await password.count()) {
    await page.locator("input").first().fill("user1");
    await password.fill("user1");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(6000);
  }
  return { page, errors };
}

/** Ctrl+K, type, pick a result. The one navigation path that works everywhere. */
export async function openViaPalette(page, query, index = 1) {
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(700);
  await page.keyboard.type(query);
  await page.waitForTimeout(700);
  const hit = page.locator('[role="dialog"] button').nth(index);
  if (!(await hit.count())) { await page.keyboard.press("Escape"); return false; }
  await hit.click();
  await page.waitForTimeout(2200);
  return true;
}

/**
 * Put a preference into a known state before asserting on it.
 *
 * Preferences persist per account, so a suite that assumes a default is
 * asserting against whatever the last run left behind. This cost a full
 * debugging pass: the workspace suite reported no tab strip, which was correct
 * — an earlier session had switched floating windows on and never switched them
 * back.
 */
export async function setPreference(page, switchName, on) {
  await openViaPalette(page, "preferences");
  const toggle = page.getByRole("switch", { name: switchName }).first();
  if (!(await toggle.count())) return false;
  await toggle.scrollIntoViewIfNeeded();
  if ((await toggle.getAttribute("aria-checked")) !== String(on)) {
    /* Dispatched on the element: with floating windows on, the preferences
       screen is itself a frame and a plain click can land on whichever frame
       is above it. */
    await toggle.evaluate((element) => element.click());
    await page.waitForTimeout(1800);
  }
  return (await toggle.getAttribute("aria-checked")) === String(on);
}
