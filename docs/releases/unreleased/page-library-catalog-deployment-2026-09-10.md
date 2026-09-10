# Page Library catalog deployment — 10 September 2026

The List of pages implementation was committed and pushed as `c0b91aa21da7d557bae80725109fb4d51ccdc333`. Release `20260910071728997-8c827861` is active on both demo sites. This record supersedes the local-only publication status in the [implementation record](page-library-catalog-2026-09-10.md); its earlier test evidence remains historical.

## User impact and integration

Open Page Library → List of pages on the [web demo](https://front-design.pepbits.com/library/list-of-pages) or [desktop browser demo](https://desktop.front-design.pepbits.com/library/list-of-pages). The catalog lists the eight working pages in authenticated demo API navigation order, with search, TypeScript examples and user/integration guides. The working pages retain their API-backed workflows without the catalog documentation tabs and demo heading. See the [feature guide](../../features/page-library-catalog.md).

Shared components, effective preferences and existing access boundaries remain in use. The API was restarted to load the navigation, localization and documentation configuration. No data migration or new production integration was introduced. Existing data and policy storage are unchanged.

## Verification and evidence

Release preparation rebuilt both shells in an isolated snapshot, checked packaged assets on isolated ports and passed. Activation restarted web and desktop services and passed their application-asset health checks. The deployed source is the implementation commit above; subsequent evidence-only commits do not change its runtime.

Live verification used Chromium at 1700 × 1050 against both public hosts with the existing demo API. It checked the exact release identity, authenticated catalog membership/order, all eight TypeScript examples and guides, catalog search, working-page opening and removal of the old documentation tabs/demo patient-search heading. Web cards use the existing new-browser-tab navigation; desktop cards use workspace tabs. No record or preference values were changed.

The first automated burst hit HTTP 429 while loading configuration in a new web tab. The [diagnostic](evidence/page-library-catalog-deployment/initial-rate-limit.txt) is retained. The verification was paced at 18 seconds between page openings without changing server limits; the final run passed on both hosts with no JavaScript page errors.

Evidence: [manifest](evidence/page-library-catalog-deployment/manifest.json), [prepare log](evidence/page-library-catalog-deployment/prepare.txt), [activation log](evidence/page-library-catalog-deployment/activate.txt), [live browser log](evidence/page-library-catalog-deployment/live.txt), [web screenshot](evidence/page-library-catalog-deployment/web.png), [desktop screenshot](evidence/page-library-catalog-deployment/desktop.png).

Remote [CI run 34449225396](https://github.com/IAMPrakashJM/enterprise-fronend/actions/runs/34449225396) finished **failed**: the main check, native-linux, browser, product and navigation jobs passed; feature-browser (features) passed 27/31 suites. The [failure log](evidence/page-library-catalog-deployment/ci-failed.txt) records four unresolved failures: Library preferences expects the component-catalog marker on List of pages; clinical templates expects an inline Rail layout button; page templates expects 97 catalog entries but finds 102; documentation expects an empty patches view. These checks need reconciliation with current behavior and reruns. No all-green CI claim is made, and no test assertions were changed as part of this deployment.

Local type checks, 18 component tests, nine configuration/help API tests, project gates, both builds and catalog/workflow browser suites are recorded separately in the implementation record. This live check does not repeat record writes, payment flows or four-language acceptance. Native executables, other browser engines and native-speaker review were not tested in this deployment.

## Recovery and publication

The prior frontend release `20260910065020266-69915bef` is retained. To roll back both shells, use `npm run deploy --prefix desktop-clients -- --activate 20260910065020266-69915bef` with Node 24. API configuration recovery is separate: the prior configuration archive is `.deploy/backups/page-library-catalog-20260910/config.tar.gz`, sourced from `125d9cd`; review and restore configuration, then restart the API. No record-data rollback is needed for this change.

Code is committed, pushed and deployed to both demo hosts. This is a demo deployment, with no package publication or release tag claimed.
