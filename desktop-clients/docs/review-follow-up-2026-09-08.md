# Engineering review follow-up — 8 September 2026

This document corrects the earlier review against the implementation and records
its follow-up changes. The changes are local; the live release has not been changed.

## Test execution and CI

All root-level E2E scripts are explicitly registered in `e2e/suites.mjs`:

| Runtime group | Purpose |
| --- | --- |
| browser | Existing web/desktop browser regression suites |
| features | Records, workflows, panels, CSV import, approvals, localization, components and costing exports |
| navigation | Backend menu and translation overrides using a configuration fixture |
| product | Ledger branding and role controls using a separate product build |
| native | Linux Tauri lifecycle and language checks through WebDriver |

The runner rejects unregistered scripts, missing files and duplicate entries.
There are 26 registered suites: nine browser, thirteen feature, one navigation,
one product and two native suites.

Native scripts are not renamed into the browser group. Every dummy API test is
included by `test:api`, and CI runs it alongside unit and deployment tests.
GitHub Actions has separate jobs for the runtime groups and installs their runtimes.

Feature suites receive a fresh temporary API data directory when run with
`--managed-api`; the runner refuses to take over an occupied API port. This avoids
one suite's imports, approval state or saved views changing another suite's results.
The API is stopped and its temporary data removed after each suite. Logs remain in
`/tmp/nexora-suite-artifacts` (or `E2E_ARTIFACTS`).

The browser harness checks the configured authentication endpoint before sending
credentials. It deliberately matches authentication routes, not Vite source paths
such as `packages/auth/src/session.tsx`. Native suites check their authentication
endpoint too. Tests fail if the application targets an unexpected backend.

Examples, from `desktop-clients`, with the appropriate compiled frontend running:

```sh
npm run test:api
npm run test:e2e-registry
node e2e/run.mjs --check
node e2e/run.mjs features --managed-api
node e2e/run.mjs features --managed-api --suite=spreadsheet-policy.mjs
node e2e/run.mjs navigation --managed-api
node e2e/run.mjs product --managed-api
node e2e/run.mjs native --managed-api
```

Set `E2E_API`, `E2E_DESKTOP` and `E2E_BASE` to the endpoints used at build time.
The managed API accepts only local origins. Navigation needs its fixture;
Ledger needs a separate product build. `scripts/prepare-e2e.mjs` prepares those
fixtures in an isolated CI checkout. Do not switch the active product in a shared
working directory to test another product.

## Language loading and bundle size

Previously, all four large fallback catalogs were statically imported, and all
four API catalogs were fetched at sign-in. The application now:

1. Reads the preferred language and the backend navigation.
2. Fetches that language's catalog, including its English fallback.
3. Keeps loaded catalogs scoped to the signed-in session.
4. Fetches a new language before applying and persisting a preference change.
5. Keeps the existing language if loading fails, and allows a retry.

Switching language updates the existing workspace rather than unmounting it.
Session identity/token checks discard late catalog responses after sign-out.

Generated offline fallback catalogs are separate files under
`packages/erp-config/src/locales/`. English is immediate. Other languages are
loaded through `loadFallbackLanguage(language)`. Standalone consumers using
`translate()` without an API-loaded catalog must await that loader before first
rendering a non-English language. The application prefers its backend catalogs.

The measured largest desktop chunk fell from 729,065 gzip bytes to approximately
462,000 bytes, about 37% smaller. `verify:bundle` checks the largest client chunk
in both builds against a 550,000-byte gzip budget. This is a per-chunk budget,
not a claim about the entire page's network transfer or load time.

## Spreadsheet import/export

The old finding that *all CSV imports export no columns* was incorrect. The
record CSV importer already maps headers to application field IDs. Spreadsheet
Studio was a separate path: it accepted arbitrary positional data into fixed
costing columns and wrote XLSX directly.

Spreadsheet Studio now accepts the eight costing-template headers. It supports
reordering those known headers, but rejects unknown, duplicate or extra columns
and invalid costing values before replacing the current sheet. Unsupported
imports leave the previous data intact. The general record importer remains the
place for mapping CSV columns to application fields.

Every costing field has an explicit classification in the shared registry.
Export checks that schema through the shared export policy, checks the product's
export permission, validates current cells and submits a metadata-only audit
before creating the file. An audit request failure prevents the download.
Headers and cells carry classification attributes for browser printing. No cell
values are included in the audit payload.

The audit endpoint remains a demo logging endpoint, not a durable production audit
service. An accepted export audit is not proof that a user saved the resulting file.

## API methods

`dummy-api/route-methods.mjs` defines allowed methods for registered routes,
including dynamic record and saved-view paths. Unsupported methods receive 405,
an `Allow` header and a localized error descriptor. OPTIONS remains supported.

The review's `/application-config` example was not a registered endpoint. It
correctly remains 404; the application actually uses `/navigation` and
`/localization`. Unknown paths are not turned into imaginary routes.

## Corrections to the earlier documents

- Several suites had individual npm scripts. They were missing from aggregate
  execution and CI, not literally impossible to run.
- Native and alternate-product tests need their own environments; blanket renaming
  is not a sufficient fix.
- The API aggregate discovers test files rather than relying on the review's
  inaccurate count of eight API scripts.
- The import/export finding conflated the CSV record importer with Spreadsheet Studio.
- Dense import, record, configuration and localization modules were reformatted.
  The session fallback rationale was restored; the AI publish/retract explanation
  was already present and is preserved.
- The generated PDF is retained because the user explicitly requested a committed
  PDF. Moving it to release artifacts is an optional future repository decision.
- `ui-gap-analysis.md` is a historical comparison. Its old wizard/sandbox counts
  are not a current feature backlog.

## Boundaries

Native-speaker approval, scheduled-report delivery, durable production audits and
Windows/macOS native validation remain separate work. Creating GitHub Actions jobs
does not mean a remote Actions run has happened; local verification is recorded
below. Nothing in this follow-up declares the entire product production-ready.


Older regression scripts were updated where their assumptions had become stale:
the navigation suite now uses translated edit labels, the saved-view suite uses
a stable search selector, and the workspace suite counts current tab semantics
and closes the setup preferences document. The AI dispatch suite uses an explicit
credential-status fixture and intercepts dispatch: it checks displayed fields
against the browser request without requiring a provider secret or making an
external provider call. Production credential gates remain intact.

## Local validation results

Completed on 8 September 2026:

| Check | Result |
| --- | --- |
| Unit tests | 1,396 passed across 83 files |
| Dummy API tests | 27 passed |
| E2E registry and API-target tests | 2 passed |
| Deployment tests | 14 passed |
| Browser regression suites | All 9 passed, including targeted reruns after correcting the AI and workspace fixtures |
| Feature suites | All 13 passed: 12 in the grouped run and the costing policy suite separately |
| Backend navigation fixture | 1 suite passed |
| Ledger product fixture | 1 suite passed in a separate checkout and build |
| Linux native application | 2 suites passed, including Arabic, Hindi and Malayalam checks |
| Production builds | Desktop and web passed |
| Repository verification | Passed, including localization, API error keys, suite registration and bundle budgets |

The final unit run includes a regression test confirming that a theme edit made
while a language catalog is loading survives completion of the language switch.
The largest generated client chunks are 462,401 gzip bytes for desktop and
399,972 gzip bytes for web, both below the 550,000-byte per-chunk budget. Vite
still reports its advisory warning for chunks larger than 500 kB before gzip.

All 26 registered E2E suites passed locally across their runtime groups and
targeted reruns; this was not a single uninterrupted aggregate run. The final
language/theme race correction was checked by the unit regression and production
build; the browser suites were not repeated after that correction.

Temporary test services were stopped. These changes have not been committed,
pushed or deployed, and the new GitHub Actions jobs have not run remotely.
