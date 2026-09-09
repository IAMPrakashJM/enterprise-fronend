# Library preferences deployment — 9 September 2026

Both demo sites now serve release `20260909150151741-7a1fdde4`:

- https://front-design.pepbits.com
- https://desktop.front-design.pepbits.com

Application source: commit `f8b2bbaccb4e5d0729e78fb9b895cce21d02aba1`, pushed to main. Follow-up `4c322e9cee8c3abf4db2324f09271d847a63cd1f` only adjusts the bulk template test timeout; runtime code is identical. This record supersedes earlier local/unpublished status statements without changing historical manifests or evidence.

## Validation and activation

Local typechecking passed. The first full unit run passed 1,486 tests and timed out on the case that renders 194 template workspaces. After its timeout changed from 5 to 15 seconds, all 1,487 tests across 102 files passed. API tests (61), clinical API tests (8), suite-registry tests (2), deployment tests (14), both production builds and all verification gates passed.

The release was built with `npm run deploy:prepare` from the application commit. Isolated packaged HTML, assets and release identities passed. Activation used `npm run deploy -- --activate 20260909150151741-7a1fdde4`. Both live processes passed activation health checks. The demo API was stopped, its data backed up, and restarted to load the canonical translation catalogs. Existing demo sessions must sign in again.

Public Chromium checks passed on both hosts: release identity, demo sign-in, Patient Record footer without duplicate appearance selectors, central record layout selection, Spacing and corners, all three density choices, and no page JavaScript errors. The desktop shell was navigated using its command palette. Checks did not change stored user preferences or tenant policy. Authenticated public API checks confirmed new preference help in English, Arabic, Hindi and Malayalam on both hosts.

Remote main check jobs passed for both application and test-only commits. Browser/native jobs were still running when this record was written; a subsequent documentation push can supersede those runs. No complete remote CI or native-speaker acceptance is claimed here. Inspect the commit's Actions run for the latest result.

## Recovery

Previous frontend release: `20260909121226627-bea290e0`. It remains available through the deployment command's activation option. API data backup: `.deploy/api-backups/20260909150151741-7a1fdde4/data.tar.gz`, retained locally with restricted permissions and excluded from Git.

This is a demo frontend deployment. It does not establish native executable acceptance or production clinical service integration.
