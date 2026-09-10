# Page Library navigation labels — 10 September 2026

Rename `template.library` from **Page Template Library** to **Page Template Library TEMP**, and `template.clinical.library` from **Page templates** to **Page Library**. Canonical English, Arabic, Hindi and Malayalam API catalogs supply the labels; generated offline/standalone fallbacks are synchronized. Menu IDs, routes, permissions, page contents and preference behavior stay unchanged.

Current feature-guide navigation paths use Page Library. Historical release/help snapshots remain preserved. This label-only change does not add a new page or workflow; Library inventory remains 139.

Implementation starts on base `be77415`. Localization, Library navigation, documentation and deployment evidence are recorded below after verification. Native-speaker acceptance is separate from translated catalog presence.

## Deployment and verification

Application commit `9cd0baf639b970b1627974dc70eaa61e4ec8825f` was pushed to main. Release `20260910065020266-69915bef` is active on https://front-design.pepbits.com and https://desktop.front-design.pepbits.com.

`npm run verify:localization` and `npm run verify:library-preferences` passed from desktop-clients, including four-language catalog/fallback checks and 139 Library route contracts. Documentation and whitespace checks passed. `npm run deploy:prepare --prefix desktop-clients` built both shells in isolation and passed packaged HTML/assets checks; `npm run deploy --prefix desktop-clients -- --activate 20260910065020266-69915bef` passed activation health checks. The API restarted to load canonical labels; data was not migrated.

Public Chromium at 1800 × 1100 passed on both hosts: expected release identity, authenticated template-page navigation, both renamed sidebar groups, renamed page title, old exact labels absent, and no page JavaScript errors. No preferences were changed. [Retained logs, screenshots and hashes](evidence/page-library-labels/manifest.json) identify the checks.

Previous frontend release `20260910055109901-4206ac61` remains available for rollback. Previous canonical catalogs are retained locally in `.deploy/backups/page-library-labels-20260910/catalogs.tar.gz`; catalog rollback requires restoring those files and restarting the API. Remote CI run `34447035098` was in progress when recorded; no remote success is claimed. Native executable and native-speaker review were not performed.
