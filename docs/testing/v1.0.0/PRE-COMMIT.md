# Verification guide 1.0.0

Applies to the Library preference delivery and subsequent changes until replaced by a new accepted testing-document version.

## Documentation-only changes

From the repository root, run:

```sh
node docs/tools/check-docs.mjs
node --test docs/tools/check-docs.test.mjs
```

Check feature/release status, links, inventory and historical evidence. Do not rerun application tests merely to assign today's date to an unchanged result. If documentation tooling or CI wiring changes, validate the tool and the wiring.

## Application changes

Use the project Node 24 environment and the lockfile. From `desktop-clients`:

```sh
npm run typecheck
npm test
npm run test:api
npm run test:e2e-registry
npm run test:deployment
npm run build
npm run verify
```

This is the broad local/CI acceptance sequence, not a statement that every command was run for the latest delivery. Use [recorded evidence](../../releases/unreleased/verification-2026-09-09.md) for actual execution scope. Targeted checks may be appropriate during development; complete checks required by CI before merging implementation changes.

For generated assets, run only the relevant synchronization commands, then verify the outputs:

```sh
npm run localization:sync
npm run library:sync
npm run templates:sync
npm run verify:localization
npm run verify:library
npm run verify:templates
npm run verify:library-preferences
```

## Browser checks

The [Library suite](../../../desktop-clients/e2e/library-preferences.ts) is registered in the feature group. It navigates the route manifest, checks managed table attributes and computed padding/wrapping, and exercises layout/view/page-size locks plus clinical previews. The focused final case checks independent form/result scales, zero radius and badge wrapping.

Use isolated demo data and explicitly allowed test origins. Supply the API actually embedded in the tested shell; do not silently redirect tests to a shared deployment.

```sh
E2E_API=http://127.0.0.1:3209 \
E2E_DESKTOP=http://127.0.0.1:3109 \
node e2e/library-preferences.ts
```

Run that command from `desktop-clients` after starting the isolated API and shell. `PLAYWRIGHT_PATH` can select an existing installation. `E2E_BROWSER` supports the installed Chromium/Firefox/WebKit runtimes. `E2E_DENSITY` selects the profile. `E2E_LIBRARY_PAGES` restricts a diagnostic run; omit it for complete navigation coverage. Record restricted runs as restricted.

Prefer built-shell browser acceptance for a release. The recorded September 9 local runs used development servers; successful production builds were separate checks. Native Tauri execution requires its own runtime test and environment. A browser-rendered desktop shell does not satisfy that check.

## Evidence and decision

Record commands, result markers/exit status when retained, suite/case counts, source/diff identity, environment, changed files after tests and pending checks using the [evidence template](../../releases/templates/test-evidence.md). Keep screenshots fictional and scoped. Do not infer a hosted CI result from the presence of `.github/workflows/ci.yml`.
