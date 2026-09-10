# Comprehensive Consultation — 10 September 2026

Local implementation on base `751bfc6`. Not committed, pushed or deployed. Historical OP Consultation deployment evidence remains unchanged.

## Added and changed

- New Comprehensive Consultation route follows OP Consultation under Page templates: eight clinical page templates and 139 Library destinations.
- Shared clinical document engine with opt-in edit invalidation and configuration-version recording; existing workflows retain their behavior.
- Seventeen specialty prompts, full existing clinical note fields, linked diagnosis/code entry, four order types, editable order basket, score storage/calculation, E/M comparison, reporting profiles and full preview.
- Dedicated authenticated API, CSV service catalog, persistent consultation CSV, server validation, optimistic revisions, stable retries and locked demo signing.
- Effective preferences, four-language catalogs, public component/example, versioned help and change alert.

See the [feature and integration guide](../../features/comprehensive-consultation.md). External connections shown as Not connected are not completed integrations. Score/coding rules and specialty prompts are examples requiring clinical and current-rule acceptance.

## Verification

The following checks identify the changed source hashes and actual test scope. No production EHR integration, native executable test, native-speaker acceptance or remote CI success is implied.


- `npm run typecheck --prefix desktop-clients`: every package passed, including the public workspace/adapter contracts and tests.
- `npm run test:clinical-api --prefix desktop-clients`: 24 tests passed, including three new comprehensive tests for CSV lifecycle/tenant isolation, nested validation and score/E/M boundaries. This command also typechecks the clinical backend and tests.
- Targeted `npm test --prefix desktop-clients -- --run` for comprehensive workspace, OP workspace, clinical consultation workspace and triage editor: 8 tests in 4 files passed. Includes tenant-locked layout changes and unsaved specialty preview.
- `npm run build --prefix desktop-clients`: both application builds passed. Existing large-bundle warnings remain.
- `npm run verify --prefix desktop-clients`: all gates passed, including API message registration, canonical localization, public examples and 139 Library routes. Route coverage does not establish every preference combination or full workflow acceptance for all pages.
- `node desktop-clients/e2e/run.mjs features --suite=comprehensive-consultation.mjs --managed-api`: Chromium passed against the isolated real API, including 17-specialty configuration, retained specialty entries, coded diagnoses, four order types, edit, score, E/M comparison, full preview, failed-save identity-preserving retry, CSV save/reopen, attestation invalidation, demo signing and locked controls. Four catalog languages passed direction and desktop width checks at 1600 × 1000.
- The same runner with `--suite=op-consultation.mjs` passed the existing OP lifecycle, triage context and four-language regression at 1600 × 900.
- `node docs/tools/check-docs.mjs`: 46 documentation files passed. Documentation-tool tests and `git diff --check` passed.

Tests used Node 24 and the local Playwright/sysroot environment. Vite served port 3109 with the disposable demo API on 3210. The local browser checks were not packaged-shell, public-live or native executable tests. No live patient records were written.

[Source identity and retained artifact hashes](evidence/comprehensive-consultation/manifest.json) record the base plus changed/new implementation bytes. [Browser evidence](evidence/comprehensive-consultation/browser.txt), [OP regression](evidence/comprehensive-consultation/op-regression.txt), [API tests](evidence/comprehensive-consultation/api.txt) and [UI tests](evidence/comprehensive-consultation/unit.txt) retain the results. Only documentation/evidence changed after the final implementation checks.

![Comprehensive Consultation order basket with fictional data](evidence/comprehensive-consultation/orders.png)

## Remaining delivery and integration work

Commit, push, remote CI and deployment were not performed for this implementation. The backend is a single-process demo CSV store. Real terminology catalogs, current payer rules, historical catalog resolution, clinical specialty protocols, medication interaction checks, validated external reporting, dispatch/charge creation, certified signing/amendments and clinical/native-language acceptance remain explicit integration work. The screen's jurisdiction profiles do not assert regulatory compliance.
