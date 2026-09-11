# DCP frontend contract and recovery — 11 September 2026

Status: tested frontend increment; local source only. Not committed, pushed or deployed. The full enterprise frontend scope is not marked complete.

## Changes

- Added the supplied DCP v1 wire contract guard and authenticated adapter in existing packages. Kept authoring templates distinct from Dcp.Form.
- Added shared runtime fields for all eight current v1 types, nested collection identities, filtered patches, automatic server preview, localized validation navigation and explicit conflict recovery.
- Connected tenant-controlled shared DCP recovery drafts and Draft Center metadata. No browser-local answer store.
- Added repeatable authoring sections with row bounds, stable identities, per-row rules/validation and normalized demo answer persistence. Copying approved examples now remaps internal rule/dependency references.
- Added multi-parent dropdown mappings, tenant-authored field/section labels, shared presentation choices, release comparison and answer history metadata.
- Added RadioGroup, RangeField (composing the existing RangeInput), FormErrorSummary and their Library examples. RangeInput now supports disabled state.
- Posted and verified the frontend/backend handoff on [PLIBRYBEND-206](https://pepbits.atlassian.net/browse/PLIBRYBEND-206?focusedCommentId=10095). The other session owns backend implementation.

## Verification

Retained [source identity and artifact hashes](evidence/dcp-frontend-contract/source-manifest.json) identify the uncommitted source, including the earlier DCP increments. No commit, push or deployment was performed.

- Full `npm run ci`: **passed** — 1,569 frontend tests in 129 files; 104 generic/demo API tests and 33 clinical API tests; 2 E2E registry tests and 14 deployment-helper tests; all package/app type checks, Next.js and Vite builds, repository verification gates. [CI log](evidence/dcp-frontend-contract/ci.txt).
- A repeatable-section UI test was added after the main test stage. The final [targeted run](evidence/dcp-frontend-contract/repeatable-ui.txt) passed 8 tests across section UI and repeating-definition rules. It covers row independence, limits, copied rule references and occurrence validation. The [11-test designer API run](evidence/dcp-frontend-contract/repeatable-api.txt) additionally covers normalized repeating-answer save/reload and forged field rejection; this API test was also included in the full CI API stage.
- [Chromium desktop-browser journey](evidence/dcp-frontend-contract/runtime-browser.txt): passed API-owned v1 load, required false, automatic preview, 422 retention, repeating rows with server IDs, CAS revision, confirmed save and shared recovery autosave. [Screenshot](evidence/dcp-frontend-contract/runtime.png). A Vite browser shell is not a native executable test.
- Documentation checks passed: 316 registered pages, 148 authored workflows, 168 reference guides; 1,116 authoring/native-review items remain explicitly pending. Logs: [documentation](evidence/dcp-frontend-contract/documentation.txt), [lifecycle](evidence/dcp-frontend-contract/documentation-lifecycle.txt). Canonical copies and generated Library examples passed the CI checks.

The browser check found and led to fixes for the contract-version CORS header and React StrictMode load cancellation. No live Spring host, PostgreSQL, native executable, hardware device or native-speaker acceptance was performed. Earlier test counts and deployment identity belong to their retained historical records.

## Remaining scope

Advanced authoring components and nested editable grids, staged large-dataset job UI, scoped assignment/permission administration, file/capture/domain widgets, workflow/attestation/amendment interfaces, print/report operations and native acceptance remain. Production endpoint and business adapter work is tracked in the backend epic and was not implemented in this frontend repository.
