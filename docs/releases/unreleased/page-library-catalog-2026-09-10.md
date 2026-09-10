# Page Library catalog — 10 September 2026

Local implementation on base `125d9cd`; not committed, pushed or deployed for this task.

## Added and changed

Added List of pages first under Page Library. Its list uses authenticated API navigation membership and order. Moved TypeScript examples, user/integration guides and demo descriptions from eight working pages to shared catalog resources. Working pages open directly to their existing API-backed workspaces. Patient search and save flows remain. The Page Template Library TEMP is unchanged. Inventory is now 140 Library routes.

See the [user and integration guide](../../features/page-library-catalog.md). Canonical four-language copy, versioned help/alerts and testing cases are updated. Historical release evidence remains unchanged.

## Verification

Final checks passed under Node 24. The [manifest](evidence/page-library-catalog/manifest.json) identifies the exact base commit, working-tree source hashes, implementation digest and artifact hashes.

| Check | Command and scope | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck --prefix desktop-clients` | Every package passed |
| Components | `npm test --prefix desktop-clients -- --run` for page-library/catalog, clinic-billing/workspace, clinical-triage/editor, comprehensive-consultation/workspace and clinical-templates/clinical-templates test files | 18 tests in 5 files passed |
| Configuration/help API | `node --test dummy-api/application-config.test.mjs dummy-api/application-config-http.test.mjs dummy-api/documentation-store.test.mjs dummy-api/documentation-http.test.mjs` | 9 passed |
| Builds | `npm run build --prefix desktop-clients` | Both shells passed |
| Project gates | `npm run verify --prefix desktop-clients` | Passed, including 140 Library routes and 297 page references |
| Catalog browser | `node desktop-clients/e2e/run.mjs features --suite=page-library.mjs --managed-api` | API list/order, eight code/guide resources, search, eight working-page opens, moved tabs/demo label, four-language direction/width and no page errors passed |
| Workflow regression | Same runner separately with `clinic-billing.mjs`, `clinical-triage.mjs` and `comprehensive-consultation.mjs` | All three passed against disposable demo API data |
| Documentation | `node docs/tools/check-docs.mjs`, `node --test docs/tools/check-docs.test.mjs`, `git diff --check` | Checker, 3 tests and whitespace passed |

Browser tests used Chromium, Vite on 3109 and the isolated API on 3210. The catalog ran at 1700 × 1050; workflow suites retained their established viewports. Component tests cover access projection, removal of a resource after access revocation, opening routes, search and existing record/preference behavior. Billing regression includes correction/payment/refund/export/print; clinical regressions include API save/reopen/finalize and four-language checks.

See the [catalog screenshot](evidence/page-library-catalog/catalog.png) and localized [Arabic](evidence/page-library-catalog/ar.png), [Hindi](evidence/page-library-catalog/hi.png) and [Malayalam](evidence/page-library-catalog/ml.png) captures. Browser evidence is for a browser-rendered desktop shell, not a native executable or either public live site. Only guide-title translations and repository documentation were finalized after browser runs; final localization/documentation gates cover those edits.

No commit, push or deployment was performed. Remote CI, other desktop browsers, native execution and native-speaker/domain review remain outside this local acceptance. Existing project gates continue to report unrelated un-authored documentation workflows; this change does not claim to complete them.
